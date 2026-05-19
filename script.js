/* ═══════════════════════════════════════════════════════════
   script.js — Abhishek Ojha · Cinematic Tech Portfolio
   No personal photos. Pure code-generated visuals.
   Tech: Lenis 1.1 + GSAP 3.12 + ScrollTrigger + Canvas
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* ── MOTION PREFERENCE ─────────────────────────── */
var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var GSAP_OK = typeof gsap !== 'undefined';
var ST_OK   = typeof ScrollTrigger !== 'undefined';
if (GSAP_OK && ST_OK) gsap.registerPlugin(ScrollTrigger);

/* ── LENIS ─────────────────────────────────────── */
var lenis = null;
if (!REDUCED) {
  try {
    lenis = new Lenis({ duration: 1.25, easing: function(t){ return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    if (GSAP_OK) { gsap.ticker.add(function(t){ lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0); }
    else { (function raf(t){ lenis.raf(t); requestAnimationFrame(raf); })(0); }
    if (ST_OK) lenis.on('scroll', ScrollTrigger.update);
  } catch(e) { lenis = null; }
}

function scrollTo(el, offset) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: offset || -72, duration: 1.6 });
  else { var y = el.getBoundingClientRect().top + window.scrollY + (offset || -72); window.scrollTo({ top: y, behavior: 'smooth' }); }
}
function onScroll(cb) {
  if (lenis) lenis.on('scroll', cb);
  else window.addEventListener('scroll', function(){ cb({ scroll: window.scrollY, progress: window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight) }); }, { passive: true });
}

/* ═══════════════════════════════════════════════════════════
   1. HERO CANVAS — floating data particles + connection lines
      Visible immediately. No loader.
═══════════════════════════════════════════════════════════ */
(function heroCanvas() {
  if (REDUCED) return;
  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, t = 0;
  var DPR = Math.min(devicePixelRatio || 1, 2);

  function resize() {
    var hero = canvas.parentElement.parentElement;
    W = hero.offsetWidth; H = hero.offsetHeight;
    canvas.width  = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  /* Teal/violet palette to match accent colors */
  var PTS = Array.from({ length: 50 }, function() {
    return {
      x: Math.random() * 1600, y: Math.random() * 900,
      vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .18,
      r:  Math.random() * 1.4 + .3,
      a:  Math.random() * .35 + .06,
      col: Math.random() > .5 ? [0,212,170] : [123,97,255],
    };
  });

  var paused = false;
  document.addEventListener('visibilitychange', function(){ paused = document.hidden; });

  function draw() {
    if (paused) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, W, H);
    t += .005;

    PTS.forEach(function(p) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.col[0] + ',' + p.col[1] + ',' + p.col[2] + ',' + p.a + ')';
      ctx.fill();
    });
    for (var i = 0; i < PTS.length; i++) {
      for (var j = i + 1; j < PTS.length; j++) {
        var d = Math.hypot(PTS[i].x - PTS[j].x, PTS[i].y - PTS[j].y);
        if (d < 120) {
          ctx.beginPath(); ctx.moveTo(PTS[i].x, PTS[i].y); ctx.lineTo(PTS[j].x, PTS[j].y);
          ctx.strokeStyle = 'rgba(0,212,170,' + (.05 * (1 - d/120)) + ')';
          ctx.lineWidth = .5; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ═══════════════════════════════════════════════════════════
   2. HERO ENTRANCE — text lines shoot up from clip mask
      Immediate on page load, no loader needed
═══════════════════════════════════════════════════════════ */
(function heroEntrance() {
  var hero    = document.querySelector('.hero');
  var content = document.getElementById('heroContent');
  if (!hero) return;

  /* Trigger CSS transition after 2 frames */
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    hero.classList.add('loaded');
  }); });

  /* Fade in sub-elements */
  if (REDUCED) return;
  var els = ['.hero-chip', '.hero-sub', '.hero-ctas', '.hero-stats', '.scroll-cue'].map(function(s){ return document.querySelector(s); }).filter(Boolean);
  els.forEach(function(el){ el.style.opacity = '0'; el.style.transform = 'translateY(18px)'; });
  els.forEach(function(el, i){
    setTimeout(function(){
      el.style.transition = 'opacity .85s cubic-bezier(.16,1,.3,1), transform .85s cubic-bezier(.16,1,.3,1)';
      el.style.opacity = '1'; el.style.transform = 'none';
    }, 250 + i * 120);
  });

  /* Hero stage stagger */
  var stageEls = ['.stage-browser', '.stage-code', '.stage-notif', '.stage-phone', '.stage-stream'];
  stageEls.forEach(function(s, i){
    var el = document.querySelector(s);
    if (!el) return;
    el.style.opacity = '0'; el.style.transform = 'translateY(24px)';
    setTimeout(function(){
      el.style.transition = 'opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1)';
      el.style.opacity = '1'; el.style.transform = 'none';
    }, 500 + i * 150);
  });
})();

/* ═══════════════════════════════════════════════════════════
   3. HERO MOUSE PARALLAX — depth on all stage layers
═══════════════════════════════════════════════════════════ */
(function heroParallax() {
  if (REDUCED) return;
  var hero  = document.querySelector('.hero');
  var stage = document.getElementById('heroStage');
  var orbs  = document.querySelectorAll('.hbg-orb');
  if (!hero || !stage) return;
  var lx = 0, ly = 0, cx = 0, cy = 0;
  hero.addEventListener('mousemove', function(e){
    var r = hero.getBoundingClientRect();
    lx = (e.clientX - r.left) / r.width  - .5;
    ly = (e.clientY - r.top)  / r.height - .5;
  }, { passive: true });
  (function tick(){
    cx += (lx - cx) * .07; cy += (ly - cy) * .07;
    if (stage) stage.style.transform = 'translate(' + (cx * -14) + 'px, ' + (cy * -8) + 'px)';
    orbs.forEach(function(o, i){ o.style.transform = 'translate(' + (cx * (i+1) * -20) + 'px, ' + (cy * (i+1) * -14) + 'px)'; });
    requestAnimationFrame(tick);
  })();
})();

/* ═══════════════════════════════════════════════════════════
   4. SCROLL PROGRESS
═══════════════════════════════════════════════════════════ */
var progBar = document.getElementById('prog-bar');
onScroll(function(d){ if (progBar) progBar.style.width = ((d.progress||0)*100)+'%'; });

/* ═══════════════════════════════════════════════════════════
   5. NAV — scroll shrink + active section
═══════════════════════════════════════════════════════════ */
(function initNav(){
  var nav  = document.getElementById('nav');
  var nls  = document.querySelectorAll('.nl');
  var secs = document.querySelectorAll('section[id]');
  onScroll(function(d){
    if (!nav) return;
    nav.classList.toggle('scrolled', d.scroll > 80);
    var cur = '';
    secs.forEach(function(s){ if (d.scroll >= s.offsetTop - 260) cur = s.id; });
    nls.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href') === '#'+cur); });
  });
})();

/* ═══════════════════════════════════════════════════════════
   6. CUSTOM CURSOR
═══════════════════════════════════════════════════════════ */
(function initCursor(){
  var dot  = document.getElementById('c-dot');
  var ring = document.getElementById('c-ring');
  if (!dot || !ring) return;
  var mx=-200, my=-200, rx=-200, ry=-200;
  document.addEventListener('mousemove', function(e){ mx=e.clientX; my=e.clientY; dot.style.left=mx+'px'; dot.style.top=my+'px'; }, { passive:true });
  (function rl(){ rx+=(mx-rx)*.11; ry+=(my-ry)*.11; ring.style.left=rx+'px'; ring.style.top=ry+'px'; requestAnimationFrame(rl); })();
  document.querySelectorAll('a,button,.proj-card,.wg-card,.sg-cat,.fp-step').forEach(function(el){
    el.addEventListener('mouseenter', function(){ document.body.classList.add('ch'); });
    el.addEventListener('mouseleave', function(){ document.body.classList.remove('ch'); });
  });
  document.addEventListener('mouseleave', function(){ dot.style.opacity='0'; ring.style.opacity='0'; });
  document.addEventListener('mouseenter', function(){ dot.style.opacity='1'; ring.style.opacity='1'; });
})();

/* ═══════════════════════════════════════════════════════════
   7. HERO SCROLL PARALLAX (canvas + content drift)
═══════════════════════════════════════════════════════════ */
(function heroScrollPx(){
  if (REDUCED || !GSAP_OK || !ST_OK) return;
  var canvas  = document.getElementById('hero-canvas');
  var content = document.getElementById('heroContent');
  var stage   = document.getElementById('heroStage');
  ScrollTrigger.create({
    trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1,
    onUpdate: function(self){
      var p = self.progress;
      if (canvas)  gsap.set(canvas,  { yPercent: p * 22 });
      if (content) gsap.set(content, { yPercent: p * 12, opacity: 1 - p * .7 });
      if (stage)   gsap.set(stage,   { yPercent: p * 8,  opacity: 1 - p * .5 });
    },
  });
})();

/* ═══════════════════════════════════════════════════════════
   8. REVEAL FADES — IntersectionObserver (no GSAP dep)
═══════════════════════════════════════════════════════════ */
(function revealFades(){
  if (REDUCED) { document.querySelectorAll('.reveal-up').forEach(function(el){ el.classList.add('in'); }); return; }
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      var delay = parseFloat(e.target.dataset.delay||0);
      setTimeout(function(){ e.target.classList.add('in'); }, delay * 1000);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal-up').forEach(function(el){ obs.observe(el); });
})();

/* ═══════════════════════════════════════════════════════════
   9. ARCHITECTURE DIAGRAM — scroll-triggered node entrance
═══════════════════════════════════════════════════════════ */
(function archAnim(){
  if (REDUCED || !GSAP_OK || !ST_OK) return;
  var nodes = document.querySelectorAll('.arch-node');
  nodes.forEach(function(node, i){
    gsap.from(node, {
      opacity:0, scale:.85, y:20, duration:.8, ease:'power3.out',
      delay: (i % 4) * .08,
      scrollTrigger:{ trigger:node, start:'top 86%', toggleActions:'play none none none' },
    });
  });
  /* Connectors fade */
  document.querySelectorAll('.arch-connectors').forEach(function(c, i){
    gsap.from(c, { opacity:0, duration:.6, delay: i*.1, scrollTrigger:{ trigger:c, start:'top 90%' } });
  });
})();

/* ═══════════════════════════════════════════════════════════
   10. FLOW PIPELINE ANIMATION
       Packets animate through steps sequentially
═══════════════════════════════════════════════════════════ */
(function flowAnim(){
  var triggered = false;
  var steps = [
    { status: document.getElementById('fst1'), cls: 'fps-done', txt: '✓ Captured' },
    { status: document.getElementById('fst2'), cls: 'fps-active', txt: '● Signing' },
    { status: document.getElementById('fst3'), cls: 'fps-active', txt: '● Sending…' },
    { status: document.getElementById('fst4'), cls: 'fps-active', txt: '● Writing…' },
    { status: document.getElementById('fst5'), cls: 'fps-done',   txt: '✓ Notified' },
  ];

  function runFlow() {
    steps.forEach(function(s){ s.status.className = 'fps-status'; s.status.textContent = '● Idle'; });
    setTimeout(function(){ activate(0); }, 400);
    setTimeout(function(){ activate(1); }, 1000);
    setTimeout(function(){ activate(2); }, 1800);
    setTimeout(function(){ activate(3); }, 2600);
    setTimeout(function(){ activate(4); }, 3400);
    /* Loop */
    setTimeout(runFlow, 6000);
  }
  function activate(i) {
    var s = steps[i];
    if (!s || !s.status) return;
    s.status.className = 'fps-status ' + s.cls;
    s.status.textContent = s.txt;
  }

  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting && !triggered) {
        triggered = true;
        runFlow();
        obs.disconnect();
      }
    });
  }, { threshold: 0.3 });
  var fp = document.querySelector('.flow-pipeline');
  if (fp) obs.observe(fp);
})();

/* ═══════════════════════════════════════════════════════════
   11. SKILL BARS — scroll-triggered width animation
═══════════════════════════════════════════════════════════ */
(function skillBars(){
  document.querySelectorAll('.sbar-row').forEach(function(row){
    var fill = row.querySelector('.sbar-fill');
    var pct  = row.getAttribute('data-pct') || '75';
    if (!fill) return;
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        fill.style.width = pct + '%';
        obs.unobserve(row);
      });
    }, { threshold: 0.3 });
    obs.observe(row);
  });
})();

/* ═══════════════════════════════════════════════════════════
   12. FEATURED PROJECT — 3D tilt on mousemove
═══════════════════════════════════════════════════════════ */
(function featTilt(){
  if (REDUCED || !GSAP_OK) return;
  var fp = document.querySelector('.proj-feat');
  if (!fp) return;
  fp.addEventListener('mousemove', function(e){
    var r=fp.getBoundingClientRect();
    gsap.to(fp,{ rotateX:((e.clientY-r.top)/r.height-.5)*4, rotateY:((e.clientX-r.left)/r.width-.5)*-4, transformPerspective:1100, duration:.5, ease:'power2.out', overwrite:true });
  });
  fp.addEventListener('mouseleave', function(){
    gsap.to(fp,{ rotateX:0, rotateY:0, duration:.8, ease:'power3.out', overwrite:true });
  });
})();

/* ═══════════════════════════════════════════════════════════
   13. PROJECT CARD ENTRANCE + TILT
═══════════════════════════════════════════════════════════ */
(function projCards(){
  if (REDUCED || !GSAP_OK || !ST_OK) return;
  gsap.from('.proj-card', { opacity:0, y:50, duration:1, ease:'power3.out', stagger:.1, scrollTrigger:{ trigger:'.proj-grid', start:'top 82%' } });
  document.querySelectorAll('.proj-card:not(.proj-cta)').forEach(function(card){
    card.addEventListener('mousemove', function(e){
      var r=card.getBoundingClientRect();
      gsap.to(card,{ rotateX:((e.clientY-r.top)/r.height-.5)*6, rotateY:((e.clientX-r.left)/r.width-.5)*-6, transformPerspective:900, duration:.4, ease:'power2.out', overwrite:true });
    });
    card.addEventListener('mouseleave', function(){
      gsap.to(card,{ rotateX:0, rotateY:0, duration:.7, ease:'power3.out', overwrite:true });
    });
  });
})();

/* ═══════════════════════════════════════════════════════════
   14. DASHBOARD BAR CHART — live-looking animations
       Random slight height variation to simulate live data
═══════════════════════════════════════════════════════════ */
(function dashLive(){
  if (REDUCED) return;
  var bars = document.querySelectorAll('.sbc-bar');
  if (!bars.length) return;
  setInterval(function(){
    bars.forEach(function(b){
      var base = parseFloat(b.style.getPropertyValue('--h')) || 70;
      var variation = (Math.random() - .5) * 14;
      var newH = Math.max(20, Math.min(98, base + variation));
      b.style.setProperty('--h', newH + '%');
    });
  }, 2200);
})();

/* ═══════════════════════════════════════════════════════════
   15. HERO STAGE — KPI counter animations
═══════════════════════════════════════════════════════════ */
(function kpiCounters(){
  var els = document.querySelectorAll('.animate-count[data-to]');
  if (!els.length) return;
  var done = false;
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting || done) return;
      done = true;
      els.forEach(function(el){
        var target = +el.getAttribute('data-to');
        var start  = performance.now();
        var dur    = 1400;
        function tick(now){
          var p = Math.min((now - start) / dur, 1);
          var ease = 1 - Math.pow(1 - p, 3);
          el.textContent = target >= 1000
            ? (Math.round(ease * target / 100) * 100).toLocaleString()
            : Math.round(ease * target);
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = target >= 1000 ? target.toLocaleString() : target;
        }
        requestAnimationFrame(tick);
      });
      obs.disconnect();
    });
  }, { threshold: 0.5 });
  var hero = document.querySelector('.hero');
  if (hero) obs.observe(hero);
})();

/* ═══════════════════════════════════════════════════════════
   16. MARQUEE — pause on hover
═══════════════════════════════════════════════════════════ */
(function marquee(){
  var mq = document.querySelector('.mq-track');
  if (!mq) return;
  var wrap = mq.parentElement;
  wrap.addEventListener('mouseenter', function(){ mq.style.animationPlayState='paused'; });
  wrap.addEventListener('mouseleave', function(){ mq.style.animationPlayState='running'; });
})();

/* ═══════════════════════════════════════════════════════════
   17. MOBILE MENU
═══════════════════════════════════════════════════════════ */
function closeMob() {
  var menu   = document.getElementById('mobMenu');
  var burger = document.getElementById('burger');
  if (!menu) return;
  menu.classList.remove('open');
  menu.setAttribute('aria-hidden','true');
  if (burger){ burger.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }
  document.body.style.overflow = '';
}
(function initMob(){
  var burger = document.getElementById('burger');
  var menu   = document.getElementById('mobMenu');
  var mobX   = document.getElementById('mobX');
  if (!burger || !menu) return;
  burger.addEventListener('click', function(){
    var open = menu.classList.toggle('open');
    menu.setAttribute('aria-hidden', String(!open));
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  if (mobX) mobX.addEventListener('click', closeMob);
  document.addEventListener('keydown', function(e){ if (e.key==='Escape' && menu.classList.contains('open')) closeMob(); });
})();

/* ═══════════════════════════════════════════════════════════
   18. SMOOTH ANCHOR SCROLL
═══════════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click', function(e){
    var target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault(); closeMob(); scrollTo(target);
  });
});

/* ═══════════════════════════════════════════════════════════
   19. CONTACT FORM
═══════════════════════════════════════════════════════════ */
function sendForm(e) {
  if (e) e.preventDefault();
  var name   = document.getElementById('fn');
  var email  = document.getElementById('fe');
  var msg    = document.getElementById('fm');
  var status = document.getElementById('form-status');
  var btn    = document.getElementById('formBtn');
  var txt    = document.getElementById('formBtnTxt');
  if (!name||!email||!msg||!status||!btn) return;
  if (!name.value.trim()||!email.value.trim()||!msg.value.trim()) {
    status.style.color='#f87171'; status.textContent='Please fill in name, email, and message.'; return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    status.style.color='#f87171'; status.textContent='Please enter a valid email address.'; return;
  }
  if (txt) txt.textContent='Sending…'; btn.disabled=true;
  setTimeout(function(){
    ['fn','fe','fs','fm'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    if (txt) txt.textContent='✓ Sent!';
    btn.disabled=false;
    status.style.color='#86efac'; status.textContent="Message received! I'll be in touch within 24 hours.";
    var toast=document.getElementById('toast');
    if (toast){ toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); }, 3500); }
    setTimeout(function(){ if(txt) txt.textContent='Send Message →'; status.textContent=''; }, 5000);
  }, 1500);
}
window.sendForm = sendForm;
window.closeMob = closeMob;

/* ═══════════════════════════════════════════════════════════
   20. KEYBOARD FOCUS RING
═══════════════════════════════════════════════════════════ */
document.addEventListener('mousedown', function(){ document.body.classList.add('using-mouse'); });
document.addEventListener('keydown',   function(){ document.body.classList.remove('using-mouse'); });

/* ═══════════════════════════════════════════════════════════
   21. RESIZE → refresh ScrollTrigger
═══════════════════════════════════════════════════════════ */
var _rt;
window.addEventListener('resize', function(){
  clearTimeout(_rt);
  _rt = setTimeout(function(){ if (ST_OK) ScrollTrigger.refresh(); }, 300);
}, { passive: true });