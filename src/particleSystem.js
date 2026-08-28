/**
 * Particle FX & Visual Flight Sensation Engine for "Cyberpunk 2099: Metropolis".
 * PHASE 2 — FLIGHT FEEL & SENSE OF SPEED
 * Manages high-velocity speed streaks, dual thruster plasma trails, air-brake exhaust,
 * collision spark explosions, ring shockwaves, and aerodynamic camera vibration.
 */

import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // 1. Collision Sparks Pool
    this.SPARK_COUNT = 300;
    this.sparksGeo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.SPARK_COUNT * 3);
    this.sparkVelocities = new Float32Array(this.SPARK_COUNT * 3);
    this.sparkLifetimes = new Float32Array(this.SPARK_COUNT);
    this.sparkMaxLifetimes = new Float32Array(this.SPARK_COUNT);
    this.sparkColors = new Float32Array(this.SPARK_COUNT * 3);

    for (let i = 0; i < this.SPARK_COUNT; i++) {
      this.sparkPositions[i * 3 + 1] = -999;
      this.sparkLifetimes[i] = 0;
      this.sparkMaxLifetimes[i] = 1;
    }

    this.sparksGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    this.sparksGeo.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));

    const sparkMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparksMesh = new THREE.Points(this.sparksGeo, sparkMat);
    this.scene.add(this.sparksMesh);

    // 2. High-Velocity Speed Streaks Particle Tunnel
    this.STREAK_COUNT = 250;
    this.streakGeo = new THREE.BufferGeometry();
    this.streakPositions = new Float32Array(this.STREAK_COUNT * 3);
    this.streakSpeeds = new Float32Array(this.STREAK_COUNT);
    this.streakColors = new Float32Array(this.STREAK_COUNT * 3);

    for (let i = 0; i < this.STREAK_COUNT; i++) {
      this.resetStreak(i, true);
    }

    this.streakGeo.setAttribute('position', new THREE.BufferAttribute(this.streakPositions, 3));
    this.streakGeo.setAttribute('color', new THREE.BufferAttribute(this.streakColors, 3));

    this.streakMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.0, // Controlled by speed
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.streakMesh = new THREE.Points(this.streakGeo, this.streakMat);
    this.scene.add(this.streakMesh);

    // 3. Dual Thruster Plasma Particle Trails
    this.TRAIL_COUNT = 180;
    this.trailGeo = new THREE.BufferGeometry();
    this.trailPositions = new Float32Array(this.TRAIL_COUNT * 3);
    this.trailLifetimes = new Float32Array(this.TRAIL_COUNT);
    this.trailColors = new Float32Array(this.TRAIL_COUNT * 3);

    for (let i = 0; i < this.TRAIL_COUNT; i++) {
      this.trailPositions[i * 3 + 1] = -999;
      this.trailLifetimes[i] = 0;
    }

    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    this.trailGeo.setAttribute('color', new THREE.BufferAttribute(this.trailColors, 3));

    const trailMat = new THREE.PointsMaterial({
      size: 0.45,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.trailMesh = new THREE.Points(this.trailGeo, trailMat);
    this.scene.add(this.trailMesh);

    // 4. Shockwave Rings Pool
    this.shockwaves = [];
    for (let i = 0; i < 4; i++) {
      const ringGeo = new THREE.RingGeometry(0.1, 0.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.visible = false;
      this.scene.add(ringMesh);
      this.shockwaves.push({
        mesh: ringMesh,
        active: false,
        timer: 0,
        duration: 0.45,
        maxScale: 10
      });
    }

    // 5. Camera Shake & Aerodynamic Vibration State
    this.shakeIntensity = 0;
    this.shakeDecay = 4.5;
    this.shakeOffset = new THREE.Vector3();
    this.aeroVibration = new THREE.Vector3();
  }

  resetStreak(i, randomZ = false) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2.5 + Math.random() * 9.0;
    this.streakPositions[i * 3] = Math.cos(angle) * radius;
    this.streakPositions[i * 3 + 1] = Math.sin(angle) * radius;
    this.streakPositions[i * 3 + 2] = randomZ ? (Math.random() - 0.5) * 40 : -25;
    this.streakSpeeds[i] = 40 + Math.random() * 60;

    // Cyan / Magenta streaks
    const isNitro = Math.random() > 0.5;
    this.streakColors[i * 3] = isNitro ? 1.0 : 0.0;
    this.streakColors[i * 3 + 1] = isNitro ? 0.0 : 0.94;
    this.streakColors[i * 3 + 2] = 1.0;
  }

  /**
   * Spawns metal sparks / explosion debris at contact point
   */
  emitCollisionSparks(pos, normal, count = 25, isShield = false) {
    let spawned = 0;
    for (let i = 0; i < this.SPARK_COUNT && spawned < count; i++) {
      if (this.sparkLifetimes[i] <= 0) {
        this.sparkPositions[i * 3] = pos.x;
        this.sparkPositions[i * 3 + 1] = pos.y;
        this.sparkPositions[i * 3 + 2] = pos.z;

        const speed = 15 + Math.random() * 25;
        const dir = new THREE.Vector3(
          normal.x + (Math.random() - 0.5) * 1.2,
          normal.y + (Math.random() - 0.5) * 1.2,
          normal.z + (Math.random() - 0.5) * 1.2
        ).normalize();

        this.sparkVelocities[i * 3] = dir.x * speed;
        this.sparkVelocities[i * 3 + 1] = dir.y * speed;
        this.sparkVelocities[i * 3 + 2] = dir.z * speed;

        this.sparkLifetimes[i] = 0.3 + Math.random() * 0.4;
        this.sparkMaxLifetimes[i] = this.sparkLifetimes[i];

        if (isShield) {
          this.sparkColors[i * 3] = 0.0;
          this.sparkColors[i * 3 + 1] = 0.94;
          this.sparkColors[i * 3 + 2] = 1.0;
        } else {
          this.sparkColors[i * 3] = 1.0;
          this.sparkColors[i * 3 + 1] = Math.random() > 0.5 ? 0.3 : 0.8;
          this.sparkColors[i * 3 + 2] = 0.1;
        }

        spawned++;
      }
    }
  }

  /**
   * Emits plasma particles from vehicle thruster exhausts
   */
  emitThrusterTrail(leftPos, rightPos, isNitro, speedRatio) {
    if (speedRatio < 0.05) return;
    const emitCount = isNitro ? 4 : (speedRatio > 0.4 ? 2 : 1);
    let emitted = 0;

    for (let i = 0; i < this.TRAIL_COUNT && emitted < emitCount; i++) {
      if (this.trailLifetimes[i] <= 0) {
        const origin = (emitted % 2 === 0) ? leftPos : rightPos;
        this.trailPositions[i * 3] = origin.x + (Math.random() - 0.5) * 0.15;
        this.trailPositions[i * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.15;
        this.trailPositions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.15;

        this.trailLifetimes[i] = isNitro ? 0.35 : 0.22;

        if (isNitro) {
          this.trailColors[i * 3] = 1.0;
          this.trailColors[i * 3 + 1] = 0.0;
          this.trailColors[i * 3 + 2] = 0.85; // Magenta / Purple
        } else {
          this.trailColors[i * 3] = 0.0;
          this.trailColors[i * 3 + 1] = 0.9;
          this.trailColors[i * 3 + 2] = 1.0; // Cyan
        }

        emitted++;
      }
    }
  }

  /**
   * Spawns expansive shockwave ring on waypoint clearing
   */
  emitRingShockwave(pos, rotation, colorHex = 0x00f0ff) {
    for (const sw of this.shockwaves) {
      if (!sw.active) {
        sw.active = true;
        sw.timer = 0;
        sw.mesh.position.copy(pos);
        sw.mesh.quaternion.copy(rotation);
        sw.mesh.material.color.setHex(colorHex);
        sw.mesh.material.opacity = 0.9;
        sw.mesh.scale.set(1, 1, 1);
        sw.mesh.visible = true;
        break;
      }
    }
    this.emitCollisionSparks(pos, new THREE.Vector3(0, 1, 0), 30, true);
  }

  /**
   * Adds trauma / camera shake
   */
  addCameraShake(amount = 0.3) {
    this.shakeIntensity = Math.min(1.0, this.shakeIntensity + amount);
  }

  /**
   * Frame update for all particle systems and aerodynamic vibration
   */
  update(dt, vehiclePos, vehicleQuaternion, speedRatio, isNitro) {
    // 1. Update Collision Sparks
    const sparkPosAttr = this.sparksGeo.attributes.position;
    const sparkColAttr = this.sparksGeo.attributes.color;
    let sparksNeedUpdate = false;

    for (let i = 0; i < this.SPARK_COUNT; i++) {
      if (this.sparkLifetimes[i] > 0) {
        this.sparkLifetimes[i] -= dt;
        this.sparkVelocities[i * 3 + 1] -= 9.8 * dt;

        this.sparkPositions[i * 3] += this.sparkVelocities[i * 3] * dt;
        this.sparkPositions[i * 3 + 1] += this.sparkVelocities[i * 3 + 1] * dt;
        this.sparkPositions[i * 3 + 2] += this.sparkVelocities[i * 3 + 2] * dt;

        if (this.sparkLifetimes[i] <= 0) {
          this.sparkPositions[i * 3 + 1] = -999;
        }
        sparksNeedUpdate = true;
      }
    }
    if (sparksNeedUpdate) {
      sparkPosAttr.needsUpdate = true;
      sparkColAttr.needsUpdate = true;
    }

    // 2. Update High-Speed Optical Streak Tunnel
    const streakPosAttr = this.streakGeo.attributes.position;
    const minStreakSpeed = 0.35; // Activate streaks when speed > 35%
    const targetStreakOpacity = (speedRatio > minStreakSpeed || isNitro) ? (isNitro ? 0.9 : (speedRatio - minStreakSpeed) * 1.5) : 0.0;
    this.streakMat.opacity = THREE.MathUtils.lerp(this.streakMat.opacity, targetStreakOpacity, dt * 8);

    if (this.streakMat.opacity > 0.01) {
      const forwardZSpeed = (isNitro ? 160 : 60 + speedRatio * 80) * dt;

      for (let i = 0; i < this.STREAK_COUNT; i++) {
        this.streakPositions[i * 3 + 2] += forwardZSpeed;
        if (this.streakPositions[i * 3 + 2] > 15) {
          this.resetStreak(i, false);
        }
      }
      streakPosAttr.needsUpdate = true;

      // Position streak tunnel around vehicle & orient to heading
      this.streakMesh.position.copy(vehiclePos);
      this.streakMesh.quaternion.copy(vehicleQuaternion);
      this.streakMesh.visible = true;
    } else {
      this.streakMesh.visible = false;
    }

    // 3. Update Thruster Plasma Trails
    const trailPosAttr = this.trailGeo.attributes.position;
    let trailNeedsUpdate = false;

    for (let i = 0; i < this.TRAIL_COUNT; i++) {
      if (this.trailLifetimes[i] > 0) {
        this.trailLifetimes[i] -= dt;
        if (this.trailLifetimes[i] <= 0) {
          this.trailPositions[i * 3 + 1] = -999;
        }
        trailNeedsUpdate = true;
      }
    }
    if (trailNeedsUpdate) {
      trailPosAttr.needsUpdate = true;
    }

    // 4. Update Shockwaves
    for (const sw of this.shockwaves) {
      if (sw.active) {
        sw.timer += dt;
        const progress = sw.timer / sw.duration;
        if (progress >= 1.0) {
          sw.active = false;
          sw.mesh.visible = false;
        } else {
          const scale = THREE.MathUtils.lerp(1.0, sw.maxScale, Math.pow(progress, 0.7));
          sw.mesh.scale.set(scale, scale, 1);
          sw.mesh.material.opacity = (1.0 - progress) * 0.9;
        }
      }
    }

    // 5. Update Camera Shake & Aerodynamic Vibration
    if (this.shakeIntensity > 0.001) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
      const mag = Math.pow(this.shakeIntensity, 2) * 0.5;
      this.shakeOffset.set(
        (Math.random() - 0.5) * mag,
        (Math.random() - 0.5) * mag,
        (Math.random() - 0.5) * mag
      );
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    // Aerodynamic micro-rumble at high velocity / nitro
    const aeroMag = (isNitro ? 0.045 : (speedRatio > 0.6 ? (speedRatio - 0.6) * 0.03 : 0.0));
    if (aeroMag > 0) {
      this.aeroVibration.set(
        (Math.random() - 0.5) * aeroMag,
        (Math.random() - 0.5) * aeroMag,
        (Math.random() - 0.5) * aeroMag
      );
      this.shakeOffset.add(this.aeroVibration);
    }
  }
}
