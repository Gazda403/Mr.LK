// ============================================================
//  MR. LK STUDIO — Preloader
//  Characters stagger in → counter to 100 → reveal site
// ============================================================

export class Preloader {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.el         = document.getElementById('preloader');
    this.chars      = document.querySelectorAll('.preloader__char');
    this.counter    = document.querySelector('.preloader__counter');
    this.line       = document.querySelector('.preloader__line');
    this.count      = 0;
  }

  run() {
    const tl = gsap.timeline({ onComplete: () => this._reveal() });

    // Line grows in
    tl.to(this.line, {
      width: '200px',
      duration: 1.5,
      ease: 'power3.out',
    });

    // Counter fades in
    tl.to(this.counter, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
    }, '-=1.0');

    // Counter increments 0 → 100 (extended +1.6s for full background 3D scene loading)
    tl.to(this, {
      count: 100,
      duration: 3.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.counter.textContent = Math.round(this.count);
      },
    }, '-=0.9');

    // Characters animate in with stagger
    tl.to(this.chars, {
      translateY: '0%',
      opacity: 1,
      duration: 1.1,
      stagger: 0.09,
      ease: 'power4.out',
    }, '-=2.4');

    // Hold for a beat to ensure WebGL frame compilation finishes
    tl.to({}, { duration: 0.8 });
  }

  _reveal() {
    const tl = gsap.timeline({ onComplete: () => {
      this.el.style.display = 'none';
      this.onComplete();
    }});

    // Characters scatter upward
    tl.to(this.chars, {
      translateY: '-120%',
      opacity: 0,
      duration: 0.6,
      stagger: 0.04,
      ease: 'power3.in',
    });

    // Counter fades
    tl.to(this.counter, {
      opacity: 0,
      duration: 0.3,
    }, '-=0.4');

    // Overlay slides up
    tl.to(this.el, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.0,
      ease: 'power4.inOut',
    }, '-=0.2');
  }
}
