/* ═══════════════════════════════════════════════════════════════
   DEMO — Realistic Morpho Butterfly with perching behaviour
   ═══════════════════════════════════════════════════════════════
   Standalone showcase:
   • Forewing / hindwing with realistic bezier outlines
   • UV-normalised wing geometry + cambered tips
   • Procedural venation + iridescent patch texture
   • MeshPhysicalMaterial (iridescence, transmission, sheen)
   • Full body: head, compound eyes, proboscis, thorax,
     segmented abdomen, 6 legs, antennae with clubs
   • Flower with petals to perch on
   • RoomEnvironment + soft shadows
   • OrbitControls + perching behaviour
   • Reduced-motion: static basking pose
   */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const DPR = Math.min(window.devicePixelRatio || 1, 2);
const REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 1. Wing shapes (Morpho silhouettes), RIGHT wing only.
   THREE.Shape has no scale(); we mirror the geometry in buildWing. ── */
function forewingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.42, -0.18, 0.92, -0.22);
  s.quadraticCurveTo(1.38, -0.24, 1.55, -0.07);
  s.quadraticCurveTo(1.68, 0.10, 1.48, 0.28);
  s.quadraticCurveTo(1.18, 0.55, 0.84, 0.58);
  s.quadraticCurveTo(0.46, 0.62, 0.14, 0.48);
  s.quadraticCurveTo(0, 0.35, 0, 0);
  return s;
}
function hindwingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.38, -0.12, 0.80, -0.15);
  s.quadraticCurveTo(1.16, -0.14, 1.36, 0.04);
  s.quadraticCurveTo(1.52, 0.28, 1.42, 0.50);
  s.quadraticCurveTo(1.26, 0.74, 0.94, 0.88);
  s.quadraticCurveTo(0.56, 0.98, 0.22, 0.90);
  s.quadraticCurveTo(0, 0.78, 0, 0);
  return s;
}

/* ── 2. Procedural wing textures (canvas 2D, aligned to normalized UVs) ── */
function makeVenationTexture(kind) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');

  // Base — UV(0,0) is the wing base (hinge), so the bright iridescence sits
  // mid-wing and darkens toward the outer margin, like a real Morpho.
  if (kind === 'top') {
    const grad = g.createRadialGradient(S * 0.42, S * 0.38, S * 0.05, S * 0.5, S * 0.5, S * 0.8);
    grad.addColorStop(0, '#f6fbff');
    grad.addColorStop(0.10, '#bce6ff');
    grad.addColorStop(0.26, '#3fa8ff');
    grad.addColorStop(0.48, '#1670e0');
    grad.addColorStop(0.70, '#0b3f9e');
    grad.addColorStop(0.90, '#051d5c');
    grad.addColorStop(1, '#020a26');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
  } else {
    g.fillStyle = '#3a2412';
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 7; i++) {
      g.fillStyle = 'rgba(96,58,26,' + (0.05 + Math.random() * 0.04) + ')';
      g.fillRect(0, S * (i * 0.145), S, S * 0.055);
    }
  }

  // Veins radiating from the base (UV 0,0 = top-left of canvas)
  g.lineCap = 'round';
  const baseX = S * 0.02, baseY = S * 0.02;
  const veins = [
    { a: 0.55, len: 0.95, flex: 0.35, w: 5 },
    { a: 0.40, len: 1.0, flex: 0.4, w: 4.5 },
    { a: 0.26, len: 0.98, flex: 0.45, w: 4 },
    { a: 0.12, len: 0.9, flex: 0.5, w: 3.5 },
    { a: -0.02, len: 0.82, flex: 0.55, w: 3 },
    { a: -0.16, len: 0.7, flex: 0.6, w: 2.5 },
    { a: -0.30, len: 0.55, flex: 0.65, w: 2 },
  ];
  const veinColor = kind === 'top' ? 'rgba(4,16,52,' : 'rgba(24,16,8,';
  for (const v of veins) {
    const ex = baseX + Math.cos(v.a) * S * v.len;
    const ey = baseY + Math.sin(v.a) * S * v.len;
    const cx = baseX + (ex - baseX) * v.flex + (Math.random() - 0.5) * 20;
    const cy = baseY + (ey - baseY) * v.flex + (Math.random() - 0.5) * 20;
    g.strokeStyle = veinColor + (0.14 + Math.random() * 0.08) + ')';
    g.lineWidth = v.w;
    g.beginPath();
    g.moveTo(baseX, baseY);
    g.quadraticCurveTo(cx, cy, ex, ey);
    g.stroke();
    // cross veins
    for (let j = 0; j < 2 + (Math.random() * 3 | 0); j++) {
      const t = 0.25 + Math.random() * 0.6;
      const px = baseX + (ex - baseX) * t;
      const py = baseY + (ey - baseY) * t;
      const perp = v.a + Math.PI / 2;
      const len = 14 + Math.random() * 30;
      g.strokeStyle = veinColor + '0.05)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(px + Math.cos(perp) * len, py + Math.sin(perp) * len);
      g.lineTo(px - Math.cos(perp) * len, py - Math.sin(perp) * len);
      g.stroke();
    }
  }

  // Powdery scales (top only)
  if (kind === 'top') {
    for (let i = 0; i < 4500; i++) {
      g.fillStyle = 'rgba(235,248,255,' + (Math.random() * 0.05) + ')';
      g.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 1.6, 1 + Math.random() * 1.6);
    }
  }

  // Eyespots (hindwing underside, toward the outer corner)
  if (kind === 'bottom') {
    [[0.62, 0.55, 0.10], [0.80, 0.34, 0.07], [0.46, 0.72, 0.06]].forEach(([x, y, r]) => {
      const rg = g.createRadialGradient(S * x, S * y, 0, S * x, S * y, S * r);
      rg.addColorStop(0, '#180e08');
      rg.addColorStop(0.45, '#3c2716');
      rg.addColorStop(0.78, '#6b4a2a');
      rg.addColorStop(1, '#a57b4a');
      g.fillStyle = rg;
      g.beginPath();
      g.arc(S * x, S * y, S * r, 0, Math.PI * 2);
      g.fill();
    });
  }

  // Dark margin border
  g.strokeStyle = kind === 'top' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.25)';
  g.lineWidth = 14;
  g.strokeRect(7, 7, S - 14, S - 14);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ── 3. Build a wing. ShapeGeometry UVs are raw shape coords (0..~1.7), so we
   normalize them to 0..1 so the canvas texture maps correctly. ── */
function buildWing(shape, side, forewing, frontMat, backMat, scale, mirror) {
  const geo = new THREE.ShapeGeometry(shape, 28);
  geo.rotateX(-Math.PI / 2);

  // Normalize UVs to 0..1 over the wing bounding box
  const uv = geo.attributes.uv;
  if (uv) {
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i), v = uv.getY(i);
      if (u < u0) u0 = u; if (u > u1) u1 = u;
      if (v < v0) v0 = v; if (v > v1) v1 = v;
    }
    const du = (u1 - u0) || 1, dv = (v1 - v0) || 1;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) - u0) / du, (uv.getY(i) - v0) / dv);
    }
    uv.needsUpdate = true;
  }

  // Camber: wing tip droops gently, dish toward the hinge
  const pos = geo.attributes.position;
  const bbox = new THREE.Box3().setFromBufferAttribute(pos);
  const maxX = Math.max(Math.abs(bbox.max.x), Math.abs(bbox.min.x));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const r = Math.abs(x) / maxX;
    const dish = r * r * 0.14;
    pos.setZ(i, z - dish);  // both wings droop the same way
  }
  if (mirror) {
    for (let i = 0; i < pos.count; i++) pos.setX(i, -pos.getX(i));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const frontMesh = new THREE.Mesh(geo, frontMat);
  frontMesh.scale.setScalar(scale);
  const backMesh = new THREE.Mesh(geo.clone(), backMat);
  backMesh.position.z = -0.02 * scale;
  backMesh.scale.setScalar(scale);

  const group = new THREE.Group();
  group.add(frontMesh, backMesh);
  group.userData = { frontMesh, backMesh, isForewing: forewing };
  return group;
}

/* ── 4. Full butterfly model ── */
function buildButterfly() {
  const group = new THREE.Group();
  const topTex = makeVenationTexture('top');
  const bottomTex = makeVenationTexture('bottom');

  const frontMat = new THREE.MeshPhysicalMaterial({
    map: topTex,
    iridescence: 1.0,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [120, 450],
    roughness: 0.26,
    metalness: 0.0,
    sheen: 1.0,
    sheenColor: new THREE.Color(0xffffff),
    sheenRoughness: 0.4,
    transmission: 0.18,
    thickness: 0.6,
    side: THREE.DoubleSide,
  });
  const backMat = new THREE.MeshPhysicalMaterial({
    map: bottomTex,
    roughness: 0.72,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const FW_SCALE = 0.34;
  const HW_SCALE = 0.28;

  const fwR = buildWing(forewingShape(), 1, true, frontMat, backMat, FW_SCALE, false);
  fwR.position.z = 0.18;
  const hwR = buildWing(hindwingShape(), 1, false, frontMat, backMat, HW_SCALE, false);
  hwR.position.z = -0.30;
  const fwL = buildWing(forewingShape(), -1, true, frontMat, backMat, FW_SCALE, true);
  fwL.position.z = 0.18;
  const hwL = buildWing(hindwingShape(), -1, false, frontMat, backMat, HW_SCALE, true);
  hwL.position.z = -0.30;

  const wingL = new THREE.Group();
  wingL.add(fwL, hwL);
  const wingR = new THREE.Group();
  wingR.add(fwR, hwR);

  // Basking posture: wings swept up into a shallow V (tips toward the sky)
  wingL.rotation.z = -0.5;
  wingR.rotation.z = 0.5;

  // Body
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x221a12, roughness: 0.7 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x120c07, roughness: 0.85 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0604, roughness: 0.12, metalness: 0.4 });

  // Thorax (capsule)
  const thorax = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.16, 4, 12), bodyMat);
  thorax.rotation.x = Math.PI / 2;
  thorax.position.z = 0.03;

  // Abdomen (lathe)
  const abdPts = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const r = 0.05 * Math.sin(t * Math.PI) * (1 - 0.35 * t);
    abdPts.push(new THREE.Vector2(t * 0.34, r));
  }
  const abd = new THREE.Mesh(new THREE.LatheGeometry(abdPts, 14), darkMat);
  abd.rotation.x = Math.PI / 2;
  abd.position.z = -0.17;

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), bodyMat);
  head.position.z = 0.13;

  // Compound eyes
  [[-0.026, 0.02, 0.145], [0.026, 0.02, 0.145]].forEach(([x, y, z]) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), eyeMat);
    eye.position.set(x, y, z);
    head.add(eye);
  });

  // Proboscis (coiled tube under the head)
  const probPts = [];
  for (let i = 0; i <= 36; i++) {
    const t = i / 36;
    const ang = t * Math.PI * 4.5;
    const r = 0.012 * (1 - t * 0.35);
    probPts.push(new THREE.Vector3(
      Math.sin(ang) * r,
      -0.012 - t * 0.02,
      -0.02 + Math.cos(ang) * r
    ));
  }
  const probCurve = new THREE.CatmullRomCurve3(probPts);
  const prob = new THREE.Mesh(
    new THREE.TubeGeometry(probCurve, 28, 0.004, 5, false),
    new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.6 })
  );
  prob.position.set(0, -0.012, 0.13);

  // Antennae with clubs
  const antenMat = new THREE.MeshStandardMaterial({ color: 0x2a1f18, roughness: 0.5 });
  const antenGroup = new THREE.Group();
  [-1, 1].forEach((s) => {
    const pts = [
      new THREE.Vector3(0, 0.018 * s, 0.13),
      new THREE.Vector3(0.05 * s, 0.075 * s, 0.20),
      new THREE.Vector3(0.085 * s, 0.10 * s, 0.16),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.004, 5, false), antenMat);
    const club = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.4 })
    );
    club.position.copy(pts[2]);
    const g2 = new THREE.Group();
    g2.add(tube, club);
    antenGroup.add(g2);
  });

  // Legs (6 thin cylinders)
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.6 });
  const legPos = [-0.07, -0.02, 0.03];
  legPos.forEach((zOff) => {
    [-1, 1].forEach((s) => {
      const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.05, 5), legMat);
      seg1.position.set(0.03 * s, -0.032, 0.05 + zOff);
      seg1.rotation.z = 0.3 * s;
      const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.05, 5), legMat);
      seg2.position.set(0.055 * s, -0.058, 0.05 + zOff);
      seg2.rotation.z = 0.5 * s;
      group.add(seg1, seg2);
    });
  });

  group.add(wingL, wingR, thorax, abd, head, prob, antenGroup);
  group.userData = { wingL, wingR, antenGroup, head };
  return group;
}

/* ── 5. Flower ── */
function makeFlower() {
  const group = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.028, 0.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.7 })
  );
  stem.position.y = -0.35;
  group.add(stem);

  const petalMat = new THREE.MeshPhysicalMaterial({
    color: 0xf5a8c0, roughness: 0.35, metalness: 0, transmission: 0.12, thickness: 0.4, side: THREE.DoubleSide,
  });
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2;
    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0);
    petalShape.quadraticCurveTo(0.045, 0.09, 0, 0.15);
    petalShape.quadraticCurveTo(-0.045, 0.09, 0, 0);
    const g = new THREE.ShapeGeometry(petalShape, 8);
    const m = new THREE.Mesh(g, petalMat);
    m.position.set(Math.sin(ang) * 0.055, 0.0, Math.cos(ang) * 0.055);
    m.rotation.y = ang;
    m.rotation.x = -0.55;
    m.rotation.z = 0.1;
    group.add(m);
  }
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xd4a040, roughness: 0.6 })
  );
  center.position.y = 0.015;
  group.add(center);
  group.position.y = 0.35;
  return group;
}

/* ── 6. Ground ── */
function makeGround() {
  const g = new THREE.CircleGeometry(3, 40);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(200,180,150,0.45)');
  grad.addColorStop(0.5, 'rgba(200,180,150,0.15)');
  grad.addColorStop(1, 'rgba(200,180,150,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.rotation = -Math.PI / 2;
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  mat.receiveShadow = true;
  const mesh = new THREE.Mesh(g, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.36;
  return mesh;
}

/* ── 7. Main scene setup (with error capture) ── */
const canvas = document.getElementById('demo');
const loader = document.getElementById('loader');

const hideTimer = setTimeout(() => { if (loader) loader.classList.add('hidden'); }, 3000);

let initError = null;
try {

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(DPR);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
if (!REDUCE) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3ead9);
scene.fog = new THREE.Fog(0xf3ead9, 7, 12);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.05, 20);
camera.position.set(1.6, 1.15, 3.4);

// Environment for iridescence reflections
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
const key = new THREE.DirectionalLight(0xfff5e6, 2.0);
key.position.set(2, 4, 3);
key.castShadow = !REDUCE;
key.shadow.mapSize.set(512, 512);
key.shadow.bias = -0.001;
scene.add(key);
const fill = new THREE.DirectionalLight(0xb0c8ff, 0.6);
fill.position.set(-2, 1, -2);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffdead, 0.5);
rim.position.set(0, -1, -3);
scene.add(rim);

// Build
const butterfly = buildButterfly();
butterfly.position.set(0, 0.75, 0);
scene.add(butterfly);

const flower = makeFlower();
flower.position.set(0, 0, 0.5);
scene.add(flower);

const ground = makeGround();
scene.add(ground);

// Orbit Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.6, 0.2);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.6;
controls.maxDistance = 6;
controls.autoRotate = !REDUCE;
controls.autoRotateSpeed = 0.7;
controls.update();

/* ── 8. Behaviour state machine ── */
const state = {
  mode: 'perch',       // 'fly' | 'perch'
  time: 0,
  timeScale: 1.0,
  phase: 0,
  flyTarget: new THREE.Vector3(),
  targetY: 0.75,
  hoverT: Math.random() * Math.PI * 2,
  perchPos: new THREE.Vector3(0, 0.72, 0.42),
  flyTimer: 0,
};

// Lissajous flight path around the flower
const FLIGHT = { A: 0.22, B: 0.14, C: 0.20, a: 1.2, b: 0.85, c: 1.05, p1: 0, p2: 1.3, p3: 2.5 };

function updateFly(dt) {
  state.time += dt * state.timeScale;
  const t = state.time;
  const fx = Math.sin(t * FLIGHT.a + FLIGHT.p1) * FLIGHT.A;
  const fy = Math.sin(t * FLIGHT.b + FLIGHT.p2) * FLIGHT.B + 0.72;
  const fz = Math.cos(t * FLIGHT.c + FLIGHT.p3) * FLIGHT.C + 0.3;
  state.flyTarget.set(fx, fy, fz);
  state.targetY = fy;
}

function updateState(dt) {
  state.hoverT += dt * 0.8 * state.timeScale;
  state.phase += dt * (state.mode === 'fly' ? 1.7 : 0.5) * state.timeScale;

  if (state.mode === 'fly') {
    updateFly(dt);
    state.flyTimer -= dt;
    if (state.flyTimer <= 0) {
      state.mode = 'perch';
      state.flyTimer = 4 + Math.random() * 3;
    }
  } else {
    // perch: sit on the flower with wings half-open, fluttering slowly
    state.flyTarget.copy(state.perchPos);
    state.flyTimer -= dt;
    if (state.flyTimer <= 0) {
      state.mode = 'fly';
      state.flyTimer = 6 + Math.random() * 4;
    }
  }
}

/* ── 9. Animation loop ── */
let lastTime = 0;

function loop(time) {
  const dt = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;
  if (dt <= 0) { requestAnimationFrame(loop); return; }

  updateState(dt);

  const wingL = butterfly.userData.wingL;
  const wingR = butterfly.userData.wingR;
  const antenGroup = butterfly.userData.antenGroup;

  // Flap cycle: quick upstroke, pause, slower downstroke, glide
  const ph = state.phase;
  const f = ph % 1;
  let flap;
  if (f < 0.40) flap = Math.sin((f / 0.40) * Math.PI);
  else if (f < 0.52) flap = 0;
  else if (f < 0.82) flap = -Math.sin(((f - 0.52) / 0.30) * Math.PI) * 0.85;
  else flap = 0;

  const flying = state.mode === 'fly';
  const amp = flying ? 1.15 : 0.55;
  // Basking V is the resting baseline; flap opens/closes around it
  const baseTilt = flying ? 0.0 : 0.35;
  wingL.rotation.z = -baseTilt - flap * amp;
  wingR.rotation.z = baseTilt + flap * amp;
  // Hindwing lags the forewing a touch
  wingL.children.forEach((c, i) => { if (i === 1 || i === 3) c.rotation.y = flap * 0.10 * amp; });
  wingR.children.forEach((c, i) => { if (i === 1 || i === 3) c.rotation.y = -flap * 0.10 * amp; });

  // Antennae sway gently with the flap
  antenGroup.rotation.y = Math.sin(state.phase * Math.PI * 2) * 0.12;
  antenGroup.rotation.x = Math.sin(state.phase * Math.PI * 0.5) * 0.04;

  // Body bob
  const bob = Math.abs(flap) * 0.05 * amp + Math.sin(state.hoverT * 2) * 0.01;

  // Steering
  const lerp = 1 - Math.pow(0.002, dt);
  butterfly.position.lerp(state.flyTarget, lerp);

  if (flying) {
    butterfly.position.y += bob;
    // Face velocity direction
    const dx = Math.cos(state.time * FLIGHT.a + FLIGHT.p1) * FLIGHT.A * FLIGHT.a;
    const dz = -Math.sin(state.time * FLIGHT.c + FLIGHT.p3) * FLIGHT.C * FLIGHT.c;
    if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
      butterfly.rotation.y = Math.atan2(dx, dz);
    }
    butterfly.rotation.z = -dx * 0.12;
    butterfly.rotation.x = Math.sin(state.time * 0.5) * 0.04;
  } else {
    // Perch: level out over the flower, gentle sway
    butterfly.position.y = state.perchPos.y + Math.sin(state.hoverT * 0.5) * 0.006;
    butterfly.rotation.x *= 0.9;
    butterfly.rotation.z *= 0.9;
    butterfly.rotation.y = butterfly.rotation.y * 0.95 + 0.1 * 0.05;
  }

  controls.update();
  renderer.render(scene, camera);
  if (!REDUCE) requestAnimationFrame(loop);
}

/* ── 10. Controls ── */
document.getElementById('btnPerch').addEventListener('click', () => { state.mode = 'perch'; state.flyTimer = 99; });
document.getElementById('btnFly').addEventListener('click', () => { state.mode = 'fly'; state.flyTimer = 6 + Math.random() * 4; });
document.getElementById('btnSlow').addEventListener('click', () => { state.timeScale = state.timeScale === 1 ? 0.25 : 1; });
document.getElementById('btnReset').addEventListener('click', () => {
  camera.position.set(1.6, 1.15, 3.4);
  controls.target.set(0, 0.6, 0.2);
  controls.update();
});

/* ── 11. Resize ── */
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

/* ── 12. Fade out loader ── */
clearTimeout(hideTimer);
requestAnimationFrame(() => { loader.classList.add('hidden'); });

/* ── 13. Start loop ── */
if (REDUCE) {
  state.mode = 'perch';
  state.flyTimer = 99;
  renderer.render(scene, camera);
} else {
  state.flyTimer = 7 + Math.random() * 3;
  requestAnimationFrame(loop);
}

} catch (err) {
  initError = err;
  console.error('Demo init failed:', err);
  if (loader) {
    clearTimeout(hideTimer);
    loader.classList.remove('hidden');
    loader.innerHTML = '<span style="color:#a04030;font-style:italic;max-width:32ch;text-align:center">' +
      (err && err.message ? err.message : 'WebGL unavailable') + '</span>';
  }
}