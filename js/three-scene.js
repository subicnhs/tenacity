/* ============================================================
   THREE-SCENE.JS
   Floating "circuit panel" field behind the hero / page.
   Lightweight: low poly counts, no postprocessing, capped DPR.
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 11);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // ---- lighting ----
  const ambient = new THREE.AmbientLight(0x4a5a7a, 1.1);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xd9a441, 1.2);
  keyLight.position.set(4, 6, 8);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x2bb7a3, 0.8);
  rimLight.position.set(-6, -3, -4);
  scene.add(rimLight);

  // ---- panel field (stand-ins for student/project "cards") ----
  const PANEL_COUNT = window.innerWidth < 760 ? 9 : 16;
  const panels = [];
  const group = new THREE.Group();
  scene.add(group);

  const panelGeo = new THREE.BoxGeometry(1.15, 0.75, 0.04);
  const edgesGeo = new THREE.EdgesGeometry(panelGeo);

  const colors = [0xd9a441, 0x2bb7a3, 0xe2614f];

  for (let i = 0; i < PANEL_COUNT; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x131d30,
      metalness: 0.35,
      roughness: 0.55,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(panelGeo, mat);

    const lineColor = colors[i % colors.length];
    const edgeMat = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.85 });
    const edges = new THREE.LineSegments(edgesGeo, edgeMat);
    mesh.add(edges);

    const radius = 4.2 + Math.random() * 3.5;
    const angle = (i / PANEL_COUNT) * Math.PI * 2;
    mesh.position.set(
      Math.cos(angle) * radius * 0.9,
      Math.sin(angle) * radius * 0.5 + (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 6 - 2
    );
    mesh.rotation.set(
      (Math.random() - 0.5) * 0.6,
      (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * 0.3
    );

    mesh.userData.baseY = mesh.position.y;
    mesh.userData.floatSpeed = 0.4 + Math.random() * 0.5;
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    mesh.userData.rotSpeed = (Math.random() - 0.5) * 0.15;

    group.add(mesh);
    panels.push(mesh);
  }

  // ---- subtle particle dust ----
  const dustCount = window.innerWidth < 760 ? 80 : 160;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 20;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: 0xf2efe6, size: 0.02, transparent: true, opacity: 0.35 });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // ---- mouse parallax ----
  let mouseX = 0, mouseY = 0;
  let targetRotX = 0, targetRotY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // ---- scroll parallax: rotate the whole field as user scrolls ----
  let scrollY = window.scrollY;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  // ---- resize ----
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // ---- render loop ----
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!prefersReducedMotion) {
      targetRotY += (mouseX * 0.35 - targetRotY) * 0.04;
      targetRotX += (mouseY * 0.2 - targetRotX) * 0.04;
      group.rotation.y = targetRotY + scrollY * 0.0006;
      group.rotation.x = targetRotX;

      dust.rotation.y = t * 0.015;

      panels.forEach((p) => {
        p.position.y = p.userData.baseY + Math.sin(t * p.userData.floatSpeed + p.userData.floatOffset) * 0.25;
        p.rotation.z += p.userData.rotSpeed * 0.01;
      });
    }

    renderer.render(scene, camera);
  }

  animate();

  window.__tenacityScene = { scene, camera, renderer, group };
})();