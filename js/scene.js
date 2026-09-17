/**
 * scene.js
 * Ambient 3D background for the Grade 12 Tenacity grades dashboard.
 *
 * A slow-drifting particle field + wireframe centerpiece rendered with
 * three.js, matching the navy / gold / teal dashboard palette. Responds to
 * pointer position (desktop) and scroll position (all devices) so the
 * background reads as part of the page rather than decoration bolted on.
 *
 * Fails silently if three.js or WebGL is unavailable — the page's existing
 * CSS grid/gradient background is a complete fallback on its own.
 */
(function () {
  "use strict";

  var canvas = document.getElementById("bg-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return; // CSS hides the canvas in this case too.

  var supportsWebGL = (function () {
    try {
      var test = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (test.getContext("webgl") || test.getContext("experimental-webgl")));
    } catch (e) {
      return false;
    }
  })();
  if (!supportsWebGL) return;

  var isFinePointer = window.matchMedia("(pointer: fine)").matches;
  var isSmallScreen = window.innerWidth < 760;

  var COLORS = {
    gold: new THREE.Color(0xD9A441),
    teal: new THREE.Color(0x2BB7A3),
    cream: new THREE.Color(0xF2EFE6)
  };

  var renderer, scene, camera, clock;
  var particles, wireframe;
  var pointerTarget = { x: 0, y: 0 };
  var pointerCurrent = { x: 0, y: 0 };
  var scrollFraction = 0;

  init();
  requestAnimationFrame(animate);

  function init() {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: !isSmallScreen
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 9;

    clock = new THREE.Clock();

    particles = buildParticleField();
    scene.add(particles);

    wireframe = buildWireframeCenterpiece();
    scene.add(wireframe);

    bindEvents();

    // Fade the canvas in once the first frame is on screen.
    requestAnimationFrame(function () {
      canvas.classList.add("ready");
    });
  }

  function buildParticleField() {
    var count = isSmallScreen ? 420 : 1100;
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var sizes = new Float32Array(count);

    for (var i = 0; i < count; i++) {
      var radius = 6 + Math.random() * 9;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(Math.random() * 2 - 1);

      var x = radius * Math.sin(phi) * Math.cos(theta);
      var y = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
      var z = radius * Math.cos(phi) - 4;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      var roll = Math.random();
      var color = roll < 0.46 ? COLORS.gold
        : roll < 0.86 ? COLORS.teal
        : COLORS.cream;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 0.05 + 0.015;
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    var material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    var points = new THREE.Points(geometry, material);
    points.userData.baseRotationSpeed = 0.02;
    return points;
  }

  function buildWireframeCenterpiece() {
    var geometry = new THREE.IcosahedronGeometry(3.1, 1);
    var edges = new THREE.EdgesGeometry(geometry);
    var material = new THREE.LineBasicMaterial({
      color: COLORS.gold,
      transparent: true,
      opacity: 0.09
    });
    var mesh = new THREE.LineSegments(edges, material);
    mesh.position.set(2.4, -0.6, -6);
    return mesh;
  }

  function bindEvents() {
    window.addEventListener("resize", onResize, { passive: true });

    if (isFinePointer) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function onResize() {
    isSmallScreen = window.innerWidth < 760;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onPointerMove(event) {
    pointerTarget.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerTarget.y = (event.clientY / window.innerHeight - 0.5) * 2;
  }

  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scrollFraction = max > 0 ? window.scrollY / max : 0;
  }

  function animate() {
    requestAnimationFrame(animate);

    // Browsers already throttle/pause rAF for hidden tabs; skip the actual
    // scene update too so a background tab does zero extra work.
    if (document.hidden) return;

    var delta = Math.min(clock.getDelta(), 0.1);

    // Smoothly ease toward pointer target for a "drag to look around" feel.
    pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.04;
    pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.04;

    particles.rotation.y += delta * particles.userData.baseRotationSpeed;
    particles.rotation.x = pointerCurrent.y * 0.15 + scrollFraction * 0.4;
    particles.rotation.y += pointerCurrent.x * 0.0006;

    wireframe.rotation.y += delta * 0.06;
    wireframe.rotation.x += delta * 0.015;

    camera.position.x = pointerCurrent.x * 0.5;
    camera.position.y = -pointerCurrent.y * 0.3 - scrollFraction * 0.6;
    camera.position.z = 9 - scrollFraction * 2.5;
    camera.lookAt(0, -scrollFraction * 1.2, -4);

    renderer.render(scene, camera);
  }
})();
