// ============================================================
//  MR. LK STUDIO — Preloader (Bulletproof)
//  Safety timeout ensures onComplete ALWAYS fires, even if
//  GSAP fails, fonts time out, or the browser throttles rAF.
// ============================================================

window.Preloader = class Preloader {
  constructor(onComplete) {
    this.onComplete  = onComplete;
    this.el          = document.getElementById('preloader');
    this.chars       = document.querySelectorAll('.preloader__char');
    this.counter     = document.querySelector('.preloader__counter');
    this.line        = document.querySelector('.preloader__line');
    this.words       = document.querySelectorAll('.preloader__word');
    this.count       = 0;
    this._completed  = false;  // guard: fire onComplete only once
  }

  // ── Called once to start the sequence ──
  run() {
    // SAFETY NET: no matter what happens, complete within 4 seconds
    const safetyTimer = setTimeout(() => {
      console.warn('[Preloader] Safety timeout fired — forcing complete');
      this._forceComplete();
    }, 4000);

    // If no preloader element in DOM, skip straight to complete
    if (!this.el) {
      clearTimeout(safetyTimer);
      this._fireComplete();
      return;
    }

    // If GSAP isn't available, skip straight to complete
    if (typeof gsap === 'undefined') {
      clearTimeout(safetyTimer);
      this._hideEl();
      this._fireComplete();
      return;
    }

    try {
      const tl = gsap.timeline({
        onComplete: () => {
          clearTimeout(safetyTimer);
          this._reveal();
        }
      });

      // Step 1: Word sequence
      if (this.words.length >= 3) {
        tl.to(this.words[0], { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power3.out' });
        tl.to(this.words[0], { yPercent: -120, opacity: 0, duration: 0.2, ease: 'power3.in' }, '+=0.1');
        tl.to(this.words[1], { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power3.out' });
        tl.to(this.words[1], { yPercent: -120, opacity: 0, duration: 0.2, ease: 'power3.in' }, '+=0.1');
        tl.to(this.words[2], { yPercent: 0, opacity: 1, duration: 0.25, ease: 'power3.out' });
        tl.to(this.words[2], { yPercent: -120, opacity: 0, duration: 0.2, ease: 'power3.in' }, '+=0.1');
      }

      // Step 2: Line & counter
      tl.to(this.line,    { width: '160px', duration: 0.4, ease: 'power3.out' }, '-=0.1');
      tl.to(this.counter, { opacity: 1, duration: 0.2 }, '-=0.2');

      // Step 3: Fast counter 0→100
      tl.to(this, {
        count: 100,
        duration: 0.6,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (this.counter) this.counter.textContent = Math.round(this.count);
        },
      }, '-=0.2');

      // Step 4: Logo chars
      if (this.chars.length > 0) {
        tl.to(this.chars, {
          yPercent: 0, opacity: 1,
          duration: 0.35, stagger: 0.03, ease: 'power4.out',
        }, '-=0.5');
      }

    } catch (err) {
      // GSAP threw — kill it and proceed
      clearTimeout(safetyTimer);
      console.error('[Preloader] GSAP error:', err);
      this._hideEl();
      this._fireComplete();
    }
  }

  _reveal() {
    if (this._completed) return;
    if (!this.el) { this._fireComplete(); return; }

    this.el.style.pointerEvents = 'none';

    const tl = gsap.timeline({
      onComplete: () => {
        this._hideEl();
        this._fireComplete();
      }
    });

    if (this.chars.length > 0) {
      tl.to(this.chars, {
        yPercent: -120, opacity: 0,
        duration: 0.3, stagger: 0.02, ease: 'power3.in',
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

  _hideEl() {
    if (this.el) {
      this.el.style.display     = 'none';
      this.el.style.visibility  = 'hidden';
      this.el.style.pointerEvents = 'none';
    }
  }

  _fireComplete() {
    if (this._completed) return;
    this._completed = true;
    if (this.onComplete) this.onComplete();
  }

  _forceComplete() {
    if (this._completed) return;
    // Kill any running GSAP tweens on preloader elements
    if (typeof gsap !== 'undefined' && this.el) {
      gsap.killTweensOf(this.el);
      gsap.killTweensOf(this.chars);
      gsap.killTweensOf(this.counter);
      gsap.killTweensOf(this.words);
    }
    this._hideEl();
    this._fireComplete();
  }
};
