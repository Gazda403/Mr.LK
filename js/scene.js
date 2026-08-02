// ============================================================
//  MR. LK STUDIO — Three.js Hero Scene
//  Gold torus knot + nebula particle system + bloom
// ============================================================

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export class HeroScene {
  constructor() {
    this.canvas    = document.getElementById('hero-canvas');
    this.renderer  = null;
    this.scene     = null;
    this.camera    = null;
    this.composer  = null;
    this.particles = null;
    this.heroMesh  = null;
    this.clock     = new THREE.Clock();
    this.mouse     = { x: 0, y: 0 };
    this.smoothMouse = { x: 0, y: 0 };
    this.isVisible = true;

    this.init();
  }

  init() {
    this.setupRenderer();
    this.setupScene();
    this.createLights();
    this.createParticles();
    this.createHeroObject();
    this.setupPostProcessing();
    this.bindEvents();
    this.tick();
  }

  // ── Renderer ───────────────────────────────────────────
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas:    this.canvas,
      antialias: true,
      alpha:     true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace    = THREE.SRGBColorSpace;
  }

  // ── Scene / Camera ─────────────────────────────────────
  setupScene() {
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      65, window.innerWidth / window.innerHeight, 0.1, 200
    );
    this.camera.position.set(0, 0, 6);
  }

  // ── Lights ─────────────────────────────────────────────
  createLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // Crimson key light
    const red = new THREE.PointLight(0xCF2F2F, 18, 20);
    red.position.set(4, 3, 4);
    this.scene.add(red);

    // White fill
    const white = new THREE.PointLight(0xFFFFFF, 8, 15);
    white.position.set(-4, -1, 3);
    this.scene.add(white);

    // Grey rim
    const grey = new THREE.PointLight(0x666666, 5, 15);
    grey.position.set(0, -4, 1);
    this.scene.add(grey);
  }

  // ── Particles — nebula cloud ───────────────────────────
  createParticles() {
    const COUNT = 2500;
    const pos   = new Float32Array(COUNT * 3);
    const col   = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);

    const redColor    = new THREE.Color(0xCF2F2F);
    const brightRed   = new THREE.Color(0xFF4444);
    const whiteColor  = new THREE.Color(0xF5F5F5);
    const greyColor   = new THREE.Color(0x888888);

    for (let i = 0; i < COUNT; i++) {
      // Spread across a stretched ellipsoid shape
      const u     = Math.random();
      const v     = Math.random();
      const theta = u * Math.PI * 2;
      const phi   = Math.acos(2 * v - 1);
      const r     = 3.5 + Math.pow(Math.random(), 0.5) * 5;

      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta) * 1.6;
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8;
      pos[i * 3 + 2] = r * Math.cos(phi) * 1.2 - 2;

      sizes[i] = Math.random() * 2 + 0.5;

      // Color distribution: mostly white/grey, accented with crimson
      const pick = Math.random();
      let c;
      if      (pick < 0.55) c = whiteColor;
      else if (pick < 0.75) c = greyColor;
      else if (pick < 0.90) c = redColor;
      else                  c = brightRed;

      col[i * 3]     = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos,   3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col,   3));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size:         0.025,
      vertexColors: true,
      transparent:  true,
      opacity:      0.75,
      blending:     THREE.AdditiveBlending,
      depthWrite:   false,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  // ── Hero Object — gold torus knot ──────────────────────
  createHeroObject() {
    const geo = new THREE.TorusKnotGeometry(1.1, 0.38, 200, 24, 2, 3);

    const mat = new THREE.MeshStandardMaterial({
      color:       new THREE.Color(0xCF2F2F),
      metalness:   0.92,
      roughness:   0.12,
      envMapIntensity: 2.8,
    });

    // Simple env map via PMREMGenerator
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    pmrem.dispose();

    this.heroMesh = new THREE.Mesh(geo, mat);
    this.heroMesh.position.set(2.2, 0, 0);
    this.scene.add(this.heroMesh);

    // Wireframe accent overlay
    const wfMat = new THREE.MeshBasicMaterial({
      color:     0xFF4444,
      wireframe: true,
      transparent: true,
      opacity:   0.05,
    });
    const wfMesh = new THREE.Mesh(geo, wfMat);
    this.heroMesh.add(wfMesh);
  }

  // ── Post Processing — Bloom ────────────────────────────
  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.7,    // strength — slightly stronger for red impact
      0.4,    // radius
      0.80    // threshold — lower so red pops more
    );
    this.composer.addPass(bloom);
  }

  // ── Events ─────────────────────────────────────────────
  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
    });

    // Pause rendering when out of viewport
    const obs = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
    }, { threshold: 0 });
    obs.observe(this.canvas);
  }

  // ── Animation Loop ─────────────────────────────────────
  tick() {
    requestAnimationFrame(() => this.tick());
    if (!this.isVisible) return;

    const elapsed = this.clock.getElapsedTime();

    // Smooth mouse lerp
    this.smoothMouse.x += (this.mouse.x - this.smoothMouse.x) * 0.04;
    this.smoothMouse.y += (this.mouse.y - this.smoothMouse.y) * 0.04;

    // Particles drift
    this.particles.rotation.y  = elapsed * 0.04;
    this.particles.rotation.x  = elapsed * 0.015;

    // Mouse velocity inertia response
    const mouseVelX = (this.mouse.x - this.smoothMouse.x);
    const mouseVelY = (this.mouse.y - this.smoothMouse.y);

    // Hero object spin
    this.heroMesh.rotation.x = elapsed * 0.28 + mouseVelY * 0.4;
    this.heroMesh.rotation.y = elapsed * 0.45 + mouseVelX * 0.4;
    this.heroMesh.rotation.z = elapsed * 0.12;

    // Subtle bobbing
    this.heroMesh.position.y = Math.sin(elapsed * 0.6) * 0.15;

    // Camera parallax from mouse
    this.camera.position.x = this.smoothMouse.x * 1.2;
    this.camera.position.y = this.smoothMouse.y * 0.7;
    this.camera.lookAt(this.scene.position);

    this.composer.render();
  }
}
