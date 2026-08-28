/**
 * Procedural 3D Geometry Generator for "Cyberpunk 2099: Neon Metropolis" WebXR.
 * PHASE 1 — VISUAL ENVIRONMENT OVERHAUL
 * Generates diverse skyscraper typologies, tiered mega-spires, holographic billboards,
 * rooftop helipads, antennas, skybridges, wet cyber ground, and the player's stealth rocket.
 */

import * as THREE from 'three';

/**
 * Creates high-contrast canvas textures for skyscraper facades, neon windows & holographic signs.
 */
function createSkyscraperTexture(styleType, neonColorHex, label = 'NEO-TOKYO 2099') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Vivid deep slate/indigo metallic facade background
  ctx.fillStyle = '#0e1628';
  ctx.fillRect(0, 0, 512, 1024);

  // Structural metal panel seams
  ctx.strokeStyle = '#1a2640';
  ctx.lineWidth = 2;
  for (let y = 0; y <= 1024; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let x = 0; x <= 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }

  // Glowing neon window patterns based on building style
  ctx.fillStyle = neonColorHex;
  ctx.shadowColor = neonColorHex;
  ctx.shadowBlur = 14;

  if (styleType === 'corporate') {
    // Dense vertical data-grid windows
    for (let y = 50; y < 980; y += 30) {
      for (let x = 25; x < 485; x += 36) {
        if (Math.random() > 0.2) {
          ctx.fillRect(x, y, 24, 16);
        }
      }
    }
  } else if (styleType === 'arcology') {
    // Clustered residential terrace lights
    for (let y = 55; y < 965; y += 42) {
      for (let x = 35; x < 475; x += 50) {
        if (Math.random() > 0.15) {
          ctx.fillRect(x, y, 38, 22);
        }
      }
    }
  } else {
    // Industrial / High-tech stripe matrix
    for (let y = 70; y < 950; y += 52) {
      ctx.fillRect(35, y, 442, 16);
    }
  }

  // Holographic Neon Header Billboard
  ctx.shadowColor = neonColorHex;
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Orbitron", sans-serif, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, 256, 110);

  // Vertical Japanese Kanji / Subtext
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = neonColorHex;
  ctx.fillText('サイバー都市 2099', 256, 145);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 3);
  return texture;
}

/**
 * Creates canvas texture for holographic 3D neon billboards
 */
function createHoloAdTexture(brandName, subText, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(4, 8, 18, 0.92)';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 240);

  // Grid scanlines
  ctx.fillStyle = colorHex;
  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 18;
  ctx.font = 'bold 44px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(brandName, 256, 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(subText, 256, 160);

  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = colorHex;
  ctx.fillText('► SYSTEM ONLINE ◄', 256, 200);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates wet reflective asphalt road texture with glowing neon lane dividers
 */
function createCyberRoadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a101e';
  ctx.fillRect(0, 0, 1024, 1024);

  // Neon Highway Grid Lines
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
  ctx.lineWidth = 4;
  for (let i = 64; i < 1024; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();
  }

  // Yellow & Magenta Hazard Stripes on Crossings
  ctx.fillStyle = '#ffaa00';
  for (let y = 0; y < 1024; y += 64) {
    ctx.fillRect(496, y, 32, 36);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

/**
 * Creates the ultra-sleek 3D Cyberpunk Apex Stealth Rocket
 */
export function createHoverVehicle() {
  const group = new THREE.Group();
  group.name = 'cyberpunk-apex-rocket';

  // Hull Materials
  const darkHullMat = new THREE.MeshStandardMaterial({
    color: 0x080a12,
    roughness: 0.18,
    metalness: 0.95,
    envMapIntensity: 2.0
  });

  const darkAccentMat = new THREE.MeshStandardMaterial({
    color: 0x141824,
    roughness: 0.3,
    metalness: 0.85
  });

  const neonCyanMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 3.0
  });

  const neonPinkMat = new THREE.MeshStandardMaterial({
    color: 0xff0066,
    emissive: 0xff0066,
    emissiveIntensity: 3.0
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x001122,
    emissive: 0x003344,
    transparent: true,
    opacity: 0.75,
    roughness: 0.05,
    metalness: 0.4,
    transmission: 0.85
  });

  // 1. Central Chisel Stealth Fuselage
  const fuselageGeo = new THREE.BoxGeometry(0.7, 0.4, 3.4);
  const fuselage = new THREE.Mesh(fuselageGeo, darkHullMat);
  fuselage.position.set(0, 0, 0);
  group.add(fuselage);

  // Aerodynamic Chisel Nosecone
  const noseGeo = new THREE.CylinderGeometry(0.04, 0.68, 1.4, 4);
  noseGeo.rotateY(Math.PI / 4);
  const nose = new THREE.Mesh(noseGeo, darkHullMat);
  nose.rotation.x = -Math.PI / 2;
  nose.scale.set(1, 0.45, 1);
  nose.position.set(0, -0.02, -2.2);
  group.add(nose);

  // Nose Laser Sensor Tip
  const sensorTip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.3), neonCyanMat);
  sensorTip.position.set(0, 0, -2.85);
  group.add(sensorTip);

  // 2. Faceted Cockpit Canopy
  const canopyGeo = new THREE.CylinderGeometry(0.22, 0.36, 1.3, 6);
  canopyGeo.rotateX(Math.PI / 2);
  const canopy = new THREE.Mesh(canopyGeo, glassMat);
  canopy.scale.set(0.9, 0.55, 1);
  canopy.position.set(0, 0.25, -0.45);
  group.add(canopy);

  // Canopy Neon Frame Trim
  const canopyTrim = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 1.3), neonCyanMat);
  canopyTrim.position.set(0, 0.38, -0.45);
  group.add(canopyTrim);

  // 3. Swept-Back Stealth Delta Main Wings
  const leftWingShape = new THREE.Shape();
  leftWingShape.moveTo(0, 0);
  leftWingShape.lineTo(-1.8, 1.2);
  leftWingShape.lineTo(-1.7, 1.7);
  leftWingShape.lineTo(0, 1.4);
  leftWingShape.closePath();

  const extrudeSettings = { depth: 0.05, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
  const leftWingGeo = new THREE.ExtrudeGeometry(leftWingShape, extrudeSettings);
  leftWingGeo.rotateX(Math.PI / 2);

  const leftWing = new THREE.Mesh(leftWingGeo, darkHullMat);
  leftWing.position.set(-0.32, 0.02, 0.2);
  group.add(leftWing);

  // Mirror Right Wing
  const rightWingGeo = leftWingGeo.clone();
  rightWingGeo.scale(-1, 1, 1);
  const rightWing = new THREE.Mesh(rightWingGeo, darkHullMat);
  rightWing.position.set(0.32, 0.02, 0.2);
  group.add(rightWing);

  // Neon Wing Leading Edge Laser Strips
  const leftWingStrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 2.2), neonCyanMat);
  leftWingStrip.rotation.y = -0.55;
  leftWingStrip.position.set(-1.15, 0.04, 0.85);
  group.add(leftWingStrip);

  const rightWingStrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 2.2), neonCyanMat);
  rightWingStrip.rotation.y = 0.55;
  rightWingStrip.position.set(1.15, 0.04, 0.85);
  group.add(rightWingStrip);

  // 4. Forward Aerodynamic Canard Wings
  const leftCanard = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.03, 0.4), darkAccentMat);
  leftCanard.rotation.y = -0.3;
  leftCanard.position.set(-0.55, 0.05, -1.3);
  group.add(leftCanard);

  const rightCanard = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.03, 0.4), darkAccentMat);
  rightCanard.rotation.y = 0.3;
  rightCanard.position.set(0.55, 0.05, -1.3);
  group.add(rightCanard);

  // 5. Twin Canted Vertical Stabilizers (Tail Fins)
  const finGeo = new THREE.BoxGeometry(0.04, 0.75, 0.9);
  const leftFin = new THREE.Mesh(finGeo, darkHullMat);
  leftFin.rotation.z = -0.3;
  leftFin.rotation.x = -0.2;
  leftFin.position.set(-0.52, 0.38, 1.2);
  group.add(leftFin);

  const leftFinStrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.78, 0.04), neonPinkMat);
  leftFinStrip.rotation.z = -0.3;
  leftFinStrip.rotation.x = -0.2;
  leftFinStrip.position.set(-0.54, 0.38, 1.6);
  group.add(leftFinStrip);

  const rightFin = new THREE.Mesh(finGeo, darkHullMat);
  rightFin.rotation.z = 0.3;
  rightFin.rotation.x = -0.2;
  rightFin.position.set(0.52, 0.38, 1.2);
  group.add(rightFin);

  const rightFinStrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.78, 0.04), neonPinkMat);
  rightFinStrip.rotation.z = 0.3;
  rightFinStrip.rotation.x = -0.2;
  rightFinStrip.position.set(0.54, 0.38, 1.6);
  group.add(rightFinStrip);

  // 6. Dual High-Output Armored Plasma Thruster Nacelles
  const thrusterHousingMat = new THREE.MeshStandardMaterial({ color: 0x181a24, metalness: 0.9, roughness: 0.2 });
  const thrusterGlowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

  // Left Engine Nacelle
  const leftNacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.4, 8), thrusterHousingMat);
  leftNacelle.rotation.x = Math.PI / 2;
  leftNacelle.position.set(-0.42, 0.04, 1.1);
  group.add(leftNacelle);

  const leftPlasma = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 16), thrusterGlowMat);
  leftPlasma.name = 'leftPlasma';
  leftPlasma.rotation.x = -Math.PI / 2;
  leftPlasma.position.set(-0.42, 0.04, 2.0);
  group.add(leftPlasma);

  // Right Engine Nacelle
  const rightNacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.4, 8), thrusterHousingMat);
  rightNacelle.rotation.x = Math.PI / 2;
  rightNacelle.position.set(0.42, 0.04, 1.1);
  group.add(rightNacelle);

  const rightPlasma = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 16), thrusterGlowMat);
  rightPlasma.name = 'rightPlasma';
  rightPlasma.rotation.x = -Math.PI / 2;
  rightPlasma.position.set(0.42, 0.04, 2.0);
  group.add(rightPlasma);

  // 7. Underwing Laser Emitters & Projector Headlights
  const leftCannon = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), darkAccentMat);
  leftCannon.rotation.x = Math.PI / 2;
  leftCannon.position.set(-1.0, -0.06, 0.3);
  group.add(leftCannon);

  const rightCannon = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), darkAccentMat);
  rightCannon.rotation.x = Math.PI / 2;
  rightCannon.position.set(1.0, -0.06, 0.3);
  group.add(rightCannon);

  // High-Power Forward Projector Spotlights & Illumination Field
  const headlightLight = new THREE.SpotLight(0x00f0ff, 9.0, 95, Math.PI / 3.8, 0.4);
  headlightLight.position.set(0, 0.2, -1.8);
  headlightLight.target.position.set(0, -0.1, -40.0);
  group.add(headlightLight);
  group.add(headlightLight.target);

  const forwardGlow = new THREE.PointLight(0x44ddff, 4.5, 45);
  forwardGlow.position.set(0, 0.4, -2.5);
  group.add(forwardGlow);

  // Hull Shield Protective Forcefield Bubble
  const shieldGeo = new THREE.SphereGeometry(2.1, 16, 12);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
    transparent: true,
    opacity: 0.0,
    depthWrite: false
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.name = 'shieldMesh';
  group.add(shieldMesh);

  return group;
}

/**
 * PHASE 1 — Procedurally generates rich, diverse Cyberpunk Metropolis architecture
 */
export function createCyberpunkCityGroup() {
  const cityGroup = new THREE.Group();
  cityGroup.name = 'cyberpunk-metropolis';

  const colliders = [];

  const neonColors = ['#00f0ff', '#ff0066', '#ffaa00', '#00ff88', '#b026ff'];
  const labels = ['CYBER-NET', 'NEO-TOKYO', 'KUSANAGI', 'NEXUS-9', 'ARASAKA', 'TYRELL', 'OMNI-CORP', 'SHINRA'];

  // Shared dark metal & architectural materials for performance
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x080c14, metalness: 0.9, roughness: 0.3 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x0f141e, metalness: 0.7, roughness: 0.5 });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.85, roughness: 0.2 });

  // 1. Wet Reflective Pitch-Black Road Surface
  const groundGeo = new THREE.PlaneGeometry(350, 350);
  const roadTex = createCyberRoadTexture();
  const groundMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    color: 0x04060c,
    roughness: 0.15,
    metalness: 0.9
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  cityGroup.add(ground);

  // 2. Procedural Skyscraper Generation with Architectural Typologies
  let buildingIndex = 0;

  for (let x = -105; x <= 105; x += 28) {
    for (let z = -125; z <= 125; z += 32) {
      // Keep main flight avenues open
      if (Math.abs(x) < 14) continue;
      if (Math.abs(z) < 10 || Math.abs(z + 60) < 8 || Math.abs(z - 60) < 8) continue;

      buildingIndex++;
      const typology = buildingIndex % 4; // 0: Tiered Spire, 1: Twin Tower, 2: Hex Monolith, 3: Industrial Arcology
      const colorHex = neonColors[buildingIndex % neonColors.length];
      const label = labels[buildingIndex % labels.length];

      const posX = x + (Math.random() - 0.5) * 2;
      const posZ = z + (Math.random() - 0.5) * 2;

      const neonMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 3.0
      });

      // -------------------------------------------------------------
      // Typology 0: Tiered Mega-Spire (Stepped skyscraper with crown)
      // -------------------------------------------------------------
      if (typology === 0) {
        const totalHeight = 85 + Math.random() * 45;
        const baseWidth = 16 + Math.random() * 4;
        const baseDepth = 16 + Math.random() * 4;

        // Base Stage (50% height)
        const baseH = totalHeight * 0.55;
        const baseTex = createSkyscraperTexture('corporate', colorHex, label);
        const baseMat = new THREE.MeshStandardMaterial({ map: baseTex, metalness: 0.7, roughness: 0.3 });
        const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(baseWidth, baseH, baseDepth), baseMat);
        baseMesh.position.set(posX, baseH / 2, posZ);
        cityGroup.add(baseMesh);

        // Middle Tier (Setback)
        const midH = totalHeight * 0.35;
        const midW = baseWidth * 0.7;
        const midD = baseDepth * 0.7;
        const midMesh = new THREE.Mesh(new THREE.BoxGeometry(midW, midH, midD), baseMat);
        midMesh.position.set(posX, baseH + midH / 2, posZ);
        cityGroup.add(midMesh);

        // Crown Spire & Antennas
        const spireH = totalHeight * 0.15;
        const spireMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 1.2, spireH, 6), neonMat);
        spireMesh.position.set(posX, baseH + midH + spireH / 2, posZ);
        cityGroup.add(spireMesh);

        // Glowing Beacon Orb on tip
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), neonMat);
        beacon.position.set(posX, totalHeight + spireH * 0.2, posZ);
        cityGroup.add(beacon);

        // Register AABB collision box
        const box = new THREE.Box3();
        box.setFromCenterAndSize(
          new THREE.Vector3(posX, totalHeight / 2, posZ),
          new THREE.Vector3(baseWidth, totalHeight, baseDepth)
        );
        colliders.push({ box, type: 'building' });
      }

      // -------------------------------------------------------------
      // Typology 1: Twin Tower Complex (Dual towers with skybridge)
      // -------------------------------------------------------------
      else if (typology === 1) {
        const towerH = 65 + Math.random() * 35;
        const tW = 8;
        const tD = 14;
        const separation = 9;

        const twinTex = createSkyscraperTexture('corporate', colorHex, label);
        const twinMat = new THREE.MeshStandardMaterial({ map: twinTex, metalness: 0.8, roughness: 0.25 });

        // Left Tower
        const leftTower = new THREE.Mesh(new THREE.BoxGeometry(tW, towerH, tD), twinMat);
        leftTower.position.set(posX - separation / 2, towerH / 2, posZ);
        cityGroup.add(leftTower);

        // Right Tower
        const rightTower = new THREE.Mesh(new THREE.BoxGeometry(tW, towerH, tD), twinMat);
        rightTower.position.set(posX + separation / 2, towerH / 2, posZ);
        cityGroup.add(rightTower);

        // Skybridge connecting twin towers at 75% height
        const bridgeY = towerH * 0.75;
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(separation + tW, 3.5, 4.5), darkMetalMat);
        bridge.position.set(posX, bridgeY, posZ);
        cityGroup.add(bridge);

        const bridgeNeon = new THREE.Mesh(new THREE.BoxGeometry(separation, 0.3, 4.6), neonMat);
        bridgeNeon.position.set(posX, bridgeY - 1.8, posZ);
        cityGroup.add(bridgeNeon);

        // Rooftop Helipad on Left Tower
        const helipad = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.4, 16), concreteMat);
        helipad.position.set(posX - separation / 2, towerH + 0.2, posZ);
        cityGroup.add(helipad);

        const heliH = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.4), neonMat);
        heliH.position.set(posX - separation / 2, towerH + 0.45, posZ);
        cityGroup.add(heliH);

        // AABB Box
        const box = new THREE.Box3();
        box.setFromCenterAndSize(
          new THREE.Vector3(posX, towerH / 2, posZ),
          new THREE.Vector3(separation + tW + 2, towerH, tD)
        );
        colliders.push({ box, type: 'building' });
      }

      // -------------------------------------------------------------
      // Typology 2: Hexagonal / Monolith Arcology (Angled corners)
      // -------------------------------------------------------------
      else if (typology === 2) {
        const height = 55 + Math.random() * 40;
        const radius = 9 + Math.random() * 3;

        const hexTex = createSkyscraperTexture('arcology', colorHex, label);
        const hexMat = new THREE.MeshStandardMaterial({ map: hexTex, metalness: 0.75, roughness: 0.35 });

        const hexMesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.85, radius, height, 6), hexMat);
        hexMesh.position.set(posX, height / 2, posZ);
        hexMesh.rotation.y = Math.PI / 6;
        cityGroup.add(hexMesh);

        // Cantilevered Upper Terrace
        const terrace = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.05, radius * 0.8, 4, 6), darkMetalMat);
        terrace.position.set(posX, height - 2, posZ);
        cityGroup.add(terrace);

        // Satellite Communications Dish on Roof
        const dish = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.2, 12, 1, true), darkMetalMat);
        dish.rotation.x = Math.PI / 4;
        dish.position.set(posX, height + 2.5, posZ);
        cityGroup.add(dish);

        const box = new THREE.Box3();
        box.setFromCenterAndSize(
          new THREE.Vector3(posX, height / 2, posZ),
          new THREE.Vector3(radius * 2, height, radius * 2)
        );
        colliders.push({ box, type: 'building' });
      }

      // -------------------------------------------------------------
      // Typology 3: Industrial Cyber Plant (Pipes, vents & cooling fans)
      // -------------------------------------------------------------
      else {
        const height = 45 + Math.random() * 30;
        const width = 18;
        const depth = 16;

        const indTex = createSkyscraperTexture('industrial', colorHex, label);
        const indMat = new THREE.MeshStandardMaterial({ map: indTex, metalness: 0.85, roughness: 0.4 });

        const mainBuilding = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), indMat);
        mainBuilding.position.set(posX, height / 2, posZ);
        cityGroup.add(mainBuilding);

        // External Industrial Exhaust Duct Pipes along facade
        const pipeGeo = new THREE.CylinderGeometry(0.5, 0.5, height * 0.85, 8);
        const leftPipe = new THREE.Mesh(pipeGeo, pipeMat);
        leftPipe.position.set(posX - width / 2 - 0.6, height * 0.45, posZ + 3);
        cityGroup.add(leftPipe);

        const rightPipe = new THREE.Mesh(pipeGeo, pipeMat);
        rightPipe.position.set(posX + width / 2 + 0.6, height * 0.45, posZ - 3);
        cityGroup.add(rightPipe);

        // Rooftop Industrial Cooling Turbine Units
        for (let k = -1; k <= 1; k += 2) {
          const turbine = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.5, 12), darkMetalMat);
          turbine.position.set(posX + k * 4.5, height + 1.25, posZ);
          cityGroup.add(turbine);

          // Glowing internal vent ring
          const ventGlow = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 6, 16), neonMat);
          ventGlow.rotation.x = Math.PI / 2;
          ventGlow.position.set(posX + k * 4.5, height + 2.5, posZ);
          cityGroup.add(ventGlow);
        }

        const box = new THREE.Box3();
        box.setFromCenterAndSize(
          new THREE.Vector3(posX, height / 2, posZ),
          new THREE.Vector3(width + 2, height + 4, depth)
        );
        colliders.push({ box, type: 'building' });
      }

      // -------------------------------------------------------------
      // 3D Holographic Advertising Billboards (Random placement)
      // -------------------------------------------------------------
      if (buildingIndex % 3 === 0) {
        const adBrands = [
          { name: 'ARASAKA CYBER', sub: 'NEURAL IMPLANTS V4' },
          { name: 'KUSANAGI', sub: 'HYPER-DRIVE MOTORS' },
          { name: 'NEXUS BIOWARE', sub: 'SYNTHETIC ENHANCEMENTS' },
          { name: 'NEO-RAMEN', sub: '24/7 SYNTH-NOODLES' }
        ];
        const ad = adBrands[buildingIndex % adBrands.length];
        const holoTex = createHoloAdTexture(ad.name, ad.sub, colorHex);

        const holoMat = new THREE.MeshBasicMaterial({
          map: holoTex,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });

        const holoMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), holoMat);
        const adFacingX = posX > 0 ? -1 : 1;
        holoMesh.position.set(posX + adFacingX * 10, 30 + Math.random() * 25, posZ);
        holoMesh.rotation.y = adFacingX > 0 ? -Math.PI / 2 : Math.PI / 2;
        cityGroup.add(holoMesh);

        // Hologram Projector Emitter Bar
        const projector = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 16.5), neonMat);
        projector.position.set(holoMesh.position.x, holoMesh.position.y - 4.2, posZ);
        cityGroup.add(projector);
      }
    }
  }

  // -----------------------------------------------------------------
  // 3. Multi-Level High-Altitude Skybridges with Fly-Through Conduits
  // -----------------------------------------------------------------
  const bridgeConfigs = [
    { y: 28, z: -90, width: 48, height: 3.5, depth: 6 },
    { y: 44, z: -35, width: 48, height: 3.5, depth: 6 },
    { y: 32, z: 25, width: 48, height: 3.5, depth: 6 },
    { y: 58, z: 85, width: 48, height: 3.5, depth: 6 },
    { y: 22, z: -10, width: 48, height: 3.5, depth: 6 }
  ];

  bridgeConfigs.forEach((cfg, idx) => {
    // Heavy Armored Bridge Spans
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth), darkMetalMat);
    bridge.position.set(0, cfg.y, cfg.z);
    cityGroup.add(bridge);

    // Glowing Neon Underbelly Conduits
    const conduitColor = idx % 2 === 0 ? 0x00f0ff : 0xff0066;
    const conduitMat = new THREE.MeshStandardMaterial({
      color: conduitColor,
      emissive: conduitColor,
      emissiveIntensity: 3.0
    });

    const leftConduit = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, cfg.width * 0.95, 8), conduitMat);
    leftConduit.rotation.z = Math.PI / 2;
    leftConduit.position.set(0, cfg.y - cfg.height / 2 - 0.2, cfg.z - 1.8);
    cityGroup.add(leftConduit);

    const rightConduit = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, cfg.width * 0.95, 8), conduitMat);
    rightConduit.rotation.z = Math.PI / 2;
    rightConduit.position.set(0, cfg.y - cfg.height / 2 - 0.2, cfg.z + 1.8);
    cityGroup.add(rightConduit);

    // Fly-Through Center Warning Chevrons
    const chevronBar = new THREE.Mesh(new THREE.BoxGeometry(10, 0.25, 0.25), conduitMat);
    chevronBar.position.set(0, cfg.y - cfg.height / 2 - 0.1, cfg.z);
    cityGroup.add(chevronBar);

    // Register AABB Collider
    const box = new THREE.Box3();
    box.setFromCenterAndSize(
      new THREE.Vector3(0, cfg.y, cfg.z),
      new THREE.Vector3(cfg.width, cfg.height + 1, cfg.depth)
    );
    colliders.push({ box, type: 'bridge' });
  });

  return { cityGroup, colliders };
}
