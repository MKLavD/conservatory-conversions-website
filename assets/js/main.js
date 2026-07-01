document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var delay = parseInt(entry.target.getAttribute('data-delay') || '0', 10);
          setTimeout(function () { entry.target.classList.add('in'); }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Before / After slider ---------- */
  var baSlider = document.getElementById('baSlider');
  if (baSlider) {
    var baDivider = document.getElementById('baDivider');
    var baHandle = document.getElementById('baHandle');
    var baImgBefore = baSlider.querySelector('.img-before');
    var dragging = false;

    function updateFromX(clientX) {
      var rect = baSlider.getBoundingClientRect();
      var x = clientX - rect.left;
      var pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      var clip = 100 - pct;
      baSlider.style.setProperty('--clip', clip + '%');
      baImgBefore.style.clipPath = 'inset(0 ' + clip + '% 0 0)';
      var pos = pct + '%';
      baDivider.style.left = pos;
      baHandle.style.left = pos;
    }

    function start(e) {
      dragging = true;
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updateFromX(clientX);
    }
    function move(e) {
      if (!dragging) return;
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

});
