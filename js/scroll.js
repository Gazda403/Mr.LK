// ============================================================
//  MR. LK STUDIO — Smooth Scroll (Lenis)
// ============================================================

window.initScroll = function initScroll() {
  const lenis = new Lenis({
    duration:  1.4,
    easing:    (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    smooth:    true,
    smoothTouch: false,
  });

  // Expose globally so other modules (e.g. process.js) can stop/start
  window._lenis = lenis;

  // Sync Lenis with GSAP ticker for ScrollTrigger
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // Make ScrollTrigger aware of Lenis scroll position
  lenis.on('scroll', ScrollTrigger.update);

  return lenis;
}
