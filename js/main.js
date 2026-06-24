/* ============================================================
   MAIN.JS
   Loader sequence, mobile nav toggle, active nav-link tracking,
   nav background-on-scroll class.
   ============================================================ */

(function () {
  'use strict';

  // ---- loader ----
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    const fill = document.querySelector('.loader-fill');
    if (fill) {
      requestAnimationFrame(() => {
        fill.style.transition = 'width 0.5s ease';
        fill.style.width = '100%';
      });
    }
    setTimeout(() => {
      if (loader) {
        loader.style.transition = 'opacity 0.4s ease, visibility 0.4s ease';
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
      }
    }, 550);
  });

  // safety: hide loader even if 'load' is slow/blocked
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
    }
  }, 2500);

  // ---- mobile nav toggle ----
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- nav background on scroll (CSS hook) ----
  const nav = document.getElementById('nav');
  function updateNavBg() {
    if (!nav) return;
    if (window.scrollY > 40) {
      nav.style.background = 'rgba(11,18,32,0.92)';
      nav.style.borderBottom = '1px solid rgba(242,239,230,0.08)';
    } else {
      nav.style.background = 'linear-gradient(to bottom, rgba(11,18,32,0.92), rgba(11,18,32,0))';
      nav.style.borderBottom = '1px solid transparent';
    }
  }
  window.addEventListener('scroll', updateNavBg, { passive: true });
  updateNavBg();

  // ---- active link highlight on scroll ----
  const sections = document.querySelectorAll('main .section[id]');
  const links = document.querySelectorAll('.nav-links a');

  function setActiveLink() {
    let current = '';
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.4) {
        current = section.id;
      }
    });
    links.forEach((link) => {
      link.style.color = link.getAttribute('href') === `#${current}` ? 'var(--gold)' : '';
    });
  }
  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();
})();