/**
 * Spatial Cockpit HUD & 3D WebXR Virtual Controls Module for "Cyberpunk 2099: Metropolis".
 * PHASE 5 — WEBXR INTERACTION & IMMERSIVE COCKPIT
 * Features live digital dashboard telemetry, 3D animated flight stick, dynamic throttle lever,
 * interactive 3D Nitro button, 3D compass needle, and WebXR dual-rumble haptic feedback.
 */

import * as THREE from 'three';

export class SpatialCockpit {
  constructor(vehicleGroup, camera) {
    this.vehicleGroup = vehicleGroup;
    this.camera = camera;

    // 1. Digital Dashboard Canvas HUD
    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.width = 512;
    this.hudCanvas.height = 256;
    this.hudCtx = this.hudCanvas.getContext('2d');

    this.hudTexture = new THREE.CanvasTexture(this.hudCanvas);
    this.hudTexture.minFilter = THREE.LinearFilter;

    const hudGeo = new THREE.PlaneGeometry(0.85, 0.42);
    const hudMat = new THREE.MeshBasicMaterial({
      map: this.hudTexture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.hudMesh = new THREE.Mesh(hudGeo, hudMat);
    this.hudMesh.position.set(0, 0.35, -0.65);
    this.hudMesh.rotation.x = -0.3;
    this.vehicleGroup.add(this.hudMesh);

    // 2. 3D Navigational Compass Needle inside cockpit
    const needleGeo = new THREE.ConeGeometry(0.04, 0.16, 6);
    needleGeo.rotateX(Math.PI / 2);
    const needleMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.compassNeedle = new THREE.Mesh(needleGeo, needleMat);
    this.compassNeedle.position.set(0, 0.48, -0.62);
    this.vehicleGroup.add(this.compassNeedle);

    // 3. 3D Physical Flight Stick (Centers pitch/yaw motion)
    const stickMat = new THREE.MeshStandardMaterial({ color: 0x141824, metalness: 0.85, roughness: 0.3 });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.2 });

    this.stickGroup = new THREE.Group();
    this.stickGroup.position.set(0, 0.1, -0.42);

    const stickBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.04, 8), stickMat);
    this.stickGroup.add(stickBase);

    const stickShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), stickMat);
    stickShaft.position.y = 0.11;
    this.stickGroup.add(stickShaft);

    const stickGrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.04), gripMat);
    stickGrip.position.y = 0.22;
    this.stickGroup.add(stickGrip);

    this.vehicleGroup.add(this.stickGroup);

    // 4. 3D Physical Throttle Lever (Left Console)
    this.throttleGroup = new THREE.Group();
    this.throttleGroup.position.set(-0.25, 0.12, -0.38);

    const throttleBase = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.14), stickMat);
    this.throttleGroup.add(throttleBase);

    this.throttleHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.05), gripMat);
    this.throttleHandle.position.set(0, 0.04, 0);
    this.throttleGroup.add(this.throttleHandle);

    this.vehicleGroup.add(this.throttleGroup);

    // 5. 3D Interactive Nitro Button (Right Console)
    this.nitroButton = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12),
      new THREE.MeshStandardMaterial({ color: 0xff0066, emissive: 0xff0066, emissiveIntensity: 2.0 })
    );
    this.nitroButton.position.set(0.25, 0.14, -0.38);
    this.vehicleGroup.add(this.nitroButton);

    this.updateHUD(0, 14, 100, 100, 0, 1, 'RING 01/20', 45);
  }

  /**
   * Safely triggers WebXR controller haptic feedback
   */
  static triggerHaptic(renderer, durationMs = 120, intensity = 0.6) {
    if (!renderer || !renderer.xr) return;
    const session = renderer.xr.getSession();
    if (!session) return;

    for (const source of session.inputSources) {
      if (source.gamepad && source.gamepad.hapticActuators && source.gamepad.hapticActuators.length > 0) {
        source.gamepad.hapticActuators[0].pulse(intensity, durationMs).catch(() => {});
      } else if (source.gamepad && source.gamepad.vibrationActuator) {
        source.gamepad.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude: intensity,
          strongMagnitude: intensity * 0.8
        }).catch(() => {});
      }
    }
  }

  /**
   * Updates 3D virtual flight stick & throttle lever animation
   */
  updateControlsVisuals(speedRatio, yawSpeed, rollAngle, pitchAngle, isNitro) {
    // Animate throttle lever forward/backward with speed
    if (this.throttleHandle) {
      this.throttleHandle.position.z = -speedRatio * 0.05 + 0.025;
    }

    // Animate flight stick with steering yaw/roll and pitch
    if (this.stickGroup) {
      this.stickGroup.rotation.z = -yawSpeed * 0.25;
      this.stickGroup.rotation.x = pitchAngle * 0.4;
    }

    // Glow nitro button when active
    if (this.nitroButton) {
      this.nitroButton.material.emissiveIntensity = isNitro ? 4.0 : 1.8;
      this.nitroButton.position.y = isNitro ? 0.13 : 0.14;
    }
  }

  /**
   * Updates 2D canvas texture with telemetry and target tracker
   */
  updateHUD(speedKmh, altitudeM, nitroPct, shieldPct, score, combo, objectiveText, targetDistM, targetPos) {
    const ctx = this.hudCtx;
    const w = this.hudCanvas.width;
    const h = this.hudCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Cyberpunk Glass Background
    ctx.save();
    ctx.fillStyle = 'rgba(2, 4, 8, 0.94)';
    ctx.strokeStyle = shieldPct > 30 ? '#00f0ff' : '#ff0055';
    ctx.lineWidth = 4;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);

    // Top Neon Stripe
    ctx.fillStyle = combo > 1 ? '#ff0066' : '#00f0ff';
    ctx.fillRect(0, 0, w, 6);

    // 2. Speedometer Digital Display
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 44px "Orbitron", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(speedKmh)}`, 20, 60);

    ctx.fillStyle = '#ff0066';
    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.fillText('KM/H', 130, 60);

    // Altitude
    ctx.fillStyle = '#88aabb';
    ctx.font = '14px "Orbitron", sans-serif';
    ctx.fillText(`ALT: ${Math.round(altitudeM)}M`, 20, 90);

    // 3. Shield / Hull Bar (Center)
    ctx.fillStyle = shieldPct > 30 ? '#00ff88' : '#ff0055';
    ctx.fillText(`SHIELD: ${Math.round(shieldPct)}%`, 20, 125);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeRect(20, 135, 220, 12);
    ctx.fillRect(22, 137, (216 * (shieldPct / 100)), 8);

    // 4. Nitro Boost Bar
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('NITRO:', 20, 175);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeRect(20, 185, 220, 12);
    ctx.fillStyle = nitroPct > 20 ? '#00f0ff' : '#ffaa00';
    ctx.fillRect(22, 187, (216 * (nitroPct / 100)), 8);

    // 5. Right Column: Objective & Score
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 18px "Orbitron", sans-serif';
    ctx.fillText(`${objectiveText}`, 490, 50);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '14px "Orbitron", sans-serif';
    ctx.fillText(`DIST: ${Math.round(targetDistM)}M`, 490, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Orbitron", sans-serif';
    ctx.fillText(`${score.toLocaleString()} PTS`, 490, 125);

    if (combo > 1) {
      ctx.fillStyle = '#ff0066';
      ctx.font = 'bold 18px "Orbitron", sans-serif';
      ctx.fillText(`x${combo} STREAK! 🔥`, 490, 160);
    }

    ctx.restore();
    this.hudTexture.needsUpdate = true;

    // Update 3D Needle pointing towards target position
    if (targetPos && this.compassNeedle) {
      const localTarget = targetPos.clone();
      this.vehicleGroup.worldToLocal(localTarget);
      this.compassNeedle.lookAt(localTarget);
    }
  }
}
