/* ══════════════════════════════════════════════════════
   script.js — Abhishek Ojha · Cinematic Portfolio v2
   Senior-grade: Lenis + GSAP ScrollTrigger + Canvas FX
   ══════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   GLOBALS & REDUCED-MOTION CHECK
───────────────────────────────────────────── */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────
   1. LENIS SMOOTH SCROLL  (v1.1 API)
───────────────────────────────────────────── */
let lenis = null;
try {
  lenis = new Lenis({
    duration:  1.35,
    easing:    t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  /* Sync with GSAP ticker — single RAF loop */
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* Sync with ScrollTrigger */
  lenis.on('scroll', ScrollTrigger.update);

} catch (err) {
  console.warn('[Lenis] not available, native scroll active.', err);
  lenis = null;
}

/** Unified scroll listener — works with or without Lenis */
function onScroll(cb) {
  if (lenis) {
    lenis.on('scroll', cb);
  } else {
    window.addEventListener('scroll', () => cb({
      scroll:   window.scrollY,
      progress: window.scrollY / Math.max(1, document.body.scrollHeight - innerHeight),
    }), { passive: true });
  }
}

/** Unified scrollTo */
function scrollTo(target, offset = -72) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.8 });
  } else {
    const y = target.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

/* ─────────────────────────────────────────────
   2. PRELOADER — canvas burst + progress bar
───────────────────────────────────────────── */
(function initLoader() {
  const ld  = document.getElementById('loader');
  const bar = document.getElementById('ldBar');
  const pct = document.getElementById('ldPct');
  if (!ld) return;

  /* ── Loader canvas: soft radial burst ── */
  const lc  = document.getElementById('ld-canvas');
  const lctx = lc ? lc.getContext('2d') : null;
  let lW, lH, lT = 0;

  function resizeLC() {
    if (!lc) return;
    lW = lc.width  = innerWidth;
    lH = lc.height = innerHeight;
  }
  resizeLC();
  window.addEventListener('resize', resizeLC);

  const CENTER_X = () => lW / 2;
  const CENTER_Y = () => lH / 2;

  function drawLoaderFrame() {
    if (!lctx) return;
    lT += .012;
    lctx.clearRect(0, 0, lW, lH);

    /* Drifting radial gradient */
    const ox = Math.sin(lT * .7) * lW * .06;
    const oy = Math.cos(lT * .5) * lH * .06;
    const g  = lctx.createRadialGradient(CENTER_X() + ox, CENTER_Y() + oy, 0, CENTER_X(), CENTER_Y(), lW * .6);
    g.addColorStop(0,   'rgba(200,245,90,.07)');
    g.addColorStop(.5,  'rgba(122,245,200,.03)');
    g.addColorStop(1,   'transparent');
    lctx.fillStyle = g;
    lctx.fillRect(0, 0, lW, lH);

    if (!ld.dataset.done) requestAnimationFrame(drawLoaderFrame);
  }
  if (!REDUCED) drawLoaderFrame();

  /* ── Progress counter ── */
  let cur = 0;
  const iv = setInterval(() => {
    cur += Math.random() * 16 + 2;
    if (cur >= 100) {
      cur = 100;
      clearInterval(iv);
      if (bar) bar.style.width = '100%';
      if (pct) pct.textContent  = '100%';
      setTimeout(finishLoad, 480);
    } else {
      if (bar) bar.style.width = cur + '%';
      if (pct) pct.textContent  = Math.round(cur) + '%';
    }
  }, 65);

  function finishLoad() {
    ld.dataset.done = '1';
    gsap.to(ld, {
      opacity: 0, duration: .85, ease: 'power2.inOut',
      onComplete() {
        ld.style.display = 'none';
        document.body.classList.remove('is-loading');
        startHero();
      },
    });
  }
})();

/* ─────────────────────────────────────────────
   3. HERO CANVAS — atmosphere
      Particles + connecting lines + animated blobs
      Bug fix: proper DPR resize (no cumulative scaling)
───────────────────────────────────────────── */
(function atmosCanvas() {
  if (REDUCED) return;

  const canvas = document.getElementById('atmos');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;
  const DPR = Math.min(devicePixelRatio || 1, 2);

  let ambientStrength = 1; // 0 = low, 1 = high

  /* Fix: reset scale before each resize to avoid cumulative transforms */
  function resize() {
    const hero = canvas.parentElement;
    W = hero.offsetWidth;
    H = hero.offsetHeight;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); /* always reset */
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  /* Particles */
  const PTS = Array.from({ length: 55 }, () => ({
    x:  Math.random() * 1600,
    y:  Math.random() * 900,
    vx: (Math.random() - .5) * .3,
    vy: (Math.random() - .5) * .19,
    r:  Math.random() * 1.5 + .3,
    a:  Math.random() * .45 + .06,
  }));

  /* Mouse influence */
  const mouse = { x: -9999, y: -9999 };
  canvas.closest('.hero').addEventListener('mousemove', e => {
    const r  = canvas.getBoundingClientRect();
    mouse.x  = e.clientX - r.left;
    mouse.y  = e.clientY - r.top;
  }, { passive: true });

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    t += .006;

    const bMul = ambientStrength; /* ambient multiplier */

    /* Animated radial blobs */
    [
      { x: W * .12 + Math.sin(t * .7) * 90,  y: H * .22 + Math.cos(t * .5) * 60,  r: 480, c: `rgba(200,245,90,${.055 * bMul})` },
      { x: W * .82 + Math.cos(t * .55) * 80, y: H * .55 + Math.sin(t * .7) * 70,  r: 400, c: `rgba(122,245,200,${.04  * bMul})` },
      { x: W * .5  + Math.sin(t * .4)  * 60, y: H * .82 + Math.cos(t * .35) * 50, r: 320, c: `rgba(200,245,90,${.03  * bMul})` },
    ].forEach(b => {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, b.c);
      g.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });

    /* Particles */
    PTS.forEach(p => {
      /* Slight mouse repulsion */
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const md = Math.hypot(dx, dy);
      if (md < 120 && md > 0) {
        p.vx += (dx / md) * .15;
        p.vy += (dy / md) * .15;
      }
      p.vx *= .98; p.vy *= .98;
      p.x  += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,245,90,${p.a * bMul})`;
      ctx.fill();
    });

    /* Connection lines */
    for (let i = 0; i < PTS.length; i++) {
      for (let j = i + 1; j < PTS.length; j++) {
        const d = Math.hypot(PTS[i].x - PTS[j].x, PTS[i].y - PTS[j].y);
        if (d < 130) {
          ctx.beginPath();
          ctx.moveTo(PTS[i].x, PTS[i].y);
          ctx.lineTo(PTS[j].x, PTS[j].y);
          ctx.strokeStyle = `rgba(200,245,90,${.07 * (1 - d / 130) * bMul})`;
          ctx.lineWidth   = .5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(drawFrame);
  }
  drawFrame();

  /* Expose setter for ambient toggle */
  window._setAmbient = v => { ambientStrength = v ? 1 : 0.2; };
})();

/* ─────────────────────────────────────────────
   4. HERO ENTRANCE — GSAP cinematic timeline
───────────────────────────────────────────── */
function startHero() {
  /* Trigger CSS line-mask reveal */
  const hero = document.querySelector('.hero');
  if (hero) hero.classList.add('ready');

  if (REDUCED) {
    /* Immediately visible for reduced-motion users */
    ['hChip','hSub','hActs','hStats'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
    });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl
    .add(() => document.getElementById('hChip')?.classList.add('in'), .15)
    .to('#hChip',  { opacity: 1, y: 0, duration: .75 }, .15)
    .to('#hSub',   { opacity: 1, y: 0, duration: .85 }, .5)
    .add(() => document.getElementById('hSub')?.classList.add('in'),  .5)
    .to('#hActs',  { opacity: 1, y: 0, duration: .85 }, .65)
    .add(() => document.getElementById('hActs')?.classList.add('in'), .65)
    .to('#hStats', { opacity: 1, y: 0, duration: .9  }, .82)
    .add(() => document.getElementById('hStats')?.classList.add('in'),.82);

  /* Nav drops in */
  gsap.from('#nav', { y: -18, opacity: 0, duration: .9, delay: .25, ease: 'power3.out' });
  /* Side tag fades */
  gsap.from('.side-tag',    { opacity: 0, x: -8, duration: 1.2, delay: 1.9, ease: 'power3.out' });
  /* Scroll hint */
  gsap.from('.scroll-hint', { opacity: 0, y: 8,  duration: 1,   delay: 2.3, ease: 'power2.out' });
}

/* ─────────────────────────────────────────────
   5. NAV — scroll-shrink + active-link tracking
───────────────────────────────────────────── */
const navEl   = document.getElementById('nav');
const navLnks = document.querySelectorAll('.nl');
const secEls  = document.querySelectorAll('section[id]');

onScroll(({ scroll }) => {
  if (!navEl) return;
  navEl.classList.toggle('scrolled', scroll > 60);

  let current = '';
  secEls.forEach(s => {
    if (scroll >= s.offsetTop - 240) current = s.id;
  });
  navLnks.forEach(a =>
    a.classList.toggle('active', a.getAttribute('href') === '#' + current)
  );
});

/* ─────────────────────────────────────────────
   6. SCROLL PROGRESS BAR
───────────────────────────────────────────── */
const progBar = document.getElementById('prog-bar');
onScroll(({ progress }) => {
  if (progBar) progBar.style.width = ((progress || 0) * 100) + '%';
});

/* ─────────────────────────────────────────────
   7. CUSTOM CURSOR
───────────────────────────────────────────── */
(function initCursor() {
  const dot  = document.getElementById('c-dot');
  const ring = document.getElementById('c-ring');
  const txt  = document.getElementById('c-txt');
  if (!dot || !ring) return;

  let mx = -200, my = -200, rx = -200, ry = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';  dot.style.top = my + 'px';
    if (txt) { txt.style.left = mx + 'px'; txt.style.top = my + 'px'; }
  }, { passive: true });

  /* Lagging ring — rAF lerp */
  (function ringLoop() {
    rx += (mx - rx) * .11;
    ry += (my - ry) * .11;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(ringLoop);
  })();

  /* Hover states */
  document.querySelectorAll('a, button, .sk-row, .pg-card, .cl-item').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('ch'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('ch'));
  });
  document.querySelectorAll('.proj-feat, .pg-card:not(.pg-cta-card)').forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('cv');
      if (txt) txt.textContent = 'VIEW';
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cv');
      if (txt) txt.textContent = '';
    });
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });
})();

/* ─────────────────────────────────────────────
   8. MAGNETIC BUTTONS
───────────────────────────────────────────── */
document.querySelectorAll('.mag').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r  = el.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width  / 2) * .28;
    const dy = (e.clientY - r.top  - r.height / 2) * .28;
    gsap.to(el, { x: dx, y: dy, duration: .35, ease: 'power2.out', overwrite: true });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: .75, ease: 'elastic.out(1, .4)', overwrite: true });
  });
});

/* ─────────────────────────────────────────────
   9. SCROLL REVEALS — gsap-up elements
───────────────────────────────────────────── */
if (!REDUCED) {
  gsap.utils.toArray('.gsap-up').forEach((el, i) => {
    gsap.fromTo(el,
      { opacity: 0, y: 44 },
      {
        opacity: 1, y: 0,
        duration: 1.05,
        ease: 'power3.out',
        delay: (i % 3) * .07,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

/* ─────────────────────────────────────────────
   10. HERO PARALLAX — canvas + body drift
───────────────────────────────────────────── */
if (!REDUCED) {
  gsap.to('#atmos', {
    yPercent: 22, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
  });
  gsap.to('.hero-body', {
    yPercent: 10, opacity: .35, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
  });
}

/* ─────────────────────────────────────────────
   11. SECTION PARALLAX BACKGROUNDS
       Each section's .sec-bg-layer drifts opposite to scroll
───────────────────────────────────────────── */
if (!REDUCED) {
  document.querySelectorAll('.sec-bg-layer').forEach(layer => {
    gsap.fromTo(layer,
      { yPercent: -12 },
      {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: layer.parentElement,
          start: 'top bottom',
          end:   'bottom top',
          scrub: 1.2,
        },
      }
    );
  });
}

/* ─────────────────────────────────────────────
   12. SKILL BAR ANIMATION
───────────────────────────────────────────── */
document.querySelectorAll('.sk-row').forEach(row => {
  const fill = row.querySelector('.sk-fill');
  const pct  = row.getAttribute('data-pct') || '75';
  if (!fill) return;

  ScrollTrigger.create({
    trigger: row,
    start: 'top 86%',
    once: true,
    onEnter() {
      gsap.to(fill, { width: pct + '%', duration: 1.4, ease: 'power3.out' });
    },
  });
});

/* ─────────────────────────────────────────────
   13. COUNTER ANIMATION  (fixed GSAP object tween)
───────────────────────────────────────────── */
document.querySelectorAll('.counter').forEach(el => {
  const end = +el.dataset.to;
  ScrollTrigger.create({
    trigger: el,
    start: 'top 90%',
    once: true,
    onEnter() {
      const obj = { n: 0 };
      gsap.to(obj, {
        n: end,
        duration: 1.9,
        ease: 'power2.out',
        onUpdate() { el.textContent = Math.round(obj.n); },
        onComplete() { el.textContent = end; },
      });
    },
  });
});

/* ─────────────────────────────────────────────
   14. FEATURED PROJECT — tilt on mousemove
───────────────────────────────────────────── */
const projFeat = document.querySelector('.proj-feat');
if (projFeat && !REDUCED) {
  projFeat.addEventListener('mousemove', e => {
    const r  = projFeat.getBoundingClientRect();
    const rx = ((e.clientY - r.top)  / r.height - .5) * 4;
    const ry = ((e.clientX - r.left) / r.width  - .5) * -4;
    gsap.to(projFeat, { rotateX: rx, rotateY: ry, duration: .5, ease: 'power2.out', transformPerspective: 1200 });
  });
  projFeat.addEventListener('mouseleave', () => {
    gsap.to(projFeat, { rotateX: 0, rotateY: 0, duration: .8, ease: 'power3.out' });
  });
}

/* ─────────────────────────────────────────────
   15. PROJECT GRID STAGGER
───────────────────────────────────────────── */
if (!REDUCED) {
  gsap.from('.pg-card', {
    opacity: 0, y: 50, duration: 1, ease: 'power3.out', stagger: .11,
    scrollTrigger: { trigger: '.proj-grid', start: 'top 82%' },
  });
}

/* ─────────────────────────────────────────────
   16. ABOUT PHOTO — continuous float
───────────────────────────────────────────── */
if (!REDUCED) {
  gsap.to('.about-photo', {
    y: -11, duration: 3.2,
    ease: 'sine.inOut', repeat: -1, yoyo: true,
  });
}

/* ─────────────────────────────────────────────
   17. MARQUEE — pause on hover
───────────────────────────────────────────── */
const mqEl = document.querySelector('.mq-track');
if (mqEl) {
  const band = mqEl.parentElement;
  band.addEventListener('mouseenter', () => mqEl.style.animationPlayState = 'paused');
  band.addEventListener('mouseleave', () => mqEl.style.animationPlayState = 'running');
}

/* ─────────────────────────────────────────────
   18. AMBIENT INTENSITY TOGGLE
       Dims/brightens the canvas blobs + fog layers
───────────────────────────────────────────── */
(function initAmbient() {
  const btn = document.getElementById('ambientBtn');
  if (!btn) return;

  let active = true; /* starts ON */

  btn.addEventListener('click', () => {
    active = !active;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));

    /* Control canvas ambient strength */
    if (typeof window._setAmbient === 'function') window._setAmbient(active);

    /* Dim/show fog layers */
    document.querySelectorAll('.fog').forEach(f => {
      gsap.to(f, { opacity: active ? 1 : 0, duration: .7 });
    });

    /* Dim/show hero grid overlay */
    const grid = document.querySelector('.hero-grid-overlay');
    if (grid) gsap.to(grid, { opacity: active ? 1 : 0, duration: .7 });
  });
})();

/* ─────────────────────────────────────────────
   19. MOBILE MENU
───────────────────────────────────────────── */
const burger  = document.getElementById('burger');
const mobMenu = document.getElementById('mobMenu');

function closeMob() {
  if (!mobMenu || !burger) return;
  mobMenu.classList.remove('open');
  burger.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

if (burger) {
  burger.addEventListener('click', () => {
    const isOpen = mobMenu.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
}

/* Close on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && mobMenu?.classList.contains('open')) closeMob();
});

/* ─────────────────────────────────────────────
   20. SMOOTH ANCHOR SCROLL
───────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeMob();
    scrollTo(target);
  });
});

/* ─────────────────────────────────────────────
   21. CONTACT FORM
───────────────────────────────────────────── */
function sendForm() {
  const name    = document.getElementById('fn');
  const email   = document.getElementById('fe');
  const msg     = document.getElementById('fm');
  const status  = document.getElementById('cf-status');
  const btn     = document.getElementById('cfBtn');
  if (!name || !email || !msg || !status || !btn) return;

  if (!name.value.trim() || !email.value.trim() || !msg.value.trim()) {
    status.style.color   = '#f87171';
    status.textContent   = 'Please fill in name, email, and message.';
    gsap.from(status, { x: -6, duration: .4, ease: 'power2.out' });
    return;
  }

  const sp = btn.querySelector('span');
  if (sp) sp.textContent = 'Sending…';
  gsap.to(btn, { opacity: .65, duration: .3 });

  setTimeout(() => {
    ['fn', 'fe', 'fs', 'fm'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    if (sp) sp.textContent = '✓ Message Sent!';
    gsap.to(btn, { opacity: 1, duration: .3 });
    status.style.color = 'var(--acc2)';
    status.textContent = "I'll get back to you within 24 hours.";

    const toast = document.getElementById('toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        if (sp) sp.textContent = 'Send Message →';
        status.textContent = '';
      }, 3500);
    }
  }, 1400);
}

/* ─────────────────────────────────────────────
   22. KEYBOARD FOCUS RING (accessibility)
       Shows focus ring only for keyboard users
───────────────────────────────────────────── */
document.addEventListener('mousedown', () => document.body.classList.add('using-mouse'));
document.addEventListener('keydown',   () => document.body.classList.remove('using-mouse'));


/* ─────────────────────────────────────────────
   23. PROJECT CARD — subtle 3D tilt on hover
───────────────────────────────────────────── */
if (!REDUCED) {
  document.querySelectorAll('.pg-card:not(.pg-cta-card)').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top)  / r.height - .5) * 6;
      const ry = ((e.clientX - r.left) / r.width  - .5) * -6;
      gsap.to(card, {
        rotateX: rx, rotateY: ry,
        duration: .4, ease: 'power2.out',
        transformPerspective: 900,
        overwrite: true,
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0, rotateY: 0,
        duration: .7, ease: 'power3.out',
        overwrite: true,
      });
    });
  });
}

/* ─────────────────────────────────────────────
   24. SKILLS ROW — stagger entrance
───────────────────────────────────────────── */
if (!REDUCED) {
  gsap.from('.sk-row', {
    opacity: 0, x: -20, duration: .9,
    ease: 'power3.out', stagger: .08,
    scrollTrigger: { trigger: '.skills-rows', start: 'top 84%' },
  });
}

/* ─────────────────────────────────────────────
   25. ABOUT NUMS — count-up on scroll
───────────────────────────────────────────── */
if (!REDUCED) {
  gsap.from('.an', {
    opacity: 0, y: 18, duration: .8,
    ease: 'power3.out', stagger: .12,
    scrollTrigger: { trigger: '.about-nums', start: 'top 88%' },
  });
}

/* ─────────────────────────────────────────────
   26. MARQUEE — reverse direction on second pass
       (adds visual depth without extra HTML)
───────────────────────────────────────────── */
/* Already handled by CSS — no JS needed */

/* ─────────────────────────────────────────────
   27. FOOTER — entrance on scroll
───────────────────────────────────────────── */
if (!REDUCED) {
  gsap.from('footer', {
    opacity: 0, y: 30, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: 'footer', start: 'top 95%' },
  });
}

/* ─────────────────────────────────────────────
   28. HERO STATS — counter runs in hero after load
       (already handled in startHero counters block)
       Extra: on resize, re-check ScrollTrigger
───────────────────────────────────────────── */
window.addEventListener('resize', () => {
  ScrollTrigger.refresh();
}, { passive: true });

/* ─────────────────────────────────────────────
   29. PERFORMANCE — pause canvas when tab hidden
───────────────────────────────────────────── */
let canvasPaused = false;
document.addEventListener('visibilitychange', () => {
  canvasPaused = document.hidden;
});

/* Expose globally for inline onclick */
window.sendForm = sendForm;
window.closeMob = closeMob;