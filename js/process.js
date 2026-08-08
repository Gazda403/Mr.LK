// ============================================================
//  MR. LK STUDIO — Cinematic Process Section
//  Scroll-jacked "How It Actually Works" experience
//  Phase flow: Intro → Step 1–4 (videos) → Summary → Unlock
// ============================================================

(function () {
  'use strict';

  // ── Session key — sequence replays on fresh page load ──────
  var DONE_KEY = 'proc-v1-done';

  // ── Asset paths (folder name has a space → %20; filenames with … → %E2%80%A6) ──
  var BASE = './ourwork%20component/';
  var ASSETS = {
    bg0:  BASE + 'Vertical_light_beams_flanking_pa%E2%80%A6_202608081503.jpeg',
    bg1:  BASE + 'Glowing_lightbulb_hovering_betwe%E2%80%A6_2K_202608081501.jpeg',
    bg2:  BASE + 'Floating_3D_laptop_glowing_202608081501.jpeg',
    bg3:  BASE + 'Hammer_striking_stone_block_2K_202608081500.jpeg',
    bg4:  BASE + 'Glowing_server_tower_with_red_202608081501.jpeg',
    vid1: BASE + '1st.mp4',
    vid2: BASE + '2nd.mp4',
    vid3: BASE + '3rd.mp4',
    vid4: BASE + '4th.mp4',
  };

  // ── State ──────────────────────────────────────────────────
  var state = {
    phase:        -1,    // -1 = not started
    locked:       false,
    videoPlaying: false,
    lastScroll:   0,     // debounce timestamp
  };

  // ── DOM references (populated in init) ────────────────────
  var els = {};

  // ── Public init ───────────────────────────────────────────
  function init() {
    // Clear any previous session lock so section is always visible
    try { sessionStorage.removeItem(DONE_KEY); } catch (e) {}

    els.section  = document.getElementById('process');
    if (!els.section) return;

    els.inner      = els.section.querySelector('.proc__inner');
    els.bgLayers   = els.section.querySelectorAll('.proc__bg-layer');
    els.videos     = els.section.querySelectorAll('.proc__video');
    els.texts      = els.section.querySelectorAll('.proc__phase-text');
    els.summary    = els.section.querySelector('.proc__summary');
    els.cards      = els.section.querySelectorAll('.proc__card');
    els.dots       = els.section.querySelectorAll('.proc__dot');
    els.loader     = els.section.querySelector('.proc__loader');
    els.loaderBar  = els.section.querySelector('.proc__loader-bar');

    // Set bg image URLs dynamically (avoids HTML special-char encoding issues)
    var bgUrls = [ASSETS.bg0, ASSETS.bg1, ASSETS.bg2, ASSETS.bg3, ASSETS.bg4];
    Array.prototype.forEach.call(els.bgLayers, function (layer, i) {
      layer.style.backgroundImage = 'url("' + bgUrls[i] + '")';
    });

    // Set video srcs dynamically — set all now so they can background-load
    var vidSrcs = [ASSETS.vid1, ASSETS.vid2, ASSETS.vid3, ASSETS.vid4];
    Array.prototype.forEach.call(els.videos, function (vid, i) {
      vid.src = vidSrcs[i];
    });

    // Observe when section reaches the viewport
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !state.locked) {
        lockAndStart();
        observer.disconnect();
      }
    }, { threshold: 0.45 });

    observer.observe(els.section);
  }

  // ── Scroll lock ───────────────────────────────────────────
  function lockAndStart() {
    state.locked = true;

    // Pause Lenis smooth scroll (exposed by scroll.js)
    if (window._lenis) window._lenis.stop();

    // Prevent native scroll
    document.body.style.overflow = 'hidden';

    // Activate fixed overlay
    els.section.classList.add('is-active');

    // Bind input handlers
    document.addEventListener('wheel',      onWheel,      { passive: false });
    document.addEventListener('keydown',    onKeydown,    { passive: false });

    // Touch swipe
    var touchY0 = 0;
    document.addEventListener('touchstart', function (e) {
      touchY0 = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (e.changedTouches[0].clientY < touchY0 - 40) advance();
    }, { passive: true });

    // Show first phase
    gotoPhase(0);
  }

  // ── Input handlers ────────────────────────────────────────
  function onWheel(e) {
    e.preventDefault();
    if (state.videoPlaying) return;
    var now = Date.now();
    if (now - state.lastScroll < 900) return; // debounce rapid scrolls
    if (e.deltaY > 0) {
      state.lastScroll = now;
      advance();
    }
  }

  function onKeydown(e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      if (!state.videoPlaying) advance();
    }
  }

  // ── Phase state machine ───────────────────────────────────
  function advance() {
    if (state.phase < 4) {
      gotoPhase(state.phase + 1);
    } else if (state.phase === 4) {
      showSummary();
    } else if (state.phase === 5) {
      unlock();
    }
  }

  function gotoPhase(n) {
    state.phase = n;
    updateDots(n);
    hideAllTexts();

    if (n === 0) {
      // Intro: show background + title text only
      showBg(0);
      showText(0);
    } else {
      // Steps 1–4: play transition video → then reveal bg + text
      playVideo(n, function () {
        showBg(n);
        showText(n);
      });
    }
  }

  // ── Background crossfade ──────────────────────────────────
  function showBg(n) {
    Array.prototype.forEach.call(els.bgLayers, function (l) {
      l.classList.remove('is-visible');
    });
    if (els.bgLayers[n]) {
      els.bgLayers[n].classList.add('is-visible');
    }
  }

  // ── Video playback ────────────────────────────────────────
  function playVideo(phase, onDone) {
    var idx    = phase - 1;   // videos[] is 0-indexed, phases are 1–4
    var vidEl  = els.videos[idx];
    if (!vidEl) { if (onDone) onDone(); return; }

    state.videoPlaying = true;
    showLoader();

    // Hide & pause any other videos
    Array.prototype.forEach.call(els.videos, function (v) {
      v.classList.remove('is-playing');
      v.pause();
    });

    vidEl.currentTime = 0;
    vidEl.classList.add('is-playing');

    var playProm = vidEl.play();
    if (playProm !== undefined) {
      playProm.catch(function (err) {
        console.warn('[Process] Video play failed:', err);
        finishVideo(vidEl, onDone);
      });
    }

    // Safety timeout: if video doesn't end within 20s, force-advance
    var safetyTimer = setTimeout(function () {
      if (state.videoPlaying) finishVideo(vidEl, onDone);
    }, 20000);

    vidEl.addEventListener('ended', function handler() {
      clearTimeout(safetyTimer);
      vidEl.removeEventListener('ended', handler);
      finishVideo(vidEl, onDone);
    });
  }

  function finishVideo(vidEl, onDone) {
    hideLoader();
    vidEl.classList.remove('is-playing');
    state.videoPlaying = false;
    if (onDone) onDone();
  }

  // ── Text reveal ───────────────────────────────────────────
  function showText(n) {
    var el = els.texts[n];
    if (!el) return;
    setTimeout(function () {
      el.classList.add('is-visible');
    }, 180);
  }

  function hideAllTexts() {
    Array.prototype.forEach.call(els.texts, function (t) {
      t.classList.remove('is-visible');
    });
  }

  // ── Summary (phase 5) ─────────────────────────────────────
  function showSummary() {
    state.phase = 5;
    updateDots(5);
    hideAllTexts();
    hideBgs();

    // Fade in summary overlay
    els.summary.classList.add('is-visible');

    // Stagger the 4 cards
    Array.prototype.forEach.call(els.cards, function (card, i) {
      setTimeout(function () {
        card.classList.add('is-visible');
      }, 350 + i * 160);
    });
  }

  function hideBgs() {
    Array.prototype.forEach.call(els.bgLayers, function (l) {
      l.classList.remove('is-visible');
    });
  }

  // ── Loader bar (shown during video) ──────────────────────
  function showLoader() {
    if (!els.loader) return;
    els.loader.classList.add('is-active');
    if (els.loaderBar) els.loaderBar.style.width = '0%';
  }

  function hideLoader() {
    if (!els.loader) return;
    if (els.loaderBar) els.loaderBar.style.width = '100%';
    setTimeout(function () {
      els.loader.classList.remove('is-active');
      if (els.loaderBar) els.loaderBar.style.width = '0%';
    }, 300);
  }

  // ── Dots update ───────────────────────────────────────────
  function updateDots(phase) {
    Array.prototype.forEach.call(els.dots, function (dot, i) {
      dot.classList.remove('is-active', 'is-done');
      if (i < phase)  dot.classList.add('is-done');
      if (i === phase) dot.classList.add('is-active');
    });
  }

  // ── Unlock + scroll past section ─────────────────────────
  function unlock() {
    state.locked = false;

    // Restore scroll
    document.body.style.overflow = '';

    // Deactivate fixed overlay
    els.section.classList.remove('is-active');

    // Remove event listeners
    document.removeEventListener('wheel',   onWheel);
    document.removeEventListener('keydown', onKeydown);

    // Jump scroll to just past the section
    var sectionEnd = els.section.offsetTop + els.section.offsetHeight + 20;

    // Resume Lenis and scroll past the section
    if (window._lenis) {
      window._lenis.start();
      window._lenis.scrollTo(sectionEnd, { immediate: true });
    } else {
      window.scrollTo({ top: sectionEnd, behavior: 'instant' });
    }
  }

  // ── Boot ──────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
