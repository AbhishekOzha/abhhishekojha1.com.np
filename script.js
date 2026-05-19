/* ══════════════════════════════════════════════
   script.js — Abhishek Ojha · Cinematic Portfolio
   GSAP + ScrollTrigger + Lenis smooth scroll
   ══════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────
   1. LENIS SMOOTH SCROLL
   ───────────────────────────── */
const lenis = new Lenis({
  duration: 1.4,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
});
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// Sync Lenis with ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);


/* ─────────────────────────────
   2. PRELOADER
   ───────────────────────────── */
(function loader() {
  const ld    = document.getElementById('loader');
  const bar   = document.getElementById('ldBar');
  const pct   = document.getElementById('ldPct');
  let current = 0;

  const interval = setInterval(() => {
    current += Math.random() * 18;
    if (current >= 100) {
      current = 100;
      clearInterval(interval);
      bar.style.width = '100%';
      pct.textContent = '100%';
      setTimeout(finishLoad, 600);
    } else {
      bar.style.width = current + '%';
      pct.textContent = Math.round(current) + '%';
    }
  }, 80);

  function finishLoad() {
    gsap.to(ld, {
      opacity: 0, duration: .9, ease: 'power2.inOut',
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
      Flowing gradient blobs + constellation
   ───────────────────────────── */
(function atmosCanvas() {
  const canvas = document.getElementById('atmos');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;
  const DPR = Math.min(devicePixelRatio, 2);

  function resize() {
    const hero = canvas.parentElement;
    W = hero.offsetWidth; H = hero.offsetHeight;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);
  }
  window.addEventListener('resize', () => { resize(); });
  resize();

  // Particles
  const pts = Array.from({ length: 50 }, () => ({
    x: Math.random() * 1600, y: Math.random() * 900,
    vx: (Math.random() - .5) * .32, vy: (Math.random() - .5) * .2,
    r:  Math.random() * 1.6 + .3,
    a:  Math.random() * .45 + .07,
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += .007;

    // Blobs
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

    // Particles
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,245,90,${p.a})`; ctx.fill();
    });

    // Lines
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
   4. HERO ENTRANCE — GSAP timeline
   ───────────────────────────── */
function startHero() {
  const hero = document.querySelector('.hero');
  hero.classList.add('ready'); // triggers CSS line reveal

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  tl
    .to('#hChip', { opacity: 1, y: 0, duration: .8 }, .2)
    .call(() => document.getElementById('hChip').classList.add('in'), null, .2)
    .to('#hSub',  { opacity: 1, y: 0, duration: .85 }, .55)
    .call(() => document.getElementById('hSub').classList.add('in'), null, .55)
    .to('#hActs', { opacity: 1, y: 0, duration: .85 }, .7)
    .call(() => document.getElementById('hActs').classList.add('in'), null, .7)
    .to('#hStats',{ opacity: 1, y: 0, duration: .9  }, .85)
    .call(() => document.getElementById('hStats').classList.add('in'), null, .85);

  // Nav entrance
  gsap.from('#nav', { y: -20, opacity: 0, duration: .9, delay: .3, ease: 'power3.out' });
}


/* ─────────────────────────────
   5. NAV — scroll shrink + active
   ───────────────────────────── */
const navEl   = document.getElementById('nav');
const navLnks = document.querySelectorAll('.nl');
const secEls  = document.querySelectorAll('section[id]');

lenis.on('scroll', ({ scroll }) => {
  navEl.classList.toggle('scrolled', scroll > 60);

  let current = '';
  secEls.forEach(s => { if (scroll >= s.offsetTop - 250) current = s.id; });
  navLnks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
});


/* ─────────────────────────────
   6. SCROLL PROGRESS BAR
   ───────────────────────────── */
lenis.on('scroll', ({ progress }) => {
  document.getElementById('prog-bar').style.width = (progress * 100) + '%';
});


/* ─────────────────────────────
   7. CUSTOM CURSOR
   ───────────────────────────── */
const cDot  = document.getElementById('c-dot');
const cRing = document.getElementById('c-ring');
const cTxt  = document.getElementById('c-txt');
let mx = -200, my = -200, rx = -200, ry = -200;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cDot.style.left = mx + 'px'; cDot.style.top = my + 'px';
  cTxt.style.left = mx + 'px'; cTxt.style.top = my + 'px';
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
    cTxt.textContent = 'VIEW';
  });
  el.addEventListener('mouseleave', () => {
    document.body.classList.remove('cv');
    cTxt.textContent = '';
  });
});
document.addEventListener('mouseleave', () => { cDot.style.opacity='0'; cRing.style.opacity='0'; });
document.addEventListener('mouseenter', () => { cDot.style.opacity='1'; cRing.style.opacity='1'; });


/* ─────────────────────────────
   8. MAGNETIC EFFECT
   ───────────────────────────── */
document.querySelectorAll('.mag').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r  = el.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width  / 2) * .3;
    const dy = (e.clientY - r.top  - r.height / 2) * .3;
    gsap.to(el, { x: dx, y: dy, duration: .4, ease: 'power2.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' });
  });
});


/* ─────────────────────────────
   9. GSAP SCROLL REVEALS
   ───────────────────────────── */
gsap.utils.toArray('.gsap-up').forEach((el, i) => {
  gsap.fromTo(el,
    { opacity: 0, y: 50 },
    {
      opacity: 1, y: 0,
      duration: 1.1,
      ease: 'power3.out',
      delay: (i % 3) * 0.08,
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      }
    }
  );
});


/* ─────────────────────────────
   10. SECTION TITLE WORD-BY-WORD REVEAL
   ───────────────────────────── */
document.querySelectorAll('.sec-h2').forEach(h => {
  // Split into words
  const raw = h.innerHTML;
  // Only wrap text nodes
  gsap.from(h, {
    opacity: 0, y: 40, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: h, start: 'top 85%' }
  });
});


/* ─────────────────────────────
   11. HERO PARALLAX
   ───────────────────────────── */
gsap.to('#atmos', {
  yPercent: 25,
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  }
});

gsap.to('.hero-body', {
  yPercent: 12,
  opacity: .4,
  ease: 'none',
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  }
});


/* ─────────────────────────────
   12. SKILL BAR ANIMATION
   ───────────────────────────── */
document.querySelectorAll('.sk-row').forEach(row => {
  const fill = row.querySelector('.sk-fill');
  const pct  = row.getAttribute('data-pct') || '75';

  ScrollTrigger.create({
    trigger: row,
    start: 'top 85%',
    onEnter: () => {
      gsap.to(fill, { width: pct + '%', duration: 1.4, ease: 'power3.out' });
    }
  });
});


/* ─────────────────────────────
   13. COUNTER ANIMATION
   ───────────────────────────── */
document.querySelectorAll('.counter').forEach(el => {
  const end = +el.dataset.to;
  ScrollTrigger.create({
    trigger: el,
    start: 'top 88%',
    onEnter: () => {
      gsap.fromTo({ val: 0 },
        { val: 0 },
        {
          val: end, duration: 1.8, ease: 'power2.out',
          onUpdate: function() { el.textContent = Math.round(this.targets()[0].val); }
        }
      );
    }
  });
});


/* ─────────────────────────────
   14. MARQUEE — pause on hover
   ───────────────────────────── */
const mq = document.querySelector('.mq-track');
if (mq) {
  mq.parentElement.addEventListener('mouseenter', () => mq.style.animationPlayState = 'paused');
  mq.parentElement.addEventListener('mouseleave', () => mq.style.animationPlayState = 'running');
}


/* ─────────────────────────────
   15. MOBILE MENU
   ───────────────────────────── */
const burger  = document.getElementById('burger');
const mobMenu = document.getElementById('mobMenu');

function closeMob() {
  mobMenu.classList.remove('open');
  burger.classList.remove('open');
  document.body.style.overflow = '';
}
burger.addEventListener('click', () => {
  const open = mobMenu.classList.toggle('open');
  burger.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});


/* ─────────────────────────────
   16. SMOOTH ANCHOR SCROLL
   ───────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault(); closeMob();
    lenis.scrollTo(target, { offset: -70, duration: 1.8 });
  });
});


/* ─────────────────────────────
   17. FEATURED PROJECT ENTRANCE
   ───────────────────────────── */
gsap.from('.proj-feat', {
  opacity: 0, y: 60, duration: 1.2, ease: 'power3.out',
  scrollTrigger: { trigger: '.proj-feat', start: 'top 82%' }
});


/* ─────────────────────────────
   18. PROJECT GRID STAGGER
   ───────────────────────────── */
gsap.from('.pg-card', {
  opacity: 0, y: 50, duration: 1, ease: 'power3.out',
  stagger: .12,
  scrollTrigger: { trigger: '.proj-grid', start: 'top 82%' }
});


/* ─────────────────────────────
   19. CONTACT FORM
   ───────────────────────────── */
function sendForm() {
  const name = document.getElementById('fn').value.trim();
  const email = document.getElementById('fe').value.trim();
  const msg   = document.getElementById('fm').value.trim();
  const status = document.getElementById('cf-status');

  if (!name || !email || !msg) {
    status.style.color = '#f87171';
    status.textContent = 'Please fill in name, email and message.';
    return;
  }

  const btn = document.querySelector('.cf-btn');
  btn.querySelector('span').textContent = 'Sending…';
  gsap.to(btn, { opacity: .65, duration: .3 });

  setTimeout(() => {
    ['fn','fe','fs','fm'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    btn.querySelector('span').textContent = '✓ Message Sent!';
    gsap.to(btn, { opacity: 1, duration: .3 });
    status.style.color = 'var(--acc2)';
    status.textContent = "I'll get back to you within 24 hours.";

    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      btn.querySelector('span').textContent = 'Send Message →';
      status.textContent = '';
    }, 3500);
  }, 1400);
}


/* ─────────────────────────────
   20. ABOUT PHOTO SUBTLE FLOAT
   ───────────────────────────── */
gsap.to('.about-photo', {
  y: -12,
  duration: 3,
  ease: 'sine.inOut',
  repeat: -1,
  yoyo: true,
});


/* ─────────────────────────────
   21. SIDE TAG FADE IN
   ───────────────────────────── */
gsap.from('.side-tag', {
  opacity: 0, x: -10, duration: 1.2, delay: 1.8, ease: 'power3.out'
});


/* ─────────────────────────────
   22. SCROLL CUE ANIMATION
   ───────────────────────────── */
gsap.from('.scroll-hint', {
  opacity: 0, y: 10, duration: 1, delay: 2.2, ease: 'power2.out'
});