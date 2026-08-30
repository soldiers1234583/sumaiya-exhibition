#!/usr/bin/env node
/**
 * Build pipeline — single source of truth.
 *
 * The canonical sources are the readable files in the repo root:
 *   styles.css   → styles.min.css
 *   app.js       → app.min.js
 *   index.html   is hand-maintained and already references the .min assets.
 *
 * (No more slicing line ranges out of a monolithic HTML file.)
 */
const fs = require('fs');
const { execFileSync } = require('child_process');

const ASSETS = [
  { src: 'styles.css', out: 'styles.min.css', kind: 'CSS' },
  { src: 'app.js', out: 'app.min.js', kind: 'JS' },
];

console.log('Building optimized assets...\n');

let totalIn = 0;
let totalOut = 0;

for (const asset of ASSETS) {
  if (!fs.existsSync(asset.src)) {
    console.error(`✗ Missing source: ${asset.src}`);
    process.exit(1);
  }
  execFileSync(process.execPath, ['minify.js', asset.src, asset.out], { stdio: 'inherit' });
  totalIn += fs.statSync(asset.src).size;
  totalOut += fs.statSync(asset.out).size;
}

// Sanity: the HTML must reference both artifacts, or it serves stale/unminified.
const html = fs.readFileSync('index.html', 'utf8');
for (const asset of ASSETS) {
  if (!html.includes(asset.out)) {
    console.error(`✗ index.html does not reference ${asset.out} — build incomplete.`);
    process.exit(1);
  }
}

console.log('\n✓ Build complete');
console.log(`  Source total: ${(totalIn / 1024).toFixed(1)} KB`);
console.log(`  Minified total: ${(totalOut / 1024).toFixed(1)} KB`);
console.log(`  Reduction: ${((totalIn - totalOut) / totalIn * 100).toFixed(1)}%`);
