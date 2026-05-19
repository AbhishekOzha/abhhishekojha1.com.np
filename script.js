/* ─────────────────────────────────────────────
   script.js — Abhishek Ojha · Elite Portfolio
   ───────────────────────────────────────────── */

'use strict';

/* ──────────────────────────────────────────────
   1.  CUSTOM CURSOR — magnetic dot + trailing ring
   ────────────────────────────────────────────── */
const dot     = document.getElementById('cur-dot');
const outline = document.getElementById('cur-outline');
const label   = document.getElementById('cur-label');
let mx = -200, my = -200, ox = -200, oy = -200;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.left = mx + 'px';
  dot.style.top  = my + 'px';
  label.style.left = mx + 'px';
  label.style.top  = my + 'px';
});

// Lagging ring
(function tickRing() {
  ox += (mx - ox) * 0.12;
  oy += (my - oy) * 0.12;
  outline.style.left = ox + 'px';
  outline.style.top  = oy + 'px';
  requestAnimationFrame(tickRing);
})();

// Hover states
document.querySelectorAll('a, button, .skill-row, .proj-card, .clink, .acard').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});
document.querySelectorAll('.proj-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    document.body.classList.add('cursor-project');
    label.textContent = 'VIEW';
  });
  el.addEventListener('mouseleave', () => {
    document.body.classList.remove('cursor-project');
    label.textContent = '';
  });
});


/* ──────────────────────────────────────────────
   2.  MAGNETIC BUTTONS
   ────────────────────────────────────────────── */
document.querySelectorAll('.mag-btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r  = btn.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    const dx = (e.clientX - cx) * 0.28;
    const dy = (e.clientY - cy) * 0.28;
    btn.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
    btn.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
    setTimeout(() => btn.style.transition = '', 500);
  });
});


/* ──────────────────────────────────────────────
   3.  WEBGL-STYLE HERO CANVAS (pure canvas — no lib needed)
       Animated gradient mesh + flowing particles
   ────────────────────────────────────────────── */
(function heroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;
  const DPR = Math.min(devicePixelRatio, 2);

  function resize() {
    W = canvas.parentElement.offsetWidth;
    H = canvas.parentElement.offsetHeight;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);
  }
  window.addEventListener('resize', resize);
  resize();

  // Particles
  const PARTICLES = Array.from({ length: 55 }, () => ({
    x: Math.random() * 1400,
    y: Math.random() * 900,
    vx: (Math.random() - .5) * .35,
    vy: (Math.random() - .5) * .22,
    r: Math.random() * 1.5 + .4,
    a: Math.random() * .5 + .08,
  }));

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += .008;

    /* — Background glow blobs — */
    const blobs = [
      { x: W * .15 + Math.sin(t * .7) * 80,   y: H * .25 + Math.cos(t * .5) * 60,   r: 420, c0: 'rgba(200,245,90,.055)',  c1: 'transparent' },
      { x: W * .75 + Math.cos(t * .6) * 100,  y: H * .55 + Math.sin(t * .8) * 70,   r: 380, c0: 'rgba(122,245,200,.04)', c1: 'transparent' },
      { x: W * .5  + Math.sin(t * .4) * 60,   y: H * .75 + Math.cos(t * .35) * 80,  r: 300, c0: 'rgba(200,245,90,.03)',  c1: 'transparent' },
    ];
    blobs.forEach(b => {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, b.c0);
      g.addColorStop(1, b.c1);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });

    /* — Particles — */
    PARTICLES.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,245,90,${p.a})`;
      ctx.fill();
    });

    /* — Particle connections — */
    for (let i = 0; i < PARTICLES.length; i++) {
      for (let j = i + 1; j < PARTICLES.length; j++) {
        const a = PARTICLES[i], b = PARTICLES[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(200,245,90,${.08 * (1 - d / 130)})`;
          ctx.lineWidth = .6;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();


/* ──────────────────────────────────────────────
   4.  SCROLL PROGRESS BAR
   ────────────────────────────────────────────── */
const progressEl = document.getElementById('progress');
window.addEventListener('scroll', () => {
  const pct = scrollY / (document.body.scrollHeight - innerHeight) * 100;
  progressEl.style.width = pct + '%';
}, { passive: true });


/* ──────────────────────────────────────────────
   5.  NAV — scroll-shrink + active link
   ────────────────────────────────────────────── */
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 60);

  let current = '';
  sections.forEach(s => { if (scrollY >= s.offsetTop - 220) current = s.id; });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}, { passive: true });


/* ──────────────────────────────────────────────
   6.  HERO ENTRANCE
   ────────────────────────────────────────────── */
window.addEventListener('load', () => {
  const hero = document.querySelector('.hero');
  setTimeout(() => hero.classList.add('loaded'), 100);

  // Chip
  const chip = document.querySelector('.hero-chip');
  setTimeout(() => chip.classList.add('in'), 200);
});


/* ──────────────────────────────────────────────
   7.  INTERSECTION OBSERVER — SCROLL REVEAL
   ────────────────────────────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.sc-reveal').forEach(el => revealObs.observe(el));


/* ──────────────────────────────────────────────
   8.  SKILL BAR ANIMATION (triggered on reveal)
   ────────────────────────────────────────────── */
const skillObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const row = e.target;
    const pct = row.getAttribute('data-pct') || '75';
    const fill = row.querySelector('.sk-fill');
    if (fill) {
      row.classList.add('in'); // triggers .skill-row.in .sk-fill
      row.style.setProperty('--fill-pct', pct + '%');
    }
    skillObs.unobserve(row);
  });
}, { threshold: 0.3 });

document.querySelectorAll('.skill-row').forEach(el => skillObs.observe(el));


/* ──────────────────────────────────────────────
   9.  COUNTER ANIMATION
   ────────────────────────────────────────────── */
const counterObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el  = e.target;
    const end = +el.dataset.to;
    const dur = 1600;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(ease * end) + (end === 50 ? '+' : '+');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    counterObs.unobserve(el);
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => counterObs.observe(el));


/* ──────────────────────────────────────────────
   10.  HORIZONTAL DRAG SCROLL — Projects
   ────────────────────────────────────────────── */
(function dragScroll() {
  const track = document.getElementById('projTrack');
  if (!track) return;
  let isDown = false, startX, scrollLeft;

  track.addEventListener('mousedown', e => {
    isDown = true; startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    track.classList.add('grabbing');
  });
  window.addEventListener('mouseup', () => {
    isDown = false;
    track.classList.remove('grabbing');
  });
  track.addEventListener('mouseleave', () => {
    isDown = false;
    track.classList.remove('grabbing');
  });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x    = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.6;
    track.scrollLeft = scrollLeft - walk;
  });

  // Touch support
  let touchStartX = 0, touchScrollLeft = 0;
  track.addEventListener('touchstart', e => {
    touchStartX    = e.touches[0].pageX;
    touchScrollLeft = track.scrollLeft;
  }, { passive: true });
  track.addEventListener('touchmove', e => {
    const dx = touchStartX - e.touches[0].pageX;
    track.scrollLeft = touchScrollLeft + dx;
  }, { passive: true });
})();


/* ──────────────────────────────────────────────
   11.  MOBILE MENU
   ────────────────────────────────────────────── */
function openMob() {
  document.getElementById('mobMenu').classList.add('open');
  document.getElementById('hamburger').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMob() {
  document.getElementById('mobMenu').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobMenu').classList.contains('open') ? closeMob() : openMob();
});


/* ──────────────────────────────────────────────
   12.  SMOOTH SCROLL (override defaults)
   ────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault(); closeMob();
    const y = target.getBoundingClientRect().top + scrollY - 70;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });
});


/* ──────────────────────────────────────────────
   13.  CONTACT FORM
   ────────────────────────────────────────────── */
function sendForm() {
  const name    = document.getElementById('f-name').value.trim();
  const email   = document.getElementById('f-email').value.trim();
  const subject = document.getElementById('f-subject').value.trim();
  const msg     = document.getElementById('f-msg').value.trim();
  const status  = document.getElementById('form-status');

  if (!name || !email || !msg) {
    status.style.color = '#f87171';
    status.textContent = 'Please fill in all required fields.';
    return;
  }

  const btn = document.querySelector('.form-submit');
  btn.querySelector('span').textContent = 'Sending…';
  btn.style.opacity = '.7';

  setTimeout(() => {
    ['f-name','f-email','f-subject','f-msg'].forEach(id => document.getElementById(id).value = '');
    btn.querySelector('span').textContent = '✓ Message Sent!';
    btn.style.opacity = '1';
    status.style.color = 'var(--accent2)';
    status.textContent = "Message received! I'll get back to you within 24 hours.";

    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      btn.querySelector('span').textContent = 'Send Message →';
      status.textContent = '';
    }, 3500);
  }, 1400);
}


/* ──────────────────────────────────────────────
   14.  PARALLAX — subtle hero depth on scroll
   ────────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  const canvas = document.getElementById('heroCanvas');
  if (canvas && scrollY < innerHeight) {
    canvas.style.transform = `translateY(${scrollY * 0.25}px)`;
  }
}, { passive: true });


/* ──────────────────────────────────────────────
   15.  SECTION ENTRANCE — stagger children
        (adds staggered delay to .sc-reveal groups)
   ────────────────────────────────────────────── */
document.querySelectorAll('.about-cards, .skills-grid, .clinks').forEach(parent => {
  Array.from(parent.children).forEach((child, i) => {
    child.style.setProperty('--delay', (i * 0.07) + 's');
  });
});


/* ──────────────────────────────────────────────
   16.  HERO TEXT TYPING (sub-title cycling)
        Cycles descriptors below the heading
   ────────────────────────────────────────────── */
(function typeHero() {
  const el = document.querySelector('.hero-sub strong:last-child');
  if (!el) return;
  // optional — keep it static if preferred, just decorate with underline pulse
  el.style.borderBottom = '1px solid var(--accent)';
  el.style.paddingBottom = '2px';
})();


/* ──────────────────────────────────────────────
   17.  CURSOR HIDE when leaving window
   ────────────────────────────────────────────── */
document.addEventListener('mouseleave', () => {
  dot.style.opacity = '0';
  outline.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
  dot.style.opacity = '1';
  outline.style.opacity = '1';
});


/* ──────────────────────────────────────────────
   18.  ORBIT RING pause on hover
   ────────────────────────────────────────────── */
document.querySelectorAll('.orbit-ring').forEach(ring => {
  ring.addEventListener('mouseenter', () => ring.style.animationPlayState = 'paused');
  ring.addEventListener('mouseleave', () => ring.style.animationPlayState = 'running');
});