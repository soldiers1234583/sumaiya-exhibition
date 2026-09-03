// Diagnose the LIVE site's animation state with real Chromium.
// Reports ground-truth facts we can't see from static analysis.
import { chromium } from 'playwright';

const SITE = 'https://soldiers1234583.github.io/sumaiya-site/';

const browser = await chromium.launch();
const errors = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push(`CONSOLE ERROR: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`PAGE ERROR: ${e.message}`));

await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => errors.push('NAV ERROR: ' + e.message));

// 1. prefers-reduced-motion state
const reduceMotion = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
const jsPresent = await page.evaluate(() => document.documentElement.classList.contains('js'));
const noJs = await page.evaluate(() => document.documentElement.classList.contains('no-js'));

// 2. Did the libs / animation engine load?
const libs = await page.evaluate(() => ({
  gsap: !!window.gsap,
  anime: !!window.anime,
  ScrollTrigger: !!window.ScrollTrigger,
}));

// 3. Are any .reveal elements stuck invisible (opacity 0) after load + scroll?
const reveals = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.reveal')];
  const visible = els.filter(e => parseFloat(getComputedStyle(e).opacity) > 0.5).length;
  const stuck = els.filter(e => parseFloat(getComputedStyle(e).opacity) < 0.5).length;
  const revealedClass = els.filter(e => e.classList.contains('revealed')).length;
  return { total: els.length, visible, stuck, revealedClass };
});

// 4. Scroll down to trigger reveal batches, then re-check.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2500);
const afterScroll = await page.evaluate(() => {
  const els = [...document.querySelectorAll('.reveal')];
  return {
    visible: els.filter(e => parseFloat(getComputedStyle(e).opacity) > 0.5).length,
    stuck: els.filter(e => parseFloat(getComputedStyle(e).opacity) < 0.5).length,
  };
});

// 5. Is any component hidden by reduced-motion (display:none / opacity:0)?
const hiddenComps = await page.evaluate(() => {
  const sel = ['.crochet-reveal', '.memory-marquee', '.polaroid-back', '.meteor', '.lamplight', '.bento-spotlight'];
  return sel.filter(s => {
    const el = document.querySelector(s);
    if (!el) return false;
    const st = getComputedStyle(el);
    return st.display === 'none' || parseFloat(st.opacity) < 0.05;
  });
});

// 6. Preloader state after load (should be gone by now)
const preloaderGone = await page.evaluate(() => !document.getElementById('preloader'));

console.log(JSON.stringify({ reduceMotion, jsPresent, noJs, libs, reveals, afterScroll, hiddenComps, preloaderGone, errors }, null, 2));
await browser.close();
