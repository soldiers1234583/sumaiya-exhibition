# Animation & Performance Plans — website-seagull-optimized

Audit base commit: `76f00be`. All plans below were **implemented and built** on
`npm run build`, then smoke-tested via the local server (brotli sidecars,
ETag/304, immutable versioned caching, webp texture serving all verified).

Static exhibition site for Mehrima Tasnim Sumaiya. Vanilla HTML/CSS/JS, no
framework. Motion stack: GSAP + ScrollTrigger + anime.js (vendor/bundle.js),
three.js + EffectComposer/UnrealBloomPass (butterfly3d.js), tsParticles hero
ambience, canvas-confetti, large CSS keyframe set. Phone-first (Termux, slow
links). Personality: romantic, cinematic, celebratory.

**Motion intent (user, overrides some defaults):** animations must stay
**smooth and lengthy** so the visitor can fully experience them. Never shorten
durations to fix performance — reduce frame cost instead. Longer cinematic
pacing is desired (3.6s preloader is a settled brand moment; entrances extended
to 1.1s+). Decorative motion (blur-in, sparkles, bloom) is preserved via cheaper
implementations, not deletion.

## Plan table

| # | Severity | Title | Status |
|---|----------|-------|--------|
| 001 | HIGH | Beat visual throttle (~10fps, quantised, reduced-motion gate) | DONE |
| 002 | HIGH | 3D tiering: lazy companion, half-res bloom, DPR cap, texture downscale, IO pause, dispose | DONE |
| 003 | HIGH | Aurora blur-bake (no runtime blur filter) | DONE |
| 004 | MED | Scroll-listener layout thrash (nav, carousel passive + cached metrics, magnetic button) | DONE |
| 005 | MED | Layout tweens → transforms (telemetry, vibe, toast progress, beam head) | DONE |
| 006 | MED | Sparkle trail cheaper on touch; tsParticles pause-offscreen | DONE |
| 007 | MED | Pause decorative infinite animations offscreen (`.motion-paused`) | DONE |
| 008 | MED | Define dangling `@keyframes fadeUp` (scroll-prompt was invisible w/o JS) | DONE |
| 009 | MED | Gallery blur-in kept, applied only to in-view cards, ~1.1s | DONE |
| 010 | MED | Interruptible carousel spin + reason swap; reduced-motion smooth scroll | DONE |
| 011 | MED | Reduced-motion quality: scope blanket, keep comprehension fades, reactive matchMedia | DONE |
| 012 | MED | Hover gating: neutralise sticky hover on touch | DONE |
| 013 | MED | Immutable caching for `?v=` JS/CSS + ETag validation | DONE |
| 014 | MED | Font preload alignment (Caveat high, Cherry Bomb high, Playfair dropped) | DONE |
| 015 | MED | Lazy-load tsParticles + confetti on idle; modulepreload three | DONE |
| 016 | LOW | Easing token consolidation + press feedback | DONE |
| 017 | LOW | model-viewer.js TDZ bug (flap-speed control was dead) | DONE |
| 018 | LOW | Cinematic pacing: extend tier-2 reveals + hero entrance | DONE |

## Execution order + dependencies

- 002 → 015 (both touch butterfly3d.js / index.html).
- 004 → 010 (carousel metrics cache reused by spin guard).
- 006 → 011 (sparkle/tsParticles reactive reduced-motion).
- 013 → must run alongside restart of server.py (verified via curl).
- 018 last (only after 001–012 land, so extended durations are smooth).

## Assets added this session (build-time)

- `models/textures/DIFFUSE-Morpho-didius-sq.webp` (629×1024, from 4032 photo)
- `models/textures/ALPHA-Morpho-didius-sq.webp` (315×512)
- `models/textures/NORMAL-Morpho-didius-sq.webp` (629×1024)

These replace ~3.5 MB of 2476×4032 JPEG with ~181 KB of WebP (~120 MB → ~16 MB
GPU upload). Loaded with a JPEG fallback in `butterfly3d.js` and
`model-viewer.js`; the originals stay on disk as the fallback source.

## Privacy / access control

The exhibit is private, so publishing it must stay gated. Two independent
layers, and neither is sufficient alone:

1. **Edge (the real one):** Cloudflare Pages behind a Cloudflare Access policy,
published by `.github/workflows/publish-cloudflare.yml`. Every request — HTML,
images, audio — is authenticated before Cloudflare serves it, so guessing an
asset URL gets a login page. One-time setup:
`bash scripts/setup-cloudflare-access.sh`.
2. **In-page passcode gate:** the `#siteLock` block in `index.html` (SHA-256 of
the passcode, `PERSIST = true` so a tab stays unlocked). Obscurity only — it
does not survive view-source, so it is a second layer, never the only one.

`publish-pages.yml` is deprecated and manual-only: it pushed the built site to a
public repo where nothing was actually private. Delete that public copy before
treating the exhibit as private.

## Verification notes

- `npm run build` passes (CSS + 3 JS minified, 58 sidecars emitted).
- `node --check` passes on app.js, butterfly3d.js, model-viewer.js + .min outputs.
- lightningcss validates styles.css (no syntax errors after the toast-progress
  refactor).
- server.py smoke test: `/` returns HTML with ETag + `no-cache`; versioned
  `styles.min.css?v=5` and `app.min.js?v=5` return `immutable`; `If-None-Match`
  returns `304`; `Accept-Encoding: br` returns `Content-Encoding: br`;
  webp texture returns `image/webp`.
- Feel-check still to run on a real device: carousel momentum scrape, aurora
  drift, butterfly bloom on a phone, toast countdown pause-on-hover, magnetic
  button during scroll, sparkle trail density on touch.
