/* ═══════════════════════════════════════════════════════════
   BUTTERFLY3D — three.js page-wide butterfly companion
   ═══════════════════════════════════════════════════════════
   The preloader's Morpho butterfly is reborn in WebGL. Wings are
   rebuilt from the SAME SVG path data (the SVG is the single source),
   flapped around the true body axis, and dressed in native
   MeshPhysicalMaterial iridescence. It idles on the hero title,
   lazily follows the cursor, startles on click, and drifts along as
   you scroll. Beat-reactive: pulse amplitude with the audio hum.

   Loaded as an ES module (via the import map in index.html).
   Exposes window.Butterfly3D = { start, setBeat }.
   ═══════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const DPR_CAP = 2;
const CAM_DIST = 12;
const PRELOADER_CAM_DIST = 5.5;
const PRELOADER_SCALE = 0.62; // fits the 238×199 preloader motif box
const FOV = 55;
const HOVER_R = 0.28;
const MODEL_SCALE = 0.05;
const POINTER_BLEND = 0.5;
const IDLE_MS = 2600;

// Fallback wing outlines — same art as the inline preloader SVG.
const WING_PATHS = {
  leftUpper: 'M60 52 C50 30, 15 10, 8 20 C2 28, 10 50, 25 58 C35 63, 50 58, 60 52Z',
  leftLower: 'M60 52 C48 58, 20 70, 15 78 C12 84, 20 90, 30 85 C40 80, 52 68, 60 52Z',
  rightUpper: 'M60 52 C70 30, 105 10, 112 20 C118 28, 110 50, 95 58 C85 63, 70 58, 60 52Z',
  rightLower: 'M60 52 C72 58, 100 70, 105 78 C108 84, 100 90, 90 85 C80 80, 68 68, 60 52Z',
};

const REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── procedural Morpho wing texture (reproduces the SVG gradients) ── */
function makeWingTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');

  const grad = g.createRadialGradient(S * 0.30, S * 0.26, S * 0.05, S * 0.42, S * 0.30, S * 0.72);
  grad.addColorStop(0.00, '#F6FCFF');
  grad.addColorStop(0.08, '#C9F1FF');
  grad.addColorStop(0.22, '#5FD3FF');
  grad.addColorStop(0.40, '#1E9BF0');
  grad.addColorStop(0.60, '#1261C9');
  grad.addColorStop(0.80, '#0B3A92');
  grad.addColorStop(1.00, '#061A5C');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);

  // veins
  g.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const x0 = S * 0.42, y0 = S * 0.30;
    const ang = -Math.PI * 0.5 + (i / 13 - 0.5) * Math.PI * 1.1;
    const r = S * (0.45 + Math.random() * 0.15);
    const x1 = x0 + Math.cos(ang) * r;
    const y1 = y0 + Math.sin(ang) * r;
    g.strokeStyle = 'rgba(6,26,92,' + (0.12 + Math.random() * 0.10) + ')';
    g.lineWidth = 1.5 + Math.random() * 2.5;
    g.beginPath();
    g.moveTo(x0, y0);
    g.bezierCurveTo(x0 + (x1 - x0) * 0.4 + (Math.random() - 0.5) * 40, y0 + (y1 - y0) * 0.4 + (Math.random() - 0.5) * 40, x1, y1, x1, y1);
    g.stroke();
  }
  // powdery scale speckle
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = 'rgba(230,246,255,' + (Math.random() * 0.05) + ')';
    g.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 1.6, 1 + Math.random() * 1.6);
  }
  // eyespots
  [[S * 0.62, S * 0.6, S * 0.085], [S * 0.38, S * 0.72, S * 0.06]].forEach(([x, y, r]) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, '#071338');
    rg.addColorStop(0.6, '#0D47A1');
    rg.addColorStop(1, '#4FC3F7');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ── build the butterfly from the four wing outlines ── */
function buildButterfly(scene, loader) {
  const group = new THREE.Group();

  const wingTex = makeWingTexture();
  const frontMat = new THREE.MeshPhysicalMaterial({
    map: wingTex,
    iridescence: 1.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [140, 420],
    roughness: 0.30,
    metalness: 0.0,
    sheen: 1.0,
    sheenColor: new THREE.Color(0xffffff),
    sheenRoughness: 0.45,
    side: THREE.DoubleSide,
  });
  const backMat = new THREE.MeshStandardMaterial({ color: 0x2E2E3E, roughness: 0.65, side: THREE.DoubleSide });

  // Wing hinge in SVG coords; wings pivot around the body (Z) axis.
  const HINGE = new THREE.Vector2(60, 52);

  function addWing(side, kind, pathData, isBack) {
    const shapes = loader.createShapes(pathData);
    shapes.forEach(shape => {
      shape.translate(-HINGE.x, -HINGE.y);
    });
    const geo = new THREE.ShapeGeometry(shapes, 14);
    geo.rotateX(-Math.PI / 2); // lay the SVG XY plane into the XZ world plane
    const mat = isBack ? backMat : frontMat;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(MODEL_SCALE);

    // Upper wing sits slightly forward (+Z), lower slightly behind (-Z),
    // matching the overlap in the original art. Back (underside) meshes sit
    // a hair further back so they don't z-fight with the iridescent fronts.
    const zOff = kind === 'upper' ? 0.35 : -0.5;
    const backNudge = isBack ? -0.08 : 0;
    mesh.position.set(0, 0, (zOff + backNudge) * MODEL_SCALE);
    return mesh;
  }

  // Wing groups: rotation.z IS the flap (wings rotate about the body axis).
  const wingL = new THREE.Group();
  const wingR = new THREE.Group();
  wingL.add(addWing('L', 'upper', WING_PATHS.leftUpper, false));
  wingL.add(addWing('L', 'lower', WING_PATHS.leftLower, false));
  wingL.add(addWing('L', 'upper', WING_PATHS.leftUpper, true));
  wingL.add(addWing('L', 'lower', WING_PATHS.leftLower, true));
  wingR.add(addWing('R', 'upper', WING_PATHS.rightUpper, false));
  wingR.add(addWing('R', 'lower', WING_PATHS.rightLower, false));
  wingR.add(addWing('R', 'upper', WING_PATHS.rightUpper, true));
  wingR.add(addWing('R', 'lower', WING_PATHS.rightLower, true));

  // Body along Z (head toward +Z).
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0D47A1, roughness: 0.35, metalness: 0.1 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x061A5C, roughness: 0.5 });

  const thorax = new THREE.Mesh(new THREE.CapsuleGeometry(0.75 * MODEL_SCALE, 2.1 * MODEL_SCALE, 4, 12), bodyMat);
  thorax.rotation.x = Math.PI / 2;
  thorax.position.z = 0.5 * MODEL_SCALE;

  const abdomen = new THREE.Mesh(new THREE.ConeGeometry(0.85 * MODEL_SCALE, 4.4 * MODEL_SCALE, 10), darkMat);
  abdomen.rotation.x = Math.PI / 2;
  abdomen.position.z = -2.2 * MODEL_SCALE;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.6 * MODEL_SCALE, 12, 10), bodyMat);
  head.position.z = 2.0 * MODEL_SCALE;

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x071338, roughness: 0.2 });
  [[-0.32, 0.32], [0.32, 0.32]].forEach(([x, y]) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22 * MODEL_SCALE, 8, 8), eyeMat);
    eye.position.set(x * MODEL_SCALE, y * MODEL_SCALE, 2.3 * MODEL_SCALE);
    head.add(eye);
  });

  // Antennae — TubeGeometry along an upward-forward curl, swayed in update().
  const antenMat = new THREE.MeshStandardMaterial({ color: 0x1565C0, roughness: 0.4 });
  const antenGroup = new THREE.Group();
  [-1, 1].forEach(s => {
    const pts = [
      new THREE.Vector3(0, 0.1 * MODEL_SCALE * s, 2.0 * MODEL_SCALE),
      new THREE.Vector3(0.8 * MODEL_SCALE * s, 1.6 * MODEL_SCALE, 3.4 * MODEL_SCALE),
      new THREE.Vector3(1.5 * MODEL_SCALE * s, 2.2 * MODEL_SCALE, 2.2 * MODEL_SCALE),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.05 * MODEL_SCALE, 6, false), antenMat);
    antenGroup.add(tube);
  });

  group.add(wingL, wingR, thorax, abdomen, head, antenGroup);
  group.userData = { wingL, wingR, antenGroup, wingTex };
  scene.add(group);
  return group;
}

/* ── behaviour state machine ── */
class Butterfly {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.preloader = !!opts.preloader;
    this.started = false;
    this.reduced = REDUCE;
    this.beat = 0;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    this.camera.position.set(0, 0, this.preloader ? PRELOADER_CAM_DIST : CAM_DIST);

    // Lights: cool key + warm rim for iridescence + gentle fill.
    this.scene.add(new THREE.HemisphereLight(0xbfd8ff, 0xffe6c9, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(3, 5, 6);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffd9a0, 0.8);
    rim.position.set(-4, -2, -5);
    this.scene.add(rim);
    const fill = new THREE.PointLight(0xd4af37, 0.5, 40);
    fill.position.set(0, 2, -3);
    this.scene.add(fill);

    this.butterfly = buildButterfly(this.scene, new SVGLoader());
    if (this.preloader) {
      this.butterfly.scale.setScalar(PRELOADER_SCALE);
      // Tilt the wing plane toward the camera so the 3D reads clearly
      // (iridescent sheen + banking visible, not just a frontal flap).
      this.butterfly.rotation.x = -0.32;
      this.butterfly.rotation.z = 0.18;
    }

    // Post: bloom flares the iridescent highlights.
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(canvas.clientWidth || 640, canvas.clientHeight || 480), 0.6, 0.65, 0.9);
    this.composer.addPass(this.bloom);

    // State
    this.mode = 'perch';        // perch | follow | startle
    this.pos = new THREE.Vector3(0, 0.2, 0);
    this.vel = new THREE.Vector3();
    this.accel = new THREE.Vector3();
    this.target = new THREE.Vector3(0, 0.6, 0);
    this.phase = 0;
    this.flapAmp = 0.85;
    this.flapSpeed = 1.0;
    this.hoverT = Math.random() * Math.PI * 2;
    this.startleT = 0;
    this.pointer = new THREE.Vector2(0, 0);
    this.hasPointer = false;
    this.lastMove = 0;
    this.perchY = 0;
    this.boundPointer = (e) => { this.pointer.set(e.clientX, e.clientY); this.hasPointer = true; this.lastMove = performance.now(); };
    this.boundStartle = (e) => this.startle(e.clientX, e.clientY);
    this.boundScroll = () => this.updatePerch();

    this._onResize();
    window.addEventListener('resize', this._onResize = this._onResize.bind(this));
    if (!this.preloader) {
      window.addEventListener('pointermove', this.boundPointer, { passive: true });
      window.addEventListener('click', this.boundStartle, { passive: true });
      window.addEventListener('scroll', this.boundScroll, { passive: true });
      this.updatePerch();
    } else {
      // Preloader: fixed idle perch at the centre of the motif.
      this.target.set(0, 0, 0);
      this.flapAmp = 0.55;
    }

    if (this.reduced) {
      // Render one static frame — wings gently open — and stop.
      this.phase = 0.35;
      this.flapAmp = 0.18;
      this.step(0.016);
      this.renderFrame();
      return;
    }
    this.started = true;
    this.renderer.setAnimationLoop(this.loop);
  }

  /* scroll-linked perch: butterfly hovers near the content you're reading */
  updatePerch() {
    const h = window.innerHeight || 1;
    const doc = document.documentElement;
    const max = Math.max(1, (doc.scrollHeight || h) - h);
    const p = Math.min(1, Math.max(0, (window.scrollY || 0) / max));
    // Travel from +2 (hero) to -2 (finale) — half-height is ~6.25, so this
    // covers about 32% of the visible vertical range, noticeable but not jarring.
    this.perchY = 2.0 - p * 4.0;
  }

  startle(cx, cy) {
    if (this.reduced || !this.started) return;
    const w = this._worldFromPointer(cx, cy);
    const away = new THREE.Vector3(this.pos.x - w.x, this.pos.y - w.y, 0);
    if (away.lengthSq() < 1e-4) away.set(0.5, 0.5, 0);
    away.normalize();
    this.vel.addScaledVector(away, 0.9);
    this.vel.y += 0.4;
    this.mode = 'startle';
    this.startleT = 1.0;
    this.flapAmp = 1.35;
    this.flapSpeed = 2.4;
  }

  setBeat(v) {
    this.beat = Math.max(0, Math.min(1, v));
  }

  _worldFromPointer(cx, cy) {
    const w = this._half();
    return new THREE.Vector3(
      ((cx / window.innerWidth) - 0.5) * 2 * w.x,
      (0.5 - (cy / window.innerHeight)) * 2 * w.y,
      0
    );
  }

  _half() {
    const camDist = this.preloader ? PRELOADER_CAM_DIST : CAM_DIST;
    const halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * camDist;
    const w = this.canvas.clientWidth || window.innerWidth || 1;
    const h = this.canvas.clientHeight || window.innerHeight || 1;
    const aspect = w / h;
    return { x: halfH * aspect, y: halfH };
  }

  _onResize() {
    const w = this.canvas.clientWidth || window.innerWidth || 1;
    const h = this.canvas.clientHeight || window.innerHeight || 1;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.composer.setSize(w, h);
    if (this.bloom) this.bloom.setSize(w, h);
  }

  loop = (time) => {
    const dt = Math.min(0.05, (time - (this._last || time)) / 1000);
    this._last = time;
    if (dt <= 0) return;
    this.step(dt);
    this.renderFrame();
  };

  step(dt) {
    const ph = this.phase;

    // — flap: fast upstroke, slow downstroke, glide pause (mirrors the CSS art)
    const f = ph % 1;
    let flap;
    if (f < 0.42) flap = Math.sin((f / 0.42) * Math.PI) * 1.0;       // quick up
    else if (f < 0.55) flap = 0.0;                                    // top pause
    else if (f < 0.85) flap = -Math.sin(((f - 0.55) / 0.30) * Math.PI) * 0.9; // slower down
    else flap = 0.0;                                                  // bottom glide
    const amp = this.flapAmp * (1 + this.beat * 0.7);
    const wingL = this.butterfly.userData.wingL;
    const wingR = this.butterfly.userData.wingR;
    wingL.rotation.z = -flap * amp;
    wingR.rotation.z = flap * amp;
    // hindwing lag
    wingL.children.forEach((m, i) => { if (i === 1 || i === 3) m.rotation.y = flap * 0.10 * amp; });
    wingR.children.forEach((m, i) => { if (i === 1 || i === 3) m.rotation.y = -flap * 0.10 * amp; });
    // micro camber
    wingL.rotation.y = flap * 0.06 * amp;
    wingR.rotation.y = -flap * 0.06 * amp;

    // antennae sway with the flap
    const ag = this.butterfly.userData.antenGroup;
    ag.rotation.y = Math.sin(ph * Math.PI * 2) * 0.16;
    ag.rotation.x = Math.sin(ph * Math.PI * 2 * 0.5) * 0.06;

    // body bob synced to flap
    const bob = Math.abs(flap) * 0.35 + Math.sin(this.hoverT * 2) * 0.12;

    // — steering: follow cursor when active, otherwise drift back to perch
    let tx = 0, ty = this.perchY, tz = 0;
    if (this.hasPointer && (performance.now() - this.lastMove) < IDLE_MS) {
      const w = this._worldFromPointer(this.pointer.x, this.pointer.y);
      tx = w.x * POINTER_BLEND;
      ty = (1 - POINTER_BLEND) * this.perchY + POINTER_BLEND * w.y;
    }
    this.target.set(tx, ty, tz);

    const damp = this.mode === 'startle' ? 1.6 : 3.2;
    this.accel.copy(this.target).sub(this.pos).multiplyScalar(damp * damp * 0.5);
    this.vel.addScaledVector(this.accel, dt);
    this.vel.multiplyScalar(Math.max(0, 1 - dt * damp));
    this.pos.addScaledVector(this.vel, dt);

    // — perching hover wobble
    if (this.mode === 'perch') {
      this.hoverT += dt * 1.6;
      this.pos.x += Math.sin(this.hoverT) * 0.04;
      this.pos.z = Math.cos(this.hoverT * 0.7) * HOVER_R;
    }
    this.pos.y += bob * 0.02;

    // — startle timeout → return to perch
    if (this.mode === 'startle') {
      this.startleT -= dt;
      if (this.startleT <= 0) {
        this.mode = 'perch';
        this.flapAmp = 0.85;
        this.flapSpeed = 1.0;
      }
    }

    this.phase += dt * (2.2 * this.flapSpeed) * (1 + this.beat * 0.5);

    this.butterfly.position.copy(this.pos);
    // orientation: bank into turns (wings lie in the XZ plane, so roll is rotation.z)
    if (this.preloader) {
      // Keep the fixed 3/4 tilt from the constructor.
      return;
    }
    const bank = THREE.MathUtils.clamp(-this.vel.x * 0.30, -0.45, 0.45);
    this.butterfly.rotation.z = bank;
    this.butterfly.rotation.x = THREE.MathUtils.clamp(this.vel.y * 0.20, -0.25, 0.25);
    this.butterfly.rotation.y = 0;
  }

  renderFrame() {
    this.composer.render();
  }

  dispose() {
    window.removeEventListener('pointermove', this.boundPointer);
    window.removeEventListener('click', this.boundStartle);
    window.removeEventListener('scroll', this.boundScroll);
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
  }
}

/* ── boot ── */
(function init() {
  const companionCanvas = document.getElementById('butterfly3d');
  const preloaderCanvas = document.getElementById('preloaderButterfly3d');
  const preloader = document.getElementById('preloader');
  if (!companionCanvas && !preloaderCanvas) return;

  let companion = null;
  let pre = null;

  // Preloader butterfly: WebGL boots after first paint; fade it in over the SVG.
  if (preloaderCanvas) {
    try {
      pre = new Butterfly(preloaderCanvas, { preloader: true });
      preloaderCanvas.classList.add('ready');
      // Fade the 2D SVG art out underneath (CSS handles the transition).
      if (preloader) preloader.classList.add('preloader-3d-ready');
    } catch (err) {
      console.error('Preloader Butterfly3D failed:', err);
      preloaderCanvas.remove();
    }
  }

  if (companionCanvas) {
    try {
      companion = new Butterfly(companionCanvas);
      companionCanvas.classList.add('ready');
    } catch (err) {
      console.error('Butterfly3D init failed:', err);
      companionCanvas.remove();
      companion = null;
    }
  }

  // Tear down the preloader 3D scene once the splash leaves the DOM.
  if (pre && preloader) {
    new MutationObserver((muts, obs) => {
      if (!document.getElementById('preloader')) {
        obs.disconnect();
        pre.dispose();
        pre = null;
      }
    }).observe(preloader.parentNode, { childList: true });
  }

  window.Butterfly3D = {
    start: () => { if (companion && !companion.started && !companion.reduced) { companion.started = true; companion.renderer.setAnimationLoop(companion.loop); } },
    setBeat: (v) => { if (companion) companion.setBeat(v); },
  };
})();
