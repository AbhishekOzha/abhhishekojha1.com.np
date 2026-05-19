/* ═══════════════════════════════════════════════════════════
   script.js — Abhishek Ojha · Photo Scrollytelling Portfolio
   Tech: Lenis 1.1 + GSAP 3.12 + ScrollTrigger
   Architecture: modular IIFEs, graceful fallback if libs fail
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── MOTION PREFERENCE ─────────────────────────────────── */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── GSAP SAFE REGISTER ─────────────────────────────────── */
const GSAP_OK = typeof gsap !== 'undefined';
const ST_OK   = typeof ScrollTrigger !== 'undefined';
if (GSAP_OK && ST_OK) gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────
   1. LENIS SMOOTH SCROLL
───────────────────────────────────────────────────────── */
let lenis = null;

if (!REDUCED) {
  try {
    lenis = new Lenis({
      duration:     1.25,
      easing:       t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel:  true,
    });

    if (GSAP_OK) {
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }

    if (ST_OK) lenis.on('scroll', ScrollTrigger.update);

  } catch (e) {
    console.warn('[Lenis] unavailable — native scroll active');
    lenis = null;
  }
}

/* Unified scrollTo helper */
function scrollTo(target, offset) {
  offset = offset || -72;
  if (lenis) {
    lenis.scrollTo(target, { offset: offset, duration: 1.6 });
  } else if (target) {
    const y = target.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

/* Unified onScroll helper */
function onScroll(cb) {
  if (lenis) {
    lenis.on('scroll', cb);
  } else {
    window.addEventListener('scroll', function () {
      const s = window.scrollY;
      const p = s / Math.max(1, document.body.scrollHeight - window.innerHeight);
      cb({ scroll: s, progress: p });
    }, { passive: true });
  }
}

/* ─────────────────────────────────────────────────────────
   2. HERO ENTRANCE — lines shoot up from clip mask
      Triggered immediately on DOMContentLoaded, no loader
───────────────────────────────────────────────────────── */
(function heroEntrance() {
  const hero = document.querySelector('.ch-hero');
  if (!hero) return;

  /* Add loaded class to trigger CSS transitions */
  /* Small rAF delay so browser has painted the initial state */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      hero.classList.add('loaded');
    });
  });

  /* Fade in eyebrow, sub, ctas with slight stagger */
  var eyebrow = hero.querySelector('.hero-eyebrow');
  var sub     = hero.querySelector('.hero-sub');
  var ctas    = hero.querySelector('.hero-ctas');
  var stats   = hero.querySelector('.hero-stats');
  var nudge   = hero.querySelector('.scroll-nudge');

  var els = [eyebrow, sub, ctas, stats, nudge].filter(Boolean);

  if (REDUCED) {
    els.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }

  /* Set initial invisible state */
  els.forEach(function (el) { el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; });

  /* Staggered fade-in after a brief delay */
  els.forEach(function (el, i) {
    setTimeout(function () {
      el.style.transition = 'opacity .85s cubic-bezier(.16,1,.3,1), transform .85s cubic-bezier(.16,1,.3,1)';
      el.style.opacity    = '1';
      el.style.transform  = 'none';
    }, 300 + i * 120);
  });
})();

/* ─────────────────────────────────────────────────────────
   3. SCROLL PROGRESS BAR
───────────────────────────────────────────────────────── */
var progBar = document.getElementById('prog-bar');
onScroll(function (data) {
  if (progBar) progBar.style.width = ((data.progress || 0) * 100) + '%';
});

/* ─────────────────────────────────────────────────────────
   4. NAV — shrink on scroll + active section highlight
───────────────────────────────────────────────────────── */
(function initNav() {
  var nav      = document.getElementById('nav');
  var navLinks = document.querySelectorAll('.nl');
  var sections = document.querySelectorAll('section[id], .ch-present-stack[id]');

  onScroll(function (data) {
    if (!nav) return;
    nav.classList.toggle('scrolled', data.scroll > 80);

    /* Active link tracking */
    var current = '';
    sections.forEach(function (s) {
      if (data.scroll >= s.offsetTop - 260) current = s.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  });
})();

/* ─────────────────────────────────────────────────────────
   5. CUSTOM CURSOR — dot + lagging ring
───────────────────────────────────────────────────────── */
(function initCursor() {
  var dot  = document.getElementById('c-dot');
  var ring = document.getElementById('c-ring');
  if (!dot || !ring) return;

  var mx = -200, my = -200, rx = -200, ry = -200;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  }, { passive: true });

  (function ringLoop() {
    rx += (mx - rx) * .11;
    ry += (my - ry) * .11;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(ringLoop);
  })();

  document.querySelectorAll('a, button, .wg-card, .gg-item, .clink').forEach(function (el) {
    el.addEventListener('mouseenter', function () { document.body.classList.add('cur-hover'); });
    el.addEventListener('mouseleave', function () { document.body.classList.remove('cur-hover'); });
  });

  document.addEventListener('mouseleave', function () { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', function () { dot.style.opacity = '1'; ring.style.opacity = '1'; });
})();

/* ─────────────────────────────────────────────────────────
   6. CHAPTER PHOTO — Ken Burns + scroll parallax
      Each chapter photo gets a slow parallax on scroll
───────────────────────────────────────────────────────── */
(function photoParallax() {
  if (REDUCED || !GSAP_OK || !ST_OK) return;

  /* Sticky chapter photos: parallax the inner img */
  document.querySelectorAll('.csp-img').forEach(function (img) {
    var wrap = img.closest('.ch-sticky-photo') || img.parentElement;
    gsap.fromTo(img,
      { yPercent: -8 },
      {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start:   'top bottom',
          end:     'bottom top',
          scrub:   1.5,
        },
      }
    );
  });

  /* Full-bleed chapter photos */
  document.querySelectorAll('.ch-fb-img, .psf-img').forEach(function (img) {
    gsap.fromTo(img,
      { yPercent: -10 },
      {
        yPercent: 10,
        ease: 'none',
        scrollTrigger: {
          trigger: img.closest('.ch-turning, .ps-frame') || img.parentElement,
          start:   'top bottom',
          end:     'bottom top',
          scrub:   1.2,
        },
      }
    );
  });

  /* Hero image — parallax downward as user scrolls */
  var heroBgImg = document.querySelector('.hero-bg-img');
  if (heroBgImg) {
    gsap.to(heroBgImg, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: {
        trigger: '.ch-hero',
        start: 'top top',
        end:   'bottom top',
        scrub: 1,
      },
    });
  }

  /* Contact bg image parallax */
  var contactBg = document.querySelector('.contact-bg-img');
  if (contactBg) {
    gsap.fromTo(contactBg,
      { yPercent: -8 },
      {
        yPercent: 8, ease: 'none',
        scrollTrigger: {
          trigger: '.ch-contact',
          start: 'top bottom', end: 'bottom top', scrub: 1.5,
        },
      }
    );
  }
})();

/* ─────────────────────────────────────────────────────────
   7. CLIP-PATH REVEALS — chapter text panels
      Text blocks sweep in with a clip-path opening
───────────────────────────────────────────────────────── */
(function clipReveal() {
  if (REDUCED || !GSAP_OK || !ST_OK) return;

  document.querySelectorAll('.ch-text-inner').forEach(function (inner) {
    gsap.from(inner, {
      clipPath: 'inset(0 0 100% 0)',
      opacity:  0,
      duration: 1.2,
      ease:     'power3.out',
      scrollTrigger: {
        trigger: inner,
        start:   'top 80%',
        toggleActions: 'play none none none',
      },
    });
  });

  /* Full-bleed text */
  gsap.from('.chft-inner', {
    opacity: 0, y: 60, duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.chft-inner', start: 'top 78%' },
  });
})();

/* ─────────────────────────────────────────────────────────
   8. CHAPTER LABEL FLOATS — fade up from below
───────────────────────────────────────────────────────── */
(function chLabelReveal() {
  if (REDUCED || !GSAP_OK || !ST_OK) return;

  document.querySelectorAll('.ch-label-float').forEach(function (lbl) {
    gsap.from(lbl, {
      opacity: 0, y: 30, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: lbl, start: 'top 90%' },
    });
  });
})();

/* ─────────────────────────────────────────────────────────
   9. PRESENT STACK — each photo frame slides up into view
───────────────────────────────────────────────────────── */
(function presentStack() {
  if (REDUCED || !GSAP_OK || !ST_OK) return;

  document.querySelectorAll('.ps-frame').forEach(function (frame, i) {
    /* Caption reveals */
    var caption = frame.querySelector('.psf-caption');
    if (caption) {
      gsap.from(caption, {
        opacity: 0, y: 50, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: frame, start: 'top 60%' },
      });
    }
  });
})();

/* ─────────────────────────────────────────────────────────
   10. GALLERY ITEMS — stagger scale-in
───────────────────────────────────────────────────────── */
(function galleryReveal() {
  if (REDUCED || !GSAP_OK || !ST_OK) return;

  gsap.from('.gg-item', {
    opacity: 0, scale: .96, duration: 1, ease: 'power3.out', stagger: .09,
    scrollTrigger: { trigger: '.gallery-grid', start: 'top 82%' },
  });
})();

/* ─────────────────────────────────────────────────────────
   11. UNIVERSAL .reveal-fade — observer-based (no GSAP dep)
       Covers eyebrows, headlines, body text, project cards
───────────────────────────────────────────────────────── */
(function revealFades() {
  if (REDUCED) {
    document.querySelectorAll('.reveal-fade').forEach(function (el) {
      el.classList.add('in');
    });
    return;
  }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var delay = parseFloat(e.target.dataset.delay || 0);
      setTimeout(function () { e.target.classList.add('in'); }, delay * 1000);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal-fade').forEach(function (el) {
    obs.observe(el);
  });
})();

/* ─────────────────────────────────────────────────────────
   12. WORK FEATURED — 3D tilt on hover
───────────────────────────────────────────────────────── */
(function workTilt() {
  if (REDUCED || !GSAP_OK) return;
  var feat = document.querySelector('.work-featured');
  if (!feat) return;

  feat.addEventListener('mousemove', function (e) {
    var r  = feat.getBoundingClientRect();
    var rx = ((e.clientY - r.top)  / r.height - .5) *  4;
    var ry = ((e.clientX - r.left) / r.width  - .5) * -4;
    gsap.to(feat, { rotateX: rx, rotateY: ry, transformPerspective: 1100, duration: .5, ease: 'power2.out', overwrite: true });
  });
  feat.addEventListener('mouseleave', function () {
    gsap.to(feat, { rotateX: 0, rotateY: 0, duration: .8, ease: 'power3.out', overwrite: true });
  });
})();

/* ─────────────────────────────────────────────────────────
   13. PROJECT CARDS — top-border sweep + shine on hover
───────────────────────────────────────────────────────── */
(function projectCardReveal() {
  if (REDUCED || !GSAP_OK || !ST_OK) return;

  gsap.from('.wg-card', {
    opacity: 0, y: 50, duration: 1, ease: 'power3.out', stagger: .1,
    scrollTrigger: { trigger: '.work-grid', start: 'top 82%' },
  });
})();

/* ─────────────────────────────────────────────────────────
   14. STORY BREAK — animated line expand
───────────────────────────────────────────────────────── */
(function storyBreak() {
  if (REDUCED || !GSAP_OK || !ST_OK) return;

  gsap.from('.story-break', {
    opacity: 0, scaleX: .8, duration: 1.2, ease: 'power3.out',
    transformOrigin: 'center',
    scrollTrigger: { trigger: '.story-break', start: 'top 88%' },
  });

  gsap.from('.sb-text', {
    opacity: 0, y: 16, duration: .9, ease: 'power3.out', delay: .2,
    scrollTrigger: { trigger: '.story-break', start: 'top 88%' },
  });
})();

/* ─────────────────────────────────────────────────────────
   15. SKILLS BADGE stagger
───────────────────────────────────────────────────────── */
(function skillsReveal() {
  if (REDUCED || !GSAP_OK || !ST_OK) return;

  document.querySelectorAll('.sc-group').forEach(function (g, i) {
    var badges = g.querySelectorAll('.scb');
    ScrollTrigger.create({
      trigger: g, start: 'top 88%', once: true,
      onEnter: function () {
        gsap.fromTo(badges,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, stagger: .05, duration: .55, ease: 'power3.out' }
        );
      },
    });
  });
})();

/* ─────────────────────────────────────────────────────────
   16. ABOUT PHOTO — float animation
───────────────────────────────────────────────────────── */
(function aboutFloat() {
  if (REDUCED || !GSAP_OK) return;
  var portrait = document.querySelector('.about-img-frame');
  if (portrait) {
    gsap.to(portrait, { y: -14, duration: 3.5, ease: 'sine.inOut', repeat: -1, yoyo: true });
  }
})();

/* ─────────────────────────────────────────────────────────
   17. MARQUEE — pause on hover
───────────────────────────────────────────────────────── */
(function marquee() {
  var mq = document.querySelector('.mq-inner');
  if (!mq) return;
  var wrap = mq.parentElement;
  wrap.addEventListener('mouseenter', function () { mq.style.animationPlayState = 'paused'; });
  wrap.addEventListener('mouseleave', function () { mq.style.animationPlayState = 'running'; });
})();

/* ─────────────────────────────────────────────────────────
   18. MOBILE MENU
───────────────────────────────────────────────────────── */
function closeMob() {
  var menu   = document.getElementById('mobMenu');
  var burger = document.getElementById('burger');
  if (!menu) return;
  menu.classList.remove('open');
  menu.setAttribute('aria-hidden', 'true');
  if (burger) { burger.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  document.body.style.overflow = '';
}

(function initMob() {
  var burger = document.getElementById('burger');
  var menu   = document.getElementById('mobMenu');
  var close  = document.getElementById('mobClose');
  if (!burger || !menu) return;

  burger.addEventListener('click', function () {
    var isOpen = menu.classList.toggle('open');
    menu.setAttribute('aria-hidden', String(!isOpen));
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  if (close) close.addEventListener('click', closeMob);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMob();
  });
})();

/* ─────────────────────────────────────────────────────────
   19. SMOOTH ANCHOR SCROLL
───────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var hash   = a.getAttribute('href');
    var target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    closeMob();
    scrollTo(target);
  });
});

/* ─────────────────────────────────────────────────────────
   20. CONTACT FORM — validation + feedback
───────────────────────────────────────────────────────── */
function sendForm(e) {
  if (e) e.preventDefault();

  var name   = document.getElementById('fn');
  var email  = document.getElementById('fe');
  var msg    = document.getElementById('fm');
  var status = document.getElementById('form-status');
  var btn    = document.getElementById('formBtn');
  var btnTxt = document.getElementById('formBtnText');
  if (!name || !email || !msg || !status || !btn) return;

  /* Validate */
  if (!name.value.trim() || !email.value.trim() || !msg.value.trim()) {
    status.style.color = '#f87171';
    status.textContent = 'Please fill in name, email, and message.';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    status.style.color = '#f87171';
    status.textContent = 'Please enter a valid email address.';
    return;
  }

  /* Sending state */
  if (btnTxt) btnTxt.textContent = 'Sending…';
  btn.disabled = true;

  setTimeout(function () {
    ['fn','fe','fs','fm'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    if (btnTxt) btnTxt.textContent = '✓ Sent!';
    status.style.color = '#86efac';
    status.textContent = "Message received! I'll be in touch within 24 hours.";

    var toast = document.getElementById('toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(function () { toast.classList.remove('show'); }, 3500);
    }
    setTimeout(function () {
      if (btnTxt) btnTxt.textContent = 'Send Message →';
      btn.disabled = false;
      status.textContent = '';
    }, 5000);
  }, 1500);
}

/* Expose for inline onsubmit */
window.sendForm = sendForm;
window.closeMob = closeMob;

/* ─────────────────────────────────────────────────────────
   21. KEYBOARD FOCUS RING — only show when tabbing
───────────────────────────────────────────────────────── */
document.addEventListener('mousedown', function () { document.body.classList.add('using-mouse'); });
document.addEventListener('keydown',   function () { document.body.classList.remove('using-mouse'); });

/* ─────────────────────────────────────────────────────────
   22. RESIZE — refresh ScrollTrigger
───────────────────────────────────────────────────────── */
var _resizeTimer;
window.addEventListener('resize', function () {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(function () {
    if (ST_OK) ScrollTrigger.refresh();
  }, 300);
}, { passive: true });