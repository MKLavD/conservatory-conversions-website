document.addEventListener('DOMContentLoaded', function () {

  var STORAGE_KEY = 'cc-consent';

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeConsent(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch (e) { /* localStorage unavailable (private mode etc) — choice just won't persist */ }
  }

  function applyConsent(choice) {
    gtag('consent', 'update', {
      'analytics_storage': choice.analytics ? 'granted' : 'denied',
      'ad_storage': choice.advertising ? 'granted' : 'denied',
      'ad_user_data': choice.advertising ? 'granted' : 'denied',
      'ad_personalization': choice.advertising ? 'granted' : 'denied'
    });
  }

  /* ---------- Elements ---------- */
  var banner = document.getElementById('ccBanner');
  var acceptBtn = document.getElementById('ccAcceptBtn');
  var rejectBtn = document.getElementById('ccRejectBtn');
  var openSettingsTriggers = document.querySelectorAll('[data-cc-open-settings]');
  var settingsBackdrop = document.getElementById('ccSettingsBackdrop');
  var settingsCloseBtn = document.getElementById('ccSettingsCloseBtn');
  var saveBtn = document.getElementById('ccSaveBtn');
  var analyticsToggle = document.getElementById('ccAnalyticsToggle');
  var advertisingToggle = document.getElementById('ccAdvertisingToggle');

  if (!banner || !settingsBackdrop) return;

  function hideBanner() { banner.style.display = 'none'; }
  function showBanner() { banner.style.display = 'block'; }

  function openSettings() {
    var stored = readConsent();
    analyticsToggle.checked = !!(stored && stored.analytics);
    advertisingToggle.checked = !!(stored && stored.advertising);
    settingsBackdrop.style.display = 'flex';
  }
  function closeSettings() { settingsBackdrop.style.display = 'none'; }

  function saveChoice(choice, skipUpdateCall) {
    choice.timestamp = Date.now();
    writeConsent(choice);
    // Reject leaves everything denied, which is already the default state set
    // in <head> before GTM/gtag load — no update call needed on this click.
    // (On the *next* page load the stored choice is still replayed below, so
    // Consent Mode always has an explicit signal once a choice exists.)
    if (!skipUpdateCall) applyConsent(choice);
    hideBanner();
    closeSettings();
  }

  /* ---------- Replay a stored choice on every page load, or show the banner ---------- */
  var existing = readConsent();
  if (existing) {
    applyConsent(existing);
  } else {
    showBanner();
  }

  /* ---------- Wire up controls ---------- */
  if (acceptBtn) {
    acceptBtn.addEventListener('click', function () {
      saveChoice({ analytics: true, advertising: true });
    });
  }
  if (rejectBtn) {
    rejectBtn.addEventListener('click', function () {
      saveChoice({ analytics: false, advertising: false }, true);
    });
  }
  openSettingsTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', openSettings);
  });
  if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', closeSettings);
  if (settingsBackdrop) {
    settingsBackdrop.addEventListener('click', function (e) {
      if (e.target === settingsBackdrop) closeSettings();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && settingsBackdrop.style.display === 'flex') closeSettings();
  });
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      saveChoice({
        analytics: !!analyticsToggle.checked,
        advertising: !!advertisingToggle.checked
      });
    });
  }
});
