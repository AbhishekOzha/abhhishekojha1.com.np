/* ═══════════════════════════════════════════════════════════
   script.js — Abhishek Ojha · Cinematic Portfolio
   Tech: Lenis v1.1 + GSAP 3.12 + ScrollTrigger + Canvas
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────
   0. CONSTANTS & SETUP
───────────────────────────────────────────────────────── */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Register GSAP plugin once
if (typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
} else {
  console.error('[Portfolio] GSAP failed to load — animations disabled.');
}

/* ─────────────────────────────────────────────────────────
   1. LENIS SMOOTH SCROLL
───────────────────────────────────────────────────────── */
let lenis = null;

if (!REDUCED) {
  try {
    lenis = new Lenis({
      duration: 1.3,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // Sync with GSAP ticker — single rAF loop, no double RAF
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);

  } catch (e) {
    console.warn('[Lenis] Not available, using native scroll.', e);
    lenis = null;
  }
}

/** Unified scroll listener */
function onScroll(cb) {
  if (lenis) lenis.on('scroll', cb);
  else window.addEventListener('scroll', () => cb({
    scroll:   window.scrollY,
    progress: window.scrollY / Math.max(1, document.body.scrollHeight - innerHeight),
  }), { passive: true });
}

/** Unified scrollTo */
function scrollToEl(target, offset = -72) {
  if (!target) return;
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.7 });
  else {
    const y = target.getBoundingClientRect().top + scrollY + offset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

/* ─────────────────────────────────────────────────────────
   2. PRELOADER  —  canvas burst + progress counter
───────────────────────────────────────────────────────── */
(function initLoader() {
  const loader = document.getElementById('loader');
  const bar    = document.getElementById('ldBar');
  const pct    = document.getElementById('ldPct');
  if (!loader) return;

  // ── Loader background canvas
  const lc  = document.getElementById('ld-canvas');
  const lct = lc ? lc.getContext('2d') : null;
  let lW, lH, lt = 0, loaderDone = false;

  function resizeLC() {
    if (!lc) return;
    lW = lc.width  = innerWidth;
    lH = lc.height = innerHeight;
  }
  resizeLC();
  window.addEventListener('resize', resizeLC, { passive: true });

  function drawLoader() {
    if (loaderDone || !lct) return;
    lct.clearRect(0, 0, lW, lH);
    lt += .008;

    // Slow rotating gradient orb
    const cx = lW / 2 + Math.sin(lt * .6) * lW * .05;
    const cy = lH / 2 + Math.cos(lt * .4) * lH * .05;
    const g  = lct.createRadialGradient(cx, cy, 0, cx, cy, lW * .55);
    g.addColorStop(0,   'rgba(120,50,220,.12)');
    g.addColorStop(.4,  'rgba(40,160,120,.08)');
    g.addColorStop(1,   'transparent');
    lct.fillStyle = g;
    lct.fillRect(0, 0, lW, lH);

    // Accent orb
    const g2 = lct.createRadialGradient(cx * .6, cy * .8, 0, cx * .6, cy * .8, lW * .3);
    g2.addColorStop(0, 'rgba(184,255,69,.06)');
    g2.addColorStop(1, 'transparent');
    lct.fillStyle = g2;
    lct.fillRect(0, 0, lW, lH);

    requestAnimationFrame(drawLoader);
  }
  if (!REDUCED) drawLoader();

  // ── Progress counter
  let current = 0;
  const tick = setInterval(() => {
    current += Math.random() * 14 + 3;
    if (current >= 100) {
      current = 100;
      clearInterval(tick);
      if (bar) bar.style.width = '100%';
      if (pct) pct.textContent  = '100%';
      setTimeout(finishLoad, 400);
    } else {
      if (bar) bar.style.width = current + '%';
      if (pct) pct.textContent  = Math.round(current) + '%';
    }
  }, 60);

  function finishLoad() {
    loaderDone = true;
    gsap.to(loader, {
      opacity: 0, duration: .9, ease: 'power2.inOut',
      onComplete() {
        loader.style.display = 'none';
        document.body.classList.remove('is-loading');
        startHeroEntrance();
      },
    });
  }
})();

/* ─────────────────────────────────────────────────────────
   3. HERO CANVAS  —  multi-layer living atmosphere
      ① Slow radial blobs  ② Particle net  ③ Mouse repulsion
      ④ Shooting stars  ⑤ Depth rings
───────────────────────────────────────────────────────── */
(function initHeroCanvas() {
  if (REDUCED) return;
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;
  const DPR = Math.min(devicePixelRatio || 1, 2);

  // Fix: setTransform prevents cumulative DPR scaling on resize
  function resize() {
    const hero = canvas.parentElement;
    W = hero.offsetWidth;
    H = hero.offsetHeight;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // ── Particles
  const NPTS = 65;
  const pts = Array.from({ length: NPTS }, () => ({
    x:  Math.random() * 1600,
    y:  Math.random() * 900,
    vx: (Math.random() - .5) * .28,
    vy: (Math.random() - .5) * .18,
    r:  Math.random() * 1.6 + .25,
    a:  Math.random() * .4 + .06,
    hue: Math.random() > .7 ? 'acc2' : 'acc', // color variety
  }));

  // ── Shooting stars
  const stars = Array.from({ length: 3 }, () => newStar());
  function newStar() {
    return {
      x: Math.random() * W, y: Math.random() * H * .5,
      vx: (Math.random() * 3 + 2), vy: (Math.random() * 1.5 + .5),
      len: Math.random() * 80 + 40, a: 0, life: 0, maxLife: Math.random() * 60 + 40,
      active: Math.random() > .6,
    };
  }

  // ── Mouse position in canvas space
  const mouse = { x: -9999, y: -9999 };
  const hero  = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  }

  let paused = false;
  document.addEventListener('visibilitychange', () => { paused = document.hidden; });

  function draw() {
    if (paused) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, W, H);
    t += .006;

    // ── Animated blobs (radial gradients)
    [
      { px: .12, py: .22, rx: .7, ry: .5,  r: 500, c: 'rgba(90,40,200,.055)' },
      { px: .82, py: .58, rx: .55, ry: .7, r: 420, c: 'rgba(40,180,130,.04)' },
      { px: .5,  py: .78, rx: .4, ry: .35, r: 320, c: 'rgba(184,255,69,.035)' },
    ].forEach(b => {
      const bx = W * b.px + Math.sin(t * b.rx) * W * .05;
      const by = H * b.py + Math.cos(t * b.ry) * H * .05;
      const g  = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
      g.addColorStop(0, b.c);
      g.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(bx, by, b.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });

    // ── Particles
    pts.forEach(p => {
      // Mouse repulsion
      const ddx = p.x - mouse.x, ddy = p.y - mouse.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist < 130 && dist > 0) {
        const f = (130 - dist) / 130 * .22;
        p.vx += (ddx / dist) * f;
        p.vy += (ddy / dist) * f;
      }
      // Friction + move
      p.vx *= .97; p.vy *= .97;
      p.x += p.vx; p.y += p.vy;
      // Wrap
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      const col = p.hue === 'acc2'
        ? `rgba(69,255,212,${p.a})`
        : `rgba(184,255,69,${p.a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    });

    // ── Connection lines between near particles
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < 115) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(184,255,69,${.065 * (1 - d / 115)})`;
          ctx.lineWidth   = .5;
          ctx.stroke();
        }
      }
    }

    // ── Mouse connection lines
    if (mouse.x > 0) {
      pts.forEach(p => {
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (d < 150) {
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(184,255,69,${.12 * (1 - d / 150)})`;
          ctx.lineWidth   = .6;
          ctx.stroke();
        }
      });
    }

    // ── Shooting stars
    stars.forEach((s, idx) => {
      if (!s.active) {
        if (Math.random() < .003) { stars[idx] = { ...newStar(), active: true, x: Math.random() * W, y: Math.random() * H * .4 }; }
        return;
      }
      s.life++;
      s.a = s.life < 10 ? s.life / 10 : s.life > s.maxLife - 10 ? (s.maxLife - s.life) / 10 : 1;
      ctx.save();
      ctx.globalAlpha = s.a * .55;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * s.len / 3, s.y - s.vy * s.len / 3);
      grad.addColorStop(0, 'rgba(255,255,255,.9)');
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * s.len / 3, s.y - s.vy * s.len / 3);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      s.x += s.vx; s.y += s.vy;
      if (s.life >= s.maxLife) stars[idx] = { ...newStar(), active: false };
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

/* ─────────────────────────────────────────────────────────
   4. HERO PARALLAX — mouse move depth effect
───────────────────────────────────────────────────────── */
(function heroMouseParallax() {
  if (REDUCED) return;
  const hero    = document.querySelector('.hero');
  const content = document.getElementById('heroContent');
  const orbs    = document.querySelectorAll('.orb');
  const beams   = document.querySelectorAll('.aurora-beam');
  if (!hero) return;

  let lx = 0, ly = 0;

  hero.addEventListener('mousemove', e => {
    const r  = hero.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width  - .5; // -0.5 to +0.5
    const ny = (e.clientY - r.top)  / r.height - .5;
    lx = nx; ly = ny;
  }, { passive: true });

  // Smooth lerp in rAF
  let cx = 0, cy = 0;
  (function parallaxTick() {
    cx += (lx - cx) * .06;
    cy += (ly - cy) * .06;

    if (content) {
      gsap.set(content, { x: cx * 18, y: cy * 10 });
    }
    orbs.forEach((o, i) => {
      const d = (i + 1) * 12;
      gsap.set(o, { x: cx * d * -1, y: cy * d * -1 });
    });
    beams.forEach((b, i) => {
      gsap.set(b, { x: cx * (i + 1) * 8 });
    });

    requestAnimationFrame(parallaxTick);
  })();
})();

/* ─────────────────────────────────────────────────────────
   5. HERO ENTRANCE  —  cinematic GSAP timeline after loader
───────────────────────────────────────────────────────── */
function startHeroEntrance() {
  const content  = document.getElementById('heroContent');
  const chip     = document.getElementById('hChip');
  const sub      = document.querySelector('.hero-sub');
  const ctas     = document.querySelector('.hero-ctas');
  const stats    = document.getElementById('hStats');
  const scCue    = document.querySelector('.scroll-cue');
  const sideTag  = document.querySelector('.side-tag');
  const nav      = document.getElementById('nav');

  // Trigger CSS line-mask reveal
  if (content) content.classList.add('loaded');

  if (REDUCED) {
    // Just show everything immediately
    [chip, sub, ctas, stats, scCue].forEach(el => {
      if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
    });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl
    .to(chip,  { opacity: 1, y: 0, duration: .8 }, .2)
    .to(sub,   { opacity: 1, y: 0, duration: .9 }, .45)
    .to(ctas,  { opacity: 1, y: 0, duration: .9 }, .62)
    .to(stats, { opacity: 1, y: 0, duration: .9 }, .78)
    .to(scCue, { opacity: 1, duration: .8 },        1.1);

  gsap.from(nav,     { y: -20, opacity: 0, duration: .9, delay: .2, ease: 'power3.out' });
  gsap.from(sideTag, { x: -12, opacity: 0, duration: 1.1, delay: 1.6, ease: 'power3.out' });

  // Set initial states (CSS can't always be trusted across reload)
  gsap.set([sub, ctas, stats, scCue], { opacity: 0, y: 16 });
  gsap.set(chip, { opacity: 0, y: 12 });
}

/* ─────────────────────────────────────────────────────────
   6. SCROLL PROGRESS BAR
───────────────────────────────────────────────────────── */
const progBar = document.getElementById('prog-bar');
onScroll(({ progress }) => {
  if (progBar) progBar.style.width = ((progress || 0) * 100) + '%';
});

/* ─────────────────────────────────────────────────────────
   7. NAV  —  scroll-shrink + active link
───────────────────────────────────────────────────────── */
const navEl   = document.getElementById('nav');
const navLnks = document.querySelectorAll('.nl');
const sections = document.querySelectorAll('section[id]');

onScroll(({ scroll }) => {
  if (!navEl) return;
  navEl.classList.toggle('scrolled', scroll > 80);

  let current = '';
  sections.forEach(s => { if (scroll >= s.offsetTop - 260) current = s.id; });
  navLnks.forEach(a =>
    a.classList.toggle('active', a.getAttribute('href') === '#' + current)
  );
});

/* ─────────────────────────────────────────────────────────
   8. HERO CANVAS PARALLAX ON SCROLL
───────────────────────────────────────────────────────── */
if (!REDUCED) {
  const heroCanvas = document.getElementById('hero-canvas');
  const heroBody   = document.getElementById('heroContent');
  const heroOrbs   = document.querySelectorAll('.orb');
  const heroBg     = document.querySelector('.hero-deep');

  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1.2,
    onUpdate(self) {
      const p = self.progress;
      if (heroCanvas) gsap.set(heroCanvas, { y: p * 120 });
      if (heroBody)   gsap.set(heroBody,   { y: p * 80, opacity: 1 - p * .7 });
      if (heroBg)     gsap.set(heroBg,     { y: p * 60 });
      heroOrbs.forEach((o, i) => gsap.set(o, { y: p * (i + 1) * 50 }));
    },
  });
}

/* ─────────────────────────────────────────────────────────
   9. CUSTOM CURSOR  —  dot + lagging ring + label
───────────────────────────────────────────────────────── */
(function initCursor() {
  const dot   = document.getElementById('c-dot');
  const ring  = document.getElementById('c-ring');
  const label = document.getElementById('c-label');
  if (!dot || !ring) return;

  let mx = -200, my = -200, rx = -200, ry = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    if (label) { label.style.left = mx + 'px'; label.style.top = my + 'px'; }
  }, { passive: true });

  // Ring lags behind with lerp
  (function ringLoop() {
    rx += (mx - rx) * .11;
    ry += (my - ry) * .11;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(ringLoop);
  })();

  // Hover states
  document.querySelectorAll('a, button, .proj-card, .sbar-row, .skill-category, .clink').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cur-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cur-hover'));
  });
  document.querySelectorAll('.feat-project, .proj-card:not(.proj-cta-card)').forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('cur-project');
      if (label) label.textContent = 'VIEW';
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cur-project');
      if (label) label.textContent = '';
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

/* ─────────────────────────────────────────────────────────
   10. MAGNETIC BUTTONS  —  elastic drift + snap-back
───────────────────────────────────────────────────────── */
document.querySelectorAll('.mag-btn').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r  = el.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width  / 2) * .28;
    const dy = (e.clientY - r.top  - r.height / 2) * .28;
    gsap.to(el, { x: dx, y: dy, duration: .35, ease: 'power2.out', overwrite: true });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: .75, ease: 'elastic.out(1,.4)', overwrite: true });
  });
});

/* ─────────────────────────────────────────────────────────
   11. SCROLL REVEALS  —  universal .reveal-up
───────────────────────────────────────────────────────── */
if (!REDUCED && typeof gsap !== 'undefined') {
  gsap.utils.toArray('.reveal-up').forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0);
    gsap.fromTo(el,
      { opacity: 0, y: 42 },
      {
        opacity: 1, y: 0,
        duration: 1.0, ease: 'power3.out', delay,
        scrollTrigger: {
          trigger: el, start: 'top 87%',
          toggleActions: 'play none none none',
        },
      }
    );
  });

  // Section headings — staggered line reveal
  gsap.utils.toArray('.reveal-lines').forEach(heading => {
    gsap.from(heading, {
      opacity: 0, y: 40, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: heading, start: 'top 85%' },
    });
  });
}

/* ─────────────────────────────────────────────────────────
   12. HERO STATS COUNTERS  —  run after loader finishes
      (NOT ScrollTrigger — they're in hero, already in view)
───────────────────────────────────────────────────────── */
function runCounters() {
  document.querySelectorAll('.counter[data-target]').forEach(el => {
    const target = +el.dataset.target;
    if (!target) return;

    const obj = { n: 0 };
    gsap.to(obj, {
      n: target,
      duration: 2,
      delay: .9,          // wait for hero entrance
      ease: 'power2.out',
      onUpdate() { el.textContent = Math.round(obj.n); },
      onComplete() { el.textContent = target; },
    });
  });
}
// Called from finishLoad → startHeroEntrance is called first, counters run after
setTimeout(runCounters, 800);

/* ─────────────────────────────────────────────────────────
   13. SKILL BADGE HOVER STAGGER
───────────────────────────────────────────────────────── */
if (!REDUCED) {
  document.querySelectorAll('.skill-category').forEach(cat => {
    const badges = cat.querySelectorAll('.sbadge');
    cat.addEventListener('mouseenter', () => {
      gsap.fromTo(badges,
        { y: 3, opacity: .6 },
        { y: 0, opacity: 1, stagger: .04, duration: .4, ease: 'power2.out', overwrite: true }
      );
    });
  });
}

/* ─────────────────────────────────────────────────────────
   14. SKILL BARS  —  animate width on scroll
───────────────────────────────────────────────────────── */
document.querySelectorAll('.sbar-row').forEach(row => {
  const fill = row.querySelector('.sbar-fill');
  const pct  = row.getAttribute('data-pct') || '75';
  if (!fill) return;

  ScrollTrigger.create({
    trigger: row,
    start: 'top 86%',
    once: true,
    onEnter() {
      gsap.to(fill, { width: pct + '%', duration: 1.5, ease: 'power3.out' });
    },
  });
});

/* ─────────────────────────────────────────────────────────
   15. FEATURED PROJECT  —  3D tilt on mousemove
───────────────────────────────────────────────────────── */
(function featTilt() {
  if (REDUCED) return;
  const fp = document.querySelector('.feat-project');
  if (!fp) return;

  fp.addEventListener('mousemove', e => {
    const r  = fp.getBoundingClientRect();
    const rx = ((e.clientY - r.top)  / r.height - .5) *  5;
    const ry = ((e.clientX - r.left) / r.width  - .5) * -5;
    gsap.to(fp, { rotateX: rx, rotateY: ry, transformPerspective: 1100, duration: .5, ease: 'power2.out', overwrite: true });
  });
  fp.addEventListener('mouseleave', () => {
    gsap.to(fp, { rotateX: 0, rotateY: 0, duration: .8, ease: 'power3.out', overwrite: true });
  });

  // Entrance animation
  if (!REDUCED) {
    gsap.from(fp, {
      opacity: 0, y: 60, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: fp, start: 'top 82%' },
    });
  }
})();

/* ─────────────────────────────────────────────────────────
   16. PROJECT CARDS  —  3D tilt + stagger entrance
───────────────────────────────────────────────────────── */
(function projCards() {
  if (!REDUCED) {
    gsap.from('.proj-card', {
      opacity: 0, y: 55, duration: 1, ease: 'power3.out', stagger: .1,
      scrollTrigger: { trigger: '.proj-grid', start: 'top 82%' },
    });
  }

  document.querySelectorAll('.proj-card:not(.proj-cta-card)').forEach(card => {
    if (REDUCED) return;
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top)  / r.height - .5) *  7;
      const ry = ((e.clientX - r.left) / r.width  - .5) * -7;
      gsap.to(card, { rotateX: rx, rotateY: ry, transformPerspective: 900, duration: .4, ease: 'power2.out', overwrite: true });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: .7, ease: 'power3.out', overwrite: true });
    });
  });
})();

/* ─────────────────────────────────────────────────────────
   17. SECTION PARALLAX  —  background orbs/elements drift
───────────────────────────────────────────────────────── */
if (!REDUCED) {
  [
    { el: '.about-bg-orb', yAmt: 80 },
    { el: '.skills-bg',    yAmt: 60 },
    { el: '.projects-bg',  yAmt: 70 },
    { el: '.contact-bg',   yAmt: 60 },
  ].forEach(({ el, yAmt }) => {
    const node = document.querySelector(el);
    if (!node) return;
    gsap.fromTo(node,
      { y: -yAmt / 2 },
      {
        y: yAmt / 2, ease: 'none',
        scrollTrigger: {
          trigger: node.parentElement,
          start: 'top bottom', end: 'bottom top',
          scrub: 1.5,
        },
      }
    );
  });
}

/* ─────────────────────────────────────────────────────────
   18. ABOUT PHOTO  —  breathing float
───────────────────────────────────────────────────────── */
if (!REDUCED) {
  gsap.to('.about-photo-frame', {
    y: -12, duration: 3.5,
    ease: 'sine.inOut', repeat: -1, yoyo: true,
  });
}

/* ─────────────────────────────────────────────────────────
   19. MARQUEE  —  pause on hover, reverse on visible
───────────────────────────────────────────────────────── */
const mq = document.querySelector('.marquee-track');
if (mq) {
  const wrap = mq.parentElement;
  wrap.addEventListener('mouseenter', () => mq.style.animationPlayState = 'paused');
  wrap.addEventListener('mouseleave', () => mq.style.animationPlayState = 'running');
}

/* ─────────────────────────────────────────────────────────
   20. MOBILE MENU
───────────────────────────────────────────────────────── */
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

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && mobMenu?.classList.contains('open')) closeMob();
});

/* ─────────────────────────────────────────────────────────
   21. SMOOTH ANCHOR SCROLL
───────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeMob();
    scrollToEl(target);
  });
});

/* ─────────────────────────────────────────────────────────
   22. CONTACT FORM  —  with proper validation + feedback
───────────────────────────────────────────────────────── */
function sendForm(e) {
  if (e) e.preventDefault();

  const nameEl  = document.getElementById('fn');
  const emailEl = document.getElementById('fe');
  const msgEl   = document.getElementById('fm');
  const status  = document.getElementById('form-status');
  const btn     = document.getElementById('formBtn');
  const btnTxt  = document.getElementById('formBtnText');
  if (!nameEl || !emailEl || !msgEl || !status || !btn) return;

  const name  = nameEl.value.trim();
  const email = emailEl.value.trim();
  const msg   = msgEl.value.trim();

  // Validate
  if (!name || !email || !msg) {
    status.style.color = '#f87171';
    status.textContent = 'Please fill in name, email, and message.';
    if (!REDUCED) gsap.from(status, { x: -5, duration: .3, ease: 'power2.out' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    status.style.color = '#f87171';
    status.textContent = 'Please enter a valid email address.';
    return;
  }

  // Sending state
  if (btnTxt) btnTxt.textContent = 'Sending…';
  btn.disabled = true;
  if (!REDUCED) gsap.to(btn, { opacity: .6, duration: .3 });

  // Simulate send (replace with real fetch if backend available)
  setTimeout(() => {
    ['fn','fe','fs','fm'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    if (btnTxt) btnTxt.textContent = '✓ Sent!';
    if (!REDUCED) gsap.to(btn, { opacity: 1, duration: .3 });
    status.style.color = '#86efac';
    status.textContent = "Message received! I'll be in touch within 24 hours.";

    const toast = document.getElementById('toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => { toast.classList.remove('show'); }, 3500);
    }
    setTimeout(() => {
      if (btnTxt) btnTxt.textContent = 'Send Message →';
      btn.disabled = false;
      status.textContent = '';
    }, 5000);
  }, 1500);
}

// Wire up form
const formEl = document.querySelector('.contact-form');
if (formEl) formEl.addEventListener('submit', sendForm);

/* ─────────────────────────────────────────────────────────
   23. KEYBOARD ACCESSIBILITY — show focus ring only when tabbing
───────────────────────────────────────────────────────── */
document.addEventListener('mousedown', () => document.body.classList.add('using-mouse'));
document.addEventListener('keydown',   () => document.body.classList.remove('using-mouse'));

/* ─────────────────────────────────────────────────────────
   24. RESIZE — refresh ScrollTrigger
───────────────────────────────────────────────────────── */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }, 300);
}, { passive: true });

/* ─────────────────────────────────────────────────────────
   25. EXPOSE GLOBALS (needed by inline onclick handlers)
───────────────────────────────────────────────────────── */
window.closeMob  = closeMob;
window.sendForm  = sendForm;