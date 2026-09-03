// Diagnose the audio dock play/pause with real Chromium.
import { chromium } from 'playwright';

const SITE = 'https://soldiers1234583.github.io/sumaiya-site/';
const browser = await chromium.launch();
const errors = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => errors.push('NAV: ' + e.message));

// The dock becomes visible when the gallery scrolls into view.
await page.evaluate(() => { const g = document.getElementById('gallery'); if (g) g.scrollIntoView(); });
await page.waitForTimeout(1200);

const before = await page.evaluate(() => {
  const p = document.getElementById('dockPlay');
  return { exists: !!p, text: p && p.textContent, visible: !!(p && p.offsetParent) };
});

// Click the play button.
let clickErr = null;
try { await page.click('#dockPlay', { timeout: 4000 }); } catch (e) { clickErr = 'CLICK ERR: ' + e.message; }
await page.waitForTimeout(1500);

const after = await page.evaluate(() => {
  const p = document.getElementById('dockPlay');
  const info = { playText: p && p.textContent, isPlayingClass: document.querySelector('.audio-dock')?.classList.contains('playing'), vinylSpin: document.querySelector('.dock-vinyl')?.classList.contains('spinning') };
  // Try to reach the <audio> element
  let audio = null;
  // It's created in JS via new Audio(), not in DOM; check via any <audio>
  const els = document.querySelectorAll('audio');
  info.audioEls = els.length;
  info.dockTrack = document.getElementById('dockTrack')?.textContent;
  info.dockArtist = document.getElementById('dockArtist')?.textContent;
  return info;
});

// Also test the next button
let nextErr = null;
try { await page.click('#dockNext', { timeout: 4000 }); } catch (e) { nextErr = 'NEXT ERR: ' + e.message; }

console.log(JSON.stringify({ before, after, clickErr, nextErr, errors }, null, 2));
await browser.close();
