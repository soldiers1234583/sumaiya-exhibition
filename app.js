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
  progress.style.width = '100%';

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
      progress.style.transitionDuration = duration + 'ms';
      progress.style.width = '0%';
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
    progress.style.transitionDuration = '0ms';
  });
  el.addEventListener('mouseleave', function() {
    if (duration < Infinity) {
      const currentWidth = parseFloat(getComputedStyle(progress).width);
      const totalWidth = el.offsetWidth - 3;
      const remaining = (currentWidth / totalWidth) * duration;
      if (remaining > 0) {
        progress.style.transitionDuration = remaining + 'ms';
        progress.style.width = '0%';
        timer = setTimeout(function() { dismissToast(id); }, remaining);
      }
    }
  });

  return id;
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
    img.src = art.src + '?v=6';
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
        <img src="${art.src}?v=6" alt="${art.title}" width="${art.orientation === 'landscape' ? 4 : 3}" height="${art.orientation === 'landscape' ? 3 : 4}" loading="lazy" decoding="async">
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
  activeCard.classList.remove('spinning');
  void activeCard.offsetWidth;
  activeCard.classList.add('spinning');
  setTimeout(() => activeCard.classList.remove('spinning'), 700);
}

function goToSlide(index, { spin = true, smooth = true, focus = false } = {}) {
  const total = artworks.length;
  const idx = ((index % total) + total) % total;
  const target = carouselCards[idx];
  if (!target) return;
  const vpWidth = carouselViewport.clientWidth;
  const left = target.offsetLeft - (vpWidth - target.offsetWidth) / 2;
  scriptedScroll = true;
  carouselViewport.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'auto' });
  updateActiveUI(idx);
  if (spin) spinActiveCard();
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
  carouselCards.forEach((card, i) => {
    const center = card.offsetLeft + card.offsetWidth / 2;
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
});

// Recompute on resize + IntersectionObserver (handles content-visibility)
let resizeT;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    goToSlide(currentSlide, { spin: false, smooth: false });
  }, 120);
});

// When the carousel becomes visible (content-visibility deferred), re-sync
const resizeObserver = new ResizeObserver(() => {
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
  lightboxImg.src = art.src + '?v=6';
  lightboxImg.alt = art.title;
  lightboxCat.textContent = `CAT. ${String(lightboxIndex + 1).padStart(2, '0')} — ${art.date}`;
  lightboxTitle.textContent = `"${art.title}"`;
  lightboxCritique.textContent = art.critique;
  lightboxCount.textContent = `${lightboxIndex + 1} / ${artworks.length}`;
  lightboxLens.style.backgroundImage = 'url("' + art.src + '?v=6")';
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
    img.src = artworks[idx].src + '?v=6';
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
function flipReason() {
  let i;
  do { i = Math.floor(Math.random() * REASONS.length); } while (i === lastReason);
  lastReason = i;
  reasonText.classList.add('swap');
  setTimeout(() => {
    reasonText.textContent = REASONS[i];
    reasonText.classList.remove('swap');
  }, 200);
  reasonBtn.classList.remove('pulsing');
  void reasonBtn.offsetWidth;
  reasonBtn.classList.add('pulsing');
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
  ScrollTrigger.create({
    trigger: reasonsWrap,
    start: 'top 75%',
    end: 'bottom 45%',
    scrub: 0.6,
    onUpdate: function(self) {
      const p = Math.max(0, Math.min(1, self.progress));
      beamTrack.style.clipPath = 'inset(0 0 ' + (100 - p * 100) + '% 0)';
      beamHead.style.top = (p * 100) + '%';
    }
  });
}

/* ── Cursor / finger sparkle trail (gentle pastel sparkles) ── */
(function sparkleTrail() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const SPARKLE_COLORS = ['#E5898B', '#C7B8E8', '#D4AF37', '#9FAF90'];
  const sparks = [];
  const maxSparks = isCoarse ? 10 : 24;
  const body = document.body;

  function makeSpark(x, y) {
    if (sparks.length >= maxSparks) {
      const old = sparks.shift();
      if (old && old.parentNode) old.parentNode.removeChild(old);
    }
    const el = document.createElement('span');
    el.className = 'sparkle';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.background = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
    const size = Math.random() * 5 + 3;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    body.appendChild(el);
    sparks.push(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
  }

  let throttle = false;
  function onMove(e) {
    if (throttle) return;
    throttle = true;
    setTimeout(() => { throttle = false; }, 40);
    const x = e.clientX + (Math.random() * 14 - 7);
    const y = e.clientY + (Math.random() * 14 - 7);
    makeSpark(x, y);
  }
  document.addEventListener(isCoarse ? 'touchmove' : 'mousemove', onMove, { passive: true });
})();

/* ═══════════════════════════════════════════
   CONFETTI
   ═══════════════════════════════════════════ */
const confettiCanvas = document.getElementById('confettiCanvas');
const cctx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
let confettiParticles = [];
let confettiRunning = false;

function resizeConfetti() {
  if (!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
resizeConfetti();
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resizeConfetti, 150); });

const CONFETTI_COLORS = ['#E5898B', '#F7C9C4', '#D4AF37', '#ECE7F6', '#C7E3D1', '#E8A86C', '#FFDFB0', '#FBF8F4'];

function launchConfetti() {
  if (!cctx) return;
  confettiParticles = [];
  for (let i = 0; i < 120; i++) {
    confettiParticles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 1) * 14,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      gravity: 0.25,
      opacity: 1,
      decay: Math.random() * 0.008 + 0.005,
    });
  }
  confettiRunning = true;
  animateConfetti();
}

function animateConfetti() {
  if (!cctx || !confettiRunning) return;
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  let alive = false;
  confettiParticles.forEach(p => {
    if (p.opacity <= 0) return;
    alive = true;
    p.x += p.vx;
    p.vy += p.gravity;
    p.y += p.vy;
    p.vx *= 0.99;
    p.rotation += p.rotSpeed;
    p.opacity -= p.decay;
    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate((p.rotation * Math.PI) / 180);
    cctx.globalAlpha = Math.max(0, p.opacity);
    cctx.fillStyle = p.color;
    cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    cctx.restore();
  });
  if (alive) requestAnimationFrame(animateConfetti);
  else { confettiRunning = false; cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
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
    launchConfetti();
    this.classList.add('done');
    this.textContent = '♥ Dedicated';
    heartCount += 1;
    try { localStorage.setItem(HEARTS_KEY, String(heartCount)); } catch (err) {}
    updateHeartsUI();
    const msg = document.getElementById('dedicateMsg');
    if (msg) msg.classList.add('show');
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
// Determine motion preference via GSAP matchMedia. We use GSAP's matchMedia()
// rather than a one-shot window.matchMedia() read because it re-evaluates and
// reverts automatically when the OS prefers-reduced-motion setting changes at
// runtime (no page reload required).
let motionOK = true;
try {
  gsap.matchMedia().add({ reduceMotion: REDUCE_Q }, (ctx) => {
    motionOK = !ctx.conditions.reduceMotion;
  });
} catch (e) { motionOK = true; /* fall back to enabled if matchMedia is unavailable */ }

// GSAP matchMedia: gate motion per tier
const mm = gsap.matchMedia();
mm.add({ motionOK: '(prefers-reduced-motion: no-preference)', motionReduce: REDUCE_Q }, (ctx) => {
  const { motionOK: ok } = ctx.conditions;

  /* ── TIER 1: Hero entrance — anime.js ── */
  if (ok) {
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
      duration: 450,
      easing: 'cubicBezier(0.16, 1, 0.3, 1)',
    });

    // Title characters — spring-like stagger, slower
    heroTl.add({
      targets: '.hero-title-char',
      opacity: [0, 1],
      translateY: [15, 0],
      rotateX: [-30, 0],
      duration: 560,
      delay: anime.stagger(32, { start: 300 }),
      easing: 'cubicBezier(0.16, 1, 0.3, 1)',
    }, '-=200');

    // Subtitle
    heroTl.add({
      targets: '.hero-subtitle',
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 450,
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
     frames one by one in the exhibition. */
  if (ok) {
    const carouselEl = document.getElementById('galleryCarousel');
    const entranceCards = gsap.utils.toArray('.art-card');
    if (carouselEl && entranceCards.length) {
      gsap.set(carouselEl, { opacity: 0, y: 30 });
      gsap.set(entranceCards, { opacity: 0, y: 24, filter: 'blur(6px)' });
      ScrollTrigger.create({
        trigger: carouselEl, start: 'top 85%', once: true,
        onEnter: () => {
          gsap.to(entranceCards, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.7,
            ease: 'power3.out',
            stagger: { each: 0.07, from: 'center' },
            onComplete: () => {
              gsap.to(carouselEl, { opacity: 1, y: 0, duration: 0.3 });
              carouselEl.style.filter = '';
              carouselCards.forEach(c => c.querySelectorAll('.skeleton').forEach(s => s.classList.add('skel-done')));
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
  if (ok) {
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
  if (ok) {
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
  if (ok) {
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
            });
        },
      });
    }
  } else {
    document.querySelectorAll('.finale-card').forEach(c => { c.style.opacity = '1'; c.classList.add('skel-done'); });
  }

  /* ── TIER 1: Parallax on hero motifs (GSAP — scrub needs continuous RAF) ── */
  if (ok) {
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
  if (ok) {
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
          duration: 500,
          delay: anime.stagger(50),
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

// Show/hide nav — visible by default; hide on scroll-down, reveal on scroll-up
const forMehrimaTag = document.getElementById('forMehrimaTag');
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      const scrollY = (document.documentElement ? document.documentElement.scrollTop : 0) || (document.body ? document.body.scrollTop : 0) || 0;
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
        const nearBottom = window.innerHeight + scrollY >= (document.body.scrollHeight - 500);
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
    bar.style.height = Math.random() * 30 + 5 + 'px';
    telemetry.appendChild(bar);
  }
  f1Card.addEventListener('mouseenter', () => {
    telemetry.querySelectorAll('span').forEach(bar => {
      gsap.to(bar, { height: Math.random() * 35 + 5, duration: 0.3, ease: 'power2.out', overwrite: true });
    });
  });
}

/* ═══════════════════════════════════════════
   VIBE METER — TIER 3: always keep
   ═══════════════════════════════════════════ */
document.querySelectorAll('.vibe-fill').forEach(fill => {
  const w = fill.dataset.width;
  gsap.set(fill, { width: '0%' });
  ScrollTrigger.create({
    trigger: fill, start: 'top 90%', once: true,
    onEnter: () => { gsap.to(fill, { width: w + '%', duration: 0.8, ease: 'power2.out' }); },
  });
});

/* ═══════════════════════════════════════════
   AUDIO DOCK
   ═══════════════════════════════════════════ */
const audioDock = document.getElementById('audioDock');
const dockVinyl = document.getElementById('dockVinyl');
const dockPlay = document.getElementById('dockPlay');
let isPlaying = false;
ScrollTrigger.create({
  trigger: '#gallery', start: 'top 80%', once: true,
  onEnter: () => audioDock.classList.add('visible'),
});

/* ── WebAudio ambient — a warm exhibition-hall hum ── */
let audioCtx = null;
let ambientGain = null;
let ambientOscillators = [];
let ambientNoise = null;

function startAmbient() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  ambientGain = audioCtx.createGain();
  ambientGain.gain.value = 0;
  ambientGain.connect(audioCtx.destination);

  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  lp.Q.value = 0.8;
  lp.connect(ambientGain);

  [110, 164.8, 220.6].forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    osc.detune.value = (i - 1) * 7;
    const g = audioCtx.createGain();
    g.gain.value = i === 0 ? 0.16 : 0.08;
    osc.connect(g);
    g.connect(lp);
    osc.start();
    ambientOscillators.push(osc);
  });

  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  ambientNoise = audioCtx.createBufferSource();
  ambientNoise.buffer = buf;
  ambientNoise.loop = true;
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 0.5;
  const ng = audioCtx.createGain();
  ng.gain.value = 0.008;
  ambientNoise.connect(bp); bp.connect(ng); ng.connect(ambientGain);
  ambientNoise.start();

  ambientGain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 1.6);
  return true;
}

function stopAmbient() {
  if (!ambientGain || !audioCtx) return;
  const ctx = audioCtx;
  ambientGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
  setTimeout(() => {
    ambientOscillators.forEach(o => { try { o.stop(); o.disconnect(); } catch (e) {} });
    if (ambientNoise) { try { ambientNoise.stop(); ambientNoise.disconnect(); } catch (e) {} }
    ambientOscillators = [];
    ambientNoise = null;
    ambientGain = null;
    try { ctx.close(); } catch (e) {}
    audioCtx = null;
  }, 700);
}

function ambientSwoop() {
  if (!audioCtx || !ambientOscillators.length) return;
  const osc = ambientOscillators[0];
  if (!osc || !osc.frequency) return;
  const base = osc.frequency.value;
  const t = audioCtx.currentTime;
  osc.frequency.cancelScheduledValues(t);
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.linearRampToValueAtTime(base * 1.5, t + 0.35);
  osc.frequency.linearRampToValueAtTime(base, t + 1.1);
}

dockPlay.addEventListener('click', () => {
  isPlaying = !isPlaying;
  dockVinyl.classList.toggle('spinning', isPlaying);
  dockPlay.textContent = isPlaying ? '❚❚' : '▶';
  dockPlay.setAttribute('aria-label', isPlaying ? 'Pause the exhibition sound' : 'Play the exhibition sound');
  if (isPlaying) {
    startAmbient();
    showToast('Now playing', {
      type: 'info',
      description: 'a warm hum for the exhibition — 505 for the night drives',
      duration: 3000
    });
  } else {
    stopAmbient();
    showToast('Paused', {
      type: 'info',
      description: 'the vibe rests for now',
      duration: 2000
    });
  }
});

// Resume audio if the tab comes back
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && audioCtx && audioCtx.state === 'suspended' && isPlaying) audioCtx.resume();
});

/* ── Easter egg: double-tap the vinyl → night drive mode ── */
dockVinyl.addEventListener('dblclick', () => {
  const reduceM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isPlaying && !reduceM) ambientSwoop();
  showToast('night drive mode', {
    type: 'info',
    description: 'for the night drives ♥',
    duration: 2500
  });
});

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
  /* ── Helper: detect touch device ── */
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
    function updateMagCenter() {
      var r = dedicateBtn.getBoundingClientRect();
      magBtnCX = r.left + r.width / 2;
      magBtnCY = r.top + r.height / 2;
    }
    dedicateBtn.addEventListener('mouseenter', updateMagCenter);
    document.addEventListener('scroll', updateMagCenter, { passive: true });
    window.addEventListener('resize', updateMagCenter);
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

  /* ── Dock play button — press feedback ── */
  dockPlay.addEventListener('mousedown', () => {
    anime({ targets: dockPlay, scale: 0.85, duration: 80, easing: 'easeInQuad' });
  });
  dockPlay.addEventListener('mouseup', () => {
    anime({ targets: dockPlay, scale: 1, duration: 120, easing: 'cubicBezier(0.16, 1, 0.3, 1)' });
  });
  dockPlay.addEventListener('touchstart', () => {
    anime({ targets: dockPlay, scale: 0.85, duration: 80, easing: 'easeInQuad' });
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
