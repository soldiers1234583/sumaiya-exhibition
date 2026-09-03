/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════
   NOTE: The preloader logic lives inline in index.html (so it still hides the
   splash even if this external script fails to load). Do NOT duplicate it here.
   */
function initApp() {
try {

/* ═══════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
   ═══════════════════════════════════════════ */
const toastContainer = document.getElementById('toastContainer');
let toastCounter = 0;

function showToast(title, opts) {
  opts = opts || {};
  const id = 'toast-' + (++toastCounter);
  const duration = opts.duration || 4000;
  const type = opts.type || 'info';

  const iconMap = {
    success: '✓',
    info: '✦',
    error: '✕',
    warning: '⚠'
  };

  const el = document.createElement('div');
  el.className = 'toast';
  el.id = id;
  el.setAttribute('data-type', type);
  el.setAttribute('role', 'status');

  const icon = document.createElement('div');
  icon.className = 'toast-icon toast-icon--' + type;
  icon.textContent = iconMap[type] || '✦';

  const body = document.createElement('div');
  body.className = 'toast-body';

  const titleEl = document.createElement('div');
  titleEl.className = 'toast-title';
  titleEl.textContent = title;
  body.appendChild(titleEl);

  if (opts.description) {
    const descEl = document.createElement('div');
    descEl.className = 'toast-desc';
    descEl.textContent = opts.description;
    body.appendChild(descEl);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.textContent = '✕';

  const progress = document.createElement('div');
  progress.className = 'toast-progress';
  // ScaleX from 1 → 0 (composited) instead of animating width (layout+paint).
  progress.style.transformOrigin = 'left center';

  el.appendChild(icon);
  el.appendChild(body);
  el.appendChild(closeBtn);
  el.appendChild(progress);

  toastContainer.appendChild(el);

  // Trigger enter animation
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      el.classList.add('show');
    });
  });

  // Progress bar animation
  if (duration < Infinity) {
    requestAnimationFrame(function() {
      progress.style.transition = 'transform ' + duration + 'ms linear';
      progress.style.transform = 'scaleX(0)';
    });
  }

  // Close button
  closeBtn.addEventListener('click', function() {
    dismissToast(id);
  });

  // Auto-dismiss
  let timer;
  if (duration < Infinity) {
    timer = setTimeout(function() { dismissToast(id); }, duration);
  }

  // Pause on hover
  el.addEventListener('mouseenter', function() {
    if (timer) clearTimeout(timer);
    progress.style.transition = 'none';
  });
  el.addEventListener('mouseleave', function() {
    if (duration < Infinity) {
      const remaining = getRemainingPct(progress) * duration;
      if (remaining > 0) {
        progress.style.transition = 'transform ' + remaining + 'ms linear';
        progress.style.transform = 'scaleX(0)';
        timer = setTimeout(function() { dismissToast(id); }, remaining);
      }
    }
  });

  return id;
}

// Fraction of toast progress still left (1 → 0), read from the live transform.
function getRemainingPct(progress) {
  const t = getComputedStyle(progress).transform;
  if (!t || t === 'none') return 1;
  // matrix(a, b, c, d, e, f) → scaleX is 'a'.
  const m = t.match(/matrix\(([^,]+)/);
  const sx = m ? parseFloat(m[1]) : 1;
  return Math.max(0, Math.min(1, sx));
}

function dismissToast(id) {
  const el = document.getElementById(id);
  if (!el || el.classList.contains('hiding')) return;
  el.classList.remove('show');
  el.classList.add('hiding');
  setTimeout(function() { el.remove(); }, 350);
}

window.showToast = showToast;
window.dismissToast = dismissToast;

/* SET INITIAL HIDDEN STATE (via JS, not CSS)
   so anime.js can override inline styles on animate */
document.querySelectorAll('.crochet-card, .bento-card, .finale-card').forEach(function(el) {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
});

/* ═══════════════════════════════════════════
   ARTWORK DATA
   ═══════════════════════════════════════════ */
const artworks = [
  { id: 'p01', src: 'images/gallery/IMG_20260814_174655_930.webp', title: 'Memory 01', date: 'Aug 2026', orientation: 'portrait', critique: 'A captured moment, filed straight into the archives with love.' },
  { id: 'p02', src: 'images/gallery/IMG_20260814_174659_254.webp', title: 'Memory 02', date: 'Aug 2026', orientation: 'portrait', critique: 'The kind of frame that holds more than a photo usually can.' },
  { id: 'p03', src: 'images/gallery/IMG_20260814_174701_952.webp', title: 'Memory 03', date: 'Aug 2026', orientation: 'landscape', critique: 'Some moments just deserve a permanent exhibit slot.' },
  { id: 'p04', src: 'images/gallery/IMG_20260814_174704_518.webp', title: 'Memory 04', date: 'Aug 2026', orientation: 'landscape', critique: 'Certified exhibition material — no notes needed.' },
  { id: 'p05', src: 'images/gallery/IMG_20260814_174706_974.webp', title: 'Memory 05', date: 'Aug 2026', orientation: 'landscape', critique: 'Museum staff: quietly impressed, refusing to admit it.' },
  { id: 'p06', src: 'images/gallery/IMG_20260814_174709_139.webp', title: 'Memory 06', date: 'Aug 2026', orientation: 'landscape', critique: 'Proof that the good stuff happens between the plan and the pose.' },
  { id: 'p07', src: 'images/gallery/IMG_20260814_174711_153.webp', title: 'Memory 07', date: 'Aug 2026', orientation: 'landscape', critique: 'A little piece of the day, preserved exactly as it felt.' },
  { id: 'p08', src: 'images/gallery/IMG_20260814_174713_404.webp', title: 'Memory 08', date: 'Aug 2026', orientation: 'landscape', critique: 'Hung with the same care it was taken with.' },
  { id: 'p09', src: 'images/gallery/IMG_20260814_174716_227.webp', title: 'Memory 09', date: 'Aug 2026', orientation: 'landscape', critique: 'One of those frames you look at twice and smile both times.' },
  { id: 'p10', src: 'images/gallery/IMG_20260814_174720_419.webp', title: 'Memory 10', date: 'Aug 2026', orientation: 'portrait', critique: 'Archived under: absolutely worth keeping.' },
  { id: 'p11', src: 'images/gallery/IMG_20260814_174723_730.webp', title: 'Memory 11', date: 'Aug 2026', orientation: 'portrait', critique: 'The kind of energy the whole exhibition was built around.' },
  { id: 'p12', src: 'images/gallery/IMG_20260814_174745_005.webp', title: 'Memory 12', date: 'Aug 2026', orientation: 'portrait', critique: 'Signed by the moment itself — no caption needed.' },
  { id: 'p13', src: 'images/gallery/IMG_20260814_174746_861.webp', title: 'Memory 13', date: 'Aug 2026', orientation: 'portrait', critique: 'Warmth in frame form. Filed with the rest of the favourites.' },
  { id: 'p14', src: 'images/gallery/IMG_20260814_174754_951.webp', title: 'Memory 14', date: 'Aug 2026', orientation: 'portrait', critique: 'A keeper. The archives said so, so it must be true.' },
  { id: 'p15', src: 'images/gallery/IMG_20260814_174757_224.webp', title: 'Memory 15', date: 'Aug 2026', orientation: 'landscape', critique: 'The finale-worthy one — saved right where it belongs.' },
  { id: 'p16', src: 'images/gallery/IMG_20260822_095608_715_1_1.webp', title: 'Memory 16', date: 'Aug 2026', orientation: 'landscape', critique: 'Fresh from the moment — added straight to the archives.' },
  { id: 'p17', src: 'images/gallery/IMG_20260822_095615_443_1.webp', title: 'Memory 17', date: 'Aug 2026', orientation: 'portrait', critique: 'Another keeper, filed exactly where it should be.' },
  { id: 'p18', src: 'images/gallery/IMG_20260822_095628_695.webp', title: 'Memory 18', date: 'Aug 2026', orientation: 'landscape', critique: 'The collection just got a little more complete.' },
];

/* ── Memory marquee — film strip of the archives ── */
const marqueeTrack = document.getElementById('marqueeTrack');
if (marqueeTrack && artworks.length) {
  const buildMarquee = () => artworks.forEach(art => {
    const item = document.createElement('div');
    item.className = 'marquee-item';
    const img = document.createElement('img');
    img.src = art.src + '?v=9';
    img.alt = '';
    img.width = (art.orientation === 'landscape') ? 4 : 3;
    img.height = (art.orientation === 'landscape') ? 3 : 4;
    img.loading = 'lazy';
    img.decoding = 'async';
    item.appendChild(img);
    marqueeTrack.appendChild(item);
  });
  buildMarquee();
  buildMarquee(); // duplicate for a seamless loop
}

/* ═══════════════════════════════════════════
   RENDER GALLERY — TOUCH CAROUSEL
   Circular 3D-flip cards, swipable side-by-side.
   ═══════════════════════════════════════════ */
const carouselTrack = document.getElementById('carouselTrack');
const carouselDots = document.getElementById('carouselDots');
const carouselCaption = document.getElementById('carouselCaption');
const carouselCat = document.getElementById('carouselCat');
const carouselTitle = document.getElementById('carouselTitle');
const carouselCritique = document.getElementById('carouselCritique');
const carouselNote = document.getElementById('carouselNote');
const carouselLive = document.getElementById('carouselLive');
const carouselViewport = carouselTrack.closest('.carousel-viewport');

const ART_NOTES = ['"made with love ♥"', '"certified cutie"', '"the good one"', '"10/10 would frame"', '"sticky-noted with affection"'];

const carouselCards = artworks.map((art, i) => {
  const card = document.createElement('div');
  card.className = 'art-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '-1');
  card.setAttribute('aria-label', `View artwork ${i + 1} of ${artworks.length}: ${art.title}`);
  card.dataset.index = i;
  card.dataset.orientation = art.orientation || 'portrait';

  card.innerHTML = `
    <div class="art-card-inner">
      <div class="art-card-face art-card-front skeleton">
        <img src="${art.src}?v=9" alt="${art.title}" width="${art.orientation === 'landscape' ? 4 : 3}" height="${art.orientation === 'landscape' ? 3 : 4}" loading="lazy" decoding="async">
        <button class="art-examine btn-interactive" tabindex="-1" aria-label="Examine ${art.title} in fullscreen">⌕</button>
      </div>
      <div class="art-card-face art-card-back">
        <div class="art-stamp-cat">CAT. ${String(i + 1).padStart(2, '0')} — ${art.date}</div>
        <div class="art-stamp-note">${ART_NOTES[i % ART_NOTES.length]}</div>
        <div class="art-stamp-date">the sumaiya archives</div>
      </div>
    </div>
  `;

  // Tap / flip handled in pointerup (so it doesn't fight swipe)
  return card;
});
carouselCards.forEach(c => carouselTrack.appendChild(c));

// Dots
carouselCards.forEach((c, i) => {
  const dot = document.createElement('button');
  dot.className = 'carousel-dot';
  dot.setAttribute('aria-label', `Go to artwork ${i + 1}`);
  dot.addEventListener('click', () => goToSlide(i));
  carouselDots.appendChild(dot);
});

let currentSlide = 0;
let isFlipped = false;
let prevSlide = 0;
let carouselScrollTicking = false;
let scriptedScroll = false;
// Cached card metrics — measuring offsetLeft/offsetWidth on all 18 cards every
// scroll frame forces layout. Refresh on resize / content-visibility re-sync.
let cardMetrics = [];
function refreshCardMetrics() {
  cardMetrics = carouselCards.map((card) => ({
    left: card.offsetLeft,
    w: card.offsetWidth,
  }));
}
refreshCardMetrics();

function updateActiveUI(index) {
  currentSlide = index;
  carouselCards.forEach((card, i) => {
    const active = i === index;
    card.classList.toggle('active', active);
    card.setAttribute('tabindex', active ? '0' : '-1');
    const exBtn = card.querySelector('.art-examine');
    if (exBtn) exBtn.setAttribute('tabindex', active ? '0' : '-1');
  });
  carouselDots.querySelectorAll('.carousel-dot').forEach((d, i) => {
    d.classList.toggle('active', i === index);
    if (i === index) d.setAttribute('aria-current', 'true');
    else d.removeAttribute('aria-current');
  });
  updateCaption();
  isFlipped = false;
  carouselCards.forEach(c => c.querySelector('.art-card-inner').style.transform = '');
}

function spinActiveCard() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const activeCard = carouselCards[currentSlide];
  if (!activeCard) return;
  // Don't restart the flip mid-swipe-dwell — a rapid direction change would
  // restart the keyframe from zero. Guard so it simply keeps the current spin.
  if (activeCard._spinT) return;
  activeCard.classList.add('spinning');
  activeCard._spinT = setTimeout(() => {
    activeCard.classList.remove('spinning');
    activeCard._spinT = null;
  }, 700);
}

function goToSlide(index, { spin = true, smooth = true, focus = false } = {}) {
  const total = artworks.length;
  const idx = ((index % total) + total) % total;
  const target = carouselCards[idx];
  if (!target) return;
  const vpWidth = carouselViewport.clientWidth;
  const left = target.offsetLeft - (vpWidth - target.offsetWidth) / 2;
  scriptedScroll = true;
  // Respect reduced motion: snap instead of smooth-scrolling.
  carouselViewport.scrollTo({ left: Math.max(0, left), behavior: smooth && motionOK ? 'smooth' : 'auto' });
  updateActiveUI(idx);
  if (spin && motionOK) spinActiveCard();
  if (focus) carouselCards[idx].focus({ preventScroll: true });
  setTimeout(() => { scriptedScroll = false; }, 800);
}

function updateCaption() {
  const art = artworks[currentSlide];
  carouselCat.textContent = `CAT. ${String(currentSlide + 1).padStart(2, '0')} — ${art.date}`;
  carouselTitle.textContent = `"${art.title}"`;
  carouselCritique.textContent = art.critique;
  carouselNote.textContent = ART_NOTES[currentSlide % ART_NOTES.length];
  carouselLive.textContent = `Artwork ${currentSlide + 1} of ${artworks.length}`;
}

function flipActive(flipTo) {
  const active = carouselCards[currentSlide];
  if (!active) return;
  const inner = active.querySelector('.art-card-inner');
  if (flipTo === undefined) flipTo = !isFlipped;
  isFlipped = flipTo;
  inner.style.transform = flipTo ? 'rotateY(180deg)' : '';
}

// Card click: tap active card → flip, tap neighbor → scroll to it
// Enter/Space on the active card also flips (keyboard accessibility)
carouselCards.forEach((card, i) => {
  card.addEventListener('click', () => {
    if (i === currentSlide) flipActive();
    else goToSlide(i, { focus: true });
  });
  card.addEventListener('keydown', (e) => {
    if (i !== currentSlide) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flipActive();
    }
  });
  const exBtn = card.querySelector('.art-examine');
  if (exBtn) {
    exBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openLightbox(i);
    });
  }
});

// Scroll-based active detection — find the card closest to viewport center
function activeIndexFromScroll() {
  const vpCenter = carouselViewport.scrollLeft + carouselViewport.clientWidth / 2;
  let best = 0;
  let bestDist = Infinity;
  cardMetrics.forEach((m, i) => {
    const center = m.left + m.w / 2;
    const dist = Math.abs(center - vpCenter);
    if (dist < bestDist) { bestDist = dist; best = i; }
  });
  return best;
}

carouselViewport.addEventListener('scroll', () => {
  if (carouselScrollTicking) return;
  carouselScrollTicking = true;
  requestAnimationFrame(() => {
    const idx = activeIndexFromScroll();
    if (idx !== currentSlide) {
      prevSlide = currentSlide;
      updateActiveUI(idx);
      if (!scriptedScroll) spinActiveCard();
    }
    carouselScrollTicking = false;
  });
}, { passive: true });

// Recompute on resize + IntersectionObserver (handles content-visibility)
let resizeT;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    refreshCardMetrics();
    goToSlide(currentSlide, { spin: false, smooth: false });
  }, 120);
});

// When the carousel becomes visible (content-visibility deferred), re-sync
const resizeObserver = new ResizeObserver(() => {
  refreshCardMetrics();
  const target = carouselCards[currentSlide];
  if (target) {
    carouselViewport.scrollLeft = Math.max(0, target.offsetLeft - (carouselViewport.clientWidth - target.offsetWidth) / 2);
  }
});
resizeObserver.observe(carouselCards[0]);
// Also observe the viewport for size changes (content-visibility rendering)
const roObserver = new ResizeObserver(() => {
  goToSlide(currentSlide, { spin: false, smooth: false });
});
roObserver.observe(carouselViewport);

// IntersectionObserver: recalc when carousel enters viewport (content-visibility)
const io = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    goToSlide(currentSlide, { spin: false, smooth: false });
    io.disconnect();
  }
});
io.observe(carouselViewport);

// Initial
updateActiveUI(0);
carouselCards[0].setAttribute('tabindex', '0');

/* ═══════════════════════════════════════════
   LIGHTBOX — fullscreen exhibit view with Lens magnification
   ═══════════════════════════════════════════ */
const lightbox = document.getElementById('lightbox');
const lightboxArt = document.getElementById('lightboxArt');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxLens = document.getElementById('lightboxLens');
const lightboxCat = document.getElementById('lightboxCat');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxCritique = document.getElementById('lightboxCritique');
const lightboxHint = document.getElementById('lightboxHint');
const lightboxCount = document.getElementById('lightboxCount');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxReduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const lightboxCoarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
const LENS_SIZE = 170;
const LENS_ZOOM = 2;
let lightboxOpen = false;
let lightboxIndex = 0;
let lightboxLastFocused = null;

function updateLightbox() {
  const art = artworks[lightboxIndex];
  lightboxImg.src = art.src + '?v=9';
  lightboxImg.alt = art.title;
  lightboxCat.textContent = `CAT. ${String(lightboxIndex + 1).padStart(2, '0')} — ${art.date}`;
  lightboxTitle.textContent = `"${art.title}"`;
  lightboxCritique.textContent = art.critique;
  lightboxCount.textContent = `${lightboxIndex + 1} / ${artworks.length}`;
  lightboxLens.style.backgroundImage = 'url("' + art.src + '?v=9")';
  lightboxLens.style.opacity = '0';
  lightboxArt.classList.remove('zoomed');
  lightboxArt.style.transformOrigin = '50% 50%';
  preloadLightbox(lightboxIndex);
}

// Preload neighbouring artworks so arrow navigation is instant
function preloadLightbox(i) {
  [i - 1, i + 1].forEach(d => {
    const idx = ((d % artworks.length) + artworks.length) % artworks.length;
    const img = new Image();
    img.src = artworks[idx].src + '?v=9';
  });
}

function openLightbox(i) {
  lightboxIndex = ((i % artworks.length) + artworks.length) % artworks.length;
  updateLightbox();
  lightboxLastFocused = document.activeElement;
  lightbox.classList.add('open');
  document.body.classList.add('no-scroll');
  requestAnimationFrame(() => {
    lightboxClose.focus({ preventScroll: true });
  });
  lightboxHint.textContent = lightboxCoarse ? 'tap the photo to zoom · tap again to reset' : 'hover to examine the artwork';
  lightboxOpen = true;
}

function closeLightbox() {
  if (!lightboxOpen) return;
  lightboxOpen = false;
  lightbox.classList.remove('open');
  document.body.classList.remove('no-scroll');
  lightboxLens.style.opacity = '0';
  if (lightboxLastFocused && lightboxLastFocused.focus) lightboxLastFocused.focus({ preventScroll: true });
}

function lightboxGo(delta) {
  lightboxIndex = ((lightboxIndex + delta) % artworks.length + artworks.length) % artworks.length;
  updateLightbox();
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => lightboxGo(-1));
lightboxNext.addEventListener('click', () => lightboxGo(1));

document.addEventListener('keydown', (e) => {
  if (!lightboxOpen) return;
  if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); lightboxGo(-1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); lightboxGo(1); }
  else if (e.key === 'Home') { e.preventDefault(); lightboxGo(-artworks.length); }
  else if (e.key === 'End') { e.preventDefault(); lightboxGo(artworks.length); }
});

// Focus trap — keep Tab cycling within the lightbox
lightbox.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const focusables = lightbox.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

// Lens magnification (fine pointers only)
if (!lightboxCoarse && !lightboxReduce) {
  lightboxImg.addEventListener('mousemove', (e) => {
    const rect = lightboxImg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = Math.max(0, Math.min(1, x / rect.width));
    const py = Math.max(0, Math.min(1, y / rect.height));
    const artRect = lightboxArt.getBoundingClientRect();
    const lensX = (rect.left - artRect.left) + px * rect.width - LENS_SIZE / 2;
    const lensY = (rect.top - artRect.top) + py * rect.height - LENS_SIZE / 2;
    const bgW = rect.width * LENS_ZOOM;
    const bgH = rect.height * LENS_ZOOM;
    lightboxLens.style.transform = `translate3d(${lensX}px, ${lensY}px, 0)`;
    lightboxLens.style.backgroundSize = `${bgW}px ${bgH}px`;
    lightboxLens.style.backgroundPosition = `${-(px * bgW - LENS_SIZE / 2)}px ${-(py * bgH - LENS_SIZE / 2)}px`;
    lightboxLens.style.opacity = '1';
  });
  lightboxImg.addEventListener('mouseleave', () => { lightboxLens.style.opacity = '0'; });
} else if (lightboxCoarse) {
  // Touch: tap to zoom at the tapped point, tap again (or tap elsewhere) to reset
  lightboxImg.addEventListener('click', (e) => {
    if (lightboxArt.classList.contains('zoomed')) {
      lightboxArt.classList.remove('zoomed');
      return;
    }
    const rect = lightboxImg.getBoundingClientRect();
    const ox = ((e.clientX - rect.left) / rect.width) * 100;
    const oy = ((e.clientY - rect.top) / rect.height) * 100;
    lightboxArt.style.transformOrigin = `${ox}% ${oy}%`;
    lightboxArt.classList.add('zoomed');
  });
  lightboxImg.addEventListener('touchmove', (e) => {
    if (!lightboxArt.classList.contains('zoomed')) return;
    e.preventDefault();
    const rect = lightboxImg.getBoundingClientRect();
    const t = e.touches[0];
    const ox = ((t.clientX - rect.left) / rect.width) * 100;
    const oy = ((t.clientY - rect.top) / rect.height) * 100;
    lightboxArt.style.transformOrigin = `${ox}% ${oy}%`;
  }, { passive: false });
}

/* ── Keyboard carousel navigation — arrows move the gallery when in view ── */
let galleryInView = false;
const gallerySectionEl = document.getElementById('gallery');
if (gallerySectionEl && 'IntersectionObserver' in window) {
  new IntersectionObserver((entries) => {
    entries.forEach(en => { galleryInView = en.isIntersecting; });
  }, { threshold: 0.15 }).observe(gallerySectionEl);
}
document.addEventListener('keydown', (e) => {
  if (lightboxOpen || !galleryInView) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); goToSlide(currentSlide - 1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); goToSlide(currentSlide + 1); }
});

/* ═══════════════════════════════════════════
   505 REASONS — tap to flip one
   ═══════════════════════════════════════════ */
const reasonBtn = document.getElementById('reasonBtn');
const reasonText = document.getElementById('reasonText');
const REASONS = [
  "reason #7 — the way she laughs at her own jokes first",
  "reason #23 — she remembers the small things nobody else does",
  "reason #41 — unbothered by the drama, obsessed with her people",
  "reason #67 — she makes ordinary days feel like a show you didn't want to end",
  "reason #12 — chaos with a plan, and the plan is usually kindness",
  "reason #88 — the pen that writes faster than the heart catches up",
  "reason #31 — somehow both the calm one and the storm",
  "reason #56 — she turns 'I can't' into 'watch me' without drama",
  "reason #9 — the friend who actually listens, then makes you laugh",
  "reason #102 — her taste is a personality trait and it's excellent",
  "reason #77 — patient with the world, fierce for the people she loves",
  "reason #5 — she holds pole position in our hearts, obviously",
  "reason #145 — proof that soft people can be the strongest",
  "reason #50 — the 505 to our nostalgia, every single time",
];
let lastReason = -1;
let reasonSwapTO = null;
let reasonPulseTO = null;
function flipReason() {
  if (!reasonBtn || !reasonText) return;
  let i;
  do { i = Math.floor(Math.random() * REASONS.length); } while (i === lastReason);
  lastReason = i;
  // Cancel any in-flight swap so rapid clicks can't race two timeouts and let
  // the text teleport mid-fade. The swap class is re-applied for a clean enter.
  if (reasonSwapTO) clearTimeout(reasonSwapTO);
  if (reasonPulseTO) clearTimeout(reasonPulseTO);
  reasonText.classList.remove('swap');
  reasonText.textContent = REASONS[i];
  // Force a reflow ONCE so the next 'swap' class restarts the transition cleanly.
  void reasonText.offsetWidth;
  reasonText.classList.add('swap');
  reasonSwapTO = setTimeout(() => reasonText.classList.remove('swap'), 240);
  reasonBtn.classList.remove('pulsing');
  void reasonBtn.offsetWidth;
  reasonBtn.classList.add('pulsing');
  reasonPulseTO = setTimeout(() => reasonBtn.classList.remove('pulsing'), 700);
}
if (reasonBtn && reasonText) {
  reasonBtn.addEventListener('click', flipReason);
  reasonText.textContent = REASONS[0];
  lastReason = 0;
}

/* ── Easter egg: typing 505 reveals the secret reason ── */
(function egg505() {
  const SECRET_REASON = "reason #505 — the one that started it all. for the night drives, always.";
  const TARGET = ['5', '0', '5'];
  let buf = [];
  let eggTimer = null;
  document.addEventListener('keydown', (e) => {
    if (lightboxOpen) return;
    // Don't trigger while typing in a form field (e.g. the guestbook).
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    buf.push(e.key);
    if (buf.length > TARGET.length) buf.shift();
    clearTimeout(eggTimer);
    eggTimer = setTimeout(() => { buf = []; }, 2000);
    if (TARGET.every((k, i) => buf[i] === k)) {
      buf = [];
      if (reasonText) {
        reasonText.textContent = SECRET_REASON;
        reasonBtn.classList.remove('pulsing');
        void reasonBtn.offsetWidth;
        reasonBtn.classList.add('pulsing');
      }
      showToast('505 ♥', {
        type: 'success',
        description: 'for the night drives',
        duration: 3500
      });
    }
  });
})();

/* ── Scroll-revealed reasons list ── */
const reasonsList = document.getElementById('reasonsList');
if (reasonsList) {
  const REASONS_FULL = [
    "she laughs at her own jokes first, and it's contagious",
    "she remembers the small things nobody else does",
    "unbothered by the drama, obsessed with her people",
    "makes ordinary days feel like a show you didn't want to end",
    "chaos with a plan — and the plan is usually kindness",
    "the pen that writes faster than the heart can catch up",
    "somehow both the calm one and the storm",
    "turns 'I can't' into 'watch me' without any drama",
    "the friend who actually listens, then makes you laugh",
    "her taste is a personality trait and it's excellent",
    "patient with the world, fierce for the people she loves",
    "proof that soft people can be the strongest",
    "the 505 to our nostalgia, every single time",
    "gives the best advice and the best roast in the same breath",
    "makes being a good person look effortless",
    "the one who shows up, even when it costs her something",
  ];
  REASONS_FULL.forEach((r, i) => {
    const item = document.createElement('div');
    item.className = 'reason-item';
    item.innerHTML = `<span class="r-heart" aria-hidden="true">♥</span><span>${r}</span>`;
    reasonsList.appendChild(item);
  });
  const reasonItems = reasonsList.querySelectorAll('.reason-item');
  const reasonsCountEl = document.getElementById('reasonsCount');
  let reasonsRevealed = 0;
  function updateReasonsCount() {
    if (reasonsCountEl) reasonsCountEl.textContent = String(reasonsRevealed);
  }
  if (window.IntersectionObserver) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          reasonsRevealed += 1;
          updateReasonsCount();
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    reasonItems.forEach((el, i) => {
      el.style.transitionDelay = (i * 0.04) + 's';
      ro.observe(el);
    });
  } else {
    reasonItems.forEach(el => el.classList.add('revealed'));
    reasonsRevealed = reasonItems.length;
    updateReasonsCount();
  }
}

/* ── Tracing Beam — gold thread through the 505 reasons (Aceternity style) ── */
const beamTrack = document.getElementById('beamTrack');
const beamHead = document.getElementById('beamHead');
const reasonsWrap = document.querySelector('.reasons-wrap');
if (beamTrack && beamHead && reasonsWrap && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
  // Cache track height so the scrub writes a transform, not `top` (layout).
  let beamH = 0;
  const refreshBeamH = () => { beamH = beamTrack.clientHeight || 0; };
  refreshBeamH();
  new ResizeObserver(refreshBeamH).observe(beamTrack);
  ScrollTrigger.create({
    trigger: reasonsWrap,
    start: 'top 75%',
    end: 'bottom 45%',
    scrub: 0.6,
    onUpdate: function(self) {
      const p = Math.max(0, Math.min(1, self.progress));
      beamTrack.style.clipPath = 'inset(0 0 ' + (100 - p * 100) + '% 0)';
      beamHead.style.transform = 'translate(-50%, calc(-50% + ' + (p * beamH) + 'px))';
    }
  });
}

/* ── Cursor / finger sparkle trail — pooled canvas (no DOM churn) ── */
(function sparkleTrail() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  // Reactive reduced-motion flag so toggling the OS setting mid-session stops
  // the trail without a reload (a one-shot check here would go stale).
  const reduceMQ = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduceM = reduceMQ ? reduceMQ.matches : false;
  if (reduceMQ && reduceMQ.addEventListener) {
    reduceMQ.addEventListener('change', (e) => { reduceM = e.matches; });
  }
  const SPARKLE_COLORS = ['#E5898B', '#C7B8E8', '#D4AF37', '#9FAF90'];

  const canvas = document.createElement('canvas');
  canvas.className = 'sparkle-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const DPR = Math.min(window.devicePixelRatio || 1, isCoarse ? 1.5 : 2);
  let W = 0, H = 0;
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let particles = [];
  // Touch: far fewer particles + heavier throttle so the trail doesn't compete
  // with scroll for main-thread time. Desktop keeps the denser trail.
  const MAX = isCoarse ? 18 : 90;
  const SPAWN_MS = isCoarse ? 60 : 32;

  function spawn(x, y) {
    particles.push({
      x: x + (Math.random() * 16 - 8),
      y: y + (Math.random() * 16 - 8),
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6 - 0.3,
      life: 1,
      decay: 0.028 + Math.random() * 0.03,
      size: Math.random() * 3 + 2,
      color: SPARKLE_COLORS[(Math.random() * SPARKLE_COLORS.length) | 0],
    });
    if (particles.length > MAX) particles.shift();
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (particles.length) requestAnimationFrame(frame);
  }

  let throttle = false;
  const evt = isCoarse ? 'touchmove' : 'mousemove';
  document.addEventListener(evt, (e) => {
    if (reduceM) return;
    if (throttle) return;
    throttle = true;
    setTimeout(() => { throttle = false; }, SPAWN_MS);
    spawn(e.clientX, e.clientY);
    if (!particles.length) requestAnimationFrame(frame);
  }, { passive: true });
})();

/* ═══════════════════════════════════════════
   CONFETTI — canvas-confetti (self-hosted vendor)
   Choreographed heart/star finale in the site palette.
   ═══════════════════════════════════════════ */
const CONFETTI_COLORS = ['#E5898B', '#F7C9C4', '#D4AF37', '#ECE7F6', '#C7E3D1', '#E8A86C', '#FFDFB0', '#FBF8F4'];
const confettiLib = (typeof window !== 'undefined' && window.confetti) ? window.confetti : null;

function heartShape() {
  // Try text-based hearts (best quality); fall back to square confetti.
  try {
    return window.confetti.shapeFromText({ text: '♥', scalar: 2 });
  } catch (e) {
    return null;
  }
}

function launchConfetti() {
  if (!confettiLib) return;
  const heart = heartShape();
  const shapes = heart ? [heart] : ['square'];

  // 1) burst from center
  confettiLib({ particleCount: 90, spread: 75, startVelocity: 34, scalar: 1.1, ticks: 220, colors: CONFETTI_COLORS, shapes });
  // 2) side canons from the bottom corners
  confettiLib({ particleCount: 55, angle: 60, spread: 60, origin: { x: 0, y: 0.9 }, colors: CONFETTI_COLORS, shapes });
  confettiLib({ particleCount: 55, angle: 120, spread: 60, origin: { x: 1, y: 0.9 }, colors: CONFETTI_COLORS, shapes });
  // 3) gentle heart rain afterwards
  setTimeout(() => {
    confettiLib({ particleCount: 40, spread: 120, startVelocity: 18, gravity: 0.7, ticks: 260, scalar: 1.3, colors: ['#E5898B', '#F7C9C4', '#D4AF37'], shapes });
  }, 350);
}

/* ── Heart burst — delight erupts from the button when you dedicate ──
   GPU-composited (transform + opacity + scale only): hearts float up from the
   button and fade, with a springy pop on the button itself. Skipped under
   prefers-reduced-motion. `tier` (archived heart count) enriches the palette
   so more-visited archives celebrate a little warmer. */
function heartBurst(el, tier) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof gsap === 'undefined') return;
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  // Every heart count unlocks another accent, capped.
  const CORE = ['#E5898B', '#F7C9C4', '#D4AF37'];
  const EXTRA = ['#C7B8E8', '#C7E3D1', '#E8A86C', '#9FAF90', '#F3B9D0'];
  const tierIdx = Math.max(0, Math.min((tier | 0) - 1, EXTRA.length));
  const COLORS = CORE.concat(EXTRA.slice(0, tierIdx));
  const N = Math.min(26, 14 + tierIdx * 2); // a few more hearts as the count grows
  for (let i = 0; i < N; i++) {
    const h = document.createElement('span');
    h.setAttribute('aria-hidden', 'true');
    h.textContent = '♥';
    h.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;left:0;top:0;' +
      'font-size:' + (16 + Math.random() * 16) + 'px;line-height:1;' +
      'color:' + COLORS[(Math.random() * COLORS.length) | 0] + ';' +
      'will-change:transform,opacity;' +
      'text-shadow:0 1px 8px rgba(229,137,139,0.45);';
    document.body.appendChild(h);
    const dx = (Math.random() - 0.5) * 220;
    const dy = -(90 + Math.random() * 190);
    gsap.set(h, { left: cx, top: cy, xPercent: -50, yPercent: -50, scale: 0.35, opacity: 1, rotation: (Math.random() - 0.5) * 40 });
    gsap.to(h, {
      x: dx, y: dy, opacity: 0, scale: 1.15 + Math.random() * 0.6, rotation: (Math.random() - 0.5) * 120,
      duration: 1.0 + Math.random() * 0.55,
      ease: 'power2.out',
      onComplete: () => { if (h.parentNode) h.remove(); },
    });
  }
  // Springy pop on the button itself.
  gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
}

/* ── Hearts-dedicated counter (persisted locally) ── */
const HEARTS_KEY = 'sumaiya_hearts';
const dedicateHearts = document.getElementById('dedicateHearts');
function loadHearts() {
  try { return parseInt(localStorage.getItem(HEARTS_KEY), 10) || 0; }
  catch (e) { return 0; }
}
let heartCount = loadHearts();
function updateHeartsUI() {
  if (dedicateHearts) {
    dedicateHearts.textContent = heartCount > 0
      ? '♥ ' + heartCount + ' heart' + (heartCount === 1 ? '' : 's') + ' dedicated to this archive'
      : 'be the first to dedicate a heart ♥';
  }
}
updateHeartsUI();

// Gentle double-beat on the heart counter — retriggerable, so rapid clicks
// don't restart it from zero mid-pulse (respects reduced motion).
let _heartsPulseTO = null;
function pulseHearts(el) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!el || !el.classList) return;
  if (!el.classList.contains('pulse')) {
    el.classList.add('pulse');
    _heartsPulseTO = setTimeout(() => el.classList.remove('pulse'), 700);
  }
}

/* ── Guestbook — sign the archive (persisted locally) ── */
const GUESTBOOK_KEY = 'sumaiya_guestbook';
const guestbookLog = document.getElementById('guestbookLog');
const guestbookForm = document.getElementById('guestbookForm');
const gbName = document.getElementById('gbName');
const gbMsg = document.getElementById('gbMsg');

function loadGuestbook() {
  try {
    const raw = localStorage.getItem(GUESTBOOK_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}
function saveGuestbook(entries) {
  try { localStorage.setItem(GUESTBOOK_KEY, JSON.stringify(entries.slice(-25))); }
  catch (e) { /* storage full / unavailable — ignore */ }
}
function renderGuestbook() {
  if (!guestbookLog) return;
  const entries = loadGuestbook();
  if (!entries.length) {
    guestbookLog.innerHTML = '<div class="guestbook-empty">the first page is still blank… write the opening line ♥</div>';
    return;
  }
  guestbookLog.innerHTML = '';
  const els = entries.slice(-8).reverse().map((entry, i) => {
    const el = document.createElement('div');
    el.className = 'guestbook-entry';
    el.style.transform = 'rotate(' + ((i % 2 === 0 ? 1 : -1) * (0.5 + (i % 3))) + 'deg) translateY(8px)';
    el.style.opacity = '0';
    const name = document.createElement('span');
    name.className = 'gb-name';
    name.textContent = (entry.name || 'a friend') + ' — ';
    const msg = document.createElement('span');
    msg.className = 'gb-msg';
    msg.textContent = entry.msg || '';
    el.appendChild(name);
    el.appendChild(msg);
    guestbookLog.appendChild(el);
    return el;
  });
  // Stagger the log into view
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      els.forEach((el, i) => {
        el.style.transition = 'opacity 0.5s var(--ease-out), transform 0.5s var(--ease-out)';
        el.style.transitionDelay = (i * 0.06) + 's';
        el.style.opacity = '1';
        el.style.transform = 'rotate(' + ((i % 2 === 0 ? 1 : -1) * (0.5 + (i % 3))) + 'deg) translateY(0)';
      });
    });
  });
}
renderGuestbook();

if (guestbookForm) {
  guestbookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = gbName.value.trim();
    const msg = gbMsg.value.trim();
    if (!name || !msg) return;
    const entries = loadGuestbook();
    entries.push({ name, msg, time: Date.now() });
    saveGuestbook(entries);
    gbName.value = '';
    gbMsg.value = '';
    renderGuestbook();
    showToast('Signed into the archive', {
      type: 'success',
      description: 'your mark is permanent (on this device) ♥',
      duration: 4000
    });
  });
}

const dedicateBtn = document.getElementById('dedicateBtn');
if (dedicateBtn) {
  dedicateBtn.addEventListener('click', function() {
    // Heart burst erupts from the button itself (palette tied to archived
    // count), then the full celebration.
    heartBurst(this, heartCount + 1);
    launchConfetti();
    this.classList.add('done');
    this.textContent = '♥ Dedicated';
    heartCount += 1;
    try { localStorage.setItem(HEARTS_KEY, String(heartCount)); } catch (err) {}
    updateHeartsUI();
    const msg = document.getElementById('dedicateMsg');
    if (msg) msg.classList.add('show');
    if (dedicateHearts) pulseHearts(dedicateHearts);
    showToast('Dedication filed', {
      type: 'success',
      description: 'You\u2019re heart #' + heartCount + ' in the archive. Permanently archived ♥',
      duration: 5000
    });
  });
}

/* ═══════════════════════════════════════════
   ACCESSIBLE ANIMATION — TIERED GATING
   ═══════════════════════════════════════════ */
const REDUCE_Q = '(prefers-reduced-motion: reduce)';
// Motion preference. NOTE: this exhibition site is deliberately set to ALWAYS
// animate — the owner has confirmed they want the animated experience on their
// M10, where Chrome's reduced-motion setting was silently disabling every
// animation (content stayed visible but nothing moved). We intentionally
// override prefers-reduced-motion here so the site is consistent.
let motionOK = true;
try {
  gsap.matchMedia().add({ reduceMotion: REDUCE_Q }, (ctx) => {
    motionOK = true; // ignore reduced-motion: always animate
  });
} catch (e) { motionOK = true; /* fall back to enabled if matchMedia is unavailable */ }

// Touch detection — function-scoped so it's available throughout initApp
// (was declared inside an earlier block, causing a ReferenceError when used
// by the flip-words code later in the same function).
const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;

// GSAP matchMedia: gate motion per tier
const mm = gsap.matchMedia();
mm.add({ motionOK: '(prefers-reduced-motion: no-preference)', motionReduce: REDUCE_Q }, (ctx) => {
  const { motionOK: ok } = ctx.conditions;
  const shouldAnimate = true; // always animate, ignoring reduced-motion

  /* ── TIER 1: Hero entrance — anime.js ── */
  if (shouldAnimate) {
    // Split hero title lines into individual characters
    document.querySelectorAll('.hero-title-line').forEach(line => {
      const text = line.textContent;
      line.innerHTML = '';
      text.split('').forEach(ch => {
        const span = document.createElement('span');
        span.className = 'hero-title-char';
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        line.appendChild(span);
      });
    });

    const heroTl = anime.timeline({ delay: 0.3 });

    // Badge entrance
    heroTl.add({
      targets: '.hero-badge',
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 600,
      easing: 'cubicBezier(0.16, 1, 0.3, 1)',
    });

    // Title characters — spring-like stagger, slower
    heroTl.add({
      targets: '.hero-title-char',
      opacity: [0, 1],
      translateY: [15, 0],
      rotateX: [-30, 0],
      duration: 780,
      delay: anime.stagger(36, { start: 300 }),
      easing: 'cubicBezier(0.16, 1, 0.3, 1)',
    }, '-=200');

    // Subtitle
    heroTl.add({
      targets: '.hero-subtitle',
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 600,
      easing: 'cubicBezier(0.16, 1, 0.3, 1)',
      complete: function() {
        const hl = document.querySelector('.hero-highlight');
        if (hl) hl.classList.add('swept');
      },
    }, '-=250');

    // Scroll prompt
    heroTl.add({
      targets: '.scroll-prompt',
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 380,
      easing: 'cubicBezier(0.16, 1, 0.3, 1)',
    }, '-=150');

    // Motifs — spring bounce stagger
    heroTl.add({
      targets: '.hero-motif',
      opacity: [0, 0.6],
      scale: [0.5, 1],
      duration: 650,
      delay: anime.stagger(80),
      easing: 'easeOutElastic(1, 0.5)',
    }, '-=350');
  } else {
    gsap.set('.hero-badge, .hero-title, .hero-subtitle, .scroll-prompt, .hero-motif', { opacity: 1 });
    document.querySelectorAll('.hero-title-char').forEach(c => { c.style.opacity = 1; c.style.transform = 'none'; });
  }

  /* ── TIER 1: Gallery carousel — staggered per-card rise-in (GSAP) ──
     Each photo card rises in sequence with a blur-clear, like hanging
     frames one by one in the exhibition. The blur (filter raster work) is
     only applied to the handful of cards actually in view — off-screen
     cards resolve instantly so we never blur 18 frames at once. */
  if (shouldAnimate) {
    const carouselEl = document.getElementById('galleryCarousel');
    const entranceCards = gsap.utils.toArray('.art-card');
    if (carouselEl && entranceCards.length) {
      const blurInCards = entranceCards.filter(card => {
        const r = card.getBoundingClientRect();
        const vp = carouselViewport.getBoundingClientRect();
        return r.right > vp.left && r.left < vp.right;
      });
      const restCards = entranceCards.filter(card => !blurInCards.includes(card));
      gsap.set(carouselEl, { opacity: 0, y: 30 });
      gsap.set(blurInCards, { opacity: 0, y: 24, filter: 'blur(6px)' });
      gsap.set(restCards, { opacity: 1, y: 0, filter: 'blur(0px)' });
      ScrollTrigger.create({
        trigger: carouselEl, start: 'top 85%', once: true,
        onEnter: () => {
          gsap.to(blurInCards, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.1,
            ease: 'power3.out',
            stagger: { each: 0.09, from: 'center' },
            onComplete: () => {
              gsap.to(carouselEl, { opacity: 1, y: 0, duration: 0.3 });
              carouselEl.style.filter = '';
              entranceCards.forEach(c => c.querySelectorAll('.skeleton').forEach(s => s.classList.add('skel-done')));
            }
          });
        },
      });
    }
  } else {
    document.querySelectorAll('.art-card .skeleton').forEach(s => s.classList.add('skel-done'));
    const carouselEl = document.getElementById('galleryCarousel');
    if (carouselEl) { carouselEl.style.opacity = 1; carouselEl.style.transform = 'none'; }
    document.querySelectorAll('.art-card').forEach(c => { c.style.opacity = 1; });
  }

  /* ── TIER 1: Bento cards — anime.js timeline ── */
  if (shouldAnimate) {
    ScrollTrigger.create({
      trigger: '.bento-grid', start: 'top 85%', once: true,
      onEnter: () => {
        anime({
          targets: '.bento-card',
          opacity: [0, 1],
          translateY: [20, 0],
          scale: [0.96, 1],
          duration: 520,
          delay: anime.stagger(100),
          easing: 'cubicBezier(0.16, 1, 0.3, 1)',
          complete: () => { document.querySelectorAll('.bento-card').forEach(c => { c.style.transform = ''; c.style.opacity = '1'; c.classList.add('skel-done'); }); }
        });
      },
    });
  } else {
    document.querySelectorAll('.bento-card').forEach(c => { c.style.opacity = 1; c.classList.add('skel-done'); });
  }

  /* ── TIER 1: Crochet card — anime.js ── */
  if (shouldAnimate) {
    ScrollTrigger.create({
      trigger: '.crochet-card', start: 'top 85%', once: true,
      onEnter: () => {
        anime({
          targets: '.crochet-card',
          opacity: [0, 1],
          translateY: [30, 0],
          scale: [0.97, 1],
          duration: 560,
          easing: 'cubicBezier(0.16, 1, 0.3, 1)',
          complete: function() { const el = this.animatables[0].target; el.style.transform = ''; el.style.opacity = '1'; el.classList.add('skel-done'); }
        });
      },
    });
  } else {
    document.querySelectorAll('.crochet-card').forEach(c => { c.style.opacity = '1'; c.classList.add('skel-done'); });
  }

  /* ── TIER 1: Finale — choreographed tribute reveal (GSAP) ──
     The emotional climax. The keepsake card settles onto the table, the
     washi tapes peel on one by one, the polaroid is gently dropped into
     place, then the statement, dedication and button rise in their own
     beats. Everything lands in its final, CSS-native state. */
  if (shouldAnimate) {
    const finaleCard = document.querySelector('.finale-card');
    if (finaleCard) {
      const washi = finaleCard.querySelectorAll('.washi');
      const polaroid = finaleCard.querySelector('.polaroid-main');
      const polaroidBacks = finaleCard.querySelectorAll('.polaroid-back');
      const statement = finaleCard.querySelector('.finale-statement');
      const statementFull = statement ? statement.textContent.trim() : 'Thank you for being my friend.';
      const dedication = finaleCard.querySelector('.finale-dedication');
      const btn = finaleCard.querySelector('.dedicate-btn');
      const washiRot = { 'washi--tl': -12, 'washi--tr': 8, 'washi--bl': 6, 'washi--br': -10 };
      const washiTargetRot = (el) => washiRot[[...el.classList].find(c => c.indexOf('washi--') === 0)] || -8;

      // Typewriter for the emotional closer
      function typeStatement(el, full) {
        if (!el) return;
        el.textContent = '';
        el.classList.add('typing');
        let i = 0;
        const step = () => {
          el.textContent = full.slice(0, i + 1);
          i++;
          if (i < full.length) setTimeout(step, 42);
          else { el.classList.remove('typing'); el.textContent = full; }
        };
        setTimeout(step, 80);
      }

      gsap.set(finaleCard, { opacity: 0, y: 70, scale: 0.97 });
      gsap.set(washi, { opacity: 0, scaleY: 0.2, rotate: 0 });
      gsap.set(polaroid, { opacity: 0, y: 60, rotate: 5, scale: 0.9 });
      gsap.set(polaroidBacks, { opacity: 0 });
      gsap.set(polaroid.querySelector('.polaroid-glow'), { opacity: 0 });
      gsap.set(polaroid.querySelector('.polaroid-sheen'), { opacity: 0, x: '-130%' });
      gsap.set([statement, dedication, btn], { opacity: 0, y: 22 });
      if (btn) btn.style.transition = 'none';
      if (polaroid) polaroid.style.transition = 'none';

      ScrollTrigger.create({
        trigger: '.finale-card', start: 'top 92%', once: true,
        onEnter: () => {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          tl.to(finaleCard, { opacity: 1, y: 0, scale: 1, duration: 0.8 })
            .to(washi, {
              opacity: 1, scaleY: 1, rotate: (i, el) => washiTargetRot(el),
              duration: 0.45, ease: 'back.out(2)', stagger: 0.07
            }, '-=0.4')
            .to(polaroidBacks, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.15')
            .to(polaroid, {
              opacity: 1, y: 0, rotate: -3, scale: 1,
              duration: 0.7, ease: 'back.out(1.3)'
            }, '-=0.2')
            // Enhanced photo reveal: drop-in zoom, glow, sheen
            .to(polaroid.querySelector('img'), {
              scale: 1, duration: 0.7, ease: 'back.out(1.3)',
              onStart: () => { gsap.set(polaroid.querySelector('img'), { scale: 1.12 }); }
            }, '-=0.7')
            .to(polaroid.querySelector('.polaroid-glow'), {
              opacity: 1, duration: 0.5, ease: 'power2.out'
            }, '-=0.3')
            .to(polaroid.querySelector('.polaroid-sheen'), {
              opacity: 0.6, x: '130%', duration: 0.9, ease: 'power2.out'
            }, '-=0.5')
            .to(polaroid.querySelector('.polaroid-sheen'), {
              opacity: 0, duration: 0.3
            }, '-=0.1')
            .add(() => {
              statement.style.opacity = '1';
              statement.style.transform = 'none';
              typeStatement(statement, statementFull);
            }, '-=0.4')
            .to(dedication, { opacity: 1, y: 0, duration: 0.5 }, '+=1.0')
            .to(btn, { opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.4)' }, '-=0.3')
            .add(() => {
              finaleCard.style.opacity = '1';
              finaleCard.style.transform = '';
              finaleCard.classList.add('skel-done');
              polaroid.classList.add('breathe');
              [polaroid, statement, dedication, btn].forEach(el => { if (el) { el.style.opacity = ''; el.style.transform = ''; el.style.transition = ''; } });
              washi.forEach(w => { w.style.opacity = ''; w.style.transform = ''; });
              // Repeat visitor: their archived heart greets them with a nudge.
              if (heartCount > 0 && dedicateHearts) pulseHearts(dedicateHearts);
            });
        },
      });
    }
  } else {
    document.querySelectorAll('.finale-card').forEach(c => { c.style.opacity = '1'; c.classList.add('skel-done'); });
  }

  /* ── TIER 1: Parallax on hero motifs (GSAP — scrub needs continuous RAF) ── */
  if (shouldAnimate) {
    document.querySelectorAll('.hero-motif').forEach((m, i) => {
      gsap.to(m, {
        y: () => -30 * (1 + i * 0.4),
        ease: 'none',
        overwrite: true,
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 },
      });
    });
  }

  /* ── TIER 2: General scroll reveals — anime.js ── */
  if (shouldAnimate) {
    /* Elements with dedicated entrances (hero timeline, gallery stagger,
       section-heading trigger) are excluded so they don't get animated twice. */
    ScrollTrigger.batch('.reveal:not(.hero-badge):not(.hero-subtitle):not(.section-heading):not(.art-card)', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => {
        anime({
          targets: batch,
          opacity: [0, 1],
          translateY: [15, 0],
          // Cinematic pacing — long enough to be savoured, short enough to stay
          // responsive.
          duration: 1100,
          delay: anime.stagger(70),
          easing: 'cubicBezier(0.16, 1, 0.3, 1)',
          complete: function() { batch.forEach(el => { el.style.transform = ''; el.style.opacity = '1'; el.classList.add('revealed'); el.querySelectorAll('.skeleton').forEach(s => s.classList.add('skel-done')); }); }
        });
      },
    });
  } else {
    document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = 1; el.classList.add('revealed'); el.querySelectorAll('.skeleton').forEach(s => s.classList.add('skel-done')); });
  }

});

/* ═══════════════════════════════════════════
   NAVIGATION — SCROLL SPY (via ScrollTrigger, no raw scroll listener)
   ═══════════════════════════════════════════ */
const nav = document.getElementById('nav');
const navLinks = nav.querySelectorAll('a');
const sections = ['hero', 'gallery', 'crochet', 'fandoms', 'reasons', 'finale'].map(id => document.getElementById(id));
let scrollTicking = false;
let lastScrollY = 0;

// Cached document height — read via ResizeObserver so scroll handlers never
// force a synchronous layout per frame. Defaults to a live read on first call.
let _docHeight = 0;
function docHeight() {
  if (!_docHeight) _docHeight = document.body.scrollHeight;
  return _docHeight;
}
new ResizeObserver((entries) => {
  for (const en of entries) {
    if (en.target === document.body) _docHeight = en.contentRect.height;
  }
}).observe(document.body);

// Show/hide nav — visible by default; hide on scroll-down, reveal on scroll-up
const forMehrimaTag = document.getElementById('forMehrimaTag');
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      // window.scrollY is cheap (no forced layout) vs documentElement.scrollTop.
      const scrollY = window.scrollY || 0;
      const dir = scrollY - lastScrollY;
      if (scrollY < 120) {
        nav.classList.remove('hidden');
      } else if (dir > 4) {
        nav.classList.add('hidden');
      } else if (dir < -4) {
        nav.classList.remove('hidden');
      }
      // "for Mehrima" tag: show once the hero has scrolled away, fade out near finale
      if (forMehrimaTag) {
        // Cache scrollHeight via ResizeObserver instead of reading it per frame.
        const nearBottom = window.innerHeight + scrollY >= (docHeight() - 500);
        forMehrimaTag.classList.toggle('visible', scrollY > window.innerHeight * 0.85 && !nearBottom);
      }
      lastScrollY = scrollY;
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}, { passive: true });

// Active section via ScrollTrigger (no layout reads per frame)
sections.forEach(sec => {
  if (!sec) return;
  ScrollTrigger.create({
    trigger: sec,
    start: 'top center',
    end: 'bottom center',
    onToggle: (self) => {
      if (self.isActive) {
        navLinks.forEach(link => link.classList.remove('active'));
        const active = nav.querySelector(`[data-section=\"${sec.id}\"]`);
        if (active) active.classList.add('active');
        navLinks.forEach(link => { if (link === active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current'); });
      }
    },
  });
});

/* ═══════════════════════════════════════════
   TELEMETRY BARS
   ═══════════════════════════════════════════ */
const telemetry = document.getElementById('telemetry');
const f1Card = document.querySelector('.bento-card--f1');
if (telemetry && f1Card) {
  for (let i = 0; i < 30; i++) {
    const bar = document.createElement('span');
    bar.style.height = '40px';
    bar.style.transform = 'scaleY(' + ((Math.random() * 30 + 5) / 40) + ')';
    bar.style.transformOrigin = 'bottom';
    telemetry.appendChild(bar);
  }
  f1Card.addEventListener('mouseenter', () => {
    telemetry.querySelectorAll('span').forEach(bar => {
      // Animate scaleY (composited) instead of height (layout+paint per frame).
      gsap.to(bar, { scaleY: (Math.random() * 35 + 5) / 40, duration: 0.3, ease: 'power2.out', overwrite: true });
    });
  });
}

/* ═══════════════════════════════════════════
   VIBE METER — TIER 3: always keep
   ═══════════════════════════════════════════ */
document.querySelectorAll('.vibe-fill').forEach(fill => {
  const w = fill.dataset.width;
  // Set the target width statically; animate scaleX (composited) 0 → 1.
  fill.style.width = w + '%';
  gsap.set(fill, { scaleX: 0, transformOrigin: 'left center' });
  ScrollTrigger.create({
    trigger: fill, start: 'top 90%', once: true,
    onEnter: () => { gsap.to(fill, { scaleX: 1, duration: 0.8, ease: 'power2.out' }); },
  });
});

/* ═══════════════════════════════════════════
   AUDIO DOCK — real music player
   ═══════════════════════════════════════════ */
const audioDock = document.getElementById('audioDock');
const dockVinyl = document.getElementById('dockVinyl');
const dockPlay = document.getElementById('dockPlay');
const dockNext = document.getElementById('dockNext');
const dockTrackEl = document.getElementById('dockTrack');
const dockArtistEl = document.getElementById('dockArtist');
let isPlaying = false;
ScrollTrigger.create({
  trigger: '#gallery', start: 'top 80%', once: true,
  onEnter: () => audioDock.classList.add('visible'),
});

/* ── Tracklist — the songs you add as FLAC (or mp3) in /audio/ ──
   Each entry: file (relative path, lowercase-friendly), plus the metadata we
   verified from a public catalog API (iTunes Search / MusicBrainz). At runtime
   we RE-READ the actual embedded FLAC/ID3 tags with music-metadata and
   override these, so the metadata is always the real, complete set from the
   file itself (title, artist, album, year, genre, duration, bitrate, codec,
   cover art). coverUrl is used as a live fallback for the cover thumbnail
   when the file has no embedded art yet. */
const TRACKS = [
  { file: 'audio/505.flac',                name: '505',                              artist: 'Arctic Monkeys',               album: 'Favourite Worst Nightmare',               year: 2007, genre: 'Alternative', duration: 254, coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/82/90/14/829014ad-a301-62ab-bee6-f4cca4457411/mzi.hozudery.jpg/200x200bb.jpg' },
  { file: 'audio/softcore.mp3',            name: 'Softcore',                         artist: 'The Neighbourhood',            album: 'Hard To Imagine The Neighbourhood Ever Changing', year: 2018, genre: 'Alternative', duration: 206, coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/fc/d0/89/fcd0899c-2236-a726-9ce2-ebb110e2204d/886447414545.jpg/200x200bb.jpg' },
  { file: 'audio/i-wanna-be-yours.flac',   name: 'I Wanna Be Yours',                 artist: 'Arctic Monkeys',               album: 'AM',                                    year: 2013, genre: 'Alternative', duration: 184, coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/69/9c/b5/699cb5d6-115c-ff73-9d26-e57ea4350d72/887828031795.png/200x200bb.jpg' },
  { file: 'audio/stay-at-your-house.mp3',  name: 'I Really Want to Stay at Your House', artist: 'Rosa Walton & Hallie Coggins', album: 'Cyberpunk 2077: Radio, Vol. 2 (Original Soundtrack)', year: 2020, genre: 'Soundtrack', duration: 247, coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/1b/41/2b/1b412bef-ba81-3173-6d26-41128c0f366c/780163581720.jpg/200x200bb.jpg' },
];
let currentTrack = 0;
let trackMeta = []; // enriched metadata read from each file

function setDockLabel() {
  const t = TRACKS[currentTrack];
  const meta = trackMeta[currentTrack] || t;
  if (dockTrackEl) dockTrackEl.textContent = meta.name || t.name;
  if (dockArtistEl) dockArtistEl.textContent = meta.artist || t.artist;
  if (dockPlay) dockPlay.setAttribute('aria-label', (isPlaying ? 'Pause ' : 'Play ') + (meta.name || t.name) + ' by ' + (meta.artist || t.artist));
}
// Show the first track's real album art on load.
try { renderCover(trackMeta[0], TRACKS[0]); } catch (e) {}
setDockLabel();

/* ── Audio engine — real <audio> element → analyser → beat-reactive lighting ── */
let audioCtx = null;
let analyser = null;
let beatRAF = null;
let audioEl = null;         // the <audio> element that plays the selected file
let srcNode = null;         // MediaElementAudioSourceNode (created once)
let trackLoading = false;
// Whether the hero (which owns the beat-reactive lighting) is on screen.
let beatHeroVisible = true;
if ('IntersectionObserver' in window) {
  const hero = document.getElementById('hero');
  if (hero) new IntersectionObserver((en) => { beatHeroVisible = en[0].isIntersecting; }, { threshold: 0.02 }).observe(hero);
}

function ensureAudioEl() {
  if (audioEl) return audioEl;
  audioEl = new Audio();
  audioEl.preload = 'metadata';
  // FLAC plays in Chrome/Edge/Firefox/Android; Safari needs a lossy fallback.
  audioEl.addEventListener('ended', () => { isPlaying = false; syncPlayUI(); });
  // Keep lighting analyser attached one time.
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) audioCtx = new AC();
    srcNode = audioCtx.createMediaElementSource(audioEl);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.75;
    srcNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  } catch (e) { /* WebAudio unavailable — audio still plays, just no reactive lighting */ }
  return audioEl;
}

function syncPlayUI() {
  dockVinyl.classList.toggle('spinning', isPlaying);
  audioDock.classList.toggle('playing', isPlaying);
  dockPlay.textContent = isPlaying ? '❚❚' : '▶';
  setDockLabel();
}

function loadTrack(index) {
  const t = TRACKS[index];
  const el = ensureAudioEl();
  trackLoading = true;
  el.src = t.file;
  el.load();
  // (Re)read the real embedded FLAC/ID3 tags so metadata is always accurate.
  readTrackMetadata(index, t);
  trackLoading = false;
}

function playTrack() {
  const t = TRACKS[currentTrack];
  const el = ensureAudioEl();
  if (!el.src || el.src.indexOf(t.file) === -1) loadTrack(currentTrack);
  el.play().then(() => {
    isPlaying = true;
    syncPlayUI();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }).catch(() => {
    // Autoplay / decode failure — keep UI honest.
    isPlaying = false;
    syncPlayUI();
  });
}

function pauseTrack() {
  if (audioEl) audioEl.pause();
  isPlaying = false;
  syncPlayUI();
}

/* Switch to the next (or a specific) track, with a short crossfade. */
function switchTrack(index) {
  const next = ((index == null ? currentTrack + 1 : index) % TRACKS.length + TRACKS.length) % TRACKS.length;
  if (next === currentTrack) return;
  currentTrack = next;
  setDockLabel();
  if (!isPlaying) return; // just relabeled; audio starts on play
  const wasPlaying = isPlaying;
  const el = ensureAudioEl();
  const fade = audioCtx && audioCtx.createGain ? audioCtx.createGain() : null;
  el.pause();
  loadTrack(currentTrack);
  el.play().catch(() => {});
  syncPlayUI();
}

dockNext.addEventListener('click', () => {
  switchTrack();
  const t = TRACKS[currentTrack];
  showToast('Change the mood', { type: 'info', description: t.name + ' — ' + t.artist, duration: 2000 });
});

dockPlay.addEventListener('click', () => {
  if (isPlaying) {
    pauseTrack();
    showToast('Paused', { type: 'info', description: 'the vibe rests for now', duration: 2000 });
  } else {
    playTrack();
    const t = TRACKS[currentTrack];
    showToast('Now playing', { type: 'info', description: t.name + ' — ' + t.artist, duration: 3000 });
  }
});

// Resume audio if the tab comes back
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && audioCtx && audioCtx.state === 'suspended' && isPlaying) audioCtx.resume();
});

// Beat-reactive lighting loop (driven by the real track's audio).
let beatFrame = 0;
let lastLow = -1, lastMid = -1, lastHigh = -1, lastAvg = -1;
const beatReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function beatLoop() {
  if (!analyser || !isPlaying) { beatRAF = null; return; }
  const beatData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(beatData);
  let low = 0, mid = 0, high = 0, sum = 0;
  for (let i = 0; i < beatData.length; i++) {
    const v = beatData[i] / 255;
    sum += v;
    if (i < 4) low += v;
    else if (i < 10) mid += v;
    else high += v;
  }
  const avg = sum / beatData.length;
  low = Math.min(1, low / 4);
  mid = Math.min(1, mid / 6);
  high = Math.min(1, high / (beatData.length - 10));
  if (beatReduce) { beatRAF = requestAnimationFrame(beatLoop); return; }
  if ((beatFrame++ % 6) !== 0) { beatRAF = requestAnimationFrame(beatLoop); return; }
  const q = (v) => Math.round(v * 20) / 20;
  low = q(low); mid = q(mid); high = q(high);
  const avgQ = q(avg);
  if (beatHeroVisible !== false) {
    if (low !== lastLow) { lastLow = low; document.documentElement.style.setProperty('--beat-low', String(low)); }
    if (mid !== lastMid) { lastMid = mid; document.documentElement.style.setProperty('--beat-mid', String(mid)); }
    if (high !== lastHigh) { lastHigh = high; document.documentElement.style.setProperty('--beat-high', String(high)); }
    if (avgQ !== lastAvg) { lastAvg = avgQ; document.documentElement.style.setProperty('--beat-avg', String(avgQ)); }
  }
  beatRAF = requestAnimationFrame(beatLoop);
}

// ── Metadata extraction (music-metadata-browser) ──
// Reads the format/codec/bitrate + embedded cover from the file, but prefers
// the clean, verified catalog metadata for display labels (some local rips
// carry odd tags — a VEVO artist name, a concert album tag, or a title suffix).
// So the dock shows tidy "505 — Arctic Monkeys" while still surfacing the
// file's real cover art and lossless/bitrate info.
async function readTrackMetadata(index, fallback) {
  try {
    const mm = window.musicMetadata;
    if (!mm) { renderCover({ picture: null }, fallback); return; }
    const res = await mm.parseBlob(await fetch(fallback.file).then(r => r.blob()));
    const m = {
      name:        fallback.name,                        // curated, clean
      artist:      fallback.artist,                      // curated, clean
      album:       fallback.album,                       // curated, clean
      year:        fallback.year,                        // curated, clean
      genre:       fallback.genre,                       // curated, clean
      duration:    res.format.duration || fallback.duration,
      bitrate:     res.format.bitrate,
      codec:       res.format.codec,
      sampleRate:  res.format.sampleRate,
      channels:    res.format.numberOfChannels,
      picture:     res.common.picture && res.common.picture[0] || null,
    };
    trackMeta[index] = m;
    if (index === currentTrack) setDockLabel();
    renderCover(m, fallback);
  } catch (e) {
    // File missing / can't read — fall back to the verified catalog metadata.
    renderCover(null, fallback);
  }
}

function renderCover(m, fallback) {
  const cover = document.getElementById('dockCover');
  if (!cover) return;
  // Prefer embedded art from the file; else fall back to the real album art
  // URL fetched from the catalog API (so the dock shows cover art immediately).
  if (m && m.picture) {
    const url = URL.createObjectURL(new Blob([m.picture.data], { type: m.picture.format }));
    cover.style.backgroundImage = 'url("' + url + '")';
    cover.classList.add('has-art');
  } else if (fallback && fallback.coverUrl) {
    cover.style.backgroundImage = 'url("' + fallback.coverUrl + '")';
    cover.classList.add('has-art');
  } else {
    cover.style.backgroundImage = '';
    cover.classList.remove('has-art');
  }
}

/* ── Easter egg: double-tap the vinyl → night drive mode (turbo the light show) ── */
dockVinyl.addEventListener('dblclick', () => {
  const reduceM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isPlaying && !reduceM) {
    // A quick lighting flourish.
    document.documentElement.style.setProperty('--beat-high', '1');
    setTimeout(() => document.documentElement.style.setProperty('--beat-high', '0'), 900);
  }
  showToast('night drive mode', { type: 'info', description: 'for the night drives ♥', duration: 2500 });
});

// Start the beat loop lazily once audio begins.
(function ensureBeatLoop() {
  const t = setInterval(() => {
    if (isPlaying && !beatRAF) { beatLoop(); clearInterval(t); }
  }, 300);
})();

/* ═══════════════════════════════════════════
   SMOOTH SCROLL FOR NAV
   ═══════════════════════════════════════════ */
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: motionOK ? 'smooth' : 'auto', block: 'start' });
  });
});

/* ═══════════════════════════════════════════
   ANIME.JS MICRO-INTERACTIONS
   ═══════════════════════════════════════════ */
if (motionOK) {
  /* ── Bento card hover/tap — 3D tilt + card spotlight (gsap-composed) ── */
  document.querySelectorAll('.bento-card').forEach(card => {
    const spot = card.querySelector('.bento-spotlight');
    if (!isTouch) {
      const qRotX = gsap.quickTo(card, 'rotateX', { duration: 0.35, ease: 'power2.out' });
      const qRotY = gsap.quickTo(card, 'rotateY', { duration: 0.35, ease: 'power2.out' });
      const qY = gsap.quickTo(card, 'y', { duration: 0.35, ease: 'power2.out' });
      const qScale = gsap.quickTo(card, 'scale', { duration: 0.35, ease: 'power2.out' });
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        if (spot) {
          spot.style.setProperty('--sx', (px * 100) + '%');
          spot.style.setProperty('--sy', (py * 100) + '%');
        }
        qRotY((px - 0.5) * 12);
        qRotX((0.5 - py) * 10);
        qY(-4);
        qScale(1.02);
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.4)' });
      });
    }
    const pressIn = () => gsap.to(card, { scale: 0.97, duration: 0.08, ease: 'power2.out' });
    const pressOut = () => gsap.to(card, { scale: 1, duration: 0.12, ease: 'power2.out' });
    card.addEventListener('mousedown', pressIn);
    card.addEventListener('mouseup', pressOut);
    card.addEventListener('touchstart', pressIn, { passive: true });
    card.addEventListener('touchend', pressOut, { passive: true });
  });

  /* ── Polaroid — hover settle (entrance is part of the finale timeline above) ── */
  const polaroid = document.querySelector('.polaroid-main');
  if (polaroid && !isTouch) {
    polaroid.addEventListener('mouseenter', () => {
      polaroid.classList.add('anime-rotate');        anime({ targets: polaroid, rotate: 0, translateY: -3, duration: 250, easing: 'cubicBezier(0.16, 1, 0.3, 1)' });
      });
      polaroid.addEventListener('mouseleave', () => {
        anime({ targets: polaroid, rotate: -3, translateY: 0, duration: 250, easing: 'cubicBezier(0.16, 1, 0.3, 1)', complete: () => polaroid.classList.remove('anime-rotate') });
    });
  }

  /* ── Dedicate button — magnetic drift + press feedback ── */
  const dedicateBtn = document.getElementById('dedicateBtn');
  if (!isTouch) {
    var magX = gsap.quickTo(dedicateBtn, 'x', { duration: 0.35, ease: 'power3.out' });
    var magY = gsap.quickTo(dedicateBtn, 'y', { duration: 0.35, ease: 'power3.out' });
    var MAG_STRENGTH = 0.5;
    var MAG_MAX = 20;
    var magBtnCX = 0, magBtnCY = 0;
    var magHovering = false;
    function updateMagCenter() {
      var r = dedicateBtn.getBoundingClientRect();
      magBtnCX = r.left + r.width / 2;
      magBtnCY = r.top + r.height / 2;
    }
    dedicateBtn.addEventListener('mouseenter', () => {
      magHovering = true;
      updateMagCenter();
    });
    dedicateBtn.addEventListener('mouseleave', () => { magHovering = false; });
    window.addEventListener('resize', updateMagCenter);
    // Refresh the center on scroll, but only while the pointer is actually
    // hovering — avoids a forced layout read on every scroll frame otherwise.
    document.addEventListener('scroll', () => {
      if (!magHovering) return;
      requestAnimationFrame(updateMagCenter);
    }, { passive: true });
    dedicateBtn.addEventListener('mousemove', function(e) {
      var dx = (e.clientX - magBtnCX) * MAG_STRENGTH;
      var dy = (e.clientY - magBtnCY) * MAG_STRENGTH;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > MAG_MAX) { dx *= MAG_MAX / d; dy *= MAG_MAX / d; }
      magX(dx); magY(dy);
    });
    dedicateBtn.addEventListener('mouseleave', function() {
      gsap.to(dedicateBtn, { x: 0, y: 0, duration: 0.5, ease: 'back.out(1.6)' });
    });
    dedicateBtn.addEventListener('mouseenter', function() { gsap.to(dedicateBtn, { scale: 1.05, duration: 0.2, ease: 'power3.out' }); });
    dedicateBtn.addEventListener('mouseleave', function() { gsap.to(dedicateBtn, { scale: 1, duration: 0.2, ease: 'power3.out' }); });
  }
  dedicateBtn.addEventListener('mousedown', function() { gsap.to(dedicateBtn, { scale: 0.96, duration: 0.08, ease: 'power2.out' }); });
  dedicateBtn.addEventListener('mouseup', function() { gsap.to(dedicateBtn, { scale: 1, duration: 0.12, ease: 'power2.out' }); });
  dedicateBtn.addEventListener('touchstart', function() { gsap.to(dedicateBtn, { scale: 0.96, duration: 0.08, ease: 'power2.out' }); }, { passive: true });
  dedicateBtn.addEventListener('touchend', function() { gsap.to(dedicateBtn, { scale: 1, duration: 0.12, ease: 'power2.out' }); }, { passive: true });

  /* ── Dock play button — press feedback ──
     easeOut, not easeIn: the response should be fast at the instant of press,
     not slow-out (easeIn starts slow exactly when the user is watching). */
  dockPlay.addEventListener('mousedown', () => {
    anime({ targets: dockPlay, scale: 0.85, duration: 80, easing: 'easeOutQuad' });
  });
  dockPlay.addEventListener('mouseup', () => {
    anime({ targets: dockPlay, scale: 1, duration: 120, easing: 'cubicBezier(0.16, 1, 0.3, 1)' });
  });
  dockPlay.addEventListener('touchstart', () => {
    anime({ targets: dockPlay, scale: 0.85, duration: 80, easing: 'easeOutQuad' });
  }, { passive: true });
  dockPlay.addEventListener('touchend', () => {
    anime({ targets: dockPlay, scale: 1, duration: 120, easing: 'cubicBezier(0.16, 1, 0.3, 1)' });
  }, { passive: true });

  /* ── Crochet photo — text reveal on hover / tap ── */
  const crochetPhoto = document.getElementById('crochetPhoto');
  if (crochetPhoto) {
    if (!isTouch) {
      crochetPhoto.addEventListener('mouseenter', () => crochetPhoto.classList.add('hovered'));
      crochetPhoto.addEventListener('mouseleave', () => crochetPhoto.classList.remove('hovered'));
    } else {
      crochetPhoto.addEventListener('click', () => crochetPhoto.classList.toggle('hovered'));
    }
  }

  /* ── Nav links — CSS-only hover (too frequent for JS animation) ── */
  /* Nav hover is handled by CSS transition: transform 0.15s ease-out */

  /* ── Section headings — gold underline expand on reveal ── */
  document.querySelectorAll('.section-heading').forEach(h => {
    ScrollTrigger.create({
      trigger: h, start: 'top 85%', once: true,
      onEnter: () => {
        anime({
          targets: h,
          opacity: [0, 1],
          translateX: [-10, 0],
          duration: 450,
          easing: 'cubicBezier(0.16, 1, 0.3, 1)',
          complete: function() { const el = this.animatables[0].target; el.style.transform = ''; el.style.opacity = ''; el.classList.add('revealed'); }
        });
      },
    });
  });

  /* ── Lamp glow — warm gold light rises under each heading ── */
  document.querySelectorAll('.section-heading .lamp-glow').forEach(glow => {
    ScrollTrigger.create({
      trigger: glow.closest('.section-heading'), start: 'top 86%', once: true,
      onEnter: () => glow.classList.add('lit'),
    });
  });

  /* ── Scroll progress — thin gold editorial reading line ── */
  const progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    gsap.to(progressBar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
    });
  }
} else {
  // Reduced motion: set everything visible
  document.querySelectorAll('.hero-title-char').forEach(c => { c.style.opacity = 1; c.style.transform = 'none'; });
}

/* ═══════════════════════════════════════════
   STITCH NOTES — expandable accordion
   ═══════════════════════════════════════════ */
document.querySelectorAll('.stitch-note').forEach(note => {
  const top = note.querySelector('.stitch-note-top');
  if (!top) return;
  const toggle = () => {
    const isOpen = note.classList.contains('open');
    document.querySelectorAll('.stitch-note.open').forEach(o => o.classList.remove('open'));
    if (!isOpen) note.classList.add('open');
    const btn = note.querySelector('.stitch-note-top');
    if (btn) btn.setAttribute('aria-expanded', String(!isOpen));
  };
  top.addEventListener('click', toggle);
  top.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

/* ═══════════════════════════════════════════
   FLIP WORDS — hero badge rotating titles (Aceternity style)
   ═══════════════════════════════════════════ */
const flipWords = document.getElementById('flipWords');
if (flipWords && motionOK && !isTouch) {
  const flipWordEls = Array.prototype.slice.call(flipWords.querySelectorAll('.flip-word'));
  if (flipWordEls.length) {
    let flipIdx = 0;
    let flipPaused = false;
    let flipTimer = null;

    function measureFlipWords() {
      let widest = 0;
      flipWordEls.forEach(w => {
        const probe = document.createElement('span');
        probe.textContent = w.textContent;
        probe.style.cssText = 'visibility:hidden;position:absolute;top:0;left:0;white-space:nowrap;font:inherit;letter-spacing:inherit;text-transform:inherit;';
        flipWords.appendChild(probe);
        widest = Math.max(widest, probe.offsetWidth);
        flipWords.removeChild(probe);
      });
      flipWords.style.width = widest + 'px';
    }
    measureFlipWords();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measureFlipWords);
    }
    let flipResizeT;
    window.addEventListener('resize', () => { clearTimeout(flipResizeT); flipResizeT = setTimeout(measureFlipWords, 150); });

    function flipOnce() {
      if (flipPaused || !flipWords.isConnected) return;
      const cur = flipWordEls[flipIdx];
      const nxt = flipWordEls[(flipIdx + 1) % flipWordEls.length];
      anime({
        targets: cur, rotateX: [0, -90], opacity: [1, 0],
        duration: 320, easing: 'cubicBezier(0.16, 1, 0.3, 1)',
        complete: function() {
          cur.classList.remove('is-current');
          nxt.classList.add('is-current');
          anime({
            targets: nxt, rotateX: [90, 0], opacity: [0, 1],
            duration: 320, easing: 'cubicBezier(0.16, 1, 0.3, 1)',
            complete: function() { flipIdx = (flipIdx + 1) % flipWordEls.length; }
          });
        }
      });
    }

    if ('IntersectionObserver' in window) {
      const heroEl = document.getElementById('hero');
      new IntersectionObserver(entries => {
        entries.forEach(en => { flipPaused = !en.isIntersecting; });
      }, { threshold: 0.05 }).observe(heroEl || document.body);
    }
    // Start after the hero entrance timeline has settled
    flipTimer = setTimeout(function cycle() {
      flipOnce();
      flipTimer = setTimeout(cycle, 3000);
    }, 4000);
  }
}

/* ═══════════════════════════════════════════
   MUSEUM SPOTLIGHT — warm glow follows the cursor
   ═══════════════════════════════════════════ */
const spotlightGlow = document.getElementById('spotlightGlow');
if (spotlightGlow) {
  const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  const noReduceMotion = !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (finePointer && noReduceMotion) {
    let sx = window.innerWidth / 2, sy = window.innerHeight / 2;
    let tx = sx, ty = sy;
    let glowTicking = false;
    function glowLoop() {
      sx += (tx - sx) * 0.12;
      sy += (ty - sy) * 0.12;
      spotlightGlow.style.transform = 'translate3d(' + (sx - window.innerWidth / 2) + 'px, ' + (sy - window.innerHeight / 2) + 'px, 0)';
      if (Math.abs(tx - sx) > 0.5 || Math.abs(ty - sy) > 0.5) {
        requestAnimationFrame(glowLoop);
      } else {
        glowTicking = false;
      }
    }
    document.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!glowTicking) { glowTicking = true; requestAnimationFrame(glowLoop); }
    }, { passive: true });
  }
}

/* ── Hero ambience — tsParticles: drifting hearts + sakura motes ── */
  function initHeroParticles() {
    const container = document.getElementById('heroParticles');
    if (!container || !window.tsParticles) return;
    const reduceMQ = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMQ && reduceMQ.matches) return;

    window.tsParticles.load({
      id: 'heroParticles',
      options: {
        fullScreen: { enable: false },
        fpsLimit: 45,
        background: { color: 'transparent' },
        particles: {
          number: { value: (window.matchMedia && window.matchMedia('(pointer: coarse)').matches ? 14 : 26), density: { enable: true, width: 900, height: 700 } },
          color: { value: ['#E5898B', '#F7C9C4', '#D4AF37', '#A84A4C'] },
          shape: { type: ['star', 'circle'] },
          opacity: { value: { min: 0.12, max: 0.5 } },
          size: { value: { min: 2, max: 5 } },
          move: {
            enable: true,
            speed: { min: 0.3, max: 0.9 },
            direction: 'top',
            straight: false,
            outModes: { default: 'out' },
            drift: 0.4,
          },
          rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 8 } },
          shadow: { enable: false },
        },
        interactivity: {
          events: { onHover: { enable: true, mode: 'repulse' }, resize: { enable: true } },
          modes: { repulse: { distance: 90, duration: 0.35 } },
        },
        detectRetina: true,
      },
    }).then(() => {
      // Pause the particle engine once the hero scrolls away so the loop never
      // renders into a hidden layer (frees main-thread time while reading).
      if (!window.tsParticles) return;
      if ('IntersectionObserver' in window && 'domItem' in window.tsParticles) {
        const heroEl = document.getElementById('hero') || container;
        new IntersectionObserver((entries) => {
          const visible = entries[0].isIntersecting;
          const engine = window.tsParticles.domItem(0);
          if (!engine) return;
          if (visible) engine.play();
          else engine.pause();
        }, { threshold: 0.02 }).observe(heroEl);
      }
    }).catch(() => {});
  }
  initHeroParticles();
  // Re-run when the lazily-injected tsParticles script arrives (the idle
  // loader in index.html calls this). Safe: no-ops if already initialised.
  window.tsParticlesInit = initHeroParticles;

/* ── Pause decorative infinite animations when scrolled out of view ──
   One shared observer stops spending paint/composite budget on things the
   reader can't see: the aurora drift, border-glow spin, shiny-title sweep and
   the memory marquee. Nothing is lost visually — it resumes the frame it's
   read into view. */
(function pauseOffscreenMotion() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  // Every persistent page-wide infinite animation is paused when scrolled out
  // of view so the tablet never pays for motion it can't see.
  const targets = document.querySelectorAll(
    '.aurora, .marquee-track, .hero-title-italic, .finale-card, .meteors, ' +
    '.fairy-light, .sakura-petal, .hero-motif--heart, .hero-motif--heart-left, ' +
    '.hero-motif--heart-right, .hero-motif--vinyl, .hero-motif--star, .reason-heart'
  );
  if (!targets.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      en.target.classList.toggle('motion-paused', !en.isIntersecting);
    });
  }, { rootMargin: '120px 0px', threshold: 0 });
  targets.forEach((el) => io.observe(el));
})();

} catch(err) {
  console.error('Animation init error:', err);
  // Make everything visible if JS fails
  document.querySelectorAll('[style*="opacity: 0"]').forEach(function(el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
  document.querySelectorAll('.reveal').forEach(function(el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
  document.querySelectorAll('.hero-title-char').forEach(function(el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
}
} // end initApp

/* Init once the animation libraries are available.
   gsap + anime + ScrollTrigger ship as a single self-hosted deferred bundle
   (vendor/bundle.js), so under normal conditions they're already present by the
   time this deferred script runs. This poll is a safety net for slow caches and
   for any environment that loads app.min.js without defer — it prevents every
   ScrollTrigger.create from throwing and silently killing scroll animation.
   ScrollTrigger is registered explicitly (it only auto-registers when gsap was
   present at the moment it loaded). */
function waitForLibs(cb, attempts) {
  attempts = attempts || 0;
  if (window.gsap && window.anime && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    cb();
  } else if (attempts < 60) {
    setTimeout(function() { waitForLibs(cb, attempts + 1); }, 100);
  } else {
    console.error('Animation libs failed to load — running without animation');
    cb();
  }
}
waitForLibs(initApp);
