/* site.js — 通用 JS: Nav, Scroll Reveal, Counter, Active Nav Link */

(function () {
  'use strict';

  /* ── Active Nav Link ── */
  function setActiveNav() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const links = document.querySelectorAll('.nav-links a, .mobile-menu a');
    links.forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href) return;
      const linkPath = href.replace(/\/$/, '') || '/';
      const isActive = path === linkPath ||
        (linkPath !== '/' && path.startsWith(linkPath));
      link.classList.toggle('active', isActive);
    });
  }

  /* ── Hamburger / Mobile Menu ── */
  function initNav() {
    const hamburger = document.querySelector('.nav-hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function () {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    /* Close on link click */
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    /* Close on escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });

    /* Nav shadow on scroll */
    var nav = document.querySelector('.site-nav');
    if (nav) {
      window.addEventListener('scroll', function () {
        nav.style.boxShadow = window.scrollY > 8
          ? '0 2px 16px rgba(0,0,0,0.12)'
          : '0 1px 4px rgba(0,0,0,0.08)';
      }, { passive: true });
    }
  }

  /* ── Scroll Reveal ── */
  function initScrollReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach(function (el) { observer.observe(el); });
  }

  /* ── Counter Animation ── */
  function animateCounter(el) {
    var target = parseFloat(el.dataset.target || el.textContent);
    var suffix = el.dataset.suffix || '';
    var prefix = el.dataset.prefix || '';
    var duration = 1600;
    var start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(eased * target);
      el.textContent = prefix + current + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = document.querySelectorAll('.stat-num[data-target]');
    if (!counters.length) return;

    if (!('IntersectionObserver' in window)) {
      counters.forEach(function (el) { animateCounter(el); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* ── FAQ Accordion ── */
  function initFaq() {
    var items = document.querySelectorAll('.faq-item');
    items.forEach(function (item) {
      var question = item.querySelector('.faq-question');
      if (!question) return;
      question.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        /* Close all */
        items.forEach(function (i) { i.classList.remove('open'); });
        /* Toggle current */
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  /* ── Toast ── */
  window.showToast = function (message, duration) {
    duration = duration || 3000;
    var toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove('show');
    }, duration);
  };

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    setActiveNav();
    initNav();
    initScrollReveal();
    initCounters();
    initFaq();
  });

}());
