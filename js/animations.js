// ============================================================
//  MR. LK STUDIO — GSAP Animations
//  Hero reveal + scroll-triggered section animations
// ============================================================

// ── Split text helper (no plugin needed) ──────────────────
function splitChars(el) {
  const text  = el.innerText;
  el.innerHTML = '';
  return text.split('').map(char => {
    const span = document.createElement('span');
    span.style.display = 'inline-block';
    span.style.overflow = 'hidden';
    const inner = document.createElement('span');
    inner.style.display = 'inline-block';
    inner.textContent = char === ' ' ? '\u00A0' : char;
    inner.style.transform = 'translateY(110%)';
    inner.style.opacity   = '0';
    span.appendChild(inner);
    el.appendChild(span);
    return inner;
  });
}

// ── Hero entrance animation (called after preloader) ──────
window.revealHero = function revealHero() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  // Nav
  tl.to('nav', {
    opacity:  1,
    duration: 0.8,
  });

  // Eyebrow
  tl.to('.hero__eyebrow', {
    opacity:   1,
    y:         0,
    duration:  0.7,
  }, '-=0.4');

  // Title words sweep up
  tl.to('.hero__title .word', {
    translateY: '0%',
    duration:   1.1,
    stagger:    0.1,
    ease:       'power4.out',
  }, '-=0.5');

  // Sub text
  tl.to('.hero__sub', {
    opacity:  1,
    y:        0,
    duration: 0.8,
  }, '-=0.6');

  // Scroll indicator
  tl.to('.hero__scroll', {
    opacity:  1,
    duration: 0.6,
  }, '-=0.4');

  // Marquee
  tl.to('#marquee', {
    opacity:  1,
    duration: 0.8,
  }, '-=0.5');

  return tl;
}

// ── Scroll-triggered animations ───────────────────────────
window.initScrollAnimations = function initScrollAnimations() {
  ScrollTrigger.defaults({ markers: false });

  // Generic [data-reveal] elements
  document.querySelectorAll('[data-reveal]').forEach(el => {
    gsap.fromTo(el,
      { y: 50, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 1.0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start:   'top 85%',
          once:    true,
        },
      }
    );
  });

  // Section labels slide in from left
  document.querySelectorAll('.section-label').forEach(el => {
    gsap.fromTo(el,
      { x: -30, opacity: 0 },
      {
        x: 0, opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start:   'top 88%',
          once:    true,
        },
      }
    );
  });

  // Services rows stagger in
  document.querySelectorAll('.service-item').forEach((el, i) => {
    gsap.fromTo(el,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 0.9,
        delay:    i * 0.1,
        ease:     'power3.out',
        scrollTrigger: {
          trigger: el,
          start:   'top 85%',
          once:    true,
        },
      }
    );
  });

  // ── HORIZONTAL SCROLL — Work section ──────────────────
  _initHorizontalScroll();

  // Contact heading parallax
  gsap.fromTo('.contact__bg-text',
    { x: '-10%' },
    {
      x: '10%',
      ease: 'none',
      scrollTrigger: {
        trigger: '#contact',
        start:   'top bottom',
        end:     'bottom top',
        scrub:   1.5,
      },
    }
  );

  // Hero 3D object scale out on scroll
  gsap.to('#hero-canvas', {
    opacity: 0,
    scale:   0.96,
    ease:    'none',
    scrollTrigger: {
      trigger: '#hero',
      start:   'bottom 80%',
      end:     'bottom top',
      scrub:   true,
    },
  });
}

// ── Horizontal scroll setup ───────────────────────────────
function _initHorizontalScroll() {
  const track = document.getElementById('work-track');
  if (!track) return;

  const cards    = track.querySelectorAll('.project-card');
  const wrapper  = track.parentElement;

  // Animate cards in as they enter horizontal view
  cards.forEach((card, i) => {
    gsap.fromTo(card,
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 1,
        delay:    i * 0.12,
        ease:     'power3.out',
        scrollTrigger: {
          trigger: '#work',
          start:   'top 70%',
          once:    true,
        },
      }
    );
  });

  // Horizontal drag scroll (mouse wheel drives horizontal)
  let isDown  = false;
  let startX  = 0;
  let scrollL = 0;

  wrapper.addEventListener('mousedown', e => {
    isDown  = true;
    startX  = e.pageX - wrapper.offsetLeft;
    scrollL = wrapper.scrollLeft;
    wrapper.style.cursor = 'grabbing';
  });

  wrapper.addEventListener('mouseleave', () => {
    isDown = false;
    wrapper.style.cursor = '';
  });

  wrapper.addEventListener('mouseup', () => {
    isDown = false;
    wrapper.style.cursor = '';
  });

  wrapper.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x    = e.pageX - wrapper.offsetLeft;
    const walk = (x - startX) * 2;
    wrapper.scrollLeft = scrollL - walk;
  });

  // Enable overflow horizontal scroll
  wrapper.style.overflowX = 'auto';
  wrapper.style.cursor    = 'grab';
  // Hide scrollbar visually
  wrapper.style.scrollbarWidth = 'none';
  wrapper.style.msOverflowStyle = 'none';

  // Wheel drives horizontal scroll on the work section
  wrapper.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // already horizontal
    wrapper.scrollLeft += e.deltaY * 1.2;
  }, { passive: true });

  // GSAP pin + scrub for scroll-linked horizontal
  const totalScroll = track.scrollWidth - wrapper.clientWidth;

  ScrollTrigger.create({
    trigger:   '#work',
    start:     'top top',
    end:       `+=${totalScroll}`,
    pin:       true,
    pinSpacing: true,
    onUpdate: (self) => {
      wrapper.scrollLeft = self.progress * totalScroll;
    },
  });
}
