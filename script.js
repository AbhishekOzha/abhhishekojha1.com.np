/* ══════════════════════════════════════════════
   script.js — Abhishek Ojha · Cinematic Portfolio
   GSAP + ScrollTrigger + Lenis smooth scroll
   ══════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────
   1. LENIS SMOOTH SCROLL (defensive)
   ───────────────────────────── */
let lenis = null;
try {
  lenis = new Lenis({
    duration: 1.4,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  (function rafLoop(time) { lenis.raf(time); requestAnimationFrame(rafLoop); })(0);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
} catch(e) {
  console.warn('Lenis not loaded, falling back to native scroll');
  lenis = null;
}

/* helper: scroll event works with or without Lenis */
function onScroll(cb) {
  if (lenis) lenis.on('scroll', cb);
  else window.addEventListener('scroll', () => cb({ scroll: window.scrollY, progress: window.scrollY / (document.body.scrollHeight - window.innerHeight) }), { passive: true });
}


/* ─────────────────────────────
   2. PRELOADER
   ───────────────────────────── */
(function loader() {
  const ld  = document.getElementById('loader');
  const bar = document.getElementById('ldBar');
  const pct = document.getElementById('ldPct');
  if (!ld) return;

  let current = 0;
  const interval = setInterval(() => {
    current += Math.random() * 18;
    if (current >= 100) {
      current = 100;
      clearInterval(interval);
      if (bar) bar.style.width = '100%';
      if (pct) pct.textContent = '100%';
      setTimeout(finishLoad, 500);
    } else {
      if (bar) bar.style.width = current + '%';
      if (pct) pct.textContent = Math.round(current) + '%';
    }
  }, 70);

  function finishLoad() {
    gsap.to(ld, {
      opacity: 0, duration: .8, ease: 'power2.inOut',
      onComplete: () => {
        ld.style.display = 'none';
        document.body.classList.remove('is-loading');
        startHero();
      }
    });
  }
})();


/* ─────────────────────────────
   3. ATMOSPHERE CANVAS
   ───────────────────────────── */
(function atmosCanvas() {
  const canvas = document.getElementById('atmos');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;
  const DPR = Math.min(devicePixelRatio || 1, 2);

  function resize() {
    const hero = canvas.parentElement;
    W = hero.offsetWidth; H = hero.offsetHeight;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);
  }
  window.addEventListener('resize', resize);
  resize();

  const pts = Array.from({ length: 50 }, () => ({
    x: Math.random() * 1600, y: Math.random() * 900,
    vx: (Math.random() - .5) * .32, vy: (Math.random() - .5) * .2,
    r:  Math.random() * 1.6 + .3,
    a:  Math.random() * .45 + .07,
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += .007;

    [
      { x: W * .12 + Math.sin(t * .7) * 90,  y: H * .22 + Math.cos(t * .5) * 60,  r: 460, c: 'rgba(200,245,90,.05)' },
      { x: W * .8  + Math.cos(t * .55) * 80, y: H * .55 + Math.sin(t * .7) * 70,  r: 380, c: 'rgba(122,245,200,.04)' },
      { x: W * .5  + Math.sin(t * .4) * 60,  y: H * .8  + Math.cos(t * .35) * 50, r: 300, c: 'rgba(200,245,90,.03)' },
    ].forEach(b => {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, b.c); g.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
    });

    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,245,90,${p.a})`; ctx.fill();
    });

    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(200,245,90,${.07 * (1 - d / 120)})`;
          ctx.lineWidth = .5; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();


/* ─────────────────────────────
   4. HERO ENTRANCE
   ───────────────────────────── */
function startHero() {
  const hero = document.querySelector('.hero');
  if (hero) hero.classList.add('ready');

  const chip  = document.getElementById('hChip');
  const sub   = document.getElementById('hSub');
  const acts  = document.getElementById('hActs');
  const stats = document.getElementById('hStats');

  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .to(chip,  { opacity: 1, y: 0, duration: .8, delay: .15 })
    .to(sub,   { opacity: 1, y: 0, duration: .85 }, '-=.4')
    .to(acts,  { opacity: 1, y: 0, duration: .85 }, '-=.55')
    .to(stats, { opacity: 1, y: 0, duration: .9  }, '-=.6');

  gsap.from('#nav', { y: -20, opacity: 0, duration: .9, delay: .3, ease: 'power3.out' });

  // Start counters
  document.querySelectorAll('.counter').forEach(el => {
    const end = +el.dataset.to;
    gsap.fromTo({ val: 0 }, { val: 0 }, {
      val: end, duration: 2, delay: 1.1, ease: 'power2.out',
      onUpdate: function() { el.textContent = Math.round(this.targets()[0].val); }
    });
  });
}


/* ─────────────────────────────
   5. NAV — scroll shrink + active link
   ───────────────────────────── */
const navEl   = document.getElementById('nav');
const navLnks = document.querySelectorAll('.nl');
const secEls  = document.querySelectorAll('section[id]');

onScroll(({ scroll }) => {
  if (navEl) navEl.classList.toggle('scrolled', scroll > 60);
  let current = '';
  secEls.forEach(s => { if (scroll >= s.offsetTop - 250) current = s.id; });
  navLnks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
});


/* ─────────────────────────────
   6. SCROLL PROGRESS BAR
   ───────────────────────────── */
onScroll(({ progress }) => {
  const bar = document.getElementById('prog-bar');
  if (bar) bar.style.width = ((progress || 0) * 100) + '%';
});


/* ─────────────────────────────
   7. CUSTOM CURSOR
   ───────────────────────────── */
const cDot  = document.getElementById('c-dot');
const cRing = document.getElementById('c-ring');
const cTxt  = document.getElementById('c-txt');
if (cDot && cRing) {
  let mx = -200, my = -200, rx = -200, ry = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cDot.style.left = mx + 'px'; cDot.style.top = my + 'px';
    if (cTxt) { cTxt.style.left = mx + 'px'; cTxt.style.top = my + 'px'; }
  });
  (function ringTick() {
    rx += (mx - rx) * .11; ry += (my - ry) * .11;
    cRing.style.left = rx + 'px'; cRing.style.top = ry + 'px';
    requestAnimationFrame(ringTick);
  })();

  document.querySelectorAll('a,button,.sk-row,.pg-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('ch'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('ch'));
  });
  document.querySelectorAll('.proj-feat,.pg-card:not(.pg-cta-card)').forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('cv');
      if (cTxt) cTxt.textContent = 'VIEW';
    });
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cv');
      if (cTxt) cTxt.textContent = '';
    });
  });
  document.addEventListener('mouseleave', () => { cDot.style.opacity='0'; cRing.style.opacity='0'; });
  document.addEventListener('mouseenter', () => { cDot.style.opacity='1'; cRing.style.opacity='1'; });
}


/* ─────────────────────────────
   8. MAGNETIC BUTTONS
   ───────────────────────────── */
document.querySelectorAll('.mag').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r  = el.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width  / 2) * .28;
    const dy = (e.clientY - r.top  - r.height / 2) * .28;
    gsap.to(el, { x: dx, y: dy, duration: .35, ease: 'power2.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' });
  });
});


/* ─────────────────────────────
   9. SCROLL REVEAL (.gsap-up)
   ───────────────────────────── */
gsap.utils.toArray('.gsap-up').forEach((el, i) => {
  gsap.fromTo(el,
    { opacity: 0, y: 50 },
    {
      opacity: 1, y: 0,
      duration: 1.1,
      ease: 'power3.out',
      delay: (i % 3) * 0.07,
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      }
    }
  );
});


/* ─────────────────────────────
   10. HERO PARALLAX
   ───────────────────────────── */
const atmosEl = document.getElementById('atmos');
const heroBody = document.querySelector('.hero-body');
if (atmosEl) {
  gsap.to(atmosEl, {
    yPercent: 25, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
}
if (heroBody) {
  gsap.to(heroBody, {
    yPercent: 12, opacity: .35, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
}


/* ─────────────────────────────
   11. SKILL BAR ANIMATION
   ───────────────────────────── */
document.querySelectorAll('.sk-row').forEach(row => {
  const fill = row.querySelector('.sk-fill');
  const pct  = row.getAttribute('data-pct') || '75';
  if (!fill) return;
  ScrollTrigger.create({
    trigger: row,
    start: 'top 85%',
    onEnter: () => gsap.to(fill, { width: pct + '%', duration: 1.4, ease: 'power3.out' })
  });
});


/* ─────────────────────────────
   12. FEATURED PROJECT ENTRANCE
   ───────────────────────────── */
const projFeat = document.querySelector('.proj-feat');
if (projFeat) {
  gsap.from(projFeat, {
    opacity: 0, y: 60, duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: projFeat, start: 'top 82%' }
  });
}


/* ─────────────────────────────
   13. PROJECT GRID STAGGER
   ───────────────────────────── */
const pgCards = document.querySelectorAll('.pg-card');
if (pgCards.length) {
  gsap.from(pgCards, {
    opacity: 0, y: 50, duration: 1, ease: 'power3.out', stagger: .12,
    scrollTrigger: { trigger: '.proj-grid', start: 'top 82%' }
  });
}


/* ─────────────────────────────
   14. MARQUEE — pause on hover
   ───────────────────────────── */
const mqEl = document.querySelector('.mq-track');
if (mqEl) {
  mqEl.parentElement.addEventListener('mouseenter', () => mqEl.style.animationPlayState = 'paused');
  mqEl.parentElement.addEventListener('mouseleave', () => mqEl.style.animationPlayState = 'running');
}


/* ─────────────────────────────
   15. MOBILE MENU
   ───────────────────────────── */
const burger  = document.getElementById('burger');
const mobMenu = document.getElementById('mobMenu');

function closeMob() {
  if (!mobMenu || !burger) return;
  mobMenu.classList.remove('open');
  burger.classList.remove('open');
  document.body.style.overflow = '';
}
if (burger) {
  burger.addEventListener('click', () => {
    const open = mobMenu.classList.toggle('open');
    burger.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
}


/* ─────────────────────────────
   16. SMOOTH ANCHOR SCROLL
   ───────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault(); closeMob();
    if (lenis) {
      lenis.scrollTo(target, { offset: -70, duration: 1.8 });
    } else {
      const y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
});


/* ─────────────────────────────
   17. ABOUT PHOTO FLOAT
   ───────────────────────────── */
const apPhoto = document.querySelector('.about-photo');
if (apPhoto) {
  gsap.to(apPhoto, { y: -12, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true });
}


/* ─────────────────────────────
   18. SIDE TAG + SCROLL HINT FADE
   ───────────────────────────── */
gsap.from('.side-tag',    { opacity: 0, x: -10, duration: 1.2, delay: 2, ease: 'power3.out' });
gsap.from('.scroll-hint', { opacity: 0, y: 10,  duration: 1,   delay: 2.3, ease: 'power2.out' });


/* ─────────────────────────────
   19. CONTACT FORM
   ───────────────────────────── */
function sendForm() {
  const name  = document.getElementById('fn');
  const email = document.getElementById('fe');
  const msg   = document.getElementById('fm');
  const status = document.getElementById('cf-status');
  if (!name || !email || !msg) return;

  if (!name.value.trim() || !email.value.trim() || !msg.value.trim()) {
    if (status) { status.style.color = '#f87171'; status.textContent = 'Please fill in name, email and message.'; }
    return;
  }

  const btn = document.querySelector('.cf-btn');
  if (btn) { btn.querySelector('span').textContent = 'Sending…'; gsap.to(btn, { opacity: .65, duration: .3 }); }

  setTimeout(() => {
    ['fn','fe','fs','fm'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    if (btn) { btn.querySelector('span').textContent = '✓ Sent!'; gsap.to(btn, { opacity: 1, duration: .3 }); }
    if (status) { status.style.color = 'var(--acc2)'; status.textContent = "I'll get back to you within 24 hours."; }

    const toast = document.getElementById('toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        if (btn) btn.querySelector('span').textContent = 'Send Message →';
        if (status) status.textContent = '';
      }, 3500);
    }
  }, 1400);
}