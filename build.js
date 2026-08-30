#!/usr/bin/env node
/**
 * Build pipeline — single source of truth.
 *
 *   styles.css          → styles.min.css        (lightningcss)
 *   app.js              → app.min.js            (terser, classic)
 *   butterfly3d.js      → butterfly3d.min.js    (terser, ES module)
 *
 * After minifying, every text asset in the project also gets precompressed
 * `.br` and `.gz` sidecars so server.py can serve them with zero CPU cost.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const ASSETS = [
  { src: 'styles.css', out: 'styles.min.css', kind: 'CSS' },
  { src: 'app.js', out: 'app.min.js', kind: 'JS' },
  { src: 'butterfly3d.js', out: 'butterfly3d.min.js', kind: 'JS', module: true },
];

// Text assets that should get .br/.gz sidecars (excluding images/fonts).
const SIDECAR_FILES = [
  'index.html',
  '404.html',
  'robots.txt',
  'fonts.css',
  ...ASSETS.map(a => a.out),
  'vendor/bundle.js',
  'vendor/three.module.min.js',
  'vendor/canvas-confetti.min.js',
  'vendor/tsparticles.bundle.min.js',
  ...walk('vendor/addons').filter(f => f.endsWith('.js')),
];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function writeSidecars(file) {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file);
  if (raw.length < 64) return; // not worth it
  fs.writeFileSync(file + '.br', zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } }));
  fs.writeFileSync(file + '.gz', zlib.gzipSync(raw, { level: 9 }));
}

console.log('Building optimized assets...\n');

let totalIn = 0;
let totalOut = 0;

for (const asset of ASSETS) {
  if (!fs.existsSync(asset.src)) {
    console.error(`✗ Missing source: ${asset.src}`);
    process.exit(1);
  }
  const args = ['minify.js', asset.src, asset.out];
  if (asset.module) args.push('--module');
  execFileSync(process.execPath, args, { stdio: 'inherit' });
  totalIn += fs.statSync(asset.src).size;
  totalOut += fs.statSync(asset.out).size;
}

// Sanity: the HTML must reference the produced artifacts.
const html = fs.readFileSync('index.html', 'utf8');
for (const asset of ASSETS) {
  if (!html.includes(asset.out)) {
    console.error(`✗ index.html does not reference ${asset.out} — build incomplete.`);
    process.exit(1);
  }
}

// Precompress sidecars for every text asset.
let sidecars = 0;
for (const file of SIDECAR_FILES) {
  writeSidecars(file);
  sidecars += 2;
}
console.log(`  Sidecars emitted: ${sidecars}`);

console.log('\n✓ Build complete');
console.log(`  Source total: ${(totalIn / 1024).toFixed(1)} KB`);
console.log(`  Minified total: ${(totalOut / 1024).toFixed(1)} KB`);
console.log(`  Reduction: ${((totalIn - totalOut) / totalIn * 100).toFixed(1)}%`);
