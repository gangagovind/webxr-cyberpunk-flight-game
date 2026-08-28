/**
 * Main Entry Point for "Cyberpunk 2099: Skyline Overdrive" WebXR Arcade Flight Game.
 * Features 100% player-controlled throttle (0 km/h idle at start), responsive steering,
 * Chase Cam by default, and high-contrast dark OLED cyberpunk HUD.
 */

import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { createHoverVehicle, createCyberpunkCityGroup } from './cyberpunkGeometry.js';
import { SpatialCockpit } from './spatialCockpit.js';
import { ParticleSystem } from './particleSystem.js';
import { CollisionSystem } from './collisionSystem.js';
import { BoundaryWalls } from './boundaryWalls.js';
import { CyberTrafficSystem } from './cyberTraffic.js';
import { GameManager, GAME_MODES, GAME_STATES } from './gameManager.js';
import {
  initSynthwaveAudio,
  resumeAudio,
  updateEnginePitch,
  playNitroSound,
  toggleAudioMute
} from './synthwaveAudio.js';

// ---------------------------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------------------------
const canvas = document.getElementById('scene');

// Top HUD
const currentModeTag = document.getElementById('currentModeTag');
const objectiveLabel = document.getElementById('objectiveLabel');
const objectiveVal = document.getElementById('objectiveVal');
const timerVal = document.getElementById('timerVal');
const distanceVal = document.getElementById('distanceVal');
const scoreVal = document.getElementById('scoreVal');
const streakBadge = document.getElementById('streakBadge');
const streakText = document.getElementById('streakText');
const audioBtn = document.getElementById('audioBtn');
const audioIcon = document.getElementById('audioIcon');
const pauseBtn = document.getElementById('pauseBtn');

// Waypoint / Reticle
const targetBracket = document.getElementById('targetBracket');
const bracketDist = document.getElementById('bracketDist');
const offscreenPointer = document.getElementById('offscreenPointer');
const offscreenDist = document.getElementById('offscreenDist');
const hudAlertBanner = document.getElementById('hudAlertBanner');
const alertText = document.getElementById('alertText');

// Telemetry
const speedText = document.getElementById('speedText');
const altText = document.getElementById('altText');
const shieldFill = document.getElementById('shieldFill');
const shieldPctText = document.getElementById('shieldPctText');
const nitroFill = document.getElementById('nitroFill');
const nitroQuickBtn = document.getElementById('nitroQuickBtn');

// Modals
const mainMenuModal = document.getElementById('mainMenuModal');
const startMissionBtn = document.getElementById('startMissionBtn');
const vrButtonContainer = document.getElementById('vrButtonContainer');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNumber = document.getElementById('countdownNumber');
const pauseModal = document.getElementById('pauseModal');
const resumeBtn = document.getElementById('resumeBtn');
const restartMissionBtn = document.getElementById('restartMissionBtn');
const quitToMenuBtn = document.getElementById('quitToMenuBtn');
const gameOverModal = document.getElementById('gameOverModal');
const gameOverReason = document.getElementById('gameOverReason');
const failScore = document.getElementById('failScore');
const failProgress = document.getElementById('failProgress');
const failTopSpeed = document.getElementById('failTopSpeed');
const retryMissionBtn = document.getElementById('retryMissionBtn');
const failMenuBtn = document.getElementById('failMenuBtn');
const victoryModal = document.getElementById('victoryModal');
const victoryRank = document.getElementById('victoryRank');
const newRecordTag = document.getElementById('newRecordTag');
const victoryScore = document.getElementById('victoryScore');
const victoryTime = document.getElementById('victoryTime');
const victoryCombo = document.getElementById('victoryCombo');
const victoryShield = document.getElementById('victoryShield');
const playAgainBtn = document.getElementById('playAgainBtn');
const victoryMenuBtn = document.getElementById('victoryMenuBtn');

// High score tags in menu
const circuitHighScore = document.getElementById('circuitHighScore');
const dataHuntHighScore = document.getElementById('dataHuntHighScore');

// Mobile Controls
const mobileControls = document.getElementById('mobileControls');
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  mobileControls.classList.remove('hidden');
}

// ---------------------------------------------------------------------------
// Renderer & WebXR Setup (High Clarity & Visibility)
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.65; // Boosted exposure for crystal-clear visibility
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ---------------------------------------------------------------------------
// Scene, Fog & Vivid Cyberpunk Lighting
// ---------------------------------------------------------------------------
const scene = new THREE.Scene();
// Clear, non-oppressive atmospheric night fog (visibility 180m+)
scene.fog = new THREE.FogExp2(0x0a1428, 0.007);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 600);
camera.position.set(0, 16, 16);

// 1. Broad Hemispheric Ambient Sky/Ground Light
const hemiLight = new THREE.HemisphereLight(0x6699dd, 0x1a283e, 2.6);
scene.add(hemiLight);

// 2. High-Clarity Ambient Light
const ambient = new THREE.AmbientLight(0x405578, 2.2);
scene.add(ambient);

// 3. Electric Cyan Key Moonlight
const moonLight = new THREE.DirectionalLight(0x55eeff, 3.4);
moonLight.position.set(70, 140, 70);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 1024;
moonLight.shadow.mapSize.height = 1024;
scene.add(moonLight);

// 4. Vibrant Magenta Rim Light
const pinkRimLight = new THREE.DirectionalLight(0xff3388, 3.0);
pinkRimLight.position.set(-70, 60, -70);
scene.add(pinkRimLight);

// 5. Warm Amber Street Glow
const warmFillLight = new THREE.DirectionalLight(0xffaa22, 1.4);
warmFillLight.position.set(0, -30, 0);
scene.add(warmFillLight);

// ---------------------------------------------------------------------------
// Game Systems Initialization
// ---------------------------------------------------------------------------
const { cityGroup, colliders } = createCyberpunkCityGroup();
scene.add(cityGroup);

const vehicleGroup = createHoverVehicle();
vehicleGroup.position.set(0, 14, 10);
scene.add(vehicleGroup);

const particleSystem = new ParticleSystem(scene);
const collisionSystem = new CollisionSystem(colliders, particleSystem);
const boundaryWalls = new BoundaryWalls(scene);
const cyberTraffic = new CyberTrafficSystem(scene, particleSystem);
const gameManager = new GameManager(scene, particleSystem, collisionSystem);
const spatialCockpit = new SpatialCockpit(vehicleGroup, camera);

// Atmospheric Neon Rain & Mist Particle Weather
const RAIN_COUNT = 750;
const rainGeo = new THREE.BufferGeometry();
const rainPositions = new Float32Array(RAIN_COUNT * 3);
const rainSpeeds = new Float32Array(RAIN_COUNT);

for (let i = 0; i < RAIN_COUNT; i++) {
  rainPositions[i * 3] = (Math.random() - 0.5) * 140;
  rainPositions[i * 3 + 1] = Math.random() * 70;
  rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 140;
  rainSpeeds[i] = 1.6 + Math.random() * 1.0;
}

rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
const rainMat = new THREE.PointsMaterial({
  color: 0x00f0ff,
  size: 0.16,
  transparent: true,
  opacity: 0.65,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const rainParticles = new THREE.Points(rainGeo, rainMat);
scene.add(rainParticles);

// ---------------------------------------------------------------------------
// Vehicle Physics & Controls State (100% Player Controlled)
// ---------------------------------------------------------------------------
const vehicleState = {
  speed: 0,            // Starts at 0 km/h (Stationary until W pressed)
  maxSpeed: 85,
  acceleration: 55,
  friction: 0.95,      // Decelerates smoothly when W is released
  yawSpeed: 0,
  rollAngle: 0,
  pitchAngle: 0,
  nitroEnergy: 100,
  isNitroActive: false,
  cameraMode: 'chase'  // Third-person Chase Cam default
};

const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
  nitro: false
};

// Keyboard listener
window.addEventListener('keydown', (e) => {
  initSynthwaveAudio();
  resumeAudio();

  const code = e.code;
  if (code === 'KeyW' || code === 'ArrowUp') keys.forward = true;
  if (code === 'KeyS' || code === 'ArrowDown') keys.backward = true;
  if (code === 'KeyA' || code === 'ArrowLeft') keys.left = true;
  if (code === 'KeyD' || code === 'ArrowRight') keys.right = true;
  if (code === 'Space') keys.up = true;
  if (code === 'ShiftLeft' || code === 'ShiftRight') keys.down = true;
  if (code === 'KeyN') triggerNitro();
  if (code === 'KeyC') cycleCamera();
  if (code === 'KeyM') toggleMute();
  if (code === 'Escape' || code === 'KeyP') togglePause();
});

window.addEventListener('keyup', (e) => {
  const code = e.code;
  if (code === 'KeyW' || code === 'ArrowUp') keys.forward = false;
  if (code === 'KeyS' || code === 'ArrowDown') keys.backward = false;
  if (code === 'KeyA' || code === 'ArrowLeft') keys.left = false;
  if (code === 'KeyD' || code === 'ArrowRight') keys.right = false;
  if (code === 'Space') keys.up = false;
  if (code === 'ShiftLeft' || code === 'ShiftRight') keys.down = false;
});

// Mobile Touch Listeners
function bindTouch(btnId, keyName) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyName] = true; initSynthwaveAudio(); resumeAudio(); });
  btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyName] = false; });
  btn.addEventListener('mousedown', () => { keys[keyName] = true; initSynthwaveAudio(); resumeAudio(); });
  btn.addEventListener('mouseup', () => { keys[keyName] = false; });
}
bindTouch('touchUp', 'forward');
bindTouch('touchDown', 'backward');
bindTouch('touchLeft', 'left');
bindTouch('touchRight', 'right');
bindTouch('touchAscend', 'up');
bindTouch('touchDescend', 'down');

const touchNitro = document.getElementById('touchNitro');
if (touchNitro) {
  touchNitro.addEventListener('touchstart', (e) => { e.preventDefault(); triggerNitro(); });
  touchNitro.addEventListener('click', () => triggerNitro());
}

function triggerNitro() {
  if (vehicleState.nitroEnergy > 20 && !vehicleState.isNitroActive) {
    vehicleState.isNitroActive = true;
    playNitroSound();
    particleSystem.addCameraShake(0.4);
    SpatialCockpit.triggerHaptic(renderer, 240, 0.7);
  }
}

// Bind WebXR dual-rumble haptic events
collisionSystem.onImpact = () => SpatialCockpit.triggerHaptic(renderer, 220, 0.85);
gameManager.onCheckpointCaptured = () => SpatialCockpit.triggerHaptic(renderer, 90, 0.55);

function toggleMute() {
  const muted = toggleAudioMute();
  audioIcon.textContent = muted ? '🔇' : '🔊';
}

function togglePause() {
  if (gameManager.state === GAME_STATES.PLAYING) {
    gameManager.state = GAME_STATES.PAUSED;
    pauseModal.classList.remove('hidden');
  } else if (gameManager.state === GAME_STATES.PAUSED) {
    gameManager.state = GAME_STATES.PLAYING;
    pauseModal.classList.add('hidden');
  }
}

function cycleCamera() {
  const modes = ['chase', 'cockpit', 'skyline'];
  const nextIdx = (modes.indexOf(vehicleState.cameraMode) + 1) % modes.length;
  setCameraMode(modes[nextIdx]);
}

function setCameraMode(mode) {
  vehicleState.cameraMode = mode;
  document.querySelectorAll('.preset-cam-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cam === mode);
  });
}

// ---------------------------------------------------------------------------
// WebXR VR Controllers Polling
// ---------------------------------------------------------------------------
function pollVRControllers() {
  const session = renderer.xr.getSession();
  if (!session) return;

  for (const source of session.inputSources) {
    if (source.gamepad) {
      const gp = source.gamepad;
      const axes = gp.axes;
      if (axes.length >= 2) {
        if (Math.abs(axes[0]) > 0.12) {
          vehicleState.yawSpeed = -axes[0] * 1.8;
          vehicleState.rollAngle = -axes[0] * 0.45;
        }
        if (axes[1] < -0.2) keys.forward = true;
        else if (axes[1] > 0.2) keys.backward = true;
      }
      if (gp.buttons) {
        if (gp.buttons[0] && gp.buttons[0].pressed) keys.forward = true;
        if (gp.buttons[1] && gp.buttons[1].pressed) keys.backward = true;
        if (gp.buttons[4] && gp.buttons[4].pressed) triggerNitro();
        if (gp.buttons[5] && gp.buttons[5].pressed) keys.up = true;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// UI & Menu Interactions
// ---------------------------------------------------------------------------
let selectedMode = GAME_MODES.CIRCUIT;

document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedMode = card.dataset.mode;
  });
});

function updateMenuHighScores() {
  if (gameManager.highScores) {
    circuitHighScore.textContent = `BEST: ${(gameManager.highScores.circuit || 0).toLocaleString()} PTS`;
    dataHuntHighScore.textContent = `BEST: ${(gameManager.highScores.data_hunt || 0).toLocaleString()} PTS`;
  }
}
updateMenuHighScores();

function startFlightGame(mode) {
  initSynthwaveAudio();
  resumeAudio();
  mainMenuModal.classList.add('hidden');
  gameOverModal.classList.add('hidden');
  victoryModal.classList.add('hidden');
  pauseModal.classList.add('hidden');

  // Reset Vehicle Position facing the first ring at 0 speed (idle)
  vehicleGroup.position.set(0, 14, 10);
  vehicleGroup.rotation.set(0, 0, 0);
  vehicleState.speed = 0; // Starts stationary!
  vehicleState.nitroEnergy = 100;
  vehicleState.isNitroActive = false;

  currentModeTag.textContent = mode.toUpperCase().replace('_', ' ');

  gameManager.startMission(mode);
}

startMissionBtn.addEventListener('click', () => startFlightGame(selectedMode));
retryMissionBtn.addEventListener('click', () => startFlightGame(gameManager.mode));
playAgainBtn.addEventListener('click', () => startFlightGame(gameManager.mode));
restartMissionBtn.addEventListener('click', () => startFlightGame(gameManager.mode));

resumeBtn.addEventListener('click', () => {
  gameManager.state = GAME_STATES.PLAYING;
  pauseModal.classList.add('hidden');
});

function returnToMenu() {
  gameManager.state = GAME_STATES.MENU;
  pauseModal.classList.add('hidden');
  gameOverModal.classList.add('hidden');
  victoryModal.classList.add('hidden');
  mainMenuModal.classList.remove('hidden');
  updateMenuHighScores();
}

quitToMenuBtn.addEventListener('click', returnToMenu);
failMenuBtn.addEventListener('click', returnToMenu);
victoryMenuBtn.addEventListener('click', returnToMenu);

audioBtn.addEventListener('click', () => {
  initSynthwaveAudio();
  resumeAudio();
  toggleMute();
});

pauseBtn.addEventListener('click', togglePause);
nitroQuickBtn.addEventListener('click', triggerNitro);

document.querySelectorAll('.preset-cam-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    setCameraMode(e.currentTarget.dataset.cam);
  });
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------------------
// Camera Modes Update with Dynamic FOV, Distance Warping & Vibration
// ---------------------------------------------------------------------------
function updateCamera(dt) {
  const shake = particleSystem.shakeOffset;
  const speedRatio = Math.abs(vehicleState.speed) / vehicleState.maxSpeed;

  if (vehicleState.cameraMode === 'cockpit') {
    const targetPos = vehicleGroup.position.clone().add(
      new THREE.Vector3(0, 0.35, -0.1).applyQuaternion(vehicleGroup.quaternion)
    );
    targetPos.add(shake);
    camera.position.copy(targetPos);
    camera.quaternion.copy(vehicleGroup.quaternion);
  } else if (vehicleState.cameraMode === 'chase') {
    // Dynamic chase camera elevation and trailing distance
    const distY = 2.0 + (vehicleState.isNitroActive ? 0.6 : speedRatio * 0.35);
    const distZ = 5.2 + (vehicleState.isNitroActive ? 1.6 : speedRatio * 0.85);

    const offset = new THREE.Vector3(0, distY, distZ).applyQuaternion(vehicleGroup.quaternion);
    const targetCamPos = vehicleGroup.position.clone().add(offset).add(shake);
    camera.position.lerp(targetCamPos, dt * 9);

    const lookTarget = vehicleGroup.position.clone().add(
      new THREE.Vector3(0, 0.5, -6).applyQuaternion(vehicleGroup.quaternion)
    );
    camera.lookAt(lookTarget);
  } else if (vehicleState.cameraMode === 'skyline') {
    const t = performance.now() * 0.0003;
    camera.position.set(
      vehicleGroup.position.x + Math.sin(t) * 28,
      vehicleGroup.position.y + 18,
      vehicleGroup.position.z + Math.cos(t) * 28
    );
    camera.position.add(shake);
    camera.lookAt(vehicleGroup.position);
  }

  // Dynamic FOV Warp (60° idle ➔ 76° top speed ➔ 92° Nitro Warp)
  const targetFov = vehicleState.isNitroActive ? 92 : 60 + speedRatio * 16.0;
  camera.fov += (targetFov - camera.fov) * dt * 7.0;
  camera.updateProjectionMatrix();
}

// ---------------------------------------------------------------------------
// HUD Sync & UI Updates
// ---------------------------------------------------------------------------
function updateHUD(dt) {
  // 1. Countdown Display
  if (gameManager.state === GAME_STATES.COUNTDOWN) {
    countdownOverlay.classList.remove('hidden');
    const step = Math.ceil(gameManager.countdownTimer);
    countdownNumber.textContent = step > 0 ? `${step}` : 'GO!';
  } else {
    countdownOverlay.classList.add('hidden');
  }

  // 2. Modals Status
  if (gameManager.state === GAME_STATES.GAME_OVER && gameOverModal.classList.contains('hidden')) {
    gameOverReason.textContent = gameManager.failReason || 'HULL DESTROYED';
    failScore.textContent = gameManager.score.toLocaleString();
    failProgress.textContent = gameManager.mode === GAME_MODES.CIRCUIT
      ? `${gameManager.ringsPassed} / ${gameManager.totalRings}`
      : `${gameManager.coresCollected} / ${gameManager.totalCores}`;
    failTopSpeed.textContent = `${Math.round(gameManager.topSpeed)} KM/H`;
    gameOverModal.classList.remove('hidden');
  }

  if (gameManager.state === GAME_STATES.VICTORY && victoryModal.classList.contains('hidden')) {
    victoryRank.textContent = gameManager.calculateGrade();
    victoryScore.textContent = gameManager.score.toLocaleString();
    const mins = Math.floor(gameManager.timeRemaining / 60);
    const secs = (gameManager.timeRemaining % 60).toFixed(1);
    victoryTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
    victoryCombo.textContent = `x${gameManager.combo}`;
    victoryShield.textContent = `${Math.round(collisionSystem.shield)}%`;
    newRecordTag.classList.toggle('hidden', !gameManager.isNewRecord);
    victoryModal.classList.remove('hidden');
  }

  // 3. Telemetry Panel
  const currentKmh = Math.abs(vehicleState.speed) * 2.5;
  speedText.textContent = `${Math.round(currentKmh).toString().padStart(3, '0')}`;
  altText.textContent = `ALT: ${Math.round(vehicleGroup.position.y)} M`;

  // Shield
  const shieldPct = Math.max(0, Math.min(100, collisionSystem.shield));
  shieldFill.style.width = `${shieldPct}%`;
  shieldPctText.textContent = `${Math.round(shieldPct)}%`;
  if (shieldPct > 50) {
    shieldFill.style.background = 'linear-gradient(90deg, #00ff88, #00f0ff)';
  } else if (shieldPct > 25) {
    shieldFill.style.background = 'linear-gradient(90deg, #ffaa00, #ff5500)';
  } else {
    shieldFill.style.background = 'linear-gradient(90deg, #ff0055, #ff0000)';
  }

  // Nitro
  nitroFill.style.width = `${vehicleState.nitroEnergy}%`;

  // 4. Mission Top Bar
  scoreVal.textContent = gameManager.score.toLocaleString();
  streakText.textContent = `x${gameManager.combo}`;
  streakBadge.style.transform = gameManager.combo > 1 ? `scale(${1 + gameManager.combo * 0.08})` : 'scale(1)';

  if (gameManager.mode === GAME_MODES.CIRCUIT) {
    objectiveLabel.textContent = 'TARGET RING';
    objectiveVal.textContent = `${(gameManager.currentRingIdx + 1).toString().padStart(2, '0')} / ${gameManager.totalRings}`;
  } else if (gameManager.mode === GAME_MODES.DATA_HUNT) {
    objectiveLabel.textContent = 'DATA CORES';
    objectiveVal.textContent = `${gameManager.coresCollected.toString().padStart(2, '0')} / ${gameManager.totalCores}`;
  } else {
    objectiveLabel.textContent = 'FREE FLIGHT';
    objectiveVal.textContent = `CRUISE`;
  }

  const mins = Math.floor(gameManager.timeRemaining / 60);
  const secs = (gameManager.timeRemaining % 60).toFixed(1);
  timerVal.textContent = gameManager.mode === GAME_MODES.FREE_ROAM ? '∞' : `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
  distanceVal.textContent = `${Math.round(gameManager.targetDistance)} M`;

  // 5. Waypoint Reticle & Screen-Edge Pointer
  if (gameManager.state === GAME_STATES.PLAYING) {
    const nav = gameManager.targetScreenPos;
    if (nav.isOnScreen) {
      targetBracket.classList.remove('hidden');
      offscreenPointer.classList.add('hidden');
      targetBracket.style.left = `${nav.x}px`;
      targetBracket.style.top = `${nav.y}px`;
      bracketDist.textContent = `${Math.round(gameManager.targetDistance)}m`;
    } else {
      targetBracket.classList.add('hidden');
      offscreenPointer.classList.remove('hidden');
      offscreenPointer.style.left = `${nav.x}px`;
      offscreenPointer.style.top = `${nav.y}px`;
      offscreenPointer.style.transform = `translate(-50%, -50%) rotate(${nav.angle}rad)`;
      offscreenDist.textContent = `${Math.round(gameManager.targetDistance)}m`;
    }
  } else {
    targetBracket.classList.add('hidden');
    offscreenPointer.classList.add('hidden');
  }

  // 6. Alert Banners
  if (boundaryWalls.isNearBoundary) {
    hudAlertBanner.classList.remove('hidden');
    alertText.textContent = 'WARNING: PERIMETER FORCEFIELD';
  } else if (collisionSystem.shield < 25 && !collisionSystem.isDead) {
    hudAlertBanner.classList.remove('hidden');
    alertText.textContent = 'SHIELDS CRITICAL!';
  } else {
    hudAlertBanner.classList.add('hidden');
  }

  // 7. In-Cockpit Spatial HUD (VR)
  const objText = gameManager.mode === GAME_MODES.CIRCUIT
    ? `RING ${(gameManager.currentRingIdx + 1).toString().padStart(2, '0')}/${gameManager.totalRings}`
    : `CORE ${gameManager.coresCollected}/${gameManager.totalCores}`;
  spatialCockpit.updateHUD(
    currentKmh,
    vehicleGroup.position.y,
    vehicleState.nitroEnergy,
    shieldPct,
    gameManager.score,
    gameManager.combo,
    objText,
    gameManager.targetDistance,
    gameManager.targetPosition
  );

  // 8. In-Cockpit 3D Flight Controls Animation (VR)
  const speedRatio = Math.abs(vehicleState.speed) / vehicleState.maxSpeed;
  spatialCockpit.updateControlsVisuals(
    speedRatio,
    vehicleState.yawSpeed,
    vehicleState.rollAngle,
    vehicleGroup.rotation.x,
    vehicleState.isNitroActive
  );
}

// ---------------------------------------------------------------------------
// Main Game Animation Loop (100% User Controlled Throttle)
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);

  // Poll VR Gamepads
  pollVRControllers();

  // 1. Vehicle Steering & Flight Physics
  if (gameManager.state === GAME_STATES.PLAYING || gameManager.state === GAME_STATES.MENU) {
    let targetMaxSpeed = vehicleState.isNitroActive ? 180 : vehicleState.maxSpeed;

    // 100% User Controlled Throttle with Smooth Inertia
    if (keys.forward) {
      vehicleState.speed = THREE.MathUtils.lerp(vehicleState.speed, targetMaxSpeed, dt * 3.0);
    } else if (keys.backward) {
      // Active air brake
      vehicleState.speed = THREE.MathUtils.lerp(vehicleState.speed, -15, dt * 4.0);
    } else {
      // Natural deceleration to stop when W is released
      vehicleState.speed *= vehicleState.friction;
      if (Math.abs(vehicleState.speed) < 0.1) vehicleState.speed = 0;
    }

    // Snappy Steering with Aerodynamic Banking (A/D or Arrows)
    let steerX = 0;
    if (keys.left) steerX += 1.85;
    if (keys.right) steerX -= 1.85;

    if (steerX !== 0) {
      vehicleState.yawSpeed = THREE.MathUtils.lerp(vehicleState.yawSpeed, steerX, dt * 8.5);
      vehicleState.rollAngle = THREE.MathUtils.lerp(vehicleState.rollAngle, steerX * 0.32, dt * 8.5);
    } else {
      vehicleState.yawSpeed *= 0.76;
      vehicleState.rollAngle *= 0.76;
    }

    // Vertical Altitude Lift & Dynamic Pitch (Space / Shift)
    let lift = 0;
    if (keys.up) lift += 16;
    if (keys.down) lift -= 16;

    if (lift !== 0) {
      vehicleGroup.position.y = THREE.MathUtils.clamp(vehicleGroup.position.y + lift * dt, 2.0, 100);
      vehicleGroup.rotation.x = THREE.MathUtils.lerp(vehicleGroup.rotation.x, (lift > 0 ? -0.18 : 0.18), dt * 6);
    } else {
      // Subtle nose-down on forward acceleration
      const accelPitch = keys.forward ? -0.04 : 0;
      vehicleGroup.rotation.x = THREE.MathUtils.lerp(vehicleGroup.rotation.x, accelPitch, dt * 5);
    }

    // Apply Rotation & Forward Vector
    vehicleGroup.rotation.y += vehicleState.yawSpeed * dt;
    vehicleGroup.rotation.z = vehicleState.rollAngle;

    const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(vehicleGroup.quaternion);
    vehicleGroup.position.addScaledVector(forwardVector, vehicleState.speed * dt);

    // Nitro Energy Discharge / Recharge
    if (vehicleState.isNitroActive) {
      vehicleState.nitroEnergy = Math.max(0, vehicleState.nitroEnergy - dt * 35);
      if (vehicleState.nitroEnergy === 0) vehicleState.isNitroActive = false;
    } else {
      vehicleState.nitroEnergy = Math.min(100, vehicleState.nitroEnergy + dt * 16);
    }
  }

  const speedRatio = Math.abs(vehicleState.speed) / vehicleState.maxSpeed;

  // 2. Collision Physics Check against Buildings & Bridges
  collisionSystem.checkCollisions(vehicleGroup, vehicleState, dt);

  // 3. Boundary Forcefield Repulsion & Limit Enforcement
  boundaryWalls.update(vehicleGroup, vehicleState, particleSystem, dt);

  // 4. Cyber Traffic & Security Drone Obstacles
  cyberTraffic.update(vehicleGroup, vehicleState, collisionSystem, dt);

  // 5. Game Objectives, Rings, Data Cores & Navigation
  gameManager.update(vehicleGroup, vehicleState, camera, dt);

  // 6. Particles, Thruster Plasma Trails & Optical Streaks Update
  const leftNacellePos = vehicleGroup.position.clone().add(new THREE.Vector3(-0.42, 0.04, 1.8).applyQuaternion(vehicleGroup.quaternion));
  const rightNacellePos = vehicleGroup.position.clone().add(new THREE.Vector3(0.42, 0.04, 1.8).applyQuaternion(vehicleGroup.quaternion));
  particleSystem.emitThrusterTrail(leftNacellePos, rightNacellePos, vehicleState.isNitroActive, speedRatio);
  particleSystem.update(dt, vehicleGroup.position, vehicleGroup.quaternion, speedRatio, vehicleState.isNitroActive);

  // 7. Audio Engine Frequency & Pitch Update
  updateEnginePitch(speedRatio);

  // 8. Thruster Plasma Flame Dynamic Flare & Color Shift
  const leftPlasma = vehicleGroup.getObjectByName('leftPlasma');
  const rightPlasma = vehicleGroup.getObjectByName('rightPlasma');
  if (leftPlasma && rightPlasma) {
    const scaleY = vehicleState.isNitroActive ? 3.2 : 0.3 + speedRatio * 1.4;
    leftPlasma.scale.set(1, scaleY, 1);
    rightPlasma.scale.set(1, scaleY, 1);
    leftPlasma.material.color.setHex(vehicleState.isNitroActive ? 0xff00bb : 0x00ffff);
    rightPlasma.material.color.setHex(vehicleState.isNitroActive ? 0xff00bb : 0x00ffff);
  }

  // 9. Rain Weather Follow Player
  const posAttr = rainGeo.attributes.position;
  for (let i = 0; i < RAIN_COUNT; i++) {
    let y = posAttr.getY(i) - rainSpeeds[i];
    if (y < -5) y = 70;
    posAttr.setY(i, y);
  }
  posAttr.needsUpdate = true;
  rainParticles.position.copy(vehicleGroup.position);

  // 10. Camera Position, Dynamic FOV Warping & Shake
  updateCamera(dt);

  // 11. HUD Telemetry & Navigation Sync
  updateHUD(dt);

  // 12. Render WebGL Scene
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------------------
// Boot WebXR VR Button & Animation Loop
// ---------------------------------------------------------------------------
renderer.setAnimationLoop(animate);
vrButtonContainer.appendChild(VRButton.createButton(renderer));
