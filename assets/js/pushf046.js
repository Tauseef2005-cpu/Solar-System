/* Árstraumur web-push opt-in (progressive enhancement).
   One dark modal (styled like the site's overlays) explains the transmissions
   and carries the action button. Openers: the Transmissions item in the menu
   and the footer button. On the home page it also opens by itself — but only
   for visitors who are not subscribed, and at most once a week (a local
   timestamp acts as the weekly-reset cookie). */
(function () {
  'use strict';

  var body = document.body;
  var vapid = body.getAttribute('data-vapid') || '';
  var base = body.getAttribute('data-base') || '';
  if (!vapid) { return; }

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true;
  /* iPhone/iPad in a plain Safari tab cannot receive push — hide the whole
     feature there (menu item, footer button, auto-pop). Installed-to-home-
     screen iOS supports push and falls through to the normal flow, as does
     Android, where push works in the ordinary mobile browser. */
  if (isIOS && !standalone) { return; }
  var supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!supported) { return; }

  var reg = null, sub = null, busy = false, ready = false;
  var errMsg = '';   /* transient: last attempt failed; cleared on the next try */

  /* ---------- the modal ---------- */

  var modal = document.createElement('div');
  modal.className = 'push-modal';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'pm-title');
  modal.innerHTML =
    '<div class="pm-box">' +
    '<button type="button" class="pm-close" aria-label="Close">&#10005;</button>' +
    '<p class="pm-label">Onboard link</p>' +
    '<h2 id="pm-title">Transmissions</h2>' +
    '<p class="pm-text">Occasional signals from Árstraumur, straight to this device: news, new releases, free Bandcamp codes, demos and other rarities. No noise, and one tap turns it off again.</p>' +
    '<div class="pm-actions">' +
    '<button type="button" class="pm-go push-btn">Get transmissions</button>' +
    '<button type="button" class="pm-later">Not now</button>' +
    '</div>' +
    '</div>';
  document.body.appendChild(modal);
  var pmGo = modal.querySelector('.pm-go');
  var lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    /* setTimeout, not rAF: rAF stalls in background tabs, leaving the modal
       transparent if something opened it while the tab was hidden. */
    window.setTimeout(function () { modal.classList.add('open'); }, 20);
    render();
    modal.querySelector('.pm-close').focus();
  }
  function closeModal() {
    modal.classList.remove('open');
    window.setTimeout(function () { modal.hidden = true; }, 300);
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }
  modal.addEventListener('click', function (ev) {
    if (ev.target === modal || ev.target.closest('.pm-close, .pm-later')) { closeModal(); }
  });
  addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !modal.hidden) { closeModal(); }
  });

  /* ---------- state ---------- */

  function render() {
    getButtons().forEach(function (btn) {
      if (Notification.permission === 'denied') {
        btn.textContent = 'Transmissions blocked in browser settings';
        btn.disabled = true;
        btn.classList.remove('is-on');
        return;
      }
      btn.disabled = busy || (btn === pmGo && !ready);
      btn.textContent = busy ? 'One moment…'
        : (errMsg ? errMsg : (sub ? 'Transmissions are on · turn off' : 'Get transmissions'));
      btn.classList.toggle('is-on', !!sub);
    });
  }
  function getButtons() {
    return [pmGo];
  }

  /* ---------- openers ---------- */

  function showOpeners() {
    var mi = document.querySelector('.menu-push');
    if (mi) { mi.hidden = false; }
  }
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null;
    if (!t) { return; }
    if (t.closest('.menu-push')) { openModal(); return; }
    if (t.closest('.pm-go') && !busy && ready) {
      if (sub) { disable(); } else { enable(); }
    }
  });

  /* ---------- subscribe / unsubscribe ---------- */

  function api(payload) {
    return fetch(base + '/api/push.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); });
  }
  function b64ToU8(s) {
    var pad = '='.repeat((4 - (s.length % 4)) % 4);
    var raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) { out[i] = raw.charCodeAt(i); }
    return out;
  }
  function enable() {
    busy = true; errMsg = ''; render();
    var fresh = null;
    Promise.resolve(Notification.requestPermission()).then(function (perm) {
      if (perm !== 'granted') { return null; }
      return reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToU8(vapid),
      }).then(function (s) {
        fresh = s;
        return api({ action: 'subscribe', subscription: s.toJSON() });
      }).then(function (res) {
        /* Count as subscribed only once the SERVER confirms it stored us.
           Setting `sub` before the ack made the button read "transmissions are
           on" even when the store refused (rate limit, cap, unwritable file),
           so the visitor waited for messages that were never coming. */
        if (res && res.ok) { sub = fresh; return null; }
        errMsg = 'Could not register. Try again later.';
        /* Undo the browser side too, so both ends agree on "off". */
        return fresh.unsubscribe().catch(function () {}).then(function () { sub = null; });
      });
    }).catch(function () {
      if (!errMsg) { errMsg = 'Could not register. Try again later.'; }
      sub = null;
    }).then(function () {
      busy = false; render();
      if (sub) { window.setTimeout(closeModal, 900); }   /* done: let it rest */
    });
  }
  function disable() {
    busy = true; errMsg = ''; render();
    var ep = sub && sub.endpoint;
    (sub ? sub.unsubscribe() : Promise.resolve()).then(function () {
      sub = null;
      return api({ action: 'unsubscribe', endpoint: ep });
    }).catch(function () { /* ignore */ }).then(function () { busy = false; render(); });
  }

  /* ---------- weekly auto-pop on the home page ---------- */

  function isHome() {
    var rel = location.pathname.indexOf(base) === 0 ? location.pathname.slice(base.length) : location.pathname;
    return rel === '' || rel === '/';
  }
  function maybeAutoOpen() {
    if (!isHome() || sub) { return; }
    if (Notification.permission !== 'default') { return; }
    var KEY = 'arstraumur:pushpop';
    var last = 0;
    try { last = parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch (e) { /* private mode */ }
    if (Date.now() - last < 7 * 86400 * 1000) { return; }
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* ok */ }
    /* Let the opening film land first, then a calm beat. */
    var tries = 0;
    var wait = window.setInterval(function () {
      tries++;
      if (document.body.classList.contains('film-lock') && tries < 120) { return; }
      window.clearInterval(wait);
      window.setTimeout(function () {
        if (!document.body.classList.contains('film-lock') && modal.hidden) { openModal(); }
      }, 2500);
    }, 500);
  }

  /* ---------- boot ---------- */

  navigator.serviceWorker.register(base + '/sw.js', { scope: base + '/' })
    .then(function (r) { reg = r; return r.pushManager.getSubscription(); })
    .then(function (s) {
      sub = s || null;
      ready = true;
      showOpeners();
      render();
      var mainEl = document.querySelector('main');
      if (mainEl && 'MutationObserver' in window) {
        new MutationObserver(function () { showOpeners(); render(); }).observe(mainEl, { childList: true });
      }
      maybeAutoOpen();
    })
    .catch(function () { /* SW registration failed: no openers appear */ });
})();
