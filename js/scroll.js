/* ============================================================
   SCROLL.JS
   GSAP ScrollTrigger reveals for sections, code-typing effect,
   and nav active-state tracking.
   ============================================================ */

(function () {
  'use strict';

  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- mark reveal targets ----
  const REVEAL_SELECTOR =
    '.section-head, .intro-lead, .intro-stats, .showcase-row, .portfolio-card, .student-grid .profile-card, .officer-card, .teacher-card, .contact-grid';

  function registerReveals(scope) {
    const targets = (scope || document).querySelectorAll(REVEAL_SELECTOR);
    targets.forEach((el) => {
      if (el.dataset.revealBound) return;
      el.dataset.revealBound = 'true';
      el.classList.add('reveal');

      if (prefersReducedMotion) {
        el.classList.add('is-visible');
      } else {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 92%',
          onEnter: () => el.classList.add('is-visible'),
          once: true
        });
      }
    });
  }

  registerReveals(document);

  // exposed so profiles.js can re-run this after injecting cards via fetch
  window.__refreshScrollReveals = () => registerReveals(document);

  // ---- hero load sequence ----
  window.addEventListener('DOMContentLoaded', () => {
    const lines = document.querySelectorAll('.compile-line');
    if (prefersReducedMotion) {
      lines.forEach((l) => (l.style.opacity = 1));
      return;
    }
    gsap.set(lines, { yPercent: 110, opacity: 0 });
    gsap.to(lines, {
      yPercent: 0,
      opacity: 1,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      delay: 0.3
    });
    gsap.from('.hero-sub, .hero-cta-row, .eyebrow', {
      opacity: 0,
      y: 16,
      duration: 0.7,
      ease: 'power2.out',
      stagger: 0.08,
      delay: 0.7
    });
  });

  // ---- code typing effect on scroll into view ----
  const codeEl = document.querySelector('.code-type');
  if (codeEl) {
    const fullText = codeEl.getAttribute('data-code') || '';
    let typed = false;

    ScrollTrigger.create({
      trigger: codeEl,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        if (typed || prefersReducedMotion) {
          codeEl.textContent = fullText;
          return;
        }
        typed = true;
        let i = 0;
        const speed = 18;
        const interval = setInterval(() => {
          codeEl.textContent = fullText.slice(0, i);
          i++;
          if (i > fullText.length) clearInterval(interval);
        }, speed);
      }
    });
  }

  // ---- nav background on scroll ----
  const nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 'top -80',
    end: 99999,
    toggleClass: { targets: nav, className: 'is-scrolled' }
  });

  // ---- design board / anim stage subtle parallax tilt on hover ----
  document.querySelectorAll('.showcase-visual').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      if (prefersReducedMotion) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, { rotateY: x * 6, rotateX: -y * 6, duration: 0.4, ease: 'power2.out', transformPerspective: 600 });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power2.out' });
    });
  });

})();