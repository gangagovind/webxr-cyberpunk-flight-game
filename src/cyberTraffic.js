/**
 * Autonomous Cyber Traffic, Diverse Vehicles & Environmental Hazards Engine for "Cyberpunk 2099: Metropolis".
 * PHASE 3 — OBSTACLE & TRAFFIC VARIETY
 * Features Hover Taxis, Heavy Cargo Freighters, Fast Interceptors, Patrol Drones,
 * Timed Pulsing Laser Barriers, and EMP Storm Vents.
 */

import * as THREE from 'three';
import { playCrashSound, playShieldHitSound } from './synthwaveAudio.js';

export class CyberTrafficSystem {
  constructor(scene, particleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;

    this.group = new THREE.Group();
    this.group.name = 'cyber-traffic-system';
    this.scene.add(this.group);

    this.vehicles = [];
    this.drones = [];
    this.laserBarriers = [];
    this.empVents = [];

    this.initTrafficVehicles();
    this.initSecurityDrones();
    this.initTimedLaserBarriers();
    this.initEmpStormVents();
  }

  /**
   * Initializes diverse autonomous vehicle archetypes across multi-tier corridors
   */
  initTrafficVehicles() {
    const laneAltitudes = [20, 36, 52, 68];

    // Shared materials
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x0a0d16, metalness: 0.9, roughness: 0.25 });
    const taxiYellowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const policeBlueMat = new THREE.MeshBasicMaterial({ color: 0x0088ff });
    const policeRedMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const cyanLightMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const amberClearanceMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });

    for (let i = 0; i < 14; i++) {
      const vGroup = new THREE.Group();
      const type = i % 3; // 0: Hover Taxi, 1: Heavy Cargo Freighter, 2: Fast Interceptor
      let speed, radius, vType;

      // -------------------------------------------------------------
      // Archetype 0: Hover Taxi (Cyber Yellow / Cyan)
      // -------------------------------------------------------------
      if (type === 0) {
        vType = 'taxi';
        speed = 28 + Math.random() * 15;
        radius = 2.0;

        const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.85, 3.6), darkMetalMat);
        vGroup.add(body);

        // Taxi Roof Sign
        const roofSign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.5), taxiYellowMat);
        roofSign.position.set(0, 0.55, 0);
        vGroup.add(roofSign);

        // Yellow Side Stripes
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 3.4), taxiYellowMat);
        stripe.position.set(0, 0, 0);
        vGroup.add(stripe);

        // Headlights & Taillights
        const hl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.1), cyanLightMat);
        hl.position.set(0, 0, -1.82);
        vGroup.add(hl);

        const tl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.1), policeRedMat);
        tl.position.set(0, 0, 1.82);
        vGroup.add(tl);
      }

      // -------------------------------------------------------------
      // Archetype 1: Heavy Cargo Freighter (Armored, Double-sized)
      // -------------------------------------------------------------
      else if (type === 1) {
        vType = 'freighter';
        speed = 18 + Math.random() * 8;
        radius = 3.8;

        const mainHull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 7.2), darkMetalMat);
        vGroup.add(mainHull);

        // Cargo Pod Container Ribs
        for (let c = -2.2; c <= 2.2; c += 1.4) {
          const rib = new THREE.Mesh(new THREE.BoxGeometry(3.35, 1.7, 0.3), darkMetalMat);
          rib.position.set(0, 0, c);
          vGroup.add(rib);
        }

        // Blinking Amber Clearance Lights on 4 corners
        const cornerMat = amberClearanceMat;
        for (let sx = -1; sx <= 1; sx += 2) {
          for (let sz = -1; sz <= 1; sz += 2) {
            const light = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), cornerMat);
            light.position.set(sx * 1.55, 0.75, sz * 3.5);
            vGroup.add(light);
          }
        }
      }

      // -------------------------------------------------------------
      // Archetype 2: Fast Police/Security Interceptor (Needle Profile)
      // -------------------------------------------------------------
      else {
        vType = 'interceptor';
        speed = 52 + Math.random() * 20;
        radius = 1.8;

        const body = new THREE.Mesh(new THREE.ConeGeometry(0.65, 3.8, 4), darkMetalMat);
        body.rotation.x = Math.PI / 2;
        body.scale.set(1, 0.45, 1);
        vGroup.add(body);

        // Flashing Strobe Bar
        const strobeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.1), policeBlueMat);
        strobeLeft.position.set(-0.35, 0.25, 0);
        vGroup.add(strobeLeft);

        const strobeRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.1), policeRedMat);
        strobeRight.position.set(0.35, 0.25, 0);
        vGroup.add(strobeRight);
      }

      // Position along multi-tier highways
      const laneY = laneAltitudes[i % laneAltitudes.length];
      const laneX = (i % 2 === 0 ? 1 : -1) * (7 + (i % 3) * 20);
      const isNorthbound = i % 2 === 0;

      vGroup.position.set(laneX, laneY, (Math.random() - 0.5) * 240);
      if (!isNorthbound) vGroup.rotation.y = Math.PI;

      this.group.add(vGroup);

      this.vehicles.push({
        group: vGroup,
        speed,
        direction: isNorthbound ? -1 : 1,
        altitude: laneY,
        radius,
        vType,
        weaveTimer: Math.random() * 10,
        baseX: laneX
      });
    }
  }

  /**
   * Initializes hovering security drones with active searchlights
   */
  initSecurityDrones() {
    const droneGeo = new THREE.SphereGeometry(1.0, 12, 8);
    const droneMat = new THREE.MeshStandardMaterial({ color: 0x1a0510, metalness: 0.9, roughness: 0.2 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });

    const droneWaypoints = [
      { x: 0, y: 35, z: -50, radius: 18 },
      { x: 0, y: 48, z: 40, radius: 22 },
      { x: -35, y: 60, z: 0, radius: 16 },
      { x: 35, y: 40, z: -20, radius: 16 }
    ];

    droneWaypoints.forEach((wp, idx) => {
      const droneGroup = new THREE.Group();

      const body = new THREE.Mesh(droneGeo, droneMat);
      droneGroup.add(body);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 8, 24), eyeMat);
      ring.rotation.x = Math.PI / 2;
      droneGroup.add(ring);

      // Rotating Searchlight Scanner Cone
      const coneGeo = new THREE.ConeGeometry(4.0, 14, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xff0055,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = -7;
      droneGroup.add(cone);

      droneGroup.position.set(wp.x, wp.y, wp.z);
      this.group.add(droneGroup);

      this.drones.push({
        group: droneGroup,
        cone,
        coneMat,
        center: wp,
        angle: idx * 1.5,
        speed: 0.75 + idx * 0.2,
        radius: wp.radius,
        hitRadius: 2.0
      });
    });
  }

  /**
   * Initializes timed pulsating laser barriers between skyscraper antennas
   */
  initTimedLaserBarriers() {
    const barrierLocations = [
      { pos: new THREE.Vector3(0, 32, -65), width: 34, rotY: 0 },
      { pos: new THREE.Vector3(26, 46, -30), width: 28, rotY: 0.8 },
      { pos: new THREE.Vector3(-26, 38, 30), width: 30, rotY: -0.7 }
    ];

    barrierLocations.forEach((loc, idx) => {
      const barrierGroup = new THREE.Group();
      barrierGroup.position.copy(loc.pos);
      barrierGroup.rotation.y = loc.rotY;

      // Emitter Pylons on Left & Right
      const pylonMat = new THREE.MeshStandardMaterial({ color: 0x151824, metalness: 0.9 });
      const leftPylon = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 8), pylonMat);
      leftPylon.position.set(-loc.width / 2, 0, 0);
      barrierGroup.add(leftPylon);

      const rightPylon = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 8), pylonMat);
      rightPylon.position.set(loc.width / 2, 0, 0);
      barrierGroup.add(rightPylon);

      // Pulsing Laser Energy Plane
      const laserMat = new THREE.MeshBasicMaterial({
        color: 0xff0055,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const laserMesh = new THREE.Mesh(new THREE.PlaneGeometry(loc.width, 3.2), laserMat);
      barrierGroup.add(laserMesh);

      // Warning Beacons on pylons
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
      const leftBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), beaconMat);
      leftBeacon.position.set(-loc.width / 2, 2.2, 0);
      barrierGroup.add(leftBeacon);

      const rightBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), beaconMat);
      rightBeacon.position.set(loc.width / 2, 2.2, 0);
      barrierGroup.add(rightBeacon);

      this.group.add(barrierGroup);

      this.laserBarriers.push({
        group: barrierGroup,
        laserMesh,
        laserMat,
        beaconMat,
        position: loc.pos,
        width: loc.width,
        rotation: loc.rotY,
        cycleTimer: idx * 1.5,
        activeDuration: 3.5, // Active for 3.5s
        inactiveDuration: 2.2, // Off for 2.2s
        isActive: true
      });
    });
  }

  /**
   * Initializes EMP storm vents with electrical sparks
   */
  initEmpStormVents() {
    const ventLocations = [
      new THREE.Vector3(12, 18, 0),
      new THREE.Vector3(-15, 26, -55)
    ];

    ventLocations.forEach(pos => {
      const ventGroup = new THREE.Group();
      ventGroup.position.copy(pos);

      // Industrial Vent Nozzle
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x222634, metalness: 0.85 });
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.8, 1.8, 12), nozzleMat);
      ventGroup.add(nozzle);

      // Glowing EMP Plasma Core
      const empMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.45,
        wireframe: true
      });
      const core = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 8), empMat);
      core.position.y = 2.5;
      ventGroup.add(core);

      this.group.add(ventGroup);

      this.empVents.push({
        group: ventGroup,
        core,
        position: pos,
        radius: 4.2
      });
    });
  }

  /**
   * Frame update for traffic, drones, timed lasers, and EMP hazards
   */
  update(vehicleGroup, vehicleState, collisionSystem, dt) {
    const playerPos = vehicleGroup.position;

    // 1. Update Sky-Cars & Cargo Freighters
    for (const car of this.vehicles) {
      car.group.position.z += car.direction * car.speed * dt;

      // Subtle dynamic lane weaving
      car.weaveTimer += dt;
      car.group.position.x = car.baseX + Math.sin(car.weaveTimer * 0.8) * 1.2;

      // Wrap around city highway bounds
      if (car.direction < 0 && car.group.position.z < -135) {
        car.group.position.z = 135;
      } else if (car.direction > 0 && car.group.position.z > 135) {
        car.group.position.z = -135;
      }

      // Check collision with player
      const distSq = playerPos.distanceToSquared(car.group.position);
      const minDistance = car.radius + collisionSystem.playerRadius;

      if (distSq < minDistance * minDistance && collisionSystem.invulnerableTimer <= 0) {
        const normal = new THREE.Vector3().subVectors(playerPos, car.group.position).normalize();
        collisionSystem.handleImpact(
          car.group.position,
          normal,
          Math.abs(vehicleState.speed) + car.speed,
          vehicleState,
          vehicleGroup
        );
      }
    }

    // 2. Update Security Drones
    for (const drone of this.drones) {
      drone.angle += drone.speed * dt;
      drone.group.position.x = drone.center.x + Math.cos(drone.angle) * drone.radius;
      drone.group.position.z = drone.center.z + Math.sin(drone.angle) * drone.radius;
      drone.group.position.y = drone.center.y + Math.sin(drone.angle * 2) * 3;
      drone.group.rotation.y = drone.angle + Math.PI / 2;

      // Check collision with player
      const distSq = playerPos.distanceToSquared(drone.group.position);
      const minDistance = drone.hitRadius + collisionSystem.playerRadius;

      if (distSq < minDistance * minDistance && collisionSystem.invulnerableTimer <= 0) {
        const normal = new THREE.Vector3().subVectors(playerPos, drone.group.position).normalize();
        collisionSystem.handleImpact(
          drone.group.position,
          normal,
          Math.abs(vehicleState.speed) + 20,
          vehicleState,
          vehicleGroup
        );
      }
    }

    // 3. Update Timed Pulsing Laser Barriers
    for (const barrier of this.laserBarriers) {
      barrier.cycleTimer += dt;
      const totalPeriod = barrier.activeDuration + barrier.inactiveDuration;
      const periodTime = barrier.cycleTimer % totalPeriod;

      barrier.isActive = periodTime < barrier.activeDuration;

      if (barrier.isActive) {
        barrier.laserMesh.visible = true;
        barrier.laserMat.color.setHex(0xff0055);
        barrier.beaconMat.color.setHex(0xff0055);
        barrier.laserMat.opacity = 0.75 + Math.sin(barrier.cycleTimer * 12) * 0.2;

        // Check laser collision
        const dist = playerPos.distanceTo(barrier.position);
        if (dist < barrier.width / 2 + 1.2 && Math.abs(playerPos.y - barrier.position.y) < 2.0 && collisionSystem.invulnerableTimer <= 0) {
          const normal = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), barrier.rotation);
          collisionSystem.handleImpact(
            barrier.position,
            normal,
            Math.abs(vehicleState.speed) + 25,
            vehicleState,
            vehicleGroup
          );
        }
      } else {
        // Warning safe phase (green pulse)
        barrier.laserMesh.visible = false;
        barrier.beaconMat.color.setHex(0x00ff88);
      }
    }

    // 4. Update EMP Storm Vents
    for (const emp of this.empVents) {
      emp.core.rotation.y += dt * 3.0;
      emp.core.rotation.x += dt * 1.5;

      const dist = playerPos.distanceTo(emp.position);
      if (dist < emp.radius) {
        // EMP Discharge: slow down speed and drain nitro
        vehicleState.speed *= 0.94;
        vehicleState.nitroEnergy = Math.max(0, vehicleState.nitroEnergy - dt * 25);
        if (this.particleSystem) {
          this.particleSystem.emitCollisionSparks(playerPos, new THREE.Vector3(0, 1, 0), 4, true);
        }
      }
    }
  }
}
