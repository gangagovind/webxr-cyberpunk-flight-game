/**
 * Core Game Manager & Objective System for "Cyberpunk 2099: Metropolis".
 * Manages game modes (Circuit Time Attack, Data Hunt, Free Roam), 3D neon rings, collectibles,
 * magnetic slipstream assist, 3D laser racing guides, scoring combos, timers, and navigation.
 */

import * as THREE from 'three';
import {
  playRingSound,
  playDataCoreSound,
  playCountdownBeep,
  playVictorySound,
  playGameOverSound,
  setMusicIntensity
} from './synthwaveAudio.js';

export const GAME_MODES = {
  CIRCUIT: 'circuit',
  DATA_HUNT: 'data_hunt',
  FREE_ROAM: 'free_roam'
};

export const GAME_STATES = {
  MENU: 'menu',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
  VICTORY: 'victory'
};

export class GameManager {
  constructor(scene, particleSystem, collisionSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;
    this.collisionSystem = collisionSystem;

    this.mode = GAME_MODES.CIRCUIT;
    this.state = GAME_STATES.MENU;

    // Flight Assist Settings
    this.magneticAssist = true; // Magnetic slipstream pull near rings
    this.assistStrength = 9.0;

    // Gameplay Metrics
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.comboMaxDuration = 8.0; // Generous combo timer
    this.timeRemaining = 90.0;   // Generous starting time
    this.elapsedTime = 0.0;
    this.topSpeed = 0;
    this.ringsPassed = 0;
    this.totalRings = 20;
    this.coresCollected = 0;
    this.totalCores = 15;

    // Countdown State
    this.countdownTimer = 3;
    this.countdownStep = 3;

    // 3D Rings & Collectibles
    this.ringsGroup = new THREE.Group();
    this.ringsGroup.name = 'objective-rings';
    this.scene.add(this.ringsGroup);

    this.coresGroup = new THREE.Group();
    this.coresGroup.name = 'objective-cores';
    this.scene.add(this.coresGroup);

    // 3D Laser Flight Path Guide Line
    this.initFlightPathGuide();

    this.rings = [];
    this.currentRingIdx = 0;
    this.cores = [];

    // Target Navigation Vector
    this.targetPosition = new THREE.Vector3();
    this.targetDistance = 0;
    this.targetScreenPos = { x: 0, y: 0, isOnScreen: true, angle: 0 };

    this.initRingsCourse();
    this.initDataCores();
    this.loadHighScores();
  }

  /**
   * Laser Flight Path line connecting rings
   */
  initFlightPathGuide() {
    this.guideGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(60 * 3);
    this.guideGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const guideMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.guideLine = new THREE.Line(this.guideGeo, guideMat);
    this.scene.add(this.guideLine);
  }

  /**
   * Initializes the 20-Ring Acrobatic Circuit Course with extra large radius
   */
  initRingsCourse() {
    const ringWaypoints = [
      { pos: new THREE.Vector3(0, 14, -25), rotY: 0 },
      { pos: new THREE.Vector3(0, 18, -65), rotY: 0 },
      // Slalom right between skyscrapers
      { pos: new THREE.Vector3(16, 24, -95), rotY: -0.3 },
      { pos: new THREE.Vector3(26, 32, -60), rotY: -1.6 },
      // Dive under skybridge
      { pos: new THREE.Vector3(8, 22, -30), rotY: -2.7 },
      { pos: new THREE.Vector3(-14, 18, 0), rotY: 2.5 },
      // Climb high over southern highway
      { pos: new THREE.Vector3(-22, 38, 45), rotY: 1.4 },
      { pos: new THREE.Vector3(0, 48, 80), rotY: 0.7 },
      // Loop over skyscraper spire
      { pos: new THREE.Vector3(22, 56, 95), rotY: 0.2 },
      { pos: new THREE.Vector3(38, 44, 60), rotY: -1.1 },
      // Eastern avenue canyon
      { pos: new THREE.Vector3(35, 24, 10), rotY: -2.3 },
      { pos: new THREE.Vector3(18, 16, -15), rotY: -2.9 },
      // High speed straight under multiple bridges
      { pos: new THREE.Vector3(0, 20, -50), rotY: 0 },
      { pos: new THREE.Vector3(-22, 28, -80), rotY: 0.5 },
      { pos: new THREE.Vector3(-38, 36, -50), rotY: 1.6 },
      // Western skyscraper slalom
      { pos: new THREE.Vector3(-35, 26, 0), rotY: 2.5 },
      { pos: new THREE.Vector3(-22, 20, 40), rotY: 2.0 },
      // High altitude corkscrew dive
      { pos: new THREE.Vector3(0, 52, 60), rotY: 0 },
      { pos: new THREE.Vector3(0, 30, 10), rotY: 0 },
      // Final grand finish gate
      { pos: new THREE.Vector3(0, 16, -35), rotY: 0, isFinish: true }
    ];

    this.totalRings = ringWaypoints.length;

    ringWaypoints.forEach((wp, idx) => {
      const ringGroup = new THREE.Group();
      ringGroup.position.copy(wp.pos);
      ringGroup.rotation.y = wp.rotY;

      // Outer Torus Ring Geometry (Enlarged for accessible arcade feel)
      const ringRadius = wp.isFinish ? 6.5 : 5.2;
      const torusGeo = new THREE.TorusGeometry(ringRadius, 0.28, 16, 32);
      const torusMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 2.2,
        roughness: 0.2,
        metalness: 0.8
      });
      const torus = new THREE.Mesh(torusGeo, torusMat);
      ringGroup.add(torus);

      // Inner Glowing Holographic Ring
      const innerTorusGeo = new THREE.TorusGeometry(ringRadius * 0.88, 0.1, 8, 32);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0xff0077,
        transparent: true,
        opacity: 0.85
      });
      const innerTorus = new THREE.Mesh(innerTorusGeo, innerMat);
      ringGroup.add(innerTorus);

      // Rotating Chevrons
      const chevronGroup = new THREE.Group();
      for (let c = 0; c < 4; c++) {
        const chevGeo = new THREE.BoxGeometry(0.7, 0.2, 0.2);
        const chevMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const chev = new THREE.Mesh(chevGeo, chevMat);
        const angle = (c * Math.PI) / 2;
        chev.position.set(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0);
        chev.rotation.z = angle;
        chevronGroup.add(chev);
      }
      ringGroup.add(chevronGroup);

      // Finish Gate special styling
      if (wp.isFinish) {
        torusMat.color.setHex(0xffaa00);
        torusMat.emissive.setHex(0xffaa00);
        torus.scale.set(1.2, 1.2, 1.2);
      }

      this.ringsGroup.add(ringGroup);

      this.rings.push({
        group: ringGroup,
        torus,
        innerTorus,
        chevronGroup,
        torusMat,
        position: wp.pos,
        rotation: ringGroup.quaternion,
        radius: ringRadius + 3.0, // Generous 8.2m - 9.5m capture radius!
        passed: false,
        isFinish: !!wp.isFinish,
        index: idx
      });
    });

    this.updateRingVisuals();
  }

  /**
   * Initializes Data Cores scattered across city for Data Hunt Mode
   */
  initDataCores() {
    const coreLocations = [
      new THREE.Vector3(0, 26, -90),
      new THREE.Vector3(0, 38, -35),
      new THREE.Vector3(0, 30, 25),
      new THREE.Vector3(0, 50, 85),
      new THREE.Vector3(30, 65, -50),
      new THREE.Vector3(-30, 70, 50),
      new THREE.Vector3(50, 55, 30),
      new THREE.Vector3(-50, 60, -30),
      new THREE.Vector3(18, 20, 0),
      new THREE.Vector3(-18, 22, -40),
      new THREE.Vector3(38, 28, 80),
      new THREE.Vector3(-38, 30, -80),
      new THREE.Vector3(0, 75, 0),
      new THREE.Vector3(60, 35, -90),
      new THREE.Vector3(-60, 35, 90)
    ];

    this.totalCores = coreLocations.length;

    coreLocations.forEach((pos, idx) => {
      const coreGroup = new THREE.Group();
      coreGroup.position.copy(pos);

      // Rotating Octahedron Crystal (Larger for visibility)
      const octGeo = new THREE.OctahedronGeometry(1.6, 0);
      const octMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 2.8,
        roughness: 0.1,
        metalness: 0.9
      });
      const crystal = new THREE.Mesh(octGeo, octMat);
      coreGroup.add(crystal);

      // Orbiting Energy Ring
      const ringGeo = new THREE.TorusGeometry(2.4, 0.08, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0077 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      coreGroup.add(ring);

      this.coresGroup.add(coreGroup);

      this.cores.push({
        group: coreGroup,
        crystal,
        ring,
        position: pos,
        collected: false,
        baseY: pos.y,
        idx
      });
    });
  }

  /**
   * Starts a chosen game mode
   */
  startMission(mode = GAME_MODES.CIRCUIT) {
    this.mode = mode;
    this.state = GAME_STATES.COUNTDOWN;
    this.countdownTimer = 3.2;
    this.countdownStep = 3;

    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.elapsedTime = 0;
    this.ringsPassed = 0;
    this.currentRingIdx = 0;
    this.coresCollected = 0;
    this.topSpeed = 0;

    if (mode === GAME_MODES.CIRCUIT) {
      this.timeRemaining = 90.0; // Generous 90s starting time
      this.ringsGroup.visible = true;
      this.coresGroup.visible = false;
      this.guideLine.visible = true;
      this.rings.forEach(r => (r.passed = false));
      this.updateRingVisuals();
    } else if (mode === GAME_MODES.DATA_HUNT) {
      this.timeRemaining = 150.0; // Generous 150s starting time
      this.ringsGroup.visible = false;
      this.coresGroup.visible = true;
      this.guideLine.visible = false;
      this.cores.forEach(c => {
        c.collected = false;
        c.group.visible = true;
      });
    } else {
      // FREE ROAM
      this.timeRemaining = 9999;
      this.ringsGroup.visible = true;
      this.coresGroup.visible = true;
      this.guideLine.visible = true;
      this.rings.forEach(r => (r.passed = false));
    }

    this.collisionSystem.reset();
    playCountdownBeep(false);
  }

  /**
   * Updates visual appearance of active, next, and completed rings
   */
  updateRingVisuals() {
    this.rings.forEach((ring, idx) => {
      if (ring.passed) {
        ring.group.visible = false;
      } else if (idx === this.currentRingIdx) {
        // ACTIVE TARGET RING
        ring.group.visible = true;
        ring.torusMat.color.setHex(ring.isFinish ? 0xffaa00 : 0x00f0ff);
        ring.torusMat.emissive.setHex(ring.isFinish ? 0xffaa00 : 0x00f0ff);
        ring.torusMat.emissiveIntensity = 4.0;
        ring.group.scale.set(1.1, 1.1, 1.1);
      } else if (idx === this.currentRingIdx + 1) {
        // UPCOMING RING (Semi-transparent)
        ring.group.visible = true;
        ring.torusMat.color.setHex(0x3388bb);
        ring.torusMat.emissive.setHex(0x114477);
        ring.torusMat.emissiveIntensity = 1.5;
        ring.group.scale.set(0.95, 0.95, 0.95);
      } else {
        // Far ahead rings (faded out)
        ring.group.visible = idx < this.currentRingIdx + 5;
        ring.torusMat.color.setHex(0x223344);
        ring.torusMat.emissive.setHex(0x081525);
        ring.torusMat.emissiveIntensity = 0.6;
      }
    });
  }

  /**
   * Frame update for all objectives, timers, navigation, and scoring
   */
  update(vehicleGroup, vehicleState, camera, dt) {
    if (this.state === GAME_STATES.PAUSED || this.state === GAME_STATES.MENU) {
      return;
    }

    // 1. Countdown Sequence
    if (this.state === GAME_STATES.COUNTDOWN) {
      this.countdownTimer -= dt;
      const step = Math.ceil(this.countdownTimer);
      if (step > 0 && step !== this.countdownStep) {
        this.countdownStep = step;
        playCountdownBeep(false);
      }
      if (this.countdownTimer <= 0) {
        this.state = GAME_STATES.PLAYING;
        playCountdownBeep(true);
      }
      return;
    }

    // 2. Playing State Updates
    if (this.state === GAME_STATES.PLAYING) {
      this.elapsedTime += dt;
      if (this.mode !== GAME_MODES.FREE_ROAM) {
        this.timeRemaining = Math.max(0, this.timeRemaining - dt);
        if (this.timeRemaining <= 0) {
          this.triggerGameOver('TIME LIMIT EXPIRED');
          return;
        }
      }

      // Track top speed
      const currentKmh = Math.abs(vehicleState.speed) * 2.5;
      if (currentKmh > this.topSpeed) this.topSpeed = currentKmh;

      // Check Vehicle Destruction from Collisions
      if (this.collisionSystem.isDead && this.mode !== GAME_MODES.FREE_ROAM) {
        this.triggerGameOver('HULL DESTROYED');
        return;
      }

      // Combo Multiplier Decay
      if (this.combo > 1) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 1;
          setMusicIntensity(1);
        }
      }

      const playerPos = vehicleGroup.position;

      // 3. Ring Objective Checks (Circuit & Free Roam)
      if (this.mode === GAME_MODES.CIRCUIT || this.mode === GAME_MODES.FREE_ROAM) {
        // Animate Rings
        for (const ring of this.rings) {
          if (ring.group.visible) {
            ring.chevronGroup.rotation.z += dt * 2.8;
            ring.innerTorus.rotation.z -= dt * 1.8;
          }
        }

        if (this.currentRingIdx < this.rings.length) {
          const targetRing = this.rings[this.currentRingIdx];
          this.targetPosition.copy(targetRing.position);
          this.targetDistance = playerPos.distanceTo(targetRing.position);

          // 🧲 Magnetic Slipstream Attractor:
          // When within 24m of the ring, gently pull player toward the center so hitting rings is effortless!
          if (this.magneticAssist && this.targetDistance < 24 && this.targetDistance > 1.2) {
            const pullDir = new THREE.Vector3().subVectors(targetRing.position, playerPos).normalize();
            playerPos.addScaledVector(pullDir, dt * this.assistStrength);
          }

          // Check if player passed through active ring (Generous capture zone)
          if (this.targetDistance < targetRing.radius) {
            this.passRing(targetRing, vehicleState);
          }

          // Update Flight Path Laser Guide
          this.updateGuideLine(playerPos);
        }
      }

      // 4. Data Cores Checks (Data Hunt)
      if (this.mode === GAME_MODES.DATA_HUNT) {
        let closestDist = 999;
        let closestCore = null;

        for (const core of this.cores) {
          if (!core.collected) {
            // Animate bobbing & rotation
            core.crystal.rotation.y += dt * 2.2;
            core.crystal.rotation.x += dt * 1.4;
            core.ring.rotation.x += dt * 3.2;
            core.group.position.y = core.baseY + Math.sin(this.elapsedTime * 3 + core.idx) * 0.7;

            const dist = playerPos.distanceTo(core.group.position);
            if (dist < closestDist) {
              closestDist = dist;
              closestCore = core;
            }

            // Magnetic attraction for data cores
            if (dist < 18 && dist > 1.0) {
              const pullDir = new THREE.Vector3().subVectors(core.group.position, playerPos).normalize();
              playerPos.addScaledVector(pullDir, dt * 6.0);
            }

            // Pickup trigger
            if (dist < 5.5) {
              this.collectDataCore(core, vehicleState);
            }
          }
        }

        if (closestCore) {
          this.targetPosition.copy(closestCore.position);
          this.targetDistance = closestDist;
        }

        if (this.coresCollected >= this.totalCores) {
          this.triggerVictory();
        }
      }

      // 5. Waypoint Screen Navigation Calculation
      this.updateWaypointNavigation(camera);
    }
  }

  /**
   * Updates the 3D Laser flight path line
   */
  updateGuideLine(playerPos) {
    if (!this.guideLine || !this.guideLine.visible) return;
    const posAttr = this.guideGeo.attributes.position;

    // Segment 1: Player to active ring
    posAttr.setXYZ(0, playerPos.x, playerPos.y, playerPos.z);
    posAttr.setXYZ(1, this.targetPosition.x, this.targetPosition.y, this.targetPosition.z);

    // Segment 2: Active ring to next ring
    if (this.currentRingIdx + 1 < this.rings.length) {
      const nextRing = this.rings[this.currentRingIdx + 1];
      posAttr.setXYZ(2, nextRing.position.x, nextRing.position.y, nextRing.position.z);
    } else {
      posAttr.setXYZ(2, this.targetPosition.x, this.targetPosition.y, this.targetPosition.z);
    }

    posAttr.needsUpdate = true;
    this.guideGeo.setDrawRange(0, 3);
  }

  /**
   * Action when player passes through a ring
   */
  passRing(ring, vehicleState) {
    ring.passed = true;
    this.ringsPassed++;

    // Scoring & Combos
    const basePts = ring.isFinish ? 5000 : 1500;
    this.score += basePts * this.combo;

    // Increase combo
    this.combo = Math.min(4, this.combo + 1);
    this.comboTimer = this.comboMaxDuration;
    setMusicIntensity(this.combo);

    // Generous Time (+6.0s) & Nitro (+25%) Bonus
    this.timeRemaining += 6.0;
    vehicleState.nitroEnergy = Math.min(100, vehicleState.nitroEnergy + 25);

    // Visual & Audio Polish & Haptics
    playRingSound(ring.isFinish);
    this.particleSystem.emitRingShockwave(ring.position, ring.rotation, ring.isFinish ? 0xffaa00 : 0x00f0ff);
    this.onCheckpointCaptured?.();

    // Advance to next ring
    this.currentRingIdx++;
    this.updateRingVisuals();

    // Check Victory
    if (this.currentRingIdx >= this.rings.length) {
      if (this.mode === GAME_MODES.CIRCUIT) {
        this.triggerVictory();
      } else {
        // Free Roam loops
        this.currentRingIdx = 0;
        this.rings.forEach(r => (r.passed = false));
        this.updateRingVisuals();
      }
    }
  }

  /**
   * Action when player collects a Data Core
   */
  collectDataCore(core, vehicleState) {
    core.collected = true;
    core.group.visible = false;
    this.coresCollected++;

    this.score += 3000 * this.combo;
    this.combo = Math.min(4, this.combo + 1);
    this.comboTimer = this.comboMaxDuration;
    setMusicIntensity(this.combo);

    // Repair shield and give nitro & +8s time
    this.collisionSystem.repair(35);
    vehicleState.nitroEnergy = Math.min(100, vehicleState.nitroEnergy + 35);
    this.timeRemaining += 8.0;

    playDataCoreSound();
    this.particleSystem.emitRingShockwave(core.position, new THREE.Quaternion(), 0x00ff88);
    this.onCheckpointCaptured?.();
  }

  /**
   * Projects target 3D waypoint to 2D HUD screen coordinates & edge indicator
   */
  updateWaypointNavigation(camera) {
    const p = this.targetPosition.clone();
    p.project(camera);

    const isBehind = p.z > 1.0;
    let screenX = (p.x * 0.5 + 0.5) * window.innerWidth;
    let screenY = (-(p.y * 0.5) + 0.5) * window.innerHeight;

    const margin = 55;
    const isOnScreen = !isBehind && screenX >= margin && screenX <= window.innerWidth - margin &&
                       screenY >= margin && screenY <= window.innerHeight - margin;

    let angle = 0;
    if (!isOnScreen || isBehind) {
      let nx = p.x;
      let ny = p.y;
      if (isBehind) {
        nx = -nx;
        ny = -ny;
      }
      angle = Math.atan2(-ny, nx);

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const radius = Math.min(cx, cy) - margin;
      screenX = cx + Math.cos(angle) * radius;
      screenY = cy + Math.sin(angle) * radius;
    }

    this.targetScreenPos = {
      x: screenX,
      y: screenY,
      isOnScreen,
      angle: angle + Math.PI / 2
    };
  }

  /**
   * Handles Mission Victory
   */
  triggerVictory() {
    this.state = GAME_STATES.VICTORY;
    playVictorySound();

    const timeBonus = Math.round(this.timeRemaining * 120);
    const shieldBonus = Math.round(this.collisionSystem.shield * 60);
    this.score += timeBonus + shieldBonus;

    this.saveHighScore();
  }

  /**
   * Handles Mission Game Over
   */
  triggerGameOver(reason = 'MISSION FAILED') {
    this.state = GAME_STATES.GAME_OVER;
    this.failReason = reason;
    playGameOverSound();
    this.saveHighScore();
  }

  /**
   * Evaluates mission grade (S, A, B, C)
   */
  calculateGrade() {
    if (this.mode === GAME_MODES.CIRCUIT) {
      if (this.timeRemaining > 30 && this.collisionSystem.shield > 60) return 'S RANK';
      if (this.timeRemaining > 15) return 'A RANK';
      if (this.timeRemaining > 0) return 'B RANK';
      return 'C RANK';
    } else {
      if (this.score > 45000) return 'S RANK';
      if (this.score > 28000) return 'A RANK';
      if (this.score > 12000) return 'B RANK';
      return 'C RANK';
    }
  }

  loadHighScores() {
    try {
      this.highScores = JSON.parse(localStorage.getItem('cyberpunk_high_scores')) || {
        circuit: 0,
        data_hunt: 0
      };
    } catch (e) {
      this.highScores = { circuit: 0, data_hunt: 0 };
    }
  }

  saveHighScore() {
    if (this.mode === GAME_MODES.FREE_ROAM) return;
    const key = this.mode;
    if (this.score > (this.highScores[key] || 0)) {
      this.highScores[key] = this.score;
      this.isNewRecord = true;
      try {
        localStorage.setItem('cyberpunk_high_scores', JSON.stringify(this.highScores));
      } catch (e) {}
    } else {
      this.isNewRecord = false;
    }
  }
}
