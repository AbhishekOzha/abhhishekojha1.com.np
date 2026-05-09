/* ─────────────────────────────────────────
   script.js — Abhishek Ojha Portfolio
   ───────────────────────────────────────── */

/* ── CUSTOM CURSOR ── */
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});

(function animRing() {
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(animRing);
})();

document.querySelectorAll('a, button, .skill-item, .proj-card, .stat-box, .contact-link').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width  = '18px';
    cursor.style.height = '18px';
    ring.style.width    = '56px';
    ring.style.height   = '56px';
    ring.style.opacity  = '.7';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width  = '10px';
    cursor.style.height = '10px';
    ring.style.width    = '38px';
    ring.style.height   = '38px';
    ring.style.opacity  = '.45';
  });
});


/* ── WORD REVEAL ANIMATION ── */
const styleTag = document.createElement('style');
styleTag.textContent = `
  @keyframes wordReveal {
    from { opacity:0; transform:translateY(100%); }
    to   { opacity:1; transform:translateY(0); }
  }
`;
document.head.appendChild(styleTag);

document.querySelectorAll('.word-reveal span').forEach(el => {
  const delay = el.style.animationDelay || '0s';
  el.style.animation = `wordReveal .7s cubic-bezier(.16,1,.3,1) ${delay} forwards`;
});


/* ── SCROLL PROGRESS BAR ── */
const progressLine = document.getElementById('progress-line');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progressLine.style.width = pct + '%';
});


/* ── SCROLL REVEAL ── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) setTimeout(() => e.target.classList.add('visible'), i * 80);
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));


/* ── COUNTER ANIMATION ── */
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el     = e.target;
    const target = +el.dataset.count;
    let cur = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      cur = Math.min(cur + step, target);
      el.textContent = cur + (target === 100 ? '%' : '+');
      if (cur >= target) clearInterval(timer);
    }, 35);
    counterObs.unobserve(el);
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));


/* ── CONTACT FORM ── */
function sendMsg() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const msg   = document.getElementById('msg').value.trim();
  if (!name || !email || !msg) { alert('Please fill in all fields!'); return; }
  document.getElementById('name').value  = '';
  document.getElementById('email').value = '';
  document.getElementById('msg').value   = '';
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}


/* ── ACTIVE NAV HIGHLIGHT ── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 200) current = s.id; });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + current ? 'var(--accent)' : '';
  });
});


/* ── PHOTO 3D TILT ── */
const frame = document.querySelector('.photo-frame');
if (frame) {
  frame.addEventListener('mousemove', e => {
    const r = frame.getBoundingClientRect();
    const x = (e.clientX - r.left  - r.width  / 2) / r.width;
    const y = (e.clientY - r.top   - r.height / 2) / r.height;
    frame.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
  });
  frame.addEventListener('mouseleave', () => {
    frame.style.transform  = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
    frame.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
  });
  frame.addEventListener('mouseenter', () => {
    frame.style.transition = 'transform .15s ease';
  });
}


/* ── MOBILE MENU ── */
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
  document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
}


/* ── SKILL CONSTELLATION CANVAS ── */
(function () {
  const canvas = document.getElementById('cCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const TEAL   = [14, 127, 110];
  const VIOLET = [124, 92, 191];
  const WHITE  = [255, 255, 255];

  const SKILLS = [
    { label: 'React',         color: TEAL   },
    { label: 'Node.js',       color: WHITE  },
    { label: 'Python',        color: VIOLET },
    { label: 'Django',        color: TEAL   },
    { label: 'System Design', color: VIOLET },
    { label: 'CI/CD',         color: WHITE  },
    { label: 'PostgreSQL',    color: TEAL   },
    { label: 'REST APIs',     color: WHITE  },
    { label: 'Mobile Dev',    color: VIOLET },
    { label: 'UI/UX',         color: TEAL   },
    { label: 'Healthcare',    color: VIOLET },
    { label: 'Full Stack',    color: WHITE  },
  ];

  let W, H, nodes = [];
  const mouse = { x: -9999, y: -9999 };
  const DPR          = Math.min(window.devicePixelRatio || 1, 2);
  const CONNECT_DIST = 180;
  const MOUSE_DIST   = 140;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);
    init();
  }

  function init() {
    nodes = SKILLS.map(s => ({
      label:   s.label,
      color:   s.color,
      x:       rand(W * 0.06, W * 0.94),
      y:       rand(H * 0.12, H * 0.88),
      vx:      rand(-0.28, 0.28),
      vy:      rand(-0.18, 0.18),
      r:       rand(2.8, 4.2),
      pulse:   rand(0, Math.PI * 2),
      hovered: false,
    }));
  }

  function rgba(rgb, a) { return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`; }

  function drawNode(n) {
    const pr = n.r + Math.sin(n.pulse) * 1.2;

    // glow
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, pr * 9);
    g.addColorStop(0, rgba(n.color, n.hovered ? 0.25 : 0.10));
    g.addColorStop(1, rgba(n.color, 0));
    ctx.beginPath();
    ctx.arc(n.x, n.y, pr * 9, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // core dot
    ctx.beginPath();
    ctx.arc(n.x, n.y, pr, 0, Math.PI * 2);
    ctx.fillStyle = rgba(n.color, n.hovered ? 1 : 0.7);
    ctx.fill();

    // label
    ctx.font      = `${n.hovered ? 700 : 600} ${n.hovered ? 11 : 10}px "Manrope",sans-serif`;
    ctx.fillStyle = rgba(n.color, n.hovered ? 0.95 : 0.45);
    ctx.textAlign = 'center';
    ctx.fillText(n.label, n.x, n.y - pr - 7);
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,.018)';
    ctx.lineWidth   = 1;
    const step = 38;
    for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // move nodes
    nodes.forEach(n => {
      n.pulse += 0.032;
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < MOUSE_DIST && d > 0) {
        const force = (MOUSE_DIST - d) / MOUSE_DIST;
        n.vx += (dx / d) * force * 0.55;
        n.vy += (dy / d) * force * 0.55;
        n.hovered = d < 60;
      } else {
        n.hovered = false;
      }
      n.vx *= 0.97; n.vy *= 0.97;
      n.x  += n.vx;  n.y  += n.vy;
      const pad = 30;
      if (n.x < pad)     { n.x = pad;     n.vx =  Math.abs(n.vx) * 0.6; }
      if (n.x > W - pad) { n.x = W - pad; n.vx = -Math.abs(n.vx) * 0.6; }
      if (n.y < pad)     { n.y = pad;     n.vy =  Math.abs(n.vy) * 0.6; }
      if (n.y > H - pad) { n.y = H - pad; n.vy = -Math.abs(n.vy) * 0.6; }
    });

    // connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < CONNECT_DIST) {
          const alpha     = (1 - d / CONNECT_DIST) * 0.28;
          const lineColor = a.color === b.color ? a.color : WHITE;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = rgba(lineColor, alpha);
          ctx.lineWidth   = (1 - d / CONNECT_DIST) * 1.4;
          ctx.stroke();
        }
      }
    }

    // mouse lines
    nodes.forEach(n => {
      const dx = n.x - mouse.x, dy = n.y - mouse.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < MOUSE_DIST) {
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(n.x, n.y);
        ctx.strokeStyle = rgba(n.color, (1 - d / MOUSE_DIST) * 0.5);
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      }
    });

    // mouse dot
    if (mouse.x > 0 && mouse.x < W) {
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fill();
    }

    nodes.forEach(drawNode);
    requestAnimationFrame(tick);
  }

  const wrap = canvas.closest('.constellation-wrap');
  wrap.addEventListener('mousemove', e => {
    const r  = canvas.getBoundingClientRect();
    mouse.x  = e.clientX - r.left;
    mouse.y  = e.clientY - r.top;
  });
  wrap.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  window.addEventListener('resize', resize);
  resize();
  tick();
})();
