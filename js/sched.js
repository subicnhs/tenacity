/**
 * main.js
 * Page logic for the Grade 12 Tenacity grades dashboard:
 * schedule rendering, live clock, boot screen, mobile nav, scroll progress,
 * scroll-reveal animation, and the per-subject Google Sheets modal.
 */
(function () {
  "use strict";

  var $ = function (selector, scope) {
    return (scope || document).querySelector(selector);
  };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Default schedule data — used immediately, then replaced if data/site.json
     resolves with its own values, so the page never renders empty while the
     fetch is in flight. Each subject carries its own "sheet" URL. */
  var data = {
      "terms": {
    "term1": [
      { "day": "Monday", "subject": "Visual Graphics Design", "time": "12:40 PM — 5:50 PM", "sheet": "https://docs.google.com/spreadsheets/d/17PEV9mGlNpBAsGTJyFdF1eQqxSaFbE3SUzpBxlahqVs/edit?usp=sharing" },
      { "day": "Tuesday", "subject": "Visual Graphics Design", "time": "12:40 PM — 5:50 PM", "sheet": "https://docs.google.com/spreadsheets/d/17PEV9mGlNpBAsGTJyFdF1eQqxSaFbE3SUzpBxlahqVs/edit?usp=sharing" },
      { "day": "Wednesday", "subject": "Visual Graphics Design", "time": "12:40 PM — 5:50 PM", "sheet": "https://docs.google.com/spreadsheets/d/17PEV9mGlNpBAsGTJyFdF1eQqxSaFbE3SUzpBxlahqVs/edit?usp=sharing" },
      { "day": "Thursday", "subject": "Visual Graphics Design", "time": "12:40 PM — 4:50 PM", "sheet": "https://docs.google.com/spreadsheets/d/17PEV9mGlNpBAsGTJyFdF1eQqxSaFbE3SUzpBxlahqVs/edit?usp=sharing" },
      { "day": "", "subject": "ARAL Program", "time": "4:50 PM — 5:50 PM", "sheet": "" },
      { "day": "Friday", "subject": "HRG", "time": "11:40 AM — 12:40PM", "sheet": "" },
      { "day": "", "subject": "Visual Graphics Design", "time": "12:40 PM — 5:50 PM", "sheet": "https://docs.google.com/spreadsheets/d/17PEV9mGlNpBAsGTJyFdF1eQqxSaFbE3SUzpBxlahqVs/edit?usp=sharing" }
    ],
    "term2": [
      { "day": "Monday", "subject": "Programming", "time": "12:40 PM — 5:50 PM", "sheet": "" },
      { "day": "Tuesday", "subject": "Programming", "time": "12:40 PM — 5:50 PM", "sheet": "" },
      { "day": "Wednesday", "subject": "Programming", "time": "12:40 PM — 5:50 PM", "sheet": "" },
      { "day": "Thursday", "subject": "Programming", "time": "12:40 PM — 5:50 PM", "sheet": "" },
      { "day": "Friday", "subject": "Programming", "time": "12:40 PM — 5:50 PM", "sheet": "" }
    ],
    "term3": [
      { "day": "Monday - Friday", "subject": "Work Immersion", "time": "8:00 AM — 4:00 PM", "sheet": "" }
    ]
  }
  };

  /* -------------------------------------------------------------------- */
  /* Schedule rendering                                                    */
  /* -------------------------------------------------------------------- */

  function renderSchedule(id, rows) {
    var container = $("#" + id);
    if (!container) return;
    container.innerHTML = "";

    rows.forEach(function (row, index) {
      var hasSheet = !!row.sheet;

      var day = document.createElement("div");
      day.className = "day reveal";
      day.style.transitionDelay = reducedMotion ? "0s" : Math.min(index * 60, 300) + "ms";

      day.innerHTML =
        '<div class="day-name">' + row.day + '</div>' +
        '<div class="subject">' + row.subject + '</div>' +
        '<div class="time">' + row.time + '</div>' +
        '<button class="sheet-btn"' +
          (hasSheet ? '' : ' disabled title="No sheet linked yet"') +
          ' type="button">Sheet</button>';

      var button = day.querySelector(".sheet-btn");
      if (hasSheet) {
        button.dataset.sheetUrl = row.sheet;
        button.dataset.subject = row.subject;
      }

      container.appendChild(day);
    });

    observeReveal(container);
  }

  function renderAllSchedules() {
    renderSchedule("schedule1", data.terms.term1);
    renderSchedule("schedule2", data.terms.term2);
    renderSchedule("schedule3", data.terms.term3);
  }

  function loadSiteData() {
    fetch("data/site.json")
      .then(function (response) {
        return response.json();
      })
      .then(function (siteData) {
        Object.assign(data, siteData);
        renderAllSchedules();
      })
      .catch(function () {
        /* Keep the built-in defaults already on screen. */
      });
  }

  /* -------------------------------------------------------------------- */
  /* Clock                                                                  */
  /* -------------------------------------------------------------------- */

  function tick() {
    var now = new Date();
    var clock = $("#clock");
    if (!clock) return;
    clock.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map(function (n) { return String(n).padStart(2, "0"); })
      .join(":");
  }

  /* -------------------------------------------------------------------- */
  /* Boot screen                                                            */
  /* -------------------------------------------------------------------- */

  function hideBootScreen() {
    var boot = $("#boot");
    if (boot) boot.classList.add("hide");
  }

  /* -------------------------------------------------------------------- */
  /* Mobile nav                                                             */
  /* -------------------------------------------------------------------- */

  function initMobileNav() {
    var toggle = $("#navToggle");
    var nav = $("#primaryNav");
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }

    function open() {
      nav.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    }

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.contains("open");
      if (isOpen) close(); else open();
    });

    $$("a", nav).forEach(function (link) {
      link.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
  }

  /* -------------------------------------------------------------------- */
  /* Scroll progress bar                                                   */
  /* -------------------------------------------------------------------- */

  function initScrollProgress() {
    var bar = $("#scrollProgress");
    if (!bar) return;

    var ticking = false;

    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var fraction = max > 0 ? window.scrollY / max : 0;
      bar.style.width = (fraction * 100) + "%";
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* -------------------------------------------------------------------- */
  /* Scroll-reveal                                                         */
  /* -------------------------------------------------------------------- */

  var revealObserver = ("IntersectionObserver" in window) && !reducedMotion
    ? new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      )
    : null;

  function observeReveal(scope) {
    var targets = $$(".reveal", scope);
    if (!revealObserver) {
      targets.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }
    targets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* -------------------------------------------------------------------- */
  /* Per-subject Google Sheets modal                                       */
  /* -------------------------------------------------------------------- */

  function openSheetModal(url, subject) {
    var modal = $("#sheetModal");
    var frame = $("#modalFrame");
    var label = $("#modalSubject");
    if (!modal || !frame) return;

    frame.src = url;
    if (label) label.textContent = subject || "Grade sheet";
    modal.classList.add("show");
  }

  function closeSheetModal() {
    var modal = $("#sheetModal");
    var frame = $("#modalFrame");
    if (!modal) return;

    modal.classList.remove("show");
    if (frame) frame.src = "about:blank";
  }

  function initSheetModal() {
    /* Event delegation: schedule rows are (re)rendered after the initial
       data/site.json fetch resolves, so listeners are bound at the document
       level rather than to individual buttons. */
    document.addEventListener("click", function (event) {
      var button = event.target.closest(".sheet-btn");
      if (!button || button.disabled) return;
      openSheetModal(button.dataset.sheetUrl, button.dataset.subject);
    });

    var closeButton = $("#closeSheet");
    if (closeButton) {
      closeButton.addEventListener("click", closeSheetModal);
    }

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      var modal = $("#sheetModal");
      if (modal && modal.classList.contains("show")) closeSheetModal();
    });
  }

  /* -------------------------------------------------------------------- */
  /* Init                                                                   */
  /* -------------------------------------------------------------------- */

  renderAllSchedules();
  loadSiteData();

  tick();
  setInterval(tick, 1000);

  window.addEventListener("load", function () {
    setTimeout(hideBootScreen, 500);
  });

  initMobileNav();
  initScrollProgress();
  initSheetModal();
  observeReveal(document);
})();
