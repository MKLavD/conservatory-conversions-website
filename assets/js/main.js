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

  /* ---------- Brochure modal ---------- */
  var brochureOpenBtn = document.getElementById('brochureOpenBtn');
  var brochureBackdrop = document.getElementById('brochureBackdrop');
  var brochureCloseBtn = document.getElementById('brochureCloseBtn');
  var brochureModal = document.getElementById('brochureModal');
  var brochureForm = document.getElementById('brochureForm');
  var brochureFormView = document.getElementById('brochureFormView');
  var brochureSuccessView = document.getElementById('brochureSuccessView');

  function openBrochure() {
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
    brochureForm.addEventListener('submit', function (e) {
      e.preventDefault();
      /* TODO: replace with a real submit to /api/brochure (Vercel function)
         once the contact-form backend is wired up. For now this only
         shows the success state client-side. */
      brochureFormView.style.display = 'none';
      brochureSuccessView.style.display = 'block';
    });
  }

});
