// ============================================================
//  MR. LK STUDIO — Three.js Hero Globe (Deep Diagnostic Fix)
//  Guaranteed Visible 3D Globe (Centrally Positioned & Always Rendered)
// ============================================================

(function () {
  'use strict';

  if (typeof THREE === 'undefined') {
    console.error('[HeroScene] THREE.js not loaded!');
    window.HeroScene = function () {};
    return;
  }

  // ──────────────────────────────────────────────────────────
  //  Procedural World Map Texture (High Contrast Glowing Colors)
  // ──────────────────────────────────────────────────────────
  function buildTexture() {
    var W = 2048, H = 1024;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d');

    /* Ocean base: dark navy blue */
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    /* Grid lines */
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.lineWidth = 2;
    for (var ly = 0; ly <= H; ly += H / 12) {
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
    }
    for (var lx = 0; lx <= W; lx += W / 24) {
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
    }
    /* Equator line */
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

    /* Continent dots */
    function isLand(lon, lat) {
      if (lon > -160 && lon < -50 && lat > 15  && lat < 75)  return true; // N.America
      if (lon > -85  && lon < -35 && lat > -55 && lat < 12)  return true; // S.America
      if (lon > -10  && lon < 45  && lat > 35  && lat < 70)  return true; // Europe
      if (lon > -20  && lon < 50  && lat > -35 && lat < 37)  return true; // Africa
      if (lon > 45   && lon < 145 && lat > 5   && lat < 75)  return true; // Asia
      if (lon > 110  && lon < 155 && lat > -42 && lat < -10) return true; // Australia
      if (lon > -60  && lon < -15 && lat > 60  && lat < 84)  return true; // Greenland
      return false;
    }

    var step = 8;
    for (var py = step; py < H; py += step) {
      var lat = 90 - (py / H) * 180;
      for (var px = step; px < W; px += step) {
        var lon = (px / W) * 360 - 180;
        if (isLand(lon, lat)) {
          ctx.fillStyle = '#3b0d0d';
          ctx.fillRect(px - 3.5, py - 3.5, 7, 7);
          ctx.fillStyle = '#ff2222';
          ctx.beginPath();
          ctx.arc(px, py, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    /* Glowing City Beacons */
    var cities = [
      { lon: 139.69, lat: 35.68  },
      { lon: -0.12,  lat: 51.50  },
      { lon: -74.00, lat: 40.71  },
      { lon: 151.20, lat: -33.86 },
      { lon: 55.27,  lat: 25.20  },
      { lon: 13.40,  lat: 52.52  },
      { lon: -122.4, lat: 37.77  },
      { lon: 103.81, lat: 1.35   },
    ];
    cities.forEach(function (city) {
      var cx = ((city.lon + 180) / 360) * W;
      var cy = ((90 - city.lat) / 180) * H;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
      g.addColorStop(0,   'rgba(255,255,255,1)');
      g.addColorStop(0.35, 'rgba(255,30,30,1)');
      g.addColorStop(1,   'rgba(255,30,30,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, Math.PI * 2); ctx.fill();
    });

    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  // ──────────────────────────────────────────────────────────
  //  HeroScene Class
  // ──────────────────────────────────────────────────────────
  function HeroScene() {
    this.canvas      = document.getElementById('hero-canvas');
    this.renderer    = null;
    this.scene       = null;
    this.camera      = null;
    this.globe       = null;
    this.atmosphere  = null;
    this.ring        = null;
    this.particles   = null;
    this.clock       = new THREE.Clock();
    this.mouse       = { x: 0, y: 0 };
    this.mx          = 0;
    this.my          = 0;

    if (!this.canvas) { console.warn('[HeroScene] #hero-canvas element not found'); return; }
    this._boot();
  }

  HeroScene.prototype._boot = function () {
    try {
      /* ── WebGL Renderer Setup ── */
      this.renderer = new THREE.WebGLRenderer({
        canvas:          this.canvas,
        antialias:       true,
        alpha:           true,
        powerPreference: 'high-performance',
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setClearColor(0x000000, 0);

      /* ── Scene & Camera ── */
      this.scene  = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        45, window.innerWidth / window.innerHeight, 0.1, 300
      );
      this.camera.position.set(0, 0, 6.2);

      /* ── High-Intensity Lights ── */
      this.scene.add(new THREE.AmbientLight(0xffffff, 1.8));

      var sun = new THREE.DirectionalLight(0xffffff, 4.0);
      sun.position.set(6, 4, 6);
      this.scene.add(sun);

      var rim = new THREE.DirectionalLight(0xff2222, 7.0);
      rim.position.set(-6, 2, -2);
      this.scene.add(rim);

      /* ── 3D Earth Globe ── */
      var radius = window.innerWidth < 768 ? 1.2 : 1.6;
      var geoSphere = new THREE.SphereGeometry(radius, 64, 64);
      var tex = buildTexture();

      var matGlobe = new THREE.MeshPhongMaterial({
        map:       tex,
        emissive:  new THREE.Color(0x380808),
        shininess: 60,
      });
      this.globe = new THREE.Mesh(geoSphere, matGlobe);

      /* Position safely inside viewport on ALL screens (laptop, desktop, mobile) */
      var gx = window.innerWidth < 1024 ? 0 : 0.85;
      var gy = window.innerWidth < 1024 ? -0.4 : 0;
      this.globe.position.set(gx, gy, 0);
      this.globe.rotation.y = -0.5;
      this.scene.add(this.globe);

      /* ── Atmosphere Halo ── */
      var matAtmo = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: [
          'varying vec3 vN;',
          'void main(){',
          '  vN = normalize(normalMatrix * normal);',
          '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);',
          '}',
        ].join('\n'),
        fragmentShader: [
          'varying vec3 vN;',
          'void main(){',
          '  float i = pow(0.65 - dot(vN, vec3(0.0,0.0,1.0)), 2.6);',
          '  gl_FragColor = vec4(1.0, 0.2, 0.2, clamp(i,0.0,1.0) * 0.95);',
          '}',
        ].join('\n'),
        side:        THREE.FrontSide,
        blending:    THREE.AdditiveBlending,
        transparent: true,
        depthWrite:  false,
      });
      this.atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 1.14, 64, 64),
        matAtmo
      );
      this.atmosphere.position.copy(this.globe.position);
      this.scene.add(this.atmosphere);

      /* ── Orbiting Data Ring ── */
      var ringCount = 400;
      var rPos = new Float32Array(ringCount * 3);
      var ringR = radius * 1.42;
      for (var ri = 0; ri < ringCount; ri++) {
        var ang = (ri / ringCount) * Math.PI * 2;
        var rr = ringR + (Math.random() - 0.5) * 0.15;
        rPos[ri*3]   = Math.cos(ang) * rr;
        rPos[ri*3+1] = (Math.random() - 0.5) * 0.08;
        rPos[ri*3+2] = Math.sin(ang) * rr;
      }
      var ringGeo = new THREE.BufferGeometry();
      ringGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
      this.ring = new THREE.Points(ringGeo, new THREE.PointsMaterial({
        color: 0xff2222, size: 0.05,
        transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      this.ring.rotation.x = 0.38;
      this.ring.position.copy(this.globe.position);
      this.scene.add(this.ring);

      /* ── Ambient Floating Particles ── */
      var pCount = 1500;
      var pPos = new Float32Array(pCount * 3);
      var pCol = new Float32Array(pCount * 3);
      var pal = [
        [1.0, 0.2, 0.2],
        [1.0, 0.5, 0.5],
        [1.0, 1.0, 1.0],
        [0.6, 0.6, 0.6],
      ];
      for (var pi = 0; pi < pCount; pi++) {
        var th = Math.random() * Math.PI * 2;
        var ph = Math.acos(2 * Math.random() - 1);
        var pr = 3.0 + Math.pow(Math.random(), 0.4) * 7.0;
        pPos[pi*3]   = pr * Math.sin(ph) * Math.cos(th) * 1.6;
        pPos[pi*3+1] = pr * Math.sin(ph) * Math.sin(th) * 0.9;
        pPos[pi*3+2] = pr * Math.cos(ph) * 1.3 - 1;
        var pc = pal[Math.floor(Math.random() * pal.length)];
        pCol[pi*3] = pc[0]; pCol[pi*3+1] = pc[1]; pCol[pi*3+2] = pc[2];
      }
      var pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
      this.particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
        size: 0.035, vertexColors: true,
        transparent: true, opacity: 0.8,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      this.scene.add(this.particles);

      /* ── Events ── */
      var self = this;
      window.addEventListener('mousemove', function (e) {
        self.mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
        self.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      });
      window.addEventListener('resize', function () {
        var w = window.innerWidth, h = window.innerHeight;
        self.camera.aspect = w / h;
        self.camera.updateProjectionMatrix();
        self.renderer.setSize(w, h);
        if (self.globe) {
          var ngx = w < 1024 ? 0 : 0.85;
          var ngy = w < 1024 ? -0.4 : 0;
          self.globe.position.set(ngx, ngy, 0);
          if (self.atmosphere) self.atmosphere.position.copy(self.globe.position);
          if (self.ring)       self.ring.position.copy(self.globe.position);
        }
      });

      /* ── Start Render Loop Immediately ── */
      this._tick();

      console.log('[HeroScene] 3D Globe active & rendering ✓');
    } catch (e) {
      console.error('[HeroScene] Boot failed:', e);
    }
  };

  HeroScene.prototype._tick = function () {
    var self = this;
    requestAnimationFrame(function () { self._tick(); });

    /* Always render loop without any early return guards */
    var t = this.clock.getElapsedTime();

    /* Smooth Mouse lerp */
    this.mx += (this.mouse.x - this.mx) * 0.05;
    this.my += (this.mouse.y - this.my) * 0.05;

    /* Background drift */
    if (this.particles) {
      this.particles.rotation.y = t * 0.025;
      this.particles.rotation.x = t * 0.008;
    }

    /* Globe rotation & float */
    if (this.globe) {
      this.globe.rotation.y += 0.0035;
      var baseY = window.innerWidth < 1024 ? -0.4 : 0;
      this.globe.position.y = baseY + Math.sin(t * 0.55) * 0.06;

      if (this.atmosphere) this.atmosphere.position.y = this.globe.position.y;
      if (this.ring) {
        this.ring.position.y = this.globe.position.y;
        this.ring.rotation.y = t * 0.14;
      }
    }

    /* Interactive camera tilt */
    this.camera.position.x = this.mx * 0.5;
    this.camera.position.y = this.my * 0.3;
    this.camera.lookAt(0, 0, 0);

    /* Render scene to canvas */
    this.renderer.render(this.scene, this.camera);
  };

  window.HeroScene = HeroScene;

})();
