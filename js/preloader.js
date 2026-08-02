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
    this.words      = document.querySelectorAll('.preloader__word');
    this.count      = 0;
  }

  run() {
    const tl = gsap.timeline({ onComplete: () => this._reveal() });

    // Step 1: Cinematic Word Sequence — WELCOME → TO THE → LK STUDIO
    if (this.words.length >= 3) {
      // 1a. "WELCOME"
      tl.to(this.words[0], {
        translateY: '0%',
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
      });
      tl.to(this.words[0], {
        translateY: '-120%',
        opacity: 0,
        duration: 0.5,
        ease: 'power3.in',
      }, '+=0.5');

      // 1b. "TO THE"
      tl.to(this.words[1], {
        translateY: '0%',
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
      }, '-=0.1');
      tl.to(this.words[1], {
        translateY: '-120%',
        opacity: 0,
        duration: 0.5,
        ease: 'power3.in',
      }, '+=0.5');

      // 1c. "LK STUDIO"
      tl.to(this.words[2], {
        translateY: '0%',
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
      }, '-=0.1');
      tl.to(this.words[2], {
        translateY: '-120%',
        opacity: 0,
        duration: 0.5,
        ease: 'power3.in',
      }, '+=0.6');
    }

    // Step 2: Line grows in
    tl.to(this.line, {
      width: '200px',
      duration: 1.2,
      ease: 'power3.out',
    }, '-=0.1');

    // Step 3: Counter fades in
    tl.to(this.counter, {
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
    }, '-=0.8');

    // Step 4: Counter increments 0 → 100
    tl.to(this, {
      count: 100,
      duration: 3.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.counter.textContent = Math.round(this.count);
      },
    }, '-=0.7');

    // Step 5: Logo "MR. LK" characters animate in with stagger
    tl.to(this.chars, {
      translateY: '0%',
      opacity: 1,
      duration: 1.0,
      stagger: 0.08,
      ease: 'power4.out',
    }, '-=2.2');

    // Step 6: Final hold for WebGL ready
    tl.to({}, { duration: 0.6 });
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
