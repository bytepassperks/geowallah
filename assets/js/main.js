/* GEOwallah — interactions & animations (vanilla, no deps) */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---- Navbar scroll state ---- */
  const nav = $('.nav');
  const onScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
    const prog = $('.progress');
    if (prog) {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile nav ---- */
  const toggle = $('.nav-toggle');
  const links = $('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('mobile');
    });
    $$('.nav-links a').forEach(a => a.addEventListener('click', () => {
      toggle.classList.remove('open');
      links.classList.remove('mobile');
    }));
  }

  /* ---- Active nav link by path ---- */
  const here = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === here || (here === 'index.html' && href === 'index.html')) a.classList.add('active');
  });

  /* ---- Reveal on scroll ---- */
  const reveals = $$('[data-reveal]');
  if (reduce) {
    reveals.forEach(el => el.classList.add('in'));
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  /* ---- Count up stats ---- */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduce) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const dur = 1400; const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = target * eased;
          el.textContent = (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  } else {
    counters.forEach(el => el.textContent = el.dataset.count + (el.dataset.suffix || ''));
  }

  /* ---- Hero rotating word ---- */
  const rotator = $('.rotator');
  if (rotator) {
    const words = (rotator.dataset.words || '').split('|').filter(Boolean);
    if (words.length) {
      let wi = 0, ci = 0, deleting = false;
      const type = () => {
        const w = words[wi];
        rotator.textContent = w.slice(0, ci);
        if (!deleting && ci < w.length) { ci++; setTimeout(type, 80); }
        else if (!deleting && ci === w.length) { deleting = true; setTimeout(type, 1500); }
        else if (deleting && ci > 0) { ci--; setTimeout(type, 40); }
        else { deleting = false; wi = (wi + 1) % words.length; setTimeout(type, 220); }
      };
      if (reduce) { rotator.textContent = words[0]; } else { type(); }
    }
  }

  /* ---- FAQ accordion ---- */
  $$('.qa .q').forEach(q => {
    q.addEventListener('click', () => {
      const qa = q.closest('.qa');
      const a = $('.a', qa);
      const open = qa.classList.contains('open');
      $$('.qa').forEach(o => { o.classList.remove('open'); $('.a', o).style.maxHeight = null; });
      if (!open) { qa.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  /* ---- Cursor glow (desktop) ---- */
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    window.addEventListener('mousemove', (e) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, { passive: true });
  }

  /* ---- Magnetic buttons ---- */
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    $$('.btn-primary').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28 - 2}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---- Footer year ---- */
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---- Hero node-network canvas ---- */
  const canvas = $('#net');
  if (canvas && !reduce) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, nodes = [], raf;
    const COLORS = ['#22D3EE', '#14B8A6', '#6D28D9'];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(18, Math.floor(w / 26));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
        r: Math.random() * 2 + 1.2,
        c: COLORS[(Math.random() * COLORS.length) | 0]
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j], dx = n.x - m.x, dy = n.y - m.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            ctx.globalAlpha = (1 - dist / 110) * 0.5;
            ctx.strokeStyle = '#22D3EE'; ctx.lineWidth = .6;
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      nodes.forEach(n => {
        ctx.beginPath(); ctx.fillStyle = n.c;
        ctx.shadowColor = n.c; ctx.shadowBlur = 8;
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    resize(); draw();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(draw);
    });
  }
})();
