// ============================================================
//  MR. LK STUDIO — Main Entry Point
//  Orchestrates: preloader → scene → scroll → animations → cursor
//  100% Standalone (Supports direct file:// execution & web servers)
// ============================================================

// Register GSAP plugins (available as globals)
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ── Mobile detection ──────────────────────────────────────
const isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent)
  || window.innerWidth < 768;

// ── Boot sequence ──────────────────────────────────────────
function boot() {
  console.log('[MR. LK] Booting application sequence...');

  // 1. Initialize 3D Hero Globe Scene immediately
  let heroScene = null;
  if (typeof window.HeroScene !== 'undefined') {
    try {
      heroScene = new window.HeroScene();
    } catch (e) {
      console.error('Failed to initialize HeroScene:', e);
    }
  }

  // 2. Preloader runs immediately
  const PreloaderClass = window.Preloader || class { constructor(cb) { this.cb = cb; } run() { if (this.cb) this.cb(); } };

  const preloader = new PreloaderClass(() => {
    // —— After preloader completes ——

    // Gradient bars
    if (typeof window.initGradientBars === 'function') {
      window.initGradientBars('hero-bars', {
        numBars: 15,
        gradientFrom: 'rgba(207, 47, 47, 0.4)',
        gradientTo: 'transparent',
        animationDuration: 2.5
      });
    }

    // Custom Cursor
    if (typeof window.Cursor !== 'undefined') {
      new window.Cursor();
    }

    // Init smooth scroll (Lenis)
    if (typeof window.initScroll === 'function') {
      window.initScroll();
    }

    // Hero text reveal
    if (typeof window.revealHero === 'function') {
      window.revealHero();
    }

    // Defer all scroll-animation setup — not needed until user scrolls
    const initScrollFeatures = () => {
      if (typeof window.initScrollAnimations === 'function') window.initScrollAnimations();
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      if (typeof window.initScrollPath === 'function') window.initScrollPath();
      if (typeof window.initFluidParticles === 'function') {
        window.initFluidParticles('fluid-particles-canvas', {
          particleCount: isMobile ? 0 : 1200,
          noiseIntensity: 0.003,
        });
      }
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
