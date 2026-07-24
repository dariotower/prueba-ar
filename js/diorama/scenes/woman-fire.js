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

  const paper = createPaperMaterial({ snippets: TEXT, seed: 21 });
  const winePaper = createPaperMaterial({ color: '#8c5360', ink: '#2d1119', accent: '#7b1731', snippets: TEXT, seed: 32 });
  const darkPaper = createPaperMaterial({ color: '#50383a', ink: '#d8c0a2', snippets: TEXT, seed: 44 });
  const flamePaper = createPaperMaterial({ color: '#ff8a3d', ink: '#7f161d', accent: '#ff3d17', snippets: ['fuego', 'brasas', 'la noche'], seed: 53 });
  const pagePaper = createPaperMaterial({ color: '#cbb89d', ink: '#5b3a39', snippets: TEXT, seed: 68 });

  const page = mesh(new THREE.BoxGeometry(2.65, .055, 1.72, 1, 1, 1), pagePaper, 0x5a3833, .42);
  page.position.y = -.03;
  page.receiveShadow = profile.shadows;
  root.add(page);

  const spine = mesh(new THREE.BoxGeometry(.055, .075, 1.7), darkPaper, 0x321a1c, .58);
  spine.position.set(-1.29, .005, 0);
  root.add(spine);

  const woman = createWoman({ paper, winePaper, darkPaper, shadows: profile.shadows });
  woman.position.set(-.58, .02, .05);
  root.add(woman);

  const fire = createFire({ paper, darkPaper, flamePaper, profile });
  fire.group.position.set(.58, .03, .06);
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

    woman.rotation.z = Math.sin(time * .00072) * .012;
    woman.children[3].rotation.z = -.5 + Math.sin(time * .0011) * .08;
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

function createWoman({ paper, winePaper, darkPaper, shadows }) {
  const woman = new THREE.Group();

  const skirt = mesh(new THREE.ConeGeometry(.34, .68, 4, 1, false), winePaper, 0x3b171e, .72);
  skirt.position.y = .38;
  skirt.rotation.y = Math.PI * .25;
  woman.add(skirt);

  const torso = mesh(new THREE.OctahedronGeometry(.245, 0), paper, 0x513332, .6);
  torso.scale.set(.72, 1.15, .62);
  torso.position.y = .92;
  woman.add(torso);

  const head = mesh(new THREE.OctahedronGeometry(.16, 0), paper, 0x513332, .58);
  head.scale.set(.84, 1.08, .8);
  head.position.y = 1.27;
  head.rotation.y = -.22;
  woman.add(head);

  const leftArm = mesh(new THREE.ConeGeometry(.075, .53, 3), paper, 0x513332, .54);
  leftArm.position.set(-.29, .87, .03);
  leftArm.rotation.z = -.5;
  leftArm.rotation.x = .08;
  woman.add(leftArm);

  const rightArm = mesh(new THREE.ConeGeometry(.075, .52, 3), paper, 0x513332, .54);
  rightArm.position.set(.29, .9, .03);
  rightArm.rotation.z = .62;
  woman.add(rightArm);

  const hair = mesh(new THREE.ConeGeometry(.19, .39, 5, 1, true), darkPaper, 0x2d1719, .7);
  hair.position.set(-.02, 1.29, -.065);
  hair.rotation.z = .18;
  hair.rotation.x = -.22;
  woman.add(hair);

  const shoulderFold = mesh(new THREE.ConeGeometry(.31, .24, 4, 1, true), darkPaper, 0x2d1719, .58);
  shoulderFold.position.y = 1.03;
  shoulderFold.rotation.y = Math.PI * .25;
  woman.add(shoulderFold);

  woman.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = shadows;
    object.receiveShadow = shadows;
  });
  return woman;
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
