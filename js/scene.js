// ============================================================
//  MR. LK STUDIO — Three.js Hero Scene
//  Earth sphere with texture + atmosphere glow + particles
//  No postprocessing — pure renderer for maximum compatibility
// ============================================================

import * as THREE from 'three';

export class HeroScene {
  constructor() {
    this.canvas      = document.getElementById('hero-canvas');
    if (!this.canvas) {
      console.warn('[HeroScene] #hero-canvas not found');
      return;
    }

    this.renderer    = null;
    this.scene       = null;
    this.camera      = null;
    this.particles   = null;
    this.globe       = null;
    this.atmosphere  = null;
    this.clock       = new THREE.Clock();
    this.mouse       = { x: 0, y: 0 };
    this.smoothMouse = { x: 0, y: 0 };
    this.isVisible   = true;
    this._rafId      = null;

    this._init();
  }

  // ── Renderer ───────────────────────────────────────────
  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas:          this.canvas,
      antialias:       true,
      alpha:           true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace    = THREE.SRGBColorSpace;
    console.log('[HeroScene] Renderer OK');
  }

  // ── Scene / Camera ─────────────────────────────────────
  _setupScene() {
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      55, window.innerWidth / window.innerHeight, 0.1, 200
    );
    this.camera.position.set(0, 0, 6);
  }

  // ── Lights ─────────────────────────────────────────────
  _createLights() {
    this.scene.add(new THREE.AmbientLight(0x221111, 2.5));

    const key = new THREE.DirectionalLight(0xCF2F2F, 4.0);
    key.position.set(5, 3, 4);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 1.0);
    fill.position.set(-4, -1, 3);
    this.scene.add(fill);
  }

  // ── Particle cloud ─────────────────────────────────────
  _createParticles() {
    const COUNT = 1500;
    const pos   = new Float32Array(COUNT * 3);
    const col   = new Float32Array(COUNT * 3);

    const palette = [
      new THREE.Color(0xCF2F2F),
      new THREE.Color(0xFF4444),
      new THREE.Color(0xF5F5F5),
      new THREE.Color(0x999999),
    ];

    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 4 + Math.pow(Math.random(), 0.4) * 6;
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta) * 1.5;
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.75;
      pos[i*3+2] = r * Math.cos(phi) * 1.2 - 1;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.025, vertexColors: true, transparent: true,
      opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.scene.add(this.particles);
  }

  // ── Earth Globe ────────────────────────────────────────
  _createGlobe() {
    const geo = new THREE.SphereGeometry(1.65, 64, 64);

    // Start with visible crimson material immediately
    const mat = new THREE.MeshPhongMaterial({
      color:    0x8B1010,
      emissive: 0x2A0000,
      shininess: 20,
    });

    this.globe = new THREE.Mesh(geo, mat);
    this.globe.position.set(2.0, -0.1, 0);
    this.globe.rotation.y = -0.6;
    this.scene.add(this.globe);

    console.log('[HeroScene] Globe added at', this.globe.position);

    // Load earth texture — upgrades material once ready
    new THREE.TextureLoader().load(
      './assets/earth-texture.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.map     = tex;
        mat.color   = new THREE.Color(0xffffff);
        mat.emissive = new THREE.Color(0x000000);
        mat.needsUpdate = true;
        console.log('[HeroScene] Texture loaded ✓');
      },
      undefined,
      (err) => {
        console.warn('[HeroScene] Texture load failed, using fallback color:', err);
      }
    );

    this._createAtmosphere();
  }

  // ── Atmosphere Glow ────────────────────────────────────
  _createAtmosphere() {
    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float i = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
          gl_FragColor = vec4(0.81, 0.18, 0.12, clamp(i, 0.0, 1.0) * 0.85);
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });

    this.atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.85, 64, 64),
      mat
    );
    this.atmosphere.position.copy(this.globe.position);
    this.scene.add(this.atmosphere);
  }

  // ── Events ─────────────────────────────────────────────
  _bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        ([e]) => { this.isVisible = e.isIntersecting; },
        { threshold: 0 }
      ).observe(this.canvas);
    }
  }

  // ── Render Loop ────────────────────────────────────────
  _tick() {
    this._rafId = requestAnimationFrame(() => this._tick());
    if (!this.isVisible || document.hidden) return;

    const t = this.clock.getElapsedTime();

    this.smoothMouse.x += (this.mouse.x - this.smoothMouse.x) * 0.04;
    this.smoothMouse.y += (this.mouse.y - this.smoothMouse.y) * 0.04;

    if (this.particles) {
      this.particles.rotation.y = t * 0.03;
      this.particles.rotation.x = t * 0.01;
    }

    if (this.globe) {
      this.globe.rotation.y += 0.002;
      this.globe.position.y  = -0.1 + Math.sin(t * 0.5) * 0.08;
    }

    if (this.atmosphere) {
      this.atmosphere.position.y = this.globe.position.y;
      this.atmosphere.rotation.y = this.globe.rotation.y;
    }

    this.camera.position.x = this.smoothMouse.x * 0.8;
    this.camera.position.y = this.smoothMouse.y * 0.5;
    this.camera.lookAt(this.scene.position);

    this.renderer.render(this.scene, this.camera);
  }

  // ── Boot ───────────────────────────────────────────────
  _init() {
    try {
      this._setupRenderer();
      this._setupScene();
      this._createLights();
      this._createParticles();
      this._createGlobe();
      this._bindEvents();
      this._tick();
      console.log('[HeroScene] Initialized successfully ✓');
    } catch (err) {
      console.error('[HeroScene] Init failed:', err);
    }
  }
}
