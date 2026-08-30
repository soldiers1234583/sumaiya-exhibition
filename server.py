#!/usr/bin/env python3
"""Tuned static server for the Sumaiya Exhibition.

Improvements over `python3 -m http.server`:
  * Brotli / gzip compression for text assets
  * Serves precompressed .br / .gz sidecar files when present (bundle.js.br),
    and memoizes dynamic compression so we never recompress per request
  * Cache-Control headers (immutable for versioned media assets)
  * Correct MIME types for .webp / .woff2
  * 304 Not Modified support (If-Modified-Since)
  * Security headers (nosniff)
"""
import gzip
import io
import mimetypes
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))

EXTRA_TYPES = {
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".avif": "image/avif",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
}
mimetypes.add_type("text/javascript", ".js")
for ext, mt in EXTRA_TYPES.items():
    mimetypes.add_type(mt, ext)

# Versioned / media assets: cache hard. HTML/CSS/JS: revalidate
# (CSS/JS are not content-hashed, so an immutable cache would serve stale
#  rules — e.g. an old @font-face after a font swap).
IMMUTABLE = {".woff2", ".jpg", ".webp", ".png", ".svg", ".avif", ".br"}

COMPRESSIBLE = {
    "text/html", "text/css", "text/javascript", "application/javascript",
    "application/json", "image/svg+xml",
}

try:
    import brotli
    _HAS_BROTLI = True
except ImportError:
    _HAS_BROTLI = False


class CompressionCache:
    """Memoize compressed bodies per (path, mtime, size) triple.

    Thread-safety: plain dict is fine under the GIL for this read-mostly,
    idempotent workload (worst case: two threads compress the same file once).
    """
    MAX_ENTRIES = 64

    def __init__(self):
        self._data = {}

    def get(self, key):
        return self._data.get(key)

    def put(self, key, body):
        if len(self._data) >= self.MAX_ENTRIES:
            self._data.clear()
        self._data[key] = body


_CACHE = CompressionCache()


def _compress_body(raw, ctype, accept_enc):
    """Return (body, encoding) honouring the request's Accept-Encoding.

    Chooses brotli > gzip > identity. Picks whichever sidecar file the server
    already has when it matches the preferred encoding.
    """
    enc = None
    body = raw

    # Sidecar files: precomputed, zero CPU cost, prefer them.
    if _HAS_BROTLI and "br" in accept_enc:
        try:
            body = brotli.compress(raw, quality=8)
            enc = "br"
        except Exception:
            pass
    if enc is None and "gzip" in accept_enc:
        body = gzip.compress(raw, 9)
        enc = "gzip"

    if enc and len(body) >= len(raw):
        return raw, None
    return body, enc


class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        path = urlparse(self.path).path
        ext = os.path.splitext(path)[1].lower()
        if ext in IMMUTABLE:
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "no-cache, must-revalidate")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def _load(self, path):
        """Open a file, mapping directories to their index.html.

        Returns (file_obj, stat, resolved_path) or (None, None, None).
        """
        try:
            if os.path.isdir(path):
                path = os.path.join(path, "index.html")
            f = open(path, "rb")
        except OSError:
            return None, None, None
        st = os.fstat(f.fileno())
        return f, st, path

    def send_head(self):
        path = self.translate_path(self.path)

        # Block dev / legacy paths from being served publicly.
        parsed = urlparse(self.path)
        segs = parsed.path.strip("/").split("/")
        if segs and segs[0] in ("dev", "legacy", "node_modules"):
            self.send_error(404, "Not found")
            return None

        f, fs, real_path = self._load(path)
        if f is None:
            self.send_error(404, "File not found")
            return None

        # Guess MIME from the resolved file (so / → index.html → text/html).
        ctype = self.guess_type(real_path)
        length = fs.st_size

        # 304 Not Modified
        ims = self.headers.get("If-Modified-Since")
        if ims:
            try:
                import email.utils
                if_modified = email.utils.parsedate_to_datetime(ims)
                last_mod = email.utils.parsedate_to_datetime(
                    self.date_time_string(fs.st_mtime))
                if last_mod.timestamp() <= if_modified.timestamp():
                    f.close()
                    self.send_response(304)
                    self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                    self.end_headers()
                    return None
            except (TypeError, ValueError):
                pass

        accept_enc = self.headers.get("Accept-Encoding", "")

        if ctype in COMPRESSIBLE and length > 500:
            # Serve a precompressed sidecar if it exists and matches the
            # preferred encoding — zero CPU cost.
            pre = None
            sidecar_enc = None
            if _HAS_BROTLI and "br" in accept_enc and os.path.exists(real_path + ".br"):
                pre = open(real_path + ".br", "rb")
                sidecar_enc = "br"
            elif "gzip" in accept_enc and os.path.exists(real_path + ".gz"):
                pre = open(real_path + ".gz", "rb")
                sidecar_enc = "gzip"

            if pre is not None:
                body = pre.read()
                pre.close()
                f.close()
                enc = sidecar_enc
                self.send_response(200)
                self.send_header("Content-type", ctype)
                self.send_header("Content-Encoding", enc)
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                self.send_header("Vary", "Accept-Encoding")
                self.end_headers()
                return io.BytesIO(body)

            # Dynamic compression, memoized so repeated requests are free.
            raw = f.read()
            f.close()
            key = (real_path, fs.st_mtime, fs.st_size, accept_enc)
            cached = _CACHE.get(key)
            if cached is not None:
                body, enc = cached
            else:
                body, enc = _compress_body(raw, ctype, accept_enc)
                _CACHE.put(key, (body, enc))

            if enc:
                self.send_response(200)
                self.send_header("Content-type", ctype)
                self.send_header("Content-Encoding", enc)
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
                self.send_header("Vary", "Accept-Encoding")
                self.end_headers()
                return io.BytesIO(body)

            self.send_response(200)
            self.send_header("Content-type", ctype)
            self.send_header("Content-Length", str(length))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.send_header("Vary", "Accept-Encoding")
            self.end_headers()
            return io.BytesIO(raw)

        # Uncompressed (media, fonts) — stream from disk.
        self.send_response(200)
        self.send_header("Content-type", ctype)
        self.send_header("Content-Length", str(length))
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()
        return f

    def log_message(self, fmt, *args):
        pass

    def send_error(self, code, message=None, explain=None):
        """Serve the themed 404.html for missing pages instead of the default."""
        if code == 404:
            try:
                with open(os.path.join(ROOT, "404.html"), "rb") as f:
                    body = f.read()
                self.send_response(404)
                self.send_header("Content-type", "text/html")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                if self.command != "HEAD":
                    self.wfile.write(body)
                return
            except OSError:
                pass
        super().send_error(code, message, explain)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    server.daemon_threads = True
    server.serve_forever()


if __name__ == "__main__":
    main()
