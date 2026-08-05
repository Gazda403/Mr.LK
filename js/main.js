// ============================================================
//  MR. LK STUDIO — Main Entry Point
//  Orchestrates: preloader → scene → scroll → animations → cursor
// ============================================================

import { Preloader }           from './preloader.js';
import { HeroScene }           from './scene.js';
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
  // 1. Initialize 3D Hero Scene immediately so WebGL context & textures load right away
  let heroScene = null;
  try {
    heroScene = new HeroScene();
  } catch (e) {
    console.error('Failed to initialize HeroScene:', e);
  }

  // 2. Preloader runs immediately
  const preloader = new Preloader(() => {
    // —— After preloader completes ——

    // Gradient bars — CSS-only animations, safe to start now
    initGradientBars('hero-bars', {
      numBars: 15,
      gradientFrom: 'rgba(207, 47, 47, 0.4)',
      gradientTo: 'transparent',
      animationDuration: 2.5
    });

    // Cursor (not needed during preloader since it covers the full screen)
    const cursor = new Cursor();

    // Init smooth scroll
    const lenis = initScroll();

    // Hero text reveal
    revealHero();

    // Defer all scroll-animation setup — not needed until user scrolls
    // Use requestIdleCallback if available so it doesn't fight Spline's first frames
    const initScrollFeatures = () => {
      initScrollAnimations();
      ScrollTrigger.refresh();
      initScrollPath();
      initFluidParticles('fluid-particles-canvas', {
        particleCount: isMobile ? 0 : 1200,
        noiseIntensity: 0.003,
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(initScrollFeatures, { timeout: 1500 });
    } else {
      setTimeout(initScrollFeatures, 600);
    }
  });

  preloader.run();
}

// ── Run when DOM ready ─────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
