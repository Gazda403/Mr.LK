// ============================================================
//  MR. LK STUDIO — Custom Cursor
// ============================================================

export class Cursor {
  constructor() {
    this.dot      = document.querySelector('.cursor');
    this.ring     = document.querySelector('.cursor-follower');
    this.label    = document.querySelector('.cursor-label');
    this.x        = window.innerWidth  / 2;
    this.y        = window.innerHeight / 2;
    this.ringX    = this.x;
    this.ringY    = this.y;
    this.isHidden = true;

    this.init();
  }

  init() {
    // Track raw mouse position
    window.addEventListener('mousemove', (e) => {
      this.x = e.clientX;
      this.y = e.clientY;

      if (this.isHidden) {
        this.isHidden = false;
        this.dot.style.opacity  = '1';
        this.ring.style.opacity = '1';
      }
    });

    // Hide on leave
    document.addEventListener('mouseleave', () => {
      this.dot.style.opacity  = '0';
      this.ring.style.opacity = '0';
    });

    // Run animation loop via GSAP ticker
    gsap.ticker.add(() => this._animate());

    // Hover states
    this._bindHovers();
  }

  _animate() {
    // Dot snaps instantly
    gsap.set(this.dot, {
      x: this.x - 4,
      y: this.y - 4,
    });

    // Ring lerps
    this.ringX += (this.x - this.ringX) * 0.1;
    this.ringY += (this.y - this.ringY) * 0.1;

    gsap.set(this.ring, {
      x: this.ringX - 20,
      y: this.ringY - 20,
    });

    gsap.set(this.label, {
      x: this.ringX,
      y: this.ringY,
    });
  }

  _bindHovers() {
    // Regular interactive elements
    document.querySelectorAll('a, button, .btn-outline, .service-item').forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.ring.classList.add('hover');
        this.dot.style.transform = 'translate(-4px,-4px) scale(2)';
      });
      el.addEventListener('mouseleave', () => {
        this.ring.classList.remove('hover');
        this.dot.style.transform = 'translate(-4px,-4px) scale(1)';
      });
    });

    // Project cards — show "View" label
    document.querySelectorAll('.project-card').forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.ring.classList.add('project-hover');
        this.label.textContent = 'View';
        this.label.classList.add('visible');
        this.dot.style.opacity = '0';
      });
      el.addEventListener('mouseleave', () => {
        this.ring.classList.remove('project-hover');
        this.label.classList.remove('visible');
        this.dot.style.opacity = '1';
      });
    });

    this._bindMagneticElements();
  }

  _bindMagneticElements() {
    const magneticItems = document.querySelectorAll('.nav__cta, .btn-outline, .contact__email, .service-icon');
    magneticItems.forEach(item => {
      item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const customX = (e.clientX - rect.left - rect.width / 2) * 0.35;
        const customY = (e.clientY - rect.top - rect.height / 2) * 0.35;

        gsap.to(item, {
          x: customX,
          y: customY,
          duration: 0.3,
          ease: 'power2.out',
        });
      });

      item.addEventListener('mouseleave', () => {
        gsap.to(item, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.4)',
        });
      });
    });
  }
}
