/* ═══════════════════════════════════════════════════════════════
   DEMO — Realistic Morpho Butterfly with perching behaviour
   ═══════════════════════════════════════════════════════════════
   Standalone showcase with:
   • Forewing / hindwing with realistic bezier outlines
   • Cambered wing geometry (vertex displacement)
   • Procedural venation + iridescent patch texture
   • MeshPhysicalMaterial (iridescence, transmission, sheen)
   • Full body: head, compound eyes, proboscis, thorax,
     segmented abdomen, 6 legs, antennae with clubs
   • Flower with petals to perch on
   • RoomEnvironment + soft shadows
   • OrbitControls + perching behaviour
   • Reduced-motion: static perched pose
   */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const DPR = Math.min(window.devicePixelRatio || 1, 2);
const REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 1. Wing shapes (Morpho silhouettes) ── */
function forewingShape(right) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.42, -0.18, 0.92, -0.22);
  s.quadraticCurveTo(1.38, -0.24, 1.55, -0.07);
  s.quadraticCurveTo(1.68, 0.10, 1.48, 0.28);
  s.quadraticCurveTo(1.18, 0.55, 0.84, 0.58);
  s.quadraticCurveTo(0.46, 0.62, 0.14, 0.48);
  s.quadraticCurveTo(0, 0.35, 0, 0);
  if (!right) s.scale(-1, 1);
  return s;
}
function hindwingShape(right) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.38, -0.12, 0.80, -0.15);
  s.quadraticCurveTo(1.16, -0.14, 1.36, 0.04);
  s.quadraticCurveTo(1.52, 0.28, 1.42, 0.50);
  s.quadraticCurveTo(1.26, 0.74, 0.94, 0.88);
  s.quadraticCurveTo(0.56, 0.98, 0.22, 0.90);
  s.quadraticCurveTo(0, 0.78, 0, 0);
  if (!right) s.scale(-1, 1);
  return s;
}

/* ── 2. Procedural wing textures ── */
function makeVenationTexture(kind) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');

  // Base
  if (kind === 'top') {
    // Iridescent blue gradient
    const grad = g.createRadialGradient(S * 0.25, S * 0.25, S * 0.02, S * 0.35, S * 0.30, S * 0.75);
    grad.addColorStop(0, '#f4faff');
    grad.addColorStop(0.08, '#b2e2ff');
    grad.addColorStop(0.22, '#3faaff');
    grad.addColorStop(0.42, '#1a6de0');
    grad.addColorStop(0.62, '#0e48aa');
    grad.addColorStop(0.80, '#082a6f');
    grad.addColorStop(1, '#04133a');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
  } else {
    // Dark brown underside
    g.fillStyle = '#3a2412';
    g.fillRect(0, 0, S, S);
    // Subtle lighter bands
    for (let i = 0; i < 6; i++) {
      g.fillStyle = 'rgba(90,55,25,' + (0.06 + Math.random() * 0.04) + ')';
      g.fillRect(0, S * (i * 0.16), S, S * 0.06);
    }
  }

  // Veins (both sides)
  g.lineCap = 'round';
  const base = { x: S * 0.08, y: S * 0.72 };
  const mainVeins = [
    { angle: 0.65, len: 1.0, flex: 0.3 },
    { angle: 0.50, len: 1.0, flex: 0.4 },
    { angle: 0.35, len: 0.95, flex: 0.4 },
    { angle: 0.20, len: 0.85, flex: 0.5 },
    { angle: 0.05, len: 0.75, flex: 0.5 },
    { angle: -0.10, len: 0.65, flex: 0.6 },
  ];
  for (const v of mainVeins) {
    const endX = base.x + Math.cos(v.angle) * S * v.len * 0.8;
    const endY = base.y - Math.sin(v.angle) * S * v.len * 0.8;
    const cpX = base.x + (endX - base.x) * v.flex + (Math.random() - 0.5) * 30;
    const cpY = base.y - (base.y - endY) * v.flex + (Math.random() - 0.5) * 30;
    g.strokeStyle = kind === 'top' ? 'rgba(6,20,60,' + (0.12 + Math.random() * 0.08) + ')' : 'rgba(20,15,10,0.15)';
    g.lineWidth = 2.5 + Math.random() * 2.5;
    g.beginPath();
    g.moveTo(base.x, base.y);
    g.quadraticCurveTo(cpX, cpY, endX, endY);
    g.stroke();
    // cross-veins
    for (let j = 0; j < 3 + (Math.random() * 2 | 0); j++) {
      const t = 0.2 + Math.random() * 0.6;
      const cx = base.x + (endX - base.x) * t;
      const cy = base.y + (endY - base.y) * t;
      const crossW = 20 + Math.random() * 40;
      g.strokeStyle = kind === 'top' ? 'rgba(6,20,60,0.06)' : 'rgba(20,15,10,0.08)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(cx - crossW, cy + Math.random() * 10);
      g.lineTo(cx + crossW, cy - Math.random() * 10);
      g.stroke();
    }
  }

  // Powdery scales (top only)
  if (kind === 'top') {
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = 'rgba(230,245,255,' + (Math.random() * 0.04) + ')';
      g.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
    }
  }

  // Eyespots (hindwing underside)
  if (kind === 'bottom') {
    [[0.55, 0.65, 0.08], [0.72, 0.42, 0.06], [0.38, 0.78, 0.05]].forEach(([x, y, r]) => {
      const rg = g.createRadialGradient(S * x, S * y, 0, S * x, S * y, S * r);
      rg.addColorStop(0, '#1a0f0a');
      rg.addColorStop(0.5, '#3d2818');
      rg.addColorStop(0.8, '#6b4a2a');
      rg.addColorStop(1, '#a57b4a');
      g.fillStyle = rg;
      g.beginPath();
      g.arc(S * x, S * y, S * r, 0, Math.PI * 2);
      g.fill();
    });
  }

  // Dark edge border
  g.strokeStyle = kind === 'top' ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.2)';
  g.lineWidth = 8;
  g.strokeRect(4, 4, S - 8, S - 8);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ── 3. Build a wing with camber ── */
function buildWing(shape, side, forewing, frontMat, backMat, scale) {
  const geo = new THREE.ShapeGeometry(shape, 24);
  geo.rotateX(-Math.PI / 2);

  // Camber: bend the wing tip downward (z-axis sag) and add a slight dish
  const pos = geo.attributes.position;
  const bbox = new THREE.Box3().setFromBufferAttribute(pos);
  const maxX = Math.max(Math.abs(bbox.max.x), Math.abs(bbox.min.x));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const r = Math.abs(x) / maxX;
    const dish = r * r * 0.12; // deeper camber near the tip
    pos.setZ(i, z - dish * Math.sign(side));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const frontMesh = new THREE.Mesh(geo, frontMat);
  frontMesh.scale.setScalar(scale);
  const backMesh = new THREE.Mesh(geo.clone(), backMat);
  backMesh.position.z = -0.015 * scale;
  backMesh.scale.setScalar(scale);

  // Hinge-group: forewing sits slightly forward, hindwing behind
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
    roughness: 0.28,
    metalness: 0.0,
    sheen: 1.0,
    sheenColor: new THREE.Color(0xffffff),
    sheenRoughness: 0.4,
    transmission: 0.15,
    thickness: 0.5,
    side: THREE.DoubleSide,
  });
  const backMat = new THREE.MeshPhysicalMaterial({
    map: bottomTex,
    roughness: 0.7,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x1a0f0a, roughness: 0.8 });

  const FW_SCALE = 0.22;
  const HW_SCALE = 0.18;

  // Right wings
  const fwR = buildWing(forewingShape(true), 1, true, frontMat, backMat, FW_SCALE);
  fwR.position.z = 0.15;
  const hwR = buildWing(hindwingShape(true), 1, false, frontMat, backMat, HW_SCALE);
  hwR.position.z = -0.25;
  // Left wings (mirror x scale)
  const fwL = buildWing(forewingShape(false), -1, true, frontMat, backMat, FW_SCALE);
  fwL.position.z = 0.15;
  const hwL = buildWing(hindwingShape(false), -1, false, frontMat, backMat, HW_SCALE);
  hwL.position.z = -0.25;

  const wingL = new THREE.Group();
  wingL.add(fwL, hwL);
  const wingR = new THREE.Group();
  wingR.add(fwR, hwR);

  // Body
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.75 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0d0906, roughness: 0.8 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x080505, roughness: 0.15, metalness: 0.3 });

  // Thorax (capsule)
  const thorax = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.12, 4, 10), bodyMat);
  thorax.rotation.x = Math.PI / 2;
  thorax.position.z = 0.02;

  // Abdomen (lathe)
  const abdPts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const r = 0.04 * Math.sin(t * Math.PI) * (1 - 0.5 * t);
    abdPts.push(new THREE.Vector2(t * 0.28, r));
  }
  const abd = new THREE.Mesh(new THREE.LatheGeometry(abdPts, 12), darkMat);
  abd.rotation.x = Math.PI / 2;
  abd.position.z = -0.14;

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), bodyMat);
  head.position.z = 0.11;

  // Compound eyes
  [[-0.022, 0.018, 0.125], [0.022, 0.018, 0.125]].forEach(([x, y, z]) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), eyeMat);
    eye.position.set(x, y, z);
    head.add(eye);
  });

  // Proboscis (coiled tube)
  const probPts = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const ang = t * Math.PI * 4;
    const r = 0.008 * (1 - t * 0.3);
    probPts.push(new THREE.Vector3(
      Math.sin(ang) * r,
      -0.005 - t * 0.015,
      -0.05 + Math.cos(ang) * r
    ));
  }
  const probCurve = new THREE.CatmullRomCurve3(probPts);
  const prob = new THREE.Mesh(new THREE.TubeGeometry(probCurve, 24, 0.003, 4, false), new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.6 }));
  prob.position.set(0, -0.01, 0.12);

  // Antennae with clubs
  const antenMat = new THREE.MeshStandardMaterial({ color: 0x2a1f18, roughness: 0.5 });
  [-1, 1].forEach((s) => {
    const pts = [
      new THREE.Vector3(0, 0.015 * s, 0.11),
      new THREE.Vector3(0.04 * s, 0.06 * s, 0.16),
      new THREE.Vector3(0.07 * s, 0.08 * s, 0.13),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.003, 4, false), antenMat);
    // Club
    const club = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.4 }));
    club.position.copy(pts[2]);
    const antenGroup = new THREE.Group();
    antenGroup.add(tube, club);
    group.add(antenGroup);
  });

  // Legs (6 thin cylinders)
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.6 });
  const legPos = [-0.06, -0.02, 0.02];
  legPos.forEach((zOff, pair) => {
    [-1, 1].forEach((s) => {
      const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.04, 4), legMat);
      seg1.position.set(0.025 * s, -0.025, 0.04 + zOff);
      seg1.rotation.z = 0.3 * s;
      const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.04, 4), legMat);
      seg2.position.set(0.045 * s, -0.045, 0.04 + zOff);
      seg2.rotation.z = 0.5 * s;
      group.add(seg1, seg2);
    });
  });

  group.add(wingL, wingR, thorax, abd, head, prob);
  group.userData = { wingL, wingR, head };
  return group;
}

/* ── 5. Flower ── */
function makeFlower() {
  const group = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.7 }));
  stem.position.y = -0.25;
  group.add(stem);

  const petalMat = new THREE.MeshPhysicalMaterial({ color: 0xf5b0c0, roughness: 0.3, metalness: 0, transmission: 0.1, thickness: 0.3, side: THREE.DoubleSide });
  // Pose des pétales en corolle
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0);
    petalShape.quadraticCurveTo(0.03, 0.06, 0, 0.10);
    petalShape.quadraticCurveTo(-0.03, 0.06, 0, 0);
    const g = new THREE.ShapeGeometry(petalShape, 6);
    const m = new THREE.Mesh(g, petalMat);
    m.position.set(Math.sin(ang) * 0.04, 0, Math.cos(ang) * 0.04);
    m.rotation.y = ang;
    m.rotation.x = -0.5;
    group.add(m);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd4a040, roughness: 0.6 }));
  center.position.y = 0.01;
  group.add(center);
  group.position.y = 0.25;
  return group;
}

/* ── 6. Ground ── */
function makeGround() {
  const g = new THREE.CircleGeometry(2.5, 32);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(200,180,150,0.4)');
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
  mesh.position.y = -0.27;
  return mesh;
}

/* ── 7. Main scene setup ── */
const canvas = document.getElementById('demo');
const loader = document.getElementById('loader');

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(DPR);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
if (!REDUCE) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3ead9);
scene.fog = new THREE.Fog(0xf3ead9, 6, 10);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.05, 20);
camera.position.set(1.4, 1.0, 3.2);

// Environment for iridescence reflections
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
const key = new THREE.DirectionalLight(0xfff5e6, 1.8);
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
butterfly.position.set(0, 0.6, 0);
scene.add(butterfly);

const flower = makeFlower();
flower.position.set(0, 0, 0.4);
scene.add(flower);

const ground = makeGround();
scene.add(ground);

// Orbit Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.5, 0.2);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.5;
controls.maxDistance = 6;
controls.autoRotate = !REDUCE;
controls.autoRotateSpeed = 0.8;
controls.update();

/* ── 8. Behaviour state machine ── */
const state = {
  mode: 'perch',       // 'fly' | 'perch'
  time: 0,
  timeScale: 1.0,
  phase: 0,
  flapAmp: 0.65,
  flapSpeed: 0.6,
  flyTarget: new THREE.Vector3(),
  targetY: 0.6,
  hoverT: Math.random() * Math.PI * 2,
  perchPos: new THREE.Vector3(0, 0.6, 0.25), // on flower
  flyTimer: 0,
};

// Lissajous flight path parameters
const FLIGHT = { A: 0.2, B: 0.12, C: 0.18, a: 1.3, b: 0.9, c: 1.1, p1: 0, p2: 1.2, p3: 2.5 };

function updateFly(dt) {
  state.time += dt * state.timeScale;
  const t = state.time;
  const fx = Math.sin(t * FLIGHT.a + FLIGHT.p1) * FLIGHT.A;
  const fy = Math.sin(t * FLIGHT.b + FLIGHT.p2) * FLIGHT.B + 0.6;
  const fz = Math.cos(t * FLIGHT.c + FLIGHT.p3) * FLIGHT.C + 0.15;
  state.flyTarget.set(fx, fy, fz);
  state.targetY = fy;
}

function updateState(dt) {
  state.hoverT += dt * 0.8 * state.timeScale;
  state.phase += dt * state.flapSpeed * state.timeScale;

  if (state.mode === 'fly') {
    updateFly(dt);
    state.flapAmp = 0.85;
    state.flapSpeed = 1.6;
    state.flyTimer -= dt;
    if (state.flyTimer <= 0) {
      state.mode = 'perch';
      state.flapAmp = 0.35;
      state.flapSpeed = 0.4;
    }
  } else {
    // perch on flower
    state.flyTarget.copy(state.perchPos);
    state.flapAmp = 0.35;
    state.flapSpeed = 0.4 + Math.sin(state.time * 0.5) * 0.15;
    state.flyTimer -= dt;
    if (state.flyTimer <= 0) {
      state.mode = 'fly';
      state.flyTimer = 7 + Math.random() * 5;
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

  // Position: smooth follow
  const wingL = butterfly.userData.wingL;
  const wingR = butterfly.userData.wingR;

  // Flap
  const ph = state.phase;
  const f = ph % 1;
  let flap;
  if (f < 0.40) flap = Math.sin((f / 0.40) * Math.PI);
  else if (f < 0.52) flap = 0;
  else if (f < 0.82) flap = -Math.sin(((f - 0.52) / 0.30) * Math.PI) * 0.85;
  else flap = 0;
  const amp = state.flapAmp * (1 + state.timeScale * 0);
  wingL.rotation.z = -flap * amp;
  wingR.rotation.z = flap * amp;
  // Hindwing lag
  wingL.children.forEach((c, i) => { if (i === 1 || i === 3) c.rotation.y = flap * 0.12 * amp; });
  wingR.children.forEach((c, i) => { if (i === 1 || i === 3) c.rotation.y = -flap * 0.12 * amp; });

  // Body bob
  const bob = Math.abs(flap) * 0.04 + Math.sin(state.hoverT * 2) * 0.008;

  // Steer toward target
  const lerp = 1 - Math.pow(0.001, dt);
  butterfly.position.lerp(state.flyTarget, lerp);
  if (state.mode === 'fly') {
    butterfly.position.y += bob;
    // Heading (face velocity direction)
    const dx = Math.cos(state.time * FLIGHT.a + FLIGHT.p1) * FLIGHT.A * FLIGHT.a;
    const dz = -Math.sin(state.time * FLIGHT.c + FLIGHT.p3) * FLIGHT.C * FLIGHT.c;
    if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
      butterfly.rotation.y = Math.atan2(dx, dz);
    }
    // Bank
    butterfly.rotation.z = -dx * 0.15;
    butterfly.rotation.x = Math.sin(state.time * 0.5) * 0.04;
  } else {
    // Perch: slight sway
    butterfly.position.y = state.targetY + Math.sin(state.hoverT * 0.5) * 0.005;
    butterfly.position.z = 0.25 + Math.cos(state.hoverT * 0.3) * 0.005;
    butterfly.rotation.y = butterfly.rotation.y * 0.95 + 0.15 * 0.05;
    butterfly.rotation.z = -0.04;
    butterfly.rotation.x = 0.02;
    // Antennae slow sway
    butterfly.userData.head.rotation.z = Math.sin(state.hoverT * 0.3) * 0.02;
  }

  controls.update();
  renderer.render(scene, camera);
  if (!REDUCE) requestAnimationFrame(loop);
}

/* ── 10. Controls ── */
document.getElementById('btnPerch').addEventListener('click', () => { state.mode = 'perch'; state.flyTimer = 99; });
document.getElementById('btnFly').addEventListener('click', () => { state.mode = 'fly'; state.flyTimer = 7 + Math.random() * 5; });
document.getElementById('btnSlow').addEventListener('click', () => { state.timeScale = state.timeScale === 1 ? 0.25 : 1; });
document.getElementById('btnReset').addEventListener('click', () => {
  camera.position.set(1.4, 1.0, 3.2);
  controls.target.set(0, 0.5, 0.2);
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
requestAnimationFrame(() => { loader.classList.add('hidden'); });

/* ── 13. Start loop ── */
if (REDUCE) {
  state.mode = 'perch';
  state.flyTimer = 99;
  renderer.render(scene, camera);
} else {
  state.flyTimer = 8 + Math.random() * 4;
  requestAnimationFrame(loop);
}