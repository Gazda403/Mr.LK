// ============================================================
//  MR. LK STUDIO — Three.js Hero Globe
//  Bulletproof build: no imports, no modules, pure global THREE
// ============================================================

(function () {

  if (typeof THREE === 'undefined') {
    console.error('[HeroScene] THREE.js not loaded!');
    window.HeroScene = function () {};
    return;
  }

  // ──────────────────────────────────────────────────────────
  //  Procedural World-Map Canvas Texture
  //  Bright enough to be clearly visible against #0A0A0A
  // ──────────────────────────────────────────────────────────
  function buildTexture() {
    var W = 2048, H = 1024;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d');

    /* ── Ocean base — dark navy so the sphere reads as a globe ── */
    ctx.fillStyle = '#0d1b2e';
    ctx.fillRect(0, 0, W, H);

    /* ── Grid ── */
    ctx.strokeStyle = 'rgba(207,47,47,0.18)';
    ctx.lineWidth = 1;
    for (var ly = 0; ly <= H; ly += H / 12) {
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
    }
    for (var lx = 0; lx <= W; lx += W / 24) {
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
    }
    /* equator */
    ctx.strokeStyle = 'rgba(207,47,47,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

    /* ── Continent dot-matrix ── */
    function land(lon, lat) {
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
        if (land(lon, lat)) {
          /* Land fill */
          ctx.fillStyle = '#1a0a0a';
          ctx.fillRect(px - 3, py - 3, 6, 6);
          /* Bright red dot on top */
          ctx.fillStyle = 'rgba(220,50,50,0.95)';
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    /* ── City glow nodes ── */
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
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
      g.addColorStop(0,   'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(220,50,50,1)');
      g.addColorStop(1,   'rgba(220,50,50,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
    });

    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  // ──────────────────────────────────────────────────────────
  //  HeroScene
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
    this.isVisible   = true;

    if (!this.canvas) { console.warn('[HeroScene] canvas missing'); return; }

    this._boot();
  }

  HeroScene.prototype._boot = function () {
    try {
      /* ── Renderer ── */
      this.renderer = new THREE.WebGLRenderer({
        canvas:          this.canvas,
        antialias:       true,
        alpha:           true,
        powerPreference: 'high-performance',
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      /* Explicit clear: transparent so page bg shows through */
      this.renderer.setClearColor(0x000000, 0);

      /* ── Scene ── */
      this.scene  = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        45, window.innerWidth / window.innerHeight, 0.1, 300
      );
      this.camera.position.z = 6.5;

      /* ── Lights ── */
      this.scene.add(new THREE.AmbientLight(0x888888, 1.0));

      var sun = new THREE.DirectionalLight(0xffffff, 2.8);
      sun.position.set(5, 4, 6);
      this.scene.add(sun);

      var rim = new THREE.DirectionalLight(0xff2222, 5.0);
      rim.position.set(-6, 1, -3);
      this.scene.add(rim);

      /* ── Globe ── */
      var radius = window.innerWidth < 768 ? 1.2 : 1.6;
      var geoSphere = new THREE.SphereGeometry(radius, 72, 72);
      var tex = buildTexture();

      var matGlobe = new THREE.MeshPhongMaterial({
        map:       tex,
        emissive:  new THREE.Color(0x200000),
        shininess: 60,
      });
      this.globe = new THREE.Mesh(geoSphere, matGlobe);

      var gx = window.innerWidth < 1024 ? 0 : 1.6;
      var gy = window.innerWidth < 1024 ? -0.6 : 0;
      this.globe.position.set(gx, gy, 0);
      this.globe.rotation.y = -0.5;
      this.scene.add(this.globe);

      /* ── Atmosphere glow ── */
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
          '  gl_FragColor = vec4(0.95, 0.15, 0.15, clamp(i,0.0,1.0) * 0.9);',
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

      /* ── Orbiting data ring ── */
      var ringCount = 300;
      var rPos = new Float32Array(ringCount * 3);
      var ringR = radius * 1.45;
      for (var ri = 0; ri < ringCount; ri++) {
        var ang = (ri / ringCount) * Math.PI * 2;
        var rr = ringR + (Math.random() - 0.5) * 0.12;
        rPos[ri*3]   = Math.cos(ang) * rr;
        rPos[ri*3+1] = (Math.random() - 0.5) * 0.06;
        rPos[ri*3+2] = Math.sin(ang) * rr;
      }
      var ringGeo = new THREE.BufferGeometry();
      ringGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
      this.ring = new THREE.Points(ringGeo, new THREE.PointsMaterial({
        color: 0xff3333, size: 0.045,
        transparent: true, opacity: 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      this.ring.rotation.x = 0.38;
      this.ring.position.copy(this.globe.position);
      this.scene.add(this.ring);

      /* ── Background particles ── */
      var pCount = 1400;
      var pPos = new Float32Array(pCount * 3);
      var pCol = new Float32Array(pCount * 3);
      var pal = [
        [0.85, 0.18, 0.18],
        [1.0,  0.4,  0.4 ],
        [1.0,  1.0,  1.0 ],
        [0.5,  0.5,  0.5 ],
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
        size: 0.03, vertexColors: true,
        transparent: true, opacity: 0.7,
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
          var ngx = w < 1024 ? 0 : 1.6;
          var ngy = w < 1024 ? -0.6 : 0;
          self.globe.position.set(ngx, ngy, 0);
          if (self.atmosphere) self.atmosphere.position.copy(self.globe.position);
          if (self.ring)       self.ring.position.copy(self.globe.position);
        }
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          self.isVisible = es[0].isIntersecting;
        }, { threshold: 0 }).observe(this.canvas);
      }

      /* ── Start render loop ── */
      this._tick();

      console.log('[HeroScene] Globe initialized successfully ✓');
    } catch (e) {
      console.error('[HeroScene] Boot failed:', e);
    }
  };

  HeroScene.prototype._tick = function () {
    var self = this;
    requestAnimationFrame(function () { self._tick(); });
    if (!this.isVisible || document.hidden) return;

    var t = this.clock.getElapsedTime();

    /* smooth mouse */
    this.mx += (this.mouse.x - this.mx) * 0.05;
    this.my += (this.mouse.y - this.my) * 0.05;

    /* particle drift */
    if (this.particles) {
      this.particles.rotation.y = t * 0.022;
      this.particles.rotation.x = t * 0.007;
    }

    /* globe spin + float */
    if (this.globe) {
      this.globe.rotation.y += 0.0030;
      var baseY = window.innerWidth < 1024 ? -0.6 : 0;
      this.globe.position.y = baseY + Math.sin(t * 0.55) * 0.06;

      if (this.atmosphere) this.atmosphere.position.y = this.globe.position.y;
      if (this.ring) {
        this.ring.position.y = this.globe.position.y;
        this.ring.rotation.y = t * 0.12;
      }
    }

    /* camera drift with mouse */
    this.camera.position.x += (this.mx * 0.5 - this.camera.position.x) * 0.08;
    this.camera.position.y += (this.my * 0.3 - this.camera.position.y) * 0.08;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  };

  window.HeroScene = HeroScene;

})();
