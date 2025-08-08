/**
 * ReptileCare Frontend Scripts
 * Purpose: Initialize header/footer, mobile nav, search autocomplete, slider, and utilities.
 * Dev tips:
 * - Add new page-specific initializers using initPageModules().
 * - Search dataset is in js/search-functionality.js; this file wires inputs and navigation.
 */
(function() {
  'use strict';

  /* =============================
     Utilities
     ============================= */
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function isSubdir() {
    const path = window.location.pathname;
    return (path.match(/\//g) || []).length > 1;
  }

  function resolvePath(rel) {
    return isSubdir() ? `../${rel}` : rel;
  }

  /* =============================
     Header / Footer Loader
     ============================= */
  function loadPartial(targetId, file) {
    const el = document.getElementById(targetId);
    if (!el) return Promise.resolve();
    return fetch(resolvePath(file)).then(r => r.text()).then(html => { el.innerHTML = html; });
  }

  function initHeaderInteractions() {
    const toggle = qs('#menu-toggle');
    const drawer = qs('#mobile-drawer');
    if (!toggle || !drawer) return;

    function setExpanded(expanded) {
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute('aria-label', expanded ? 'Close menu' : 'Open menu');
      drawer.classList.toggle('open', expanded);
    }

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      setExpanded(!expanded);
    });

    document.addEventListener('click', (e) => {
      if (!drawer.classList.contains('open')) return;
      const inside = e.target.closest('header');
      if (!inside) setExpanded(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) setExpanded(false);
    });
  }

  /* =============================
     Search Wiring (uses window.searchFunctionality)
     ============================= */
  function initSearch() {
    // If legacy searchFunctionality exists, initialize; otherwise load it dynamically.
    function bindFallbackForms() {
      // Minimal progressive enhancement: navigate to care guides list when submitting an empty local search.
      function bindForm(formSel, inputSel) {
        const form = qs(formSel);
        const input = qs(inputSel);
        if (!form || !input) return;
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const q = input.value.trim();
          if (!q) return;
          window.location.href = resolvePath('all-care-guides.html');
        });
      }
      bindForm('form.search', '#site-search');
      bindForm('header form.search', '#site-search-mobile');
    }

    if (window.searchFunctionality && typeof window.searchFunctionality.initialize === 'function') {
      window.searchFunctionality.initialize();
      return;
    }

    // Dynamically load enhanced search if available
    const script = document.createElement('script');
    script.src = resolvePath('js/search-functionality.js');
    script.onload = () => {
      if (window.searchFunctionality && typeof window.searchFunctionality.initialize === 'function') {
        window.searchFunctionality.initialize();
      } else {
        bindFallbackForms();
      }
    };
    script.onerror = () => bindFallbackForms();
    document.head.appendChild(script);
  }

  /* =============================
     Slider (homepage)
     ============================= */
  let sliderTimer = null; let sliderIndex = 0;
  function initSlider() {
    const container = qs('.content-slider');
    if (!container) return;

    function showSlide(n) {
      const slides = qsa('.slide', container);
      const dots = qsa('.dot', container);
      slides.forEach((s, i) => s.classList.toggle('active', i === n));
      dots.forEach((d, i) => d.classList.toggle('active', i === n));
      sliderIndex = n;
    }

    function rotate() {
      const slides = qsa('.slide', container);
      if (slides.length === 0) return;
      sliderIndex = (sliderIndex + 1) % slides.length;
      showSlide(sliderIndex);
      sliderTimer = setTimeout(rotate, 6000);
    }

    // Build from existing JSON API used by the old index
    function loadJson(fileName) {
      return fetch(fileName).then(r => r.json());
    }

    const dotsWrapper = document.createElement('div');
    dotsWrapper.className = 'dots-container';
    container.appendChild(dotsWrapper);

    loadJson(resolvePath('data/reptile_care_data.json')).then(data => {
      data.forEach((item, idx) => {
        const slide = document.createElement('div');
        slide.className = 'slide' + (idx === 0 ? ' active' : '');

        const imgWrap = document.createElement('div');
        imgWrap.className = 'slide-image';
        const img = document.createElement('img');
        img.src = item['Picture Link'];
        img.alt = item['Common Name'];
        img.loading = 'lazy';
        imgWrap.appendChild(img);

        const text = document.createElement('div');
        text.className = 'overlay-text';
        text.innerHTML = `<h3 class="common-name">${item['Common Name']}</h3><h4 class="species-name">${item['Species']}</h4>`;

        slide.appendChild(imgWrap);
        slide.appendChild(text);
        container.insertBefore(slide, dotsWrapper);

        const dot = document.createElement('span');
        dot.className = 'dot' + (idx === 0 ? ' active' : '');
        dot.addEventListener('click', () => { showSlide(idx); });
        dotsWrapper.appendChild(dot);
      });

      rotate();
    });
  }

  /* =============================
     Page bootstrap
     ============================= */
  function initPageModules() {
    initHeaderInteractions();
    initSearch();
    initSlider();
  }

  function boot() {
    const headerPromise = loadPartial('main-header', 'partials/header.html');
    headerPromise
      .then(() => { initHeaderInteractions(); initSearch(); })
      .then(() => loadPartial('main-footer', 'partials/footer.html'))
      .then(() => initPageModules())
      .catch(() => { /* graceful no-op */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();


