// ============================================================
//  MR. LK STUDIO — Main Entry Point
//  Orchestrates: preloader → scene → scroll → animations → cursor
// ============================================================

import { HeroScene }           from './scene.js';
import { Preloader }           from './preloader.js';
import { Cursor }              from './cursor.js';
import { initScroll }          from './scroll.js';
import { revealHero, initScrollAnimations } from './animations.js';
import { initGradientBars }      from './gradientBars.js';
import { initScrollPath }        from './scrollPath.js';
import { initFluidParticles }    from './fluidParticles.js';

// Register GSAP plugins (available as globals from CDN)
gsap.registerPlugin(ScrollTrigger);

// ── Mobile detection ──────────────────────────────────────
const isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent)
  || window.innerWidth < 768;

// ── Boot sequence ─────────────────────────────────────────
async function boot() {
  // 1. Cursor (start tracking immediately)
  const cursor = new Cursor();

  // 1.5 Gradient Bars Background
  initGradientBars('hero-bars', {
    numBars: 15,
    gradientFrom: 'rgba(207, 47, 47, 0.4)', // using semi-transparent red
    gradientTo: 'transparent',
    animationDuration: 2.5
  });

  // 2. 3D Scene (loads alongside preloader)
  let scene = null;
  if (!isMobile) {
    try {
      scene = new HeroScene();
      // Start hidden — canvas fades in after preloader
      document.getElementById('hero-canvas').style.opacity = '0';
    } catch (e) {
      console.warn('WebGL not available, falling back to CSS only.', e);
    }
  }

  // 3. Preloader
  const preloader = new Preloader(() => {
    // Called when preloader finishes

    // Keep native Three.js canvas hidden so Spline scene takes main stage cleanly
    if (scene) {
      document.getElementById('hero-canvas').style.display = 'none';
    }
    const splineEl = document.getElementById('hero-spline');
    if (splineEl) {
      gsap.to(splineEl, { opacity: 1, duration: 1.5, ease: 'power2.out' });
    }

    // Init smooth scroll
    const lenis = initScroll();

    // Hero reveal
    revealHero();

    // Scroll-triggered section animations
    // Small delay to let Lenis settle
    setTimeout(() => {
      initScrollAnimations();
      ScrollTrigger.refresh();
      initScrollPath(); // after refresh — pin spacers already placed
      initFluidParticles('fluid-particles-canvas', {
        particleCount: 2000,
        noiseIntensity: 0.003,
      });
    }, 300);
  });

  preloader.run();
}

// ── Run when DOM ready ─────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
