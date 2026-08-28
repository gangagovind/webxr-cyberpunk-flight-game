/**
 * Collision & Damage Physics System for "Cyberpunk 2099: Metropolis".
 * Detects collisions between the player's hovercraft and city buildings, bridges, and obstacles.
 * Features soft collision cushions, rapid shield self-repair, and protective invulnerability.
 */

import * as THREE from 'three';
import { playCrashSound, playShieldHitSound } from './synthwaveAudio.js';

export class CollisionSystem {
  constructor(colliders, particleSystem) {
    this.colliders = colliders || [];
    this.particleSystem = particleSystem;

    // Player Hull State
    this.maxShield = 100;
    this.shield = 100;
    this.isDead = false;
    this.invulnerableTimer = 0;
    this.regenDelayTimer = 0;

    // Vehicle Collision Capsule / Bounding Sphere radius
    this.playerRadius = 1.1;
    this.tempSphere = new THREE.Sphere();
    this.closestPoint = new THREE.Vector3();
  }

  /**
   * Resets vehicle health and state
   */
  reset() {
    this.shield = this.maxShield;
    this.isDead = false;
    this.invulnerableTimer = 0;
    this.regenDelayTimer = 0;
  }

  /**
   * Tests and resolves player collision against all static colliders (buildings, bridges, ground).
   */
  checkCollisions(vehicleGroup, vehicleState, dt) {
    if (this.isDead) return { hasCollided: false };

    // Update timers
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Rapid shield self-repair after 1.2 seconds of clean flight
    if (this.regenDelayTimer > 0) {
      this.regenDelayTimer -= dt;
    } else if (this.shield < this.maxShield && !this.isDead) {
      this.shield = Math.min(this.maxShield, this.shield + 15.0 * dt); // Rapid recovery
    }

    const playerPos = vehicleGroup.position;
    this.tempSphere.set(playerPos, this.playerRadius);

    // 1. Ground Collision Check (Y < 1.4)
    if (playerPos.y < 1.4) {
      playerPos.y = 1.4;

      if (vehicleState.speed > 5 || this.invulnerableTimer <= 0) {
        this.handleImpact(
          playerPos,
          new THREE.Vector3(0, 1, 0),
          Math.abs(vehicleState.speed),
          vehicleState,
          vehicleGroup
        );
        return { hasCollided: true, normal: new THREE.Vector3(0, 1, 0) };
      }
    }

    // 2. Skyscraper & Skybridge AABB Collisions
    for (let i = 0; i < this.colliders.length; i++) {
      const col = this.colliders[i];
      const box = col.box;

      // Broadphase check
      if (box.intersectsSphere(this.tempSphere)) {
        box.clampPoint(playerPos, this.closestPoint);

        const distSq = playerPos.distanceToSquared(this.closestPoint);
        const radiusSq = this.playerRadius * this.playerRadius;

        if (distSq < radiusSq || box.containsPoint(playerPos)) {
          const normal = new THREE.Vector3();
          let penetration = 0;

          if (distSq > 0.0001) {
            normal.subVectors(playerPos, this.closestPoint).normalize();
            penetration = this.playerRadius - Math.sqrt(distSq);
          } else {
            const dMinX = Math.abs(playerPos.x - box.min.x);
            const dMaxX = Math.abs(box.max.x - playerPos.x);
            const dMinZ = Math.abs(playerPos.z - box.min.z);
            const dMaxZ = Math.abs(box.max.z - playerPos.z);
            const dMinY = Math.abs(playerPos.y - box.min.y);
            const dMaxY = Math.abs(box.max.y - playerPos.y);

            const minD = Math.min(dMinX, dMaxX, dMinZ, dMaxZ, dMinY, dMaxY);
            if (minD === dMinX) normal.set(-1, 0, 0);
            else if (minD === dMaxX) normal.set(1, 0, 0);
            else if (minD === dMinZ) normal.set(0, 0, -1);
            else if (minD === dMaxZ) normal.set(0, 0, 1);
            else if (minD === dMaxY) normal.set(0, 1, 0);
            else normal.set(0, -1, 0);

            penetration = minD + this.playerRadius;
          }

          // Gentle cushioning pushback out into avenue
          playerPos.addScaledVector(normal, Math.max(penetration + 0.5, 0.8));

          const impactSpeed = Math.max(10, Math.abs(vehicleState.speed));
          this.handleImpact(this.closestPoint, normal, impactSpeed, vehicleState, vehicleGroup);

          return { hasCollided: true, normal };
        }
      }
    }

    return { hasCollided: false };
  }

  /**
   * Applies forgiving damage, soft deflection cushion, spark particles, and sound
   */
  handleImpact(contactPoint, normal, impactSpeed, vehicleState, vehicleGroup) {
    if (this.invulnerableTimer > 0) return;

    this.invulnerableTimer = 1.0; // 1.0s invulnerability cushion
    this.regenDelayTimer = 1.2;    // Fast recovery delay

    // Highly forgiving damage: only 8 - 16 HP per bump!
    const baseDamage = Math.min(18, 8 + (impactSpeed / vehicleState.maxSpeed) * 10);
    this.shield = Math.max(0, this.shield - baseDamage);

    // Sound effects
    playCrashSound(0.5);
    playShieldHitSound();

    // Particle FX & Haptic Feedback Hook
    if (this.particleSystem) {
      this.particleSystem.emitCollisionSparks(contactPoint, normal, 20, true);
      this.particleSystem.addCameraShake(0.25);
    }
    this.onImpact?.();

    // Flash shield bubble
    const shieldMesh = vehicleGroup.getObjectByName('shieldMesh');
    if (shieldMesh) {
      shieldMesh.material.opacity = 0.75;
      shieldMesh.material.color.setHex(0x00f0ff);
      setTimeout(() => {
        if (shieldMesh) shieldMesh.material.opacity = 0.0;
      }, 350);
    }

    // Soft bounce cushion: damp forward speed and auto-stabilize
    vehicleState.speed = Math.max(15, vehicleState.speed * 0.4);
    vehicleState.yawSpeed *= 0.2;
    vehicleState.rollAngle *= 0.2;

    // Check destruction
    if (this.shield <= 0) {
      this.isDead = true;
    }
  }

  /**
   * Repairs shield by specified amount
   */
  repair(amount) {
    this.shield = Math.min(this.maxShield, this.shield + amount);
  }
}
