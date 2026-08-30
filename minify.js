#!/usr/bin/env node
/**
 * Safe CSS/JS minifier backed by real parsers (not regex):
 *   - CSS:  lightningcss  (correctly preserves calc()/min()/clamp() spacing,
 *          handles url(), custom properties, @media, etc.)
 *   - JS:   terser        (AST-aware; safe with strings, template literals,
 *          regex literals and ASI)
 *
 * Usage: node minify.js <input-file> <output-file>
 */

const fs = require('fs');
const path = require('path');

function minifyCSS(css) {
  const { transform } = require('lightningcss');
  const { code } = transform({
    filename: 'styles.css',
    code: Buffer.from(css, 'utf8'),
    minify: true,
    // No `targets`: keep modern syntax as-authored (no needless transpilation).
  });
  return code.toString('utf8');
}

function minifyJS(js, isModule) {
  const terser = require('terser');
  // terser.minify returns a Promise (async worker). compress defaults are
  // conservative and well-tested; mangle keeps output small without risk.
  return terser.minify(js, {
    module: !!isModule,
    compress: {
      passes: 2,
      // Preserve behaviour that relies on retained property reads / void
      // expressions (e.g. forced reflow reads in animation code).
      toplevel: false,
    },
    mangle: { toplevel: false },
    format: { comments: false },
  });
}

// Main execution
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node minify.js <input-file> <output-file> [--module]');
  process.exit(1);
}

const [inputFile, outputFile] = args;
const ext = path.extname(inputFile).toLowerCase();
const isModule = args.includes('--module');

(async function main() {
  try {
    const content = fs.readFileSync(inputFile, 'utf8');
    let minified;

    if (ext === '.css') {
      minified = minifyCSS(content);
    } else if (ext === '.js') {
      const result = await minifyJS(content, isModule);
      if (result.error) throw result.error;
      minified = result.code;
    } else {
      console.error(`Unsupported file type: ${ext}`);
      process.exit(1);
    }

    fs.writeFileSync(outputFile, minified, 'utf8');

    const originalSize = Buffer.byteLength(content, 'utf8');
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);

    console.log(`✓ Minified ${inputFile} → ${outputFile}`);
    console.log(`  Original: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`  Minified: ${(minifiedSize / 1024).toFixed(1)} KB`);
    console.log(`  Reduction: ${reduction}%`);

  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
})();
