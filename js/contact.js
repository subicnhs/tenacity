/* ============================================================
   CONTACT.JS
   Tab switching between Teachers / Officers / Developers,
   and a front-end-only submit confirmation (no backend in MVP).
   ============================================================ */

(function () {
  'use strict';

  const tabs = document.querySelectorAll('.contact-tab');
  const groups = document.querySelectorAll('.contact-recipient');
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const target = tab.dataset.target;
      groups.forEach((g) => {
        g.classList.toggle('is-hidden', g.dataset.group !== target);
      });
    });
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        status.textContent = 'Please fill in your name, email, and message.';
        status.style.color = 'var(--coral)';
        return;
      }

      const activeTab = document.querySelector('.contact-tab.active');
      const recipient = activeTab ? activeTab.textContent.trim() : 'the class';

      // MVP note: no backend wired up yet — this is a front-end confirmation only.
      // Replace this block with a fetch() call to your form endpoint when ready.
      status.style.color = 'var(--teal)';
      status.textContent = `Message ready to send to ${recipient}. (Connect a backend to deliver it.)`;
      form.reset();
      groups.forEach((g) => g.classList.toggle('is-hidden', g.dataset.group !== 'teachers'));
      tabs.forEach((t, i) => {
        t.classList.toggle('active', i === 0);
        t.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      });
    });
  }
})();