// ============================================================
//  MR. LK STUDIO — Preloader
//  Faster, ultra-reliable preloader sequence
// ============================================================

window.Preloader = class Preloader {
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
    if (!this.el) {
      if (this.onComplete) this.onComplete();
      return;
    }

    const tl = gsap.timeline({ onComplete: () => this._reveal() });

    // Step 1: Fast Word Sequence
    if (this.words.length >= 3) {
      tl.to(this.words[0], { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power3.out' });
      tl.to(this.words[0], { yPercent: -120, opacity: 0, duration: 0.2, ease: 'power3.in' }, '+=0.1');

      tl.to(this.words[1], { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power3.out' });
      tl.to(this.words[1], { yPercent: -120, opacity: 0, duration: 0.2, ease: 'power3.in' }, '+=0.1');

      tl.to(this.words[2], { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power3.out' });
      tl.to(this.words[2], { yPercent: -120, opacity: 0, duration: 0.2, ease: 'power3.in' }, '+=0.1');
    }

    // Step 2: Line & Counter
    tl.to(this.line, { width: '160px', duration: 0.4, ease: 'power3.out' }, '-=0.1');
    tl.to(this.counter, { opacity: 1, duration: 0.2 }, '-=0.2');

    // Step 3: Fast Counter 0 → 100
    tl.to(this, {
      count: 100,
      duration: 0.6,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (this.counter) this.counter.textContent = Math.round(this.count);
      },
    }, '-=0.2');

    // Step 4: Logo Characters
    if (this.chars.length > 0) {
      tl.to(this.chars, {
        yPercent: 0,
        opacity: 1,
        duration: 0.35,
        stagger: 0.03,
        ease: 'power4.out',
      }, '-=0.5');
    }
  }

  _reveal() {
    if (this.el) this.el.style.pointerEvents = 'none';

    const tl = gsap.timeline({
      onComplete: () => {
        if (this.el) {
          this.el.style.display = 'none';
          this.el.style.visibility = 'hidden';
        }
        if (this.onComplete) this.onComplete();
      }
    });

    if (this.chars.length > 0) {
      tl.to(this.chars, {
        yPercent: -120,
        opacity: 0,
        duration: 0.3,
        stagger: 0.02,
        ease: 'power3.in',
      });
    }

    if (this.counter) {
      tl.to(this.counter, { opacity: 0, duration: 0.15 }, '-=0.2');
    }

    tl.to(this.el, {
      opacity: 0,
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.5,
      ease: 'power4.inOut',
    }, '-=0.1');
  }
}
