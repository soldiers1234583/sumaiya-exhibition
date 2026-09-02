/* ═══════════════════════════════════════════════════════════════
   Butterly Model Viewer — standalone page for the CGTrader model
   ═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const DPR = Math.min(window.devicePixelRatio || 1, 2);
const REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Target wingspan in world units — smaller = smaller butterfly on screen.
const TARGET_SPAN = 1.8;
// Default flap speed multiplier (matches the preloader's brisk flap).
const ANIM_SPEED = 1.9;

const canvas = document.getElementById('viewer');
const status = document.getElementById('status');

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(DPR);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3ead9);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(6, 3, 11);

// Lights
scene.add(new THREE.HemisphereLight(0xbfd8ff, 0xffe6c9, 1.0));
const key = new THREE.DirectionalLight(0xfff5e6, 2.0);
key.position.set(3, 5, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffd9a0, 0.6);
rim.position.set(-3, -1, -4);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xb0c8ff, 0.5);
fill.position.set(-2, 1, -2);
scene.add(fill);

// Orbit Controls
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.5;
controls.maxDistance = 20;
controls.autoRotate = !REDUCE;
controls.autoRotateSpeed = 1.2;
controls.update();

// Load the model
const texLoader = new THREE.TextureLoader();
const mapTex = texLoader.load('models/textures/DIFFUSE-Morpho-didius-sq.webp', undefined, undefined, () => texLoader.load('models/textures/DIFFUSE_Morpho_didius_Male_Dos_MHNT.jpg'));
const alphaTex = texLoader.load('models/textures/ALPHA-Morpho-didius-sq.webp', undefined, undefined, () => texLoader.load('models/textures/ALPHA_OR_OPACITY_MASK_Morpho_didius_Male_Dos_MHNT.jpg'));
const normalTex = texLoader.load('models/textures/NORMAL-Morpho-didius-sq.webp', undefined, undefined, () => texLoader.load('models/textures/NORMAL_MAP_Morpho_didius_Male_Dos_MHNT_NRM.jpg'));
mapTex.colorSpace = THREE.SRGBColorSpace;

let model, mixer, clock = new THREE.Clock();
let paused = false;
let animAction = null;
const SPEEDS = [0.5, 1, 1.9, 3, 5];
let speedIdx = 2;

async function loadModel() {
  try {
    const loader = new FBXLoader();
    const obj = await loader.loadAsync('models/butterfly.fbx');
    model = obj;

    // Apply textures
    model.traverse(o => {
      if (o.isMesh) {
        const mat = new THREE.MeshStandardMaterial({
          map: mapTex,
          alphaMap: alphaTex,
          normalMap: normalTex,
          transparent: true,
          side: THREE.DoubleSide,
          roughness: 0.5,
          metalness: 0,
        });
        o.material = mat;
        if (o.geometry) o.geometry.computeVertexNormals();
      }
    });

    // Normalize scale & center
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const s = TARGET_SPAN / Math.max(1e-6, size.x, size.y, size.z);
    model.scale.setScalar(s);
    model.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(model);
    const center = box2.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.rotation.x = 0;
    model.rotation.y = 0;

    scene.add(model);

    // Animation clips — speed up to match the preloader butterfly's flap
    // rhythm (3 quick flaps per ~4.8s → ~1.6s per flap; the FBX clip is 3s).
    if (obj.animations && obj.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      const action = mixer.clipAction(obj.animations[0]);
      action.setLoop(THREE.LoopRepeat);
      action.timeScale = ANIM_SPEED;
      action.play();
      animAction = action;
    }

    status.textContent = model.animations
      ? `✓ loaded · ${model.animations[0].name} (${(model.animations[0].duration / ANIM_SPEED).toFixed(1)}s) · speed ${ANIM_SPEED}×`
      : '✓ loaded · no animation';
    status.classList.remove('err');
  } catch (err) {
    status.textContent = '✗ ' + (err.message || 'load failed');
    status.classList.add('err');
  }
}

await loadModel();

// Animation loop
function loop() {
  requestAnimationFrame(loop);
  const dt = clock.getDelta();
  if (mixer) mixer.update(dt);
  controls.update();
  renderer.render(scene, camera);
}
if (!REDUCE) loop();
else renderer.render(scene, camera);

// Controls
document.getElementById('btnSpeed').addEventListener('click', () => {
  speedIdx = (speedIdx + 1) % SPEEDS.length;
  const s = SPEEDS[speedIdx];
  if (animAction) animAction.timeScale = s;
  document.getElementById('btnSpeed').textContent = 'Flap speed: ' + s + '×';
});
document.getElementById('btnPlay').addEventListener('click', () => {
  paused = !paused;
  if (mixer) mixer.timeScale = paused ? 0 : SPEEDS[speedIdx];
  document.getElementById('btnPlay').textContent = paused ? 'Resume animation' : 'Pause animation';
});
document.getElementById('btnAuto').addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  document.getElementById('btnAuto').textContent = 'Auto-rotate: ' + (controls.autoRotate ? 'on' : 'off');
});
document.getElementById('btnReset').addEventListener('click', () => {
  camera.position.set(6, 3, 11);
  controls.target.set(0, 0, 0);
  controls.update();
});

// Resize
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});