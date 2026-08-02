// ============================================================
//  MR. LK STUDIO — Animated Gradient Bars
//  Converted from React to vanilla JS
//  Creates pulsing vertical gradient bars (bar chart / equalizer effect)
// ============================================================

export function initGradientBars(containerId = 'hero-bars', options = {}) {
  const {
    numBars           = 15,
    gradientFrom      = '#CF2F2F',
    gradientTo        = 'transparent',
    animationDuration = 2.5,
  } = options;

  const container = document.getElementById(containerId);
  if (!container) return;

  // Inject keyframes once
  if (!document.getElementById('gradient-bars-keyframes')) {
    const style = document.createElement('style');
    style.id = 'gradient-bars-keyframes';
    style.textContent = `
      @keyframes pulseBar {
        0%   { transform: scaleY(var(--bar-scale)); }
        100% { transform: scaleY(calc(var(--bar-scale) * 0.62)); }
      }
    `;
    document.head.appendChild(style);
  }

  // Height calculation: tallest at edges, shortest at center
  const calculateHeight = (index, total) => {
    const position = index / (total - 1);
    const distanceFromCenter = Math.abs(position - 0.5);
    const heightPercentage = Math.pow(distanceFromCenter * 2, 1.2);
    return 28 + 72 * heightPercentage; // min 28%, max 100%
  };

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < numBars; i++) {
    const height = calculateHeight(i, numBars);
    const scale  = (height / 100).toFixed(4);
    const delay  = (i * 0.08).toFixed(2);

    const bar = document.createElement('div');
    bar.className = 'gradient-bar';
    bar.style.cssText = `
      flex: 1 0 calc(100% / ${numBars});
      max-width: calc(100% / ${numBars});
      height: 100%;
      background: linear-gradient(to top, ${gradientFrom}, ${gradientTo});
      transform: scaleY(${scale});
      transform-origin: bottom;
      --bar-scale: ${scale};
      animation: pulseBar ${animationDuration}s ease-in-out ${delay}s infinite alternate;
    `;

    fragment.appendChild(bar);
  }

  container.appendChild(fragment);
}
