// ============================================================
//  MR. LK STUDIO — Three.js Hero Scene
//  Earth sphere with texture + atmosphere glow + particles
// ============================================================

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class HeroScene {
  constructor() {
    this.canvas      = document.getElementById('hero-canvas');
    this.renderer    = null;
    this.scene       = null;
    this.camera      = null;
    this.composer    = null;
    this.particles   = null;
    this.globe       = null;
    this.atmosphere  = null;
    this.clock       = new THREE.Clock();
    this.mouse       = { x: 0, y: 0 };
    this.smoothMouse = { x: 0, y: 0 };
    this.isVisible   = true;

    this.init();
  }

  // ── Renderer ───────────────────────────────────────────
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas:          this.canvas,
      antialias:       true,
      alpha:           true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace    = THREE.SRGBColorSpace;
  }

  // ── Scene / Camera ─────────────────────────────────────
  setupScene() {
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      55, window.innerWidth / window.innerHeight, 0.1, 200
    );
    this.camera.position.set(0, 0, 6);
  }

  // ── Lights ─────────────────────────────────────────────
  createLights() {
    // Soft ambient so dark side of globe isn't pitch black
    const ambient = new THREE.AmbientLight(0x111122, 1.5);
    this.scene.add(ambient);

    // Crimson key light — comes from upper-right like in the screenshot
    const red = new THREE.DirectionalLight(0xCF2F2F, 3.5);
    red.position.set(5, 3, 4);
    this.scene.add(red);

    // Soft white fill from left
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-4, -1, 2);
    this.scene.add(fill);
  }

  // ── Nebula particles ───────────────────────────────────
  createParticles() {
    const COUNT = 2000;
    const pos   = new Float32Array(COUNT * 3);
    const col   = new Float32Array(COUNT * 3);

    const palette = [
      new THREE.Color(0xCF2F2F),
      new THREE.Color(0xFF4444),
      new THREE.Color(0xF5F5F5),
      new THREE.Color(0x888888),
    ];

    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 4 + Math.pow(Math.random(), 0.4) * 6;

      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta) * 1.5;
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.75;
      pos[i * 3 + 2] = r * Math.cos(phi) * 1.2 - 1;

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3]     = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    const mat = new THREE.PointsMaterial({
      size:            0.022,
      vertexColors:    true,
      transparent:     true,
      opacity:         0.7,
      blending:        THREE.AdditiveBlending,
      depthWrite:      false,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  // ── Earth Globe ────────────────────────────────────────
  createGlobe() {
    const loader  = new THREE.TextureLoader();
    const texture = loader.load('assets/earth-texture.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;

    // Main sphere — high segment count for smooth silhouette
    const geo = new THREE.SphereGeometry(1.65, 64, 64);

    const mat = new THREE.MeshStandardMaterial({
      map:             texture,
      roughness:       0.85,
      metalness:       0.05,
      // Darken oceans naturally — the texture already handles it
    });

    this.globe = new THREE.Mesh(geo, mat);
    // Position to the right, matching the screenshot layout
    this.globe.position.set(2.0, -0.1, 0);
    // Tilt slightly so Atlantic faces camera (like the screenshot)
    this.globe.rotation.y = -0.6;
    this.scene.add(this.globe);

    // ── Atmosphere glow (additive shell) ──
    this.createAtmosphere();
  }

  // ── Atmosphere — custom shader ─────────────────────────
  createAtmosphere() {
    // Slightly bigger than the globe
    const geo = new THREE.SphereGeometry(1.82, 64, 64);

    const mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */`
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal   = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          // Fresnel — strong at edges, fades in center
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.5);
          intensity = clamp(intensity, 0.0, 1.0);

          // Crimson glow matching site palette
          vec3 glowColor = vec3(0.81, 0.12, 0.12); // #CF2F2F
          gl_FragColor = vec4(glowColor, intensity * 0.9);
        }
      `,
      side:        THREE.FrontSide,
      blending:    THREE.AdditiveBlending,
      transparent: true,
      depthWrite:  false,
    });

    this.atmosphere = new THREE.Mesh(geo, mat);
    this.atmosphere.position.copy(this.globe.position);
    this.scene.add(this.atmosphere);
  }

  // ── Post Processing — Bloom ────────────────────────────
  setupPostProcessing() {
    const bW = Math.floor(window.innerWidth  / 2);
    const bH = Math.floor(window.innerHeight / 2);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(bW, bH),
      0.65,   // strength
      0.45,   // radius
      0.82    // threshold
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

    // Pause when scrolled out of view
    const obs = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
    }, { threshold: 0 });
    obs.observe(this.canvas);
  }

  // ── Animation Loop ─────────────────────────────────────
  tick() {
    requestAnimationFrame(() => this.tick());
    if (!this.isVisible || document.hidden) return;

    const elapsed = this.clock.getElapsedTime();

    // Smooth mouse lerp
    this.smoothMouse.x += (this.mouse.x - this.smoothMouse.x) * 0.04;
    this.smoothMouse.y += (this.mouse.y - this.smoothMouse.y) * 0.04;

    // Particles drift slowly
    this.particles.rotation.y = elapsed * 0.035;
    this.particles.rotation.x = elapsed * 0.012;

    // Globe slow spin on Y axis
    this.globe.rotation.y += 0.0018;

    // Subtle vertical bob
    this.globe.position.y     = -0.1 + Math.sin(elapsed * 0.5) * 0.08;
    this.atmosphere.position.y = this.globe.position.y;

    // Keep atmosphere in sync with globe rotation
    this.atmosphere.rotation.y = this.globe.rotation.y;

    // Camera parallax — gentle, not distracting
    this.camera.position.x = this.smoothMouse.x * 0.8;
    this.camera.position.y = this.smoothMouse.y * 0.5;
    this.camera.lookAt(this.scene.position);

    this.composer.render();
  }

  // ── Entry point ────────────────────────────────────────
  init() {
    this.setupRenderer();
    this.setupScene();
    this.createLights();
    this.createParticles();
    this.createGlobe();
    this.setupPostProcessing();
    this.bindEvents();
    this.tick();
  }
}
