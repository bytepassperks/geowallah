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
})();
