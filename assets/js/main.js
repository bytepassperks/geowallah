/* GEOwallah — light editorial interactions (vanilla, no deps) */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* year */
  $$('#year').forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* scroll progress bar */
  var bar = $('.progress');
  function onScroll() {
    if (bar) {
      var h = document.documentElement;
      var sc = h.scrollTop || document.body.scrollTop;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (sc / max) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* active nav link by filename */
  var path = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path || (path === 'index.html' && href === 'index.html')) a.classList.add('active');
  });

  /* mobile nav */
  var toggle = $('.nav-toggle'), links = $('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () { links.classList.toggle('open'); });
    $$('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  /* scroll reveal */
  var reveals = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var d = parseInt(el.getAttribute('data-delay') || '0', 10);
          setTimeout(function () { el.classList.add('in'); }, d * 90);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* count-up stats */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var dec = (target % 1 !== 0) ? 1 : 0;
    var dur = 1400, start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toFixed(dec) + suffix;
    }
    requestAnimationFrame(tick);
  }
  var counts = $$('[data-count]');
  if (counts.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      counts.forEach(function (el) {
        el.textContent = (el.getAttribute('data-prefix') || '') + el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
      });
    } else {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); co.unobserve(en.target); } });
      }, { threshold: 0.6 });
      counts.forEach(function (el) { co.observe(el); });
    }
  }

  /* hero rotating word (highlighted) */
  var rotor = $('[data-rotor]');
  if (rotor && !reduce) {
    var words = (rotor.getAttribute('data-rotor') || '').split('|');
    var i = 0;
    rotor.textContent = words[0];
    setInterval(function () {
      i = (i + 1) % words.length;
      rotor.style.opacity = '0';
      rotor.style.transform = 'translateY(6px)';
      setTimeout(function () {
        rotor.textContent = words[i];
        rotor.style.transition = 'opacity .35s ease, transform .35s ease';
        rotor.style.opacity = '1';
        rotor.style.transform = 'none';
      }, 220);
    }, 2200);
  }

  /* FAQ accordion */
  $$('.faq .item').forEach(function (item) {
    var q = $('.q', item), a = $('.a', item);
    if (!q || !a) return;
    q.addEventListener('click', function () {
      var open = item.classList.contains('open');
      $$('.faq .item.open').forEach(function (o) {
        if (o !== item) { o.classList.remove('open'); var oa = $('.a', o); if (oa) oa.style.maxHeight = null; }
      });
      if (open) { item.classList.remove('open'); a.style.maxHeight = null; }
      else { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  /* subtle tilt on hero collage cards */
  if (!reduce) {
    $$('.collage .ccard').forEach(function (card) {
      var base = card.style.transform;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - .5) * -6;
        var ry = ((e.clientX - r.left) / r.width - .5) * 6;
        card.style.transform = base + ' perspective(700px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = base; });
    });
  }

  /* ===== v2 polish: ambient depth, doodles, magnetic btns, cursor, mark sweep ===== */
  function mk(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  if (!reduce) {
    /* ambient gradient orbs behind everything */
    var amb = mk('div', 'ambient');
    amb.setAttribute('aria-hidden', 'true');
    amb.innerHTML = '<span class="orb o1"></span><span class="orb o2"></span><span class="orb o3"></span>';
    document.body.appendChild(amb);

    /* floating hand-drawn doodles in the hero */
    var hero = $('.hero');
    if (hero) {
      var sparkle = '<svg viewBox="0 0 40 40" stroke="#6D28D9" stroke-width="2.4"><path d="M20 5l2.6 11.4L34 19l-11.4 2.6L20 33l-2.6-11.4L6 19l11.4-2.6z"/></svg>';
      var squiggle = '<svg viewBox="0 0 80 30" stroke="#14B8A6" stroke-width="3"><path d="M3 18c8-16 18 12 26-2s18 12 26-2"/></svg>';
      var ring = '<svg viewBox="0 0 50 50" stroke="#F59E0B" stroke-width="3"><circle cx="25" cy="25" r="20" stroke-dasharray="5 9"/></svg>';
      var arrow = '<svg viewBox="0 0 70 52" stroke="#F97362" stroke-width="3"><path d="M5 12c22 4 40 14 54 32M59 44l5-13M59 44l-13 3"/></svg>';
      var doods = [
        { h: sparkle, s: 'doodle float', css: 'top:3%;right:5%;width:40px;height:40px;--rot:8deg' },
        { h: ring, s: 'doodle spin', css: 'top:44%;left:-16px;width:48px;height:48px' },
        { h: squiggle, s: 'doodle float alt', css: 'bottom:10%;right:12%;width:76px;height:30px' },
        { h: arrow, s: 'doodle float', css: 'bottom:1%;left:4%;width:68px;height:50px;--rot:-4deg' }
      ];
      doods.forEach(function (d) {
        var n = mk('span', d.s, d.h);
        n.style.cssText = d.css;
        n.setAttribute('aria-hidden', 'true');
        hero.appendChild(n);
      });
    }

    /* gentle continuous float on icons (staggered) */
    $$('.block .ico, .ci-ico, .step .ico, .sgrid .ico').forEach(function (ic, idx) {
      ic.classList.add('float-ico');
      ic.style.animationDelay = ((idx % 5) * -0.7) + 's';
    });

    /* magnetic buttons */
    $$('.btn-primary, .btn-amber, .btn-wa').forEach(function (b) {
      b.classList.add('magnetic');
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--mx', (((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(1) + 'px');
        b.style.setProperty('--my', (((e.clientY - r.top) / r.height - 0.5) * 10).toFixed(1) + 'px');
      });
      b.addEventListener('mouseleave', function () {
        b.style.setProperty('--mx', '0px');
        b.style.setProperty('--my', '0px');
      });
    });

    /* highlighter marks sweep in on scroll */
    var marks = $$('.mark:not(.rotor)');
    if (marks.length && 'IntersectionObserver' in window) {
      document.documentElement.classList.add('has-sweep');
      var mo = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('lit'); mo.unobserve(en.target); }
        });
      }, { threshold: 0.55 });
      marks.forEach(function (m) { mo.observe(m); });
    } else {
      marks.forEach(function (m) { m.classList.add('lit'); });
    }

    /* scroll parallax for doodles */
    var paraDoodles = $$('.doodle');
    var ticking = false;
    function parallax() {
      var y = window.pageYOffset;
      paraDoodles.forEach(function (d, i) {
        d.style.marginTop = (y * (i % 2 ? 0.06 : -0.05)).toFixed(1) + 'px';
      });
      ticking = false;
    }
    if (paraDoodles.length) {
      window.addEventListener('scroll', function () {
        if (!ticking) { requestAnimationFrame(parallax); ticking = true; }
      }, { passive: true });
    }
  }
})();
