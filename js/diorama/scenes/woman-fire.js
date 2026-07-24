import * as THREE from 'three';
import { addPaperEdges, createPaperMaterial } from '../paper-material.js';

const TEXT = [
  'LA CUMBRE DE LAS BRUJAS',
  'Laura Bolognesi',
  'página · fuego · memoria',
  'fragmento interior'
];

export async function createScene({ parent, profile }) {
  const root = new THREE.Group();
  root.name = 'woman-fire-diorama';
  parent.add(root);

  const paper = createPaperMaterial({ color: '#eee8dc', ink: '#765e54', snippets: TEXT, seed: 21, textOpacity: 0 });
  const printedPaper = createPaperMaterial({ color: '#e7dece', ink: '#6b5149', snippets: TEXT, seed: 26, textOpacity: .5 });
  const winePaper = createPaperMaterial({ color: '#8c5360', ink: '#2d1119', accent: '#7b1731', snippets: TEXT, seed: 32, textOpacity: .24 });
  const darkPaper = createPaperMaterial({ color: '#3e4548', ink: '#d8c0a2', snippets: TEXT, seed: 44, textOpacity: 0 });
  const flamePaper = createPaperMaterial({ color: '#ff8a3d', ink: '#7f161d', accent: '#ff3d17', snippets: ['fuego', 'brasas', 'la noche'], seed: 53 });
  const pagePaper = createPaperMaterial({ color: '#cbb89d', ink: '#5b3a39', snippets: TEXT, seed: 68 });

  const page = mesh(new THREE.BoxGeometry(2.65, .055, 1.72, 1, 1, 1), pagePaper, 0x5a3833, .42);
  page.position.y = -.03;
  page.receiveShadow = profile.shadows;
  root.add(page);

  const spine = mesh(new THREE.BoxGeometry(.055, .075, 1.7), darkPaper, 0x321a1c, .58);
  spine.position.set(-1.29, .005, 0);
  root.add(spine);

  const women = createWomenCircle({ paper, printedPaper, winePaper, darkPaper, profile });
  root.add(women);

  const fire = createFire({ paper, darkPaper, flamePaper, profile });
  fire.group.position.set(0, .03, 0);
  fire.group.scale.setScalar(.82);
  root.add(fire.group);

  const popupFold = mesh(new THREE.BoxGeometry(1.95, .018, .035), winePaper, 0x4a2228, .45);
  popupFold.position.set(0, .018, -.42);
  root.add(popupFold);

  root.scale.set(1, .001, 1);
  root.rotation.x = -Math.PI * .48;
  let revealStarted = performance.now();

  const replay = () => {
    revealStarted = performance.now();
    root.scale.y = .001;
    root.rotation.x = -Math.PI * .48;
  };

  const update = (time) => {
    const elapsed = Math.max(0, (time - revealStarted) / 1550);
    const reveal = easeOutBack(Math.min(1, elapsed));
    root.scale.y = Math.max(.001, reveal);
    root.rotation.x = THREE.MathUtils.lerp(-Math.PI * .48, 0, easeInOut(Math.min(1, elapsed)));

    women.userData.update?.(time);
    fire.update(time);
  };

  const dispose = () => {
    root.traverse((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach(disposeMaterial);
      else disposeMaterial(object.material);
    });
    root.removeFromParent();
  };

  return { root, update, replay, dispose };
}

function createWomenCircle({ paper, printedPaper, winePaper, darkPaper, profile }) {
  const circle = new THREE.Group();
  const figures = [];
  const count = 6;
  const radiusX = .87;
  const radiusZ = .57;

  for (let index = 0; index < count; index += 1) {
    const angle = -Math.PI * .5 + index * Math.PI * 2 / count;
    const figure = createStandingWoman({
      paper,
      printedPaper,
      winePaper,
      darkPaper,
      shadows: profile.shadows,
      variant: index
    });
    figure.position.set(Math.cos(angle) * radiusX, .035, Math.sin(angle) * radiusZ);
    figure.rotation.y = -Math.PI * .5 - angle;
    figure.scale.setScalar(.67);
    figure.userData.baseY = figure.position.y;
    figure.userData.phase = index * .62;
    figures.push(figure);
    circle.add(figure);
  }

  circle.userData.update = (time) => {
    // Doce poses discretas forman un ciclo de tres segundos: stop-motion de papel.
    const pose = Math.floor(time / 250) % 12;
    const cycle = pose / 12 * Math.PI * 2;
    figures.forEach((figure, index) => {
      const sway = Math.sin(cycle + figure.userData.phase);
      const breath = Math.sin(cycle * 2 + figure.userData.phase * .45);
      figure.rotation.z = sway * .022;
      figure.position.y = figure.userData.baseY + Math.max(0, breath) * .008;
      figure.userData.pose?.(sway, breath, index);
    });
  };

  return circle;
}

function createStandingWoman({ paper, printedPaper, winePaper, darkPaper, shadows, variant }) {
  const woman = new THREE.Group();
  const printOnLeft = variant % 2 === 0;

  // Núcleo facetado: mantiene cada silueta legible cuando se mira de costado.
  const skirtCore = mesh(
    new THREE.ConeGeometry(.31, .72, 5, 1, false),
    variant % 2 ? paper : printedPaper,
    0x80695c,
    .38
  );
  skirtCore.position.y = .4;
  skirtCore.rotation.y = variant * .37;
  woman.add(skirtCore);

  const torsoCore = mesh(
    new THREE.CylinderGeometry(.15, .22, .43, 5, 1, false),
    paper,
    0x755e54,
    .42
  );
  torsoCore.position.y = .91;
  torsoCore.rotation.y = .25 + variant * .21;
  woman.add(torsoCore);

  const headCore = mesh(new THREE.OctahedronGeometry(.155, 0), paper, 0x6d554c, .48);
  headCore.scale.set(.84, 1.08, .88);
  headCore.position.set(0, 1.37, 0);
  woman.add(headCore);

  const leftArmCore = foldedLimb(
    new THREE.Vector3(-.18, 1.02, 0),
    new THREE.Vector3(-.53, .76, 0),
    paper
  );
  woman.add(leftArmCore);

  const rightArmCore = foldedLimb(
    new THREE.Vector3(.18, 1.02, 0),
    new THREE.Vector3(.53, .76, 0),
    paper
  );
  woman.add(rightArmCore);

  const hairBack = panel([
    [-.31, .91], [-.36, 1.27], [-.26, 1.5], [-.03, 1.58],
    [.2, 1.5], [.3, 1.28], [.19, 1.03], [.05, .91]
  ], .075, darkPaper, 0x202629, .78);
  hairBack.position.z = -.07;
  woman.add(hairBack);

  const leftSkirt = panel([
    [-.04, .73], [-.38, .05], [-.06, .08], [.02, .69]
  ], .052, printOnLeft ? printedPaper : paper, 0x80695c, .5);
  leftSkirt.position.z = -.015;
  leftSkirt.rotation.y = .12;
  woman.add(leftSkirt);

  const centerSkirt = panel([
    [-.04, .73], [-.06, .08], [.16, .04], [.09, .7]
  ], .06, paper, 0x80695c, .54);
  centerSkirt.position.z = .04;
  centerSkirt.rotation.y = -.12;
  woman.add(centerSkirt);

  const rightSkirt = panel([
    [.09, .7], [.16, .04], [.4, .09], [.18, .71]
  ], .052, printOnLeft ? paper : printedPaper, 0x80695c, .5);
  rightSkirt.position.z = -.01;
  rightSkirt.rotation.y = .1;
  woman.add(rightSkirt);

  const torso = panel([
    [-.2, .7], [-.24, 1.04], [-.12, 1.19], [.12, 1.18],
    [.24, 1.03], [.18, .71], [0, .62]
  ], .095, paper, 0x755e54, .58);
  torso.position.z = .025;
  woman.add(torso);

  const collar = panel([
    [-.17, 1.13], [0, .91], [.17, 1.13], [.08, 1.21], [0, 1.08], [-.08, 1.21]
  ], .1, variant === 3 ? winePaper : paper, 0x694c46, .68);
  collar.position.z = .09;
  woman.add(collar);

  const neck = panel([
    [-.07, 1.15], [.07, 1.15], [.09, 1.31], [-.08, 1.31]
  ], .07, paper, 0x755e54, .5);
  woman.add(neck);

  const face = panel([
    [-.14, 1.3], [-.12, 1.47], [-.02, 1.55], [.13, 1.5],
    [.16, 1.43], [.22, 1.39], [.16, 1.35], [.17, 1.29],
    [.09, 1.23], [-.04, 1.23]
  ], .085, paper, 0x6d554c, .62);
  face.position.z = .035;
  woman.add(face);

  const hairCrown = panel([
    [-.27, 1.43], [-.16, 1.59], [.08, 1.63], [.25, 1.51],
    [.1, 1.45], [-.08, 1.47]
  ], .1, darkPaper, 0x171c1e, .84);
  hairCrown.position.z = .08;
  woman.add(hairCrown);

  const hairFold = panel([
    [-.23, 1.43], [.05, 1.57], [.2, 1.49], [-.08, 1.42]
  ], .11, darkPaper, 0x171c1e, .82);
  hairFold.position.z = .15;
  woman.add(hairFold);

  const leftArm = panel([
    [-.19, 1.07], [-.28, .99], [-.5, .83], [-.55, .77],
    [-.48, .72], [-.21, .86], [-.11, 1.02]
  ], .064, paper, 0x755e54, .56);
  leftArm.position.z = .035;
  woman.add(leftArm);

  const rightArm = panel([
    [.18, 1.07], [.28, .99], [.5, .83], [.55, .77],
    [.48, .72], [.21, .86], [.1, 1.02]
  ], .064, paper, 0x755e54, .56);
  rightArm.position.z = .03;
  woman.add(rightArm);

  const leftHand = mesh(new THREE.OctahedronGeometry(.055, 0), paper, 0x755e54, .46);
  leftHand.position.set(-.54, .76, .035);
  woman.add(leftHand);

  const rightHand = mesh(new THREE.OctahedronGeometry(.055, 0), paper, 0x755e54, .46);
  rightHand.position.set(.54, .76, .03);
  woman.add(rightHand);

  const waistFold = panel([
    [-.21, .74], [0, .62], [.22, .74], [.08, .8], [0, .73], [-.08, .8]
  ], .082, variant % 3 === 0 ? winePaper : paper, 0x664a43, .54);
  waistFold.position.z = .1;
  woman.add(waistFold);

  woman.userData.pose = (sway, breath) => {
    hairFold.rotation.z = sway * .018;
    hairCrown.rotation.z = sway * -.009;
    leftArm.rotation.z = breath * .006;
    rightArm.rotation.z = breath * -.006;
    centerSkirt.rotation.y = -.12 + sway * .025;
  };

  woman.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = shadows;
    object.receiveShadow = shadows;
  });
  return woman;
}

function panel(points, depth, material, edgeColor, edgeOpacity) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1,
    steps: 1
  });
  geometry.translate(0, 0, -depth * .5);
  geometry.computeVertexNormals();
  return mesh(geometry, material, edgeColor, edgeOpacity);
}

function foldedLimb(start, end, material) {
  const direction = end.clone().sub(start);
  const limb = mesh(
    new THREE.CylinderGeometry(.042, .058, direction.length(), 4, 1, false),
    material,
    0x755e54,
    .48
  );
  limb.position.copy(start).add(end).multiplyScalar(.5);
  limb.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );
  return limb;
}

function createFire({ paper, darkPaper, flamePaper, profile }) {
  const group = new THREE.Group();
  const flames = [];
  const smoke = [];

  for (let index = 0; index < 5; index += 1) {
    const log = mesh(new THREE.CylinderGeometry(.075, .075, .72, 6), index % 2 ? darkPaper : paper, 0x361a19, .72);
    log.rotation.z = Math.PI * .5;
    log.rotation.y = index * 1.18;
    log.position.y = .12 + (index % 2) * .025;
    log.castShadow = profile.shadows;
    group.add(log);
  }

  const flameHeights = profile.tier === 'low' ? [.58, .44, .33] : [.68, .54, .45, .35, .29];
  flameHeights.forEach((height, index) => {
    const flame = mesh(new THREE.ConeGeometry(.18 - index * .014, height, 5, 1, false), flamePaper, 0x8f241d, .38);
    flame.position.set((index - 2) * .09, .27 + height * .38, (index % 2 - .5) * .12);
    flame.rotation.y = index * .72;
    flame.userData.phase = index * 1.37;
    flame.userData.baseY = flame.position.y;
    flames.push(flame);
    group.add(flame);
  });

  const emberGeometry = new THREE.BufferGeometry();
  const emberPositions = new Float32Array(profile.embers * 3);
  const emberSeeds = new Float32Array(profile.embers * 4);
  for (let index = 0; index < profile.embers; index += 1) {
    emberSeeds[index * 4] = (Math.random() - .5) * .54;
    emberSeeds[index * 4 + 1] = Math.random();
    emberSeeds[index * 4 + 2] = (Math.random() - .5) * .42;
    emberSeeds[index * 4 + 3] = Math.random() * 2.6;
  }
  emberGeometry.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
  const embers = new THREE.Points(
    emberGeometry,
    new THREE.PointsMaterial({ color: 0xffb25e, size: .035, transparent: true, opacity: .84, depthWrite: false })
  );
  group.add(embers);

  for (let index = 0; index < profile.smoke; index += 1) {
    const puff = new THREE.Mesh(
      new THREE.IcosahedronGeometry(.13 + index * .012, 0),
      new THREE.MeshBasicMaterial({ color: 0x9f8d87, transparent: true, opacity: .1, depthWrite: false })
    );
    puff.userData.phase = index / Math.max(1, profile.smoke);
    smoke.push(puff);
    group.add(puff);
  }

  const light = new THREE.PointLight(0xff5f28, profile.tier === 'high' ? 3.2 : 2.2, 3.1, 2);
  light.position.set(0, .55, .15);
  light.castShadow = profile.shadows;
  if (profile.shadows) light.shadow.mapSize.set(512, 512);
  group.add(light);

  const update = (time) => {
    const seconds = time * .001;
    flames.forEach((flame) => {
      const pulse = 1 + Math.sin(seconds * 5.2 + flame.userData.phase) * .11;
      flame.scale.set(1 / pulse, pulse, 1 / pulse);
      flame.position.y = flame.userData.baseY + Math.sin(seconds * 4 + flame.userData.phase) * .018;
      flame.rotation.z = Math.sin(seconds * 3.3 + flame.userData.phase) * .08;
    });
    light.intensity = (profile.tier === 'high' ? 3.1 : 2.1) + Math.sin(seconds * 8.4) * .42;

    const positions = embers.geometry.attributes.position.array;
    for (let index = 0; index < profile.embers; index += 1) {
      const offset = index * 3;
      const seed = index * 4;
      const travel = (seconds * (.17 + emberSeeds[seed + 1] * .22) + emberSeeds[seed + 3]) % 1;
      positions[offset] = emberSeeds[seed] + Math.sin(seconds * 2.1 + index) * .035;
      positions[offset + 1] = .34 + travel * 1.12;
      positions[offset + 2] = emberSeeds[seed + 2];
    }
    embers.geometry.attributes.position.needsUpdate = true;

    smoke.forEach((puff, index) => {
      const travel = (seconds * .12 + puff.userData.phase) % 1;
      puff.position.set(Math.sin(seconds + index) * .11, .55 + travel * 1.22, Math.cos(seconds * .7 + index) * .08);
      puff.scale.setScalar(.55 + travel * 1.7);
      puff.material.opacity = Math.sin(Math.PI * travel) * .105;
    });
  };

  return { group, update };
}

function mesh(geometry, material, edgeColor, edgeOpacity) {
  return addPaperEdges(new THREE.Mesh(geometry, material), edgeColor, edgeOpacity);
}

function disposeMaterial(material) {
  if (!material) return;
  material.map?.dispose?.();
  material.dispose?.();
}

function easeInOut(value) {
  return value < .5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}
