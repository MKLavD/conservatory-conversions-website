document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Footer year (immediate — trivial, no layout read) ---------- */
  var yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll (set up immediately, NOT deferred) ----------
     Above-the-fold .reveal elements start at opacity:0. Deferring the observer
     behind the rAF chain kept them invisible for seconds under CPU throttle,
     which Speed Index counts as "not visually complete". Attaching the observer
     now lets above-fold content fade in right after FCP. Observer setup does no
     forced layout, so it stays LCP-safe. Delay is capped so nothing waits long. */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var delay = Math.min(parseInt(entry.target.getAttribute('data-delay') || '0', 10), 120);
          setTimeout(function () { entry.target.classList.add('in'); }, delay);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* Everything below is deferred until AFTER the first paint so it never blocks
     the LCP (hero image) paint. A double requestAnimationFrame runs once the
     browser has painted the first frame; none of this is needed before then. */
  function runAfterPaint(fn) {
    requestAnimationFrame(function () { requestAnimationFrame(fn); });
  }
  runAfterPaint(function () {

  /* ---------- Navbar scrolled state ---------- */
  var navbar = document.getElementById('navbar');
  function onScroll() {
    if (window.scrollY > 16) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav overlay ---------- */
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var closeMobileBtn = document.getElementById('closeMobileBtn');
  var mobileOverlay = document.getElementById('mobileOverlay');

  function openMobileNav() { mobileOverlay.classList.add('open'); }
  function closeMobileNav() { mobileOverlay.classList.remove('open'); }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMobileNav);
  if (closeMobileBtn) closeMobileBtn.addEventListener('click', closeMobileNav);
  if (mobileOverlay) {
    mobileOverlay.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileNav);
    });
  }

  /* ---------- Before / After slider ---------- */
  var baSlider = document.getElementById('baSlider');
  if (baSlider) {
    var baDivider = document.getElementById('baDivider');
    var baHandle = document.getElementById('baHandle');
    var baImgBefore = baSlider.querySelector('.img-before');
    var dragging = false;
    var baRect = null;   // cached geometry: read once per gesture, never mid-move
    var rafId = null;
    var pendingX = 0;

    var nudgeCancelled = false;   // any user interaction cancels the intro nudge
    var nudgePlayed = false;

    // Set the slider position directly (0 = fully left, 100 = fully right).
    function applyPct(pct) {
      var clip = 100 - pct;
      baSlider.style.setProperty('--clip', clip + '%');
      baImgBefore.style.clipPath = 'inset(0 ' + clip + '% 0 0)';
      var pos = pct + '%';
      baDivider.style.left = pos;
      baHandle.style.left = pos;
    }

    // Writes only, batched into one rAF — we never read layout after a write,
    // so continuous dragging no longer triggers a synchronous forced reflow.
    function paintClip() {
      rafId = null;
      var x = pendingX - baRect.left;
      var pct = Math.max(0, Math.min(100, (x / baRect.width) * 100));
      applyPct(pct);
    }

    function updateFromX(clientX) {
      pendingX = clientX;
      if (rafId === null) rafId = requestAnimationFrame(paintClip);
    }

    function start(e) {
      nudgeCancelled = true;   // user took over — stop the intro nudge
      dragging = true;
      baRect = baSlider.getBoundingClientRect();  // single geometry read, before any writes
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updateFromX(clientX);
    }
    function move(e) {
      if (!dragging || !baRect) return;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updateFromX(clientX);
    }
    function end() { dragging = false; }

    baSlider.addEventListener('mousedown', start);
    baSlider.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);

    /* One-time intro nudge: after full page load + 700ms, sweep the slider
       fully right → fully left → back to centre (~1s per leg, ease-in-out).
       Triggered on window 'load' so it runs well after LCP/first paint, plays
       once, and cancels instantly if the user interacts (start() flags it). */
    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function animatePct(from, to, duration, done) {
      var startTs = null;
      function frame(ts) {
        if (nudgeCancelled) return;                 // stop silently if interrupted
        if (startTs === null) startTs = ts;
        var t = Math.min(1, (ts - startTs) / duration);
        applyPct(from + (to - from) * easeInOutCubic(t));
        if (t < 1) requestAnimationFrame(frame);
        else if (done) done();
      }
      requestAnimationFrame(frame);
    }
    function playNudge(delay) {
      if (nudgePlayed || nudgeCancelled) return;
      nudgePlayed = true;
      // Respect users who prefer reduced motion — skip the animation entirely.
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      setTimeout(function () {
        if (nudgeCancelled) return;
        animatePct(50, 100, 1000, function () {
          animatePct(100, 0, 1000, function () {
            animatePct(0, 50, 1000);
          });
        });
      }, delay);
    }

    // On stacked (mobile) layouts the slider sits below the hero and is off-screen
    // at load, so trigger the nudge when it first scrolls into view instead. On
    // desktop (slider visible in the hero on load) keep the page-load trigger.
    var stacked = window.matchMedia && window.matchMedia('(max-width: 1024px)').matches;
    if (stacked && 'IntersectionObserver' in window) {
      var nudgeObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          nudgeObserver.disconnect();
          playNudge(300);   // brief settle once it's comfortably in view
        }
      }, { threshold: 0.4 });
      nudgeObserver.observe(baSlider);
    } else if (document.readyState === 'complete') {
      playNudge(700);
    } else {
      window.addEventListener('load', function () { playNudge(700); }, { once: true });
    }
  }

  /* ---------- Mobile sticky CTA: reveal once the hero CTAs scroll away ---------- */
  var mobileCta = document.querySelector('.mobile-cta-bar');
  // Prefer the hero CTA buttons as the trigger (bar appears the moment they leave
  // the viewport); fall back to the whole hero on pages without that button row.
  var ctaTrigger = document.querySelector('.hero-actions') || document.querySelector('.hero');
  if (mobileCta && ctaTrigger && 'IntersectionObserver' in window) {
    var ctaObserver = new IntersectionObserver(function (entries) {
      var e = entries[0];
      // Show ONLY once the trigger has scrolled up past the top of the viewport.
      // Checking boundingClientRect.top < 0 avoids the spurious "not intersecting"
      // the observer can report on its first callback before layout settles, which
      // otherwise flashes the bar visible on load.
      var scrolledPast = !e.isIntersecting && e.boundingClientRect.top < 0;
      mobileCta.classList.toggle('visible', scrolledPast);
    }, { threshold: 0 });
    ctaObserver.observe(ctaTrigger);
  } else if (mobileCta) {
    mobileCta.classList.add('visible'); // no IO support: just show it
  }

  /* ---------- Shared AJAX form submit (contact + brochure) ---------- */
  function submitForm(opts) {
    var form = opts.form;
    var button = opts.button;

    // Serialise named fields to a plain object.
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name) data[el.name] = el.value;
    });

    hideFormError(form);
    var originalHtml = button ? button.innerHTML : '';
    if (button) { button.disabled = true; button.innerHTML = 'Sending…'; }

    function restore() {
      if (button) { button.disabled = false; button.innerHTML = originalHtml; }
    }

    fetch(opts.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (payload) {
          if (!res.ok) throw new Error(payload.error || 'Something went wrong. Please try again.');
          return payload;
        });
      })
      .then(function () {
        restore();
        opts.onSuccess();
      })
      .catch(function (err) {
        restore();
        showFormError(form, (err && err.message) || 'Something went wrong. Please try again.');
      });
  }

  function showFormError(form, msg) {
    var errEl = form.querySelector('[data-form-error]');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.setAttribute('data-form-error', '');
      errEl.style.cssText = 'color:#c0392b;font-size:14px;margin-top:14px;text-align:center';
      form.appendChild(errEl);
    }
    errEl.textContent = msg;
    errEl.style.display = 'block';
  }

  function hideFormError(form) {
    var errEl = form.querySelector('[data-form-error]');
    if (errEl) errEl.style.display = 'none';
  }

  /* ---------- Brochure modal ---------- */
  var brochureOpenBtn = document.getElementById('brochureOpenBtn');
  var brochureBackdrop = document.getElementById('brochureBackdrop');
  var brochureCloseBtn = document.getElementById('brochureCloseBtn');
  var brochureModal = document.getElementById('brochureModal');
  var brochureForm = document.getElementById('brochureForm');
  var brochureFormView = document.getElementById('brochureFormView');
  var brochureSuccessView = document.getElementById('brochureSuccessView');

  function openBrochure(e) {
    if (e && e.preventDefault) e.preventDefault();
    brochureBackdrop.style.display = 'flex';
  }
  function closeBrochure() {
    brochureBackdrop.style.display = 'none';
    setTimeout(function () {
      brochureFormView.style.display = 'block';
      brochureSuccessView.style.display = 'none';
      if (brochureForm) brochureForm.reset();
    }, 300);
  }

  if (brochureOpenBtn) brochureOpenBtn.addEventListener('click', openBrochure);
  if (brochureCloseBtn) brochureCloseBtn.addEventListener('click', closeBrochure);
  if (brochureBackdrop) {
    brochureBackdrop.addEventListener('click', function (e) {
      if (e.target === brochureBackdrop) closeBrochure();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && brochureBackdrop && brochureBackdrop.style.display === 'flex') closeBrochure();
  });
  if (brochureModal) {
    brochureModal.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  if (brochureForm) {
    var brochureSubmitBtn = brochureForm.querySelector('button[type="submit"]');
    brochureForm.addEventListener('submit', function (e) {
      e.preventDefault();
      submitForm({
        form: brochureForm,
        button: brochureSubmitBtn,
        endpoint: '/api/brochure',
        onSuccess: function () {
          brochureFormView.style.display = 'none';
          brochureSuccessView.style.display = 'block';
        }
      });
    });
  }

  /* ---------- Contact form ---------- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var contactFormView = document.getElementById('contactFormView');
    var contactSuccessView = document.getElementById('contactSuccessView');
    var contactSuccessName = document.getElementById('contactSuccessName');
    var contactResetBtn = document.getElementById('contactResetBtn');

    var contactSubmitBtn = contactForm.querySelector('button[type="submit"]');
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameField = contactForm.elements['name'];
      var first = ((nameField && nameField.value) || '').trim().split(' ')[0] || 'there';
      submitForm({
        form: contactForm,
        button: contactSubmitBtn,
        endpoint: '/api/contact',
        onSuccess: function () {
          if (contactSuccessName) contactSuccessName.textContent = first;
          contactFormView.style.display = 'none';
          contactSuccessView.style.display = 'block';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    if (contactResetBtn) {
      contactResetBtn.addEventListener('click', function () {
        contactForm.reset();
        contactSuccessView.style.display = 'none';
        contactFormView.style.display = 'block';
      });
    }
  }

  /* ---------- Accordions (FAQ etc.) ---------- */
  var accordionItems = document.querySelectorAll('.accordion-item');

  function setAccordionHeight(item) {
    var content = item.querySelector('.accordion-content');
    if (!content) return;
    content.style.maxHeight = item.classList.contains('open') ? content.scrollHeight + 'px' : '';
  }

  accordionItems.forEach(function (item) {
    var trigger = item.querySelector('.accordion-trigger');
    if (!trigger) return;
    if (item.classList.contains('open')) setAccordionHeight(item);
    trigger.addEventListener('click', function () {
      item.classList.toggle('open');
      setAccordionHeight(item);
    });
  });

  if (accordionItems.length) {
    window.addEventListener('resize', function () {
      accordionItems.forEach(function (item) {
        if (item.classList.contains('open')) setAccordionHeight(item);
      });
    }, { passive: true });
  }

  /* ---------- Before/after gallery (filter + per-card image toggle) ---------- */
  var baCards = document.querySelectorAll('[data-ba-card]');
  if (baCards.length) {
    // Per-card "Show Before / Show After" image toggle
    baCards.forEach(function (card) {
      var imgEl = card.querySelector('[data-ba-img]');
      var toggleBtn = card.querySelector('[data-ba-toggle]');
      if (!imgEl || !toggleBtn) return;
      var labelEl = toggleBtn.querySelector('[data-ba-label]');
      var showingAfter = true;
      toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        showingAfter = !showingAfter;
        var url = showingAfter ? imgEl.getAttribute('data-after') : imgEl.getAttribute('data-before');
        imgEl.style.backgroundImage = "url('" + url + "')";
        if (labelEl) labelEl.textContent = showingAfter ? 'Show Before' : 'Show After';
      });
    });

    // Category filter pills
    var filterPills = document.querySelectorAll('[data-filter]');
    var emptyMsg = document.querySelector('[data-ba-empty]');
    filterPills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        var filter = pill.getAttribute('data-filter');
        filterPills.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        var visibleCount = 0;
        baCards.forEach(function (card) {
          var cats = (card.getAttribute('data-cats') || '').split(',');
          var show = filter === 'All' || cats.indexOf(filter) !== -1;
          card.style.display = show ? '' : 'none';
          if (show) { card.classList.add('in'); visibleCount++; }
        });
        if (emptyMsg) emptyMsg.style.display = visibleCount === 0 ? 'block' : 'none';
      });
    });
  }

  }); // end deferred init (runAfterPaint)

});
