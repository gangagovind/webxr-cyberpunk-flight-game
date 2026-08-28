/**
 * Cyberpunk Perimeter Forcefield & Boundary Wall System for "Cyberpunk 2099: Metropolis".
 * Renders glowing neon energy grid walls and enforces city boundaries with elastic repulsion physics.
 */

import * as THREE from 'three';
import { playBoundaryWarningSound } from './synthwaveAudio.js';

export class BoundaryWalls {
  constructor(scene) {
    this.scene = scene;

    // Boundary Limits
    this.bounds = {
      minX: -120,
      maxX: 120,
      minZ: -140,
      maxZ: 140,
      minY: 1.5,
      maxY: 105
    };

    this.warningDistance = 18; // Distance from edge where HUD warning triggers
    this.isNearBoundary = false;
    this.lastWarningSoundTime = 0;

    this.group = new THREE.Group();
    this.group.name = 'boundary-forcefield';
    this.scene.add(this.group);

    this.initVisualForcefield();
  }

  /**
   * Creates holographic glowing neon grid boundary walls
   */
  initVisualForcefield() {
    const wallWidthX = this.bounds.maxX - this.bounds.minX;
    const wallDepthZ = this.bounds.maxZ - this.bounds.minZ;
    const wallHeight = this.bounds.maxY - this.bounds.minY;

    // Procedural glowing cyber grid texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 512);

    // Glowing Neon Cyan Grid
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;

    const step = 64;
    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Hazard Stripes border
    ctx.fillStyle = '#ff0077';
    for (let i = 0; i < 512; i += 32) {
      ctx.fillRect(i, 0, 16, 20);
      ctx.fillRect(i, 492, 16, 20);
    }

    const gridTexture = new THREE.CanvasTexture(canvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(6, 4);

    this.gridTexture = gridTexture;

    const forcefieldMat = new THREE.MeshBasicMaterial({
      map: gridTexture,
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.forcefieldMat = forcefieldMat;

    // 1. North Wall (Z = minZ)
    const northGeo = new THREE.PlaneGeometry(wallWidthX, wallHeight);
    const northWall = new THREE.Mesh(northGeo, forcefieldMat);
    northWall.position.set(0, wallHeight / 2, this.bounds.minZ);
    this.group.add(northWall);

    // 2. South Wall (Z = maxZ)
    const southGeo = new THREE.PlaneGeometry(wallWidthX, wallHeight);
    const southWall = new THREE.Mesh(southGeo, forcefieldMat);
    southWall.position.set(0, wallHeight / 2, this.bounds.maxZ);
    southWall.rotation.y = Math.PI;
    this.group.add(southWall);

    // 3. West Wall (X = minX)
    const westGeo = new THREE.PlaneGeometry(wallDepthZ, wallHeight);
    const westWall = new THREE.Mesh(westGeo, forcefieldMat);
    westWall.position.set(this.bounds.minX, wallHeight / 2, 0);
    westWall.rotation.y = Math.PI / 2;
    this.group.add(westWall);

    // 4. East Wall (X = maxX)
    const eastGeo = new THREE.PlaneGeometry(wallDepthZ, wallHeight);
    const eastWall = new THREE.Mesh(eastGeo, forcefieldMat);
    eastWall.position.set(this.bounds.maxX, wallHeight / 2, 0);
    eastWall.rotation.y = -Math.PI / 2;
    this.group.add(eastWall);

    // 5. Ceiling Energy Dome (Y = maxY)
    const ceilingGeo = new THREE.PlaneGeometry(wallWidthX, wallDepthZ);
    const ceiling = new THREE.Mesh(ceilingGeo, forcefieldMat);
    ceiling.position.set(0, this.bounds.maxY, 0);
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);
  }

  /**
   * Enforces boundary limits and repels the hovercraft
   */
  update(vehicleGroup, vehicleState, particleSystem, dt) {
    const pos = vehicleGroup.position;
    let breached = false;
    let closestDist = 999;

    // Check proximity to all 4 walls & ceiling
    const distLeft = pos.x - this.bounds.minX;
    const distRight = this.bounds.maxX - pos.x;
    const distNorth = pos.z - this.bounds.minZ;
    const distSouth = this.bounds.maxZ - pos.z;
    const distCeil = this.bounds.maxY - pos.y;

    closestDist = Math.min(distLeft, distRight, distNorth, distSouth, distCeil);
    this.isNearBoundary = closestDist < this.warningDistance;

    // Animate texture scrolling & pulse brightness when player is close
    if (this.gridTexture) {
      this.gridTexture.offset.y += dt * 0.2;
    }

    if (this.forcefieldMat) {
      const targetOpacity = this.isNearBoundary ? 0.65 : 0.22;
      this.forcefieldMat.opacity = THREE.MathUtils.lerp(this.forcefieldMat.opacity, targetOpacity, dt * 5);
      this.forcefieldMat.color.setHex(this.isNearBoundary ? 0xff0077 : 0x00f0ff);
    }

    // Hard Boundary Repulsion & Deflection
    const repulsionForce = 45 * dt;

    if (pos.x < this.bounds.minX) {
      pos.x = this.bounds.minX;
      vehicleState.speed *= 0.3;
      vehicleGroup.position.x += 1.5;
      breached = true;
    } else if (pos.x > this.bounds.maxX) {
      pos.x = this.bounds.maxX;
      vehicleState.speed *= 0.3;
      vehicleGroup.position.x -= 1.5;
      breached = true;
    }

    if (pos.z < this.bounds.minZ) {
      pos.z = this.bounds.minZ;
      vehicleState.speed *= 0.3;
      vehicleGroup.position.z += 1.5;
      breached = true;
    } else if (pos.z > this.bounds.maxZ) {
      pos.z = this.bounds.maxZ;
      vehicleState.speed *= 0.3;
      vehicleGroup.position.z -= 1.5;
      breached = true;
    }

    if (pos.y > this.bounds.maxY) {
      pos.y = this.bounds.maxY;
      vehicleGroup.position.y -= 1.0;
      breached = true;
    }

    if (breached) {
      const now = performance.now();
      if (now - this.lastWarningSoundTime > 600) {
        playBoundaryWarningSound();
        this.lastWarningSoundTime = now;
      }
      if (particleSystem) {
        particleSystem.emitCollisionSparks(pos, new THREE.Vector3(0, 0, 1), 20, true);
        particleSystem.addCameraShake(0.3);
      }
    }

    return {
      isNearBoundary: this.isNearBoundary,
      closestDist
    };
  }
}
