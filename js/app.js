

/* =========================================================================
   3D ATTENDANCE DASHBOARD — APP LOGIC
   Data flow: JSON -> JS -> Attendance Calculation -> Filtering
              -> 3D Student Cards -> Profile Modal
   Google Sheets flows separately: config.json URL -> iframe -> reference panel
   ========================================================================= */

(function () {
  "use strict";

  const DATA_URL = "data/students.json";
  const CONFIG_URL = "data/config.json";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /** Avatar background gradients, cycled deterministically per student. */
  const AVATAR_PALETTE = [
    "linear-gradient(135deg, #D9A441, #B5872F)",
    "linear-gradient(135deg, #2BB7A3, #1d8f80)",
    "linear-gradient(135deg, #8AA6C9, #3f5a86)",
    "linear-gradient(135deg, #D9A441, #2BB7A3)",
  ];

  let ALL_STUDENTS = [];
  let ATTENTION_THRESHOLD = 90;
  let currentFilter = "all";
  let lastFocusedCard = null;

  // ----------------------------------------------------------------------
  // Boot
  // ----------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    startClock();
    initFilters();
    initModal();
    loadDashboard();
  });

  async function loadDashboard() {
    const [studentsData, config] = await Promise.all([
      fetchJSON(DATA_URL),
      fetchJSON(CONFIG_URL),
    ]);

    if (config && config.schoolYear) {
      const el = document.getElementById("schoolYearLabel");
      if (el) el.textContent = `${config.schoolYear} · CLASS ATTENDANCE`;
    }
    if (config && config.attendanceThreshold && config.attendanceThreshold.needsAttentionBelowPercent) {
      ATTENTION_THRESHOLD = config.attendanceThreshold.needsAttentionBelowPercent;
    }

    ALL_STUDENTS = ((studentsData && studentsData.students) || []).map(computeAttendance);

    renderStats(ALL_STUDENTS);
    renderCards(applyFilter(ALL_STUDENTS, currentFilter));
    buildDayRing(ALL_STUDENTS);
    renderSheetsPanel(config);
  }

  async function fetchJSON(url) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  // ----------------------------------------------------------------------
  // Attendance calculation
  // ----------------------------------------------------------------------
  function computeAttendance(student) {
    const total = Number(student.total) || 0;
    const present = Number(student.present) || 0;
    const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
    const isPerfect = total > 0 && present === total;
    const needsAttention = percentage < ATTENTION_THRESHOLD;
    return { ...student, percentage, isPerfect, needsAttention };
  }

  // ----------------------------------------------------------------------
  // Live clock
  // ----------------------------------------------------------------------
  function startClock() {
    const el = document.getElementById("liveTime");
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      el.textContent = `${hh}:${mm}:${ss}`;
    };
    tick();
    setInterval(tick, 1000);
  }

  // ----------------------------------------------------------------------
  // Dashboard statistics
  // ----------------------------------------------------------------------
  function renderStats(students) {
    const total = students.length;
    const presentToday = students.filter((s) => s.today === "Present").length;
    const perfect = students.filter((s) => s.isPerfect).length;
    const attention = students.filter((s) => s.needsAttention).length;

    animateCount("statTotal", total);
    animateCount("statPresent", presentToday);
    animateCount("statPerfect", perfect);
    animateCount("statAttention", attention);
  }

  function animateCount(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (prefersReducedMotion) {
      el.textContent = value;
      return;
    }
    const duration = 600;
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * value);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ----------------------------------------------------------------------
  // Signature element: the day ring (school-day cycle)
  // ----------------------------------------------------------------------
  function buildDayRing(students) {
    const ring = document.getElementById("dayRing");
    const inner = ring ? ring.querySelector(".day-ring-inner") : null;
    if (!inner) return;

    const totalDays = students.reduce((max, s) => Math.max(max, Number(s.total) || 0), 0) || 22;
    inner.innerHTML = "";

    for (let i = 0; i < totalDays; i++) {
      const tick = document.createElement("span");
      tick.className = "day-tick";
      const angle = (360 / totalDays) * i;
      tick.style.transform = `rotateZ(${angle}deg)`;
      if (i < totalDays - 1) tick.classList.add("is-elapsed");
      if (i === totalDays - 1) tick.classList.add("is-today");
      inner.appendChild(tick);
    }
  }

  // ----------------------------------------------------------------------
  // Filters
  // ----------------------------------------------------------------------
  function initFilters() {
    const buttons = document.querySelectorAll(".filter-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
        currentFilter = btn.dataset.filter;
        renderCards(applyFilter(ALL_STUDENTS, currentFilter));
      });
    });
  }

  function applyFilter(students, filter) {
    if (filter === "perfect") return students.filter((s) => s.isPerfect);
    if (filter === "attention") return students.filter((s) => s.needsAttention);
    return students;
  }

  // ----------------------------------------------------------------------
  // 3D student cards
  // ----------------------------------------------------------------------
  function renderCards(students) {
    const grid = document.getElementById("cardGrid");
    const emptyMsg = document.getElementById("directoryEmpty");
    const emptyMSG = document.getElementById("directoryEmpty1");
    grid.innerHTML = "";

    emptyMSG.hidden = students.length !== 0;
    emptyMsg.hidden = students.length !== 0;
    if (students.length === 0) return;

    students.forEach((student, index) => {
      const stage = document.createElement("div");
      stage.className = "card-stage";
      stage.style.animationDelay = `${Math.min(index * 45, 400)}ms`;

      const card = buildCardElement(student);
      stage.appendChild(card);
      grid.appendChild(stage);
    });
  }

  function buildCardElement(student) {
    const card = document.createElement("article");
    card.className = "student-card";
    if (student.isPerfect) card.classList.add("is-perfect");
    if (student.needsAttention) card.classList.add("is-attention");

    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute(
      "aria-label",
      `${student.name}, ${student.section}, ${student.percentage}% attendance. Open profile.`
    );

    const badge = document.createElement("span");
    badge.className = "card-badge";
    badge.textContent = "★ PERFECT";
    card.appendChild(badge);

    const photoStage = document.createElement("div");
    photoStage.className = "card-photo-stage";
    photoStage.appendChild(buildAvatar(student, 76));
    card.appendChild(photoStage);

    const body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = `
      <h3 class="card-name">${escapeHTML(student.name)}</h3>
      <p class="card-meta">${escapeHTML(student.section)}</p>
      <p class="card-id">${escapeHTML(student.id)}</p>
      <div class="card-figures">
        <div class="card-figure card-figure--present">
          <span class="card-figure-value">${student.present}</span>
          <span class="card-figure-label">Present</span>
        </div>
        <div class="card-figure card-figure--total">
          <span class="card-figure-value">${student.total}</span>
          <span class="card-figure-label">Total</span>
        </div>
        <div class="card-figure card-figure--absent">
          <span class="card-figure-value">${student.absent}</span>
          <span class="card-figure-label">Absent</span>
        </div>
      </div>
      <div class="card-progress-row">
        <div class="card-progress">
          <div class="card-progress-fill" style="width:${student.percentage}%"></div>
        </div>
        <span class="card-progress-pct">${student.percentage}%</span>
      </div>
    `;
    card.appendChild(body);

    attachTilt(card);
    card.addEventListener("click", () => openModal(student, card));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(student, card);
      }
    });

    return card;
  }

  function buildAvatar(student, size) {
    const wrap = document.createElement("div");
    wrap.className = "card-photo";
    wrap.style.width = size + "px";
    wrap.style.height = size + "px";
    wrap.style.background = paletteFor(student.id);
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", `Profile photo of ${student.name}`);

    if (student.profile) {
      const img = document.createElement("img");
      img.src = student.profile;
      img.alt = `Profile photo of ${student.name}`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.borderRadius = "50%";
      img.style.objectFit = "cover";
      img.onerror = () => {
        wrap.removeChild(img);
        wrap.textContent = initials(student.name);
      };
      wrap.appendChild(img);
    } else {
      wrap.textContent = initials(student.name);
    }
    return wrap;
  }

  function initials(name) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  function paletteFor(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  }

  /** Cursor-following 3D tilt, disabled for touch input and reduced motion. */
  function attachTilt(card) {
    if (prefersReducedMotion) return;

    const maxTilt = 10;
    let frame = null;

    card.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - y) * maxTilt * 2;

      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.transition = "box-shadow 0.4s ease, border-color 0.4s ease";
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });
    });

    card.addEventListener("pointerleave", () => {
      if (frame) cancelAnimationFrame(frame);
      card.style.transition =
        "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease, border-color 0.4s ease";
      card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0)";
    });
  }

  // ----------------------------------------------------------------------
  // Modal
  // ----------------------------------------------------------------------
  function initModal() {
    const backdrop = document.getElementById("modalBackdrop");
    const closeBtn = document.getElementById("modalClose");

    closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (backdrop.hidden) return;
      if (e.key === "Escape") {
        closeModal();
        return;
      }
      // Minimal focus trap: the close button is the only focusable element,
      // so Tab / Shift+Tab simply keep focus inside the modal.
      if (e.key === "Tab") {
        e.preventDefault();
        closeBtn.focus();
      }
    });
  }

  function openModal(student, triggerEl) {
    lastFocusedCard = triggerEl || null;

    const backdrop = document.getElementById("modalBackdrop");
    document.getElementById("modalPerfectFlag").hidden = !student.isPerfect;
    document.getElementById("modalName").textContent = student.name;
    document.getElementById(
      "modalMeta"
    ).textContent = `${student.section} · ${student.id}`;
    document.getElementById("modalToday").textContent = student.today;
    document.getElementById("modalPresent").textContent = `${student.present} / ${student.total}`;
    document.getElementById("modalAbsent").textContent = student.absent;
    document.getElementById("modalRate").textContent = `${student.percentage}%`;
    document.getElementById("modalProgressFill").style.width = `${student.percentage}%`;

    const photoHost = document.getElementById("modalPhoto");
    photoHost.innerHTML = "";
    photoHost.appendChild(buildAvatar(student, 96));

    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("modalClose").focus();
  }

  function closeModal() {
    const backdrop = document.getElementById("modalBackdrop");
    backdrop.hidden = true;
    document.body.style.overflow = "";
    if (lastFocusedCard) lastFocusedCard.focus();
  }

  // ----------------------------------------------------------------------
  // Google Sheets panel
  // ----------------------------------------------------------------------
  function renderSheetsPanel(config) {
    const panel = document.getElementById("sheetsPanel");
    const url = config && config.googleSheets && config.googleSheets.url;

    //panel.innerHTML = "";

    if (url && url.trim()) {
      const iframe = document.createElement("iframe");
      iframe.src = url.trim();
      iframe.title = "Attendance records — view-only Google Sheet";
      iframe.loading = "lazy";
      iframe.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      );
      
      // Force visual zoom to 80%
   // iframe.style.transform = "scale(0.8)";
   // iframe.style.transformOrigin = "top left";

    // Compensate for the reduced visual size
    //iframe.style.width = "500%";
    //iframe.style.height = "500%";
      
      panel.appendChild(iframe);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "sheets-placeholder";
      placeholder.innerHTML = `
        <div class="sheets-placeholder-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6"/>
            <path d="M3 9H21M9 9V20" stroke="currentColor" stroke-width="1.6"/>
          </svg>
        </div>
        <h3>Google Sheets Viewer</h3>
        <p>Add your view-only Google Sheets URL to display attendance records here.</p>
      `;
      panel.appendChild(placeholder);
    }
  }

  // ----------------------------------------------------------------------
  // Utilities
  // ----------------------------------------------------------------------
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }
})();
