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

// ── Boot sequence ——————————————————————————————————————————
function boot() {
  // 1. Cursor (start tracking immediately — skip on touch devices)
  const cursor = new Cursor();

  // 1.5 Gradient Bars Background
  initGradientBars('hero-bars', {
    numBars: 15,
    gradientFrom: 'rgba(207, 47, 47, 0.4)',
    gradientTo: 'transparent',
    animationDuration: 2.5
  });

  // 2. Preloader runs first — no 3D scene blocking the critical path
  const preloader = new Preloader(() => {
    // —— After preloader completes ——

    // 2a. Now init Three.js scene (it ends up hidden, but init is deferred
    //     so it doesn't compete with the preloader for GPU/main-thread)
    if (!isMobile) {
      try {
        const scene = new HeroScene();
        // Keep native Three.js canvas hidden so Spline scene takes main stage
        document.getElementById('hero-canvas').style.display = 'none';
      } catch (e) {
        console.warn('WebGL not available, falling back to CSS only.', e);
      }
    }

    const splineEl = document.getElementById('hero-spline');
    if (splineEl) {
      gsap.to(splineEl, { opacity: 1, duration: 1.5, ease: 'power2.out' });

      // Pause/hide Spline when offscreen to save GPU resources
      if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            splineEl.style.visibility = entry.isIntersecting ? 'visible' : 'hidden';
          });
        }, { threshold: 0 });
        obs.observe(splineEl);
      }
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
      initScrollPath();
      initFluidParticles('fluid-particles-canvas', {
        particleCount: isMobile ? 0 : 1200,
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
