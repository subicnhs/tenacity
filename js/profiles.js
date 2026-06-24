/* ============================================================
   PROFILES.JS
   Loads data/profiles.json and renders student, officer,
   teacher, and project cards. Wires up the two modals.
   ============================================================ */

(function () {
  'use strict';

  const initials = (name) =>
    name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  // ---- modal helpers ----
  const profileModal = document.getElementById('profileModal');
  const projectModal = document.getElementById('projectModal');

  function openModal(modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', (e) => closeModal(e.target.closest('.modal')));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [profileModal, projectModal].forEach((m) => m.classList.contains('open') && closeModal(m));
    }
  });

  function openProfileModal(person) {
    document.getElementById('profileModalRole').textContent = person.role || '';
    document.getElementById('profileModalName').textContent = person.name || '';
    document.getElementById('profileModalBio').textContent = person.bio || '';

    const img = document.getElementById('profileModalImg');
    if (person.photo) {
      img.src = person.photo;
      img.alt = person.name;
      img.style.display = 'block';
    } else {
      img.style.display = 'none';
    }

    const skillsEl = document.getElementById('profileModalSkills');
    skillsEl.innerHTML = '';
    (person.skills || []).forEach((s) => {
      const li = document.createElement('li');
      li.className = 'tag';
      li.textContent = s;
      skillsEl.appendChild(li);
    });

    const linksEl = document.getElementById('profileModalLinks');
    linksEl.innerHTML = '';
    (person.links || []).forEach((l) => {
      const a = document.createElement('a');
      a.href = l.url;
      a.textContent = l.label;
      a.target = '_blank';
      a.rel = 'noopener';
      linksEl.appendChild(a);
    });

    openModal(profileModal);
  }

  function openProjectModal(project) {
    document.getElementById('modalCategory').textContent = project.category || '';
    document.getElementById('modalTitle').textContent = project.title || '';
    document.getElementById('modalDesc').textContent = project.description || '';
    document.getElementById('modalMeta').textContent = project.meta || '';
    const link = document.getElementById('modalLink');
    link.href = project.link || '#';
    openModal(projectModal);
  }

  // ---- card builders ----
  function buildProfileCard(person, variant) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'profile-card' + (variant === 'officer' ? ' officer-card' : variant === 'teacher' ? ' teacher-card' : '');

    if (variant === 'teacher') {
      card.innerHTML = `
        <div class="profile-avatar">${person.photo ? `<img src="${person.photo}" alt="${person.name}">` : initials(person.name)}</div>
        <div class="teacher-card-body">
          <h4>${person.name}</h4>
          <p class="profile-role mono">${person.role}</p>
          <div class="teacher-specialties">
            ${(person.skills || []).map((s) => `<span class="tag">${s}</span>`).join('')}
          </div>
        </div>
      `;
    } else if (variant === 'officer') {
      card.innerHTML = `
        <span class="officer-badge mono">${person.role}</span>
        <div class="profile-avatar">${person.photo ? `<img src="${person.photo}" alt="${person.name}">` : initials(person.name)}</div>
        <p class="profile-name">${person.name}</p>
        <span class="officer-contact-btn mono">Contact →</span>
      `;
      card.addEventListener('click', (e) => {
        // quick path: jump to contact form, officers tab, pre-select this officer
        e.stopPropagation();
        const tab = document.querySelector('.contact-tab[data-target="officers"]');
        if (tab) tab.click();
        const select = document.getElementById('cf-recipient-officers');
        if (select && person.contactGroup) select.value = person.contactGroup;
        document.getElementById('contact').scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth' });
        return;
      });
    } else {
      card.innerHTML = `
        <div class="profile-avatar">${person.photo ? `<img src="${person.photo}" alt="${person.name}">` : initials(person.name)}</div>
        <p class="profile-name">${person.name}</p>
        <p class="profile-role mono">${person.role}</p>
      `;
    }

    if (variant !== 'officer') {
      card.addEventListener('click', () => openProfileModal(person));
    }
    return card;
  }

  function buildPortfolioCard(project) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'portfolio-card';
    card.innerHTML = `
      <p class="eyebrow mono">${project.category}</p>
      <h4>${project.title}</h4>
      <p>${project.description}</p>
    `;
    card.addEventListener('click', () => openProjectModal(project));
    return card;
  }

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ---- load + render ----
  fetch('data/profiles.json')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load profiles.json');
      return res.json();
    })
    .then((data) => {
      const studentGrid = document.getElementById('studentGrid');
      const officerGrid = document.getElementById('officerGrid');
      const teacherGrid = document.getElementById('teacherGrid');
      const portfolioGrid = document.getElementById('portfolioGrid');

      (data.students || []).forEach((s) => studentGrid.appendChild(buildProfileCard(s, 'student')));
      (data.officers || []).forEach((o) => officerGrid.appendChild(buildProfileCard(o, 'officer')));
      (data.teachers || []).forEach((t) => teacherGrid.appendChild(buildProfileCard(t, 'teacher')));
      (data.projects || []).forEach((p) => portfolioGrid.appendChild(buildPortfolioCard(p)));

      // re-run scroll reveal registration for newly injected cards
      if (window.__refreshScrollReveals) window.__refreshScrollReveals();
    })
    .catch((err) => {
      console.error(err);
    });
})();