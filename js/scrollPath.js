// ============================================================
//  MR. LK STUDIO — Scroll Path Animation
//  Pure RAF loop approach — bypasses all GSAP/Lenis complexity.
//  getBoundingClientRect() reads the actual visual position
//  every frame, so it works regardless of scroll implementation.
// ============================================================

export function initScrollPath() {
  const svg   = document.getElementById('scroll-path-svg');
  const scene = document.getElementById('path-scene');
  if (!svg || !scene) return;

  // Wait two frames for SVG to fully render and size itself
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {

      const paths      = [...svg.querySelectorAll('.scroll-crimson-path')];
      const rawLengths = paths.map(p => p.getTotalLength());

      // Debug — remove after confirming it works
      console.log('[scrollPath] path lengths:', rawLengths);

      // If SVG not yet measured, use a safe fallback (200 viewBox units)
      const lengths = rawLengths.map(l => l > 0 ? l : 200);

      // How fast each line flows (larger = more travel per scroll unit)
      const speeds = [18, 13, 8];

      // Set initial dash pattern on each path
      paths.forEach((path, i) => {
        const len  = lengths[i];
        const dash = len * 0.22;
        const gap  = len * 0.10;
        path.setAttribute('stroke-dasharray',  `${dash} ${gap}`);
        path.setAttribute('stroke-dashoffset', '0');
      });

      // ── Tick loop — runs every animation frame ────────────
      //   Reads getBoundingClientRect() which always reflects
      //   the real visual position, even with Lenis smooth scroll.
      let lastProgress = -1;

      const tick = () => {
        requestAnimationFrame(tick);

        const rect    = scene.getBoundingClientRect();
        const viewH   = window.innerHeight;
        const sceneH  = scene.offsetHeight;

        // 0 = scene just entered viewport bottom
        // 1 = scene fully exited viewport top
        const traveled = viewH - rect.top;
        const total    = sceneH + viewH;
        const progress = Math.max(0, Math.min(1, traveled / total));

        // Skip DOM writes when nothing has visually changed
        if (Math.abs(progress - lastProgress) < 0.0008) return;
        lastProgress = progress;

        paths.forEach((path, i) => {
          const len    = lengths[i];
          const dash   = len * 0.22;
          const gap    = len * 0.10;
          const offset = -(dash + gap) * speeds[i] * progress;
          path.setAttribute('stroke-dashoffset', offset);
        });
      };

      requestAnimationFrame(tick);

    });
  });
}
