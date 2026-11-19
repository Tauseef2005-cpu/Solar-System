/* Árstraumur — base interface behavior (no 3D here).
   Calm mode toggle, mobile navigation, video poster embeds.
   Motion rules: sine/power easings only, nothing bounces. */

(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- Calm mode ------------------------------------------------ */

  var calmButtons = document.querySelectorAll('.calm-toggle');

  function calmActive() {
    return root.classList.contains('calm');
  }

  function syncCalmButtons() {
    calmButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', calmActive() ? 'true' : 'false');
    });
  }

  calmButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var on = !calmActive();
      root.classList.toggle('calm', on);
      try { localStorage.setItem('arstraumur:calm2', on ? '1' : '0'); } catch (e) {}
      syncCalmButtons();
      /* The scene reacts via this event (phase 2+). */
      window.dispatchEvent(new CustomEvent('arstraumur:calm', { detail: { calm: on } }));
    });
  });
  syncCalmButtons();

  /* ---------- Mobile navigation ---------------------------------------- */

  var nav = document.querySelector('.site-nav');
  var toggle = document.querySelector('.nav-toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---------- Per-content bindings (rerun after soft navigation) -------- */

  /* A fraction of a second of character settling on the header line only,
     never on body text, fully disabled in calm mode / reduced motion. */
  function decodeOnce(el) {
    var spans = el.querySelectorAll('time, .t-no');
    spans.forEach(function (node) {
      var finalText = node.textContent;
      var glyphs = '0123456789·:-ABCDEFGHIKLMNORSTUVX';
      var steps = 9;
      var step = 0;
      var timer = setInterval(function () {
        step++;
        if (step >= steps) {
          clearInterval(timer);
          node.textContent = finalText;
          return;
        }
        var settled = Math.floor(finalText.length * (step / steps));
        var out = finalText.slice(0, settled);
        for (var i = settled; i < finalText.length; i++) {
          var ch = finalText[i];
          out += (ch === ' ' || ch === '·') ? ch : glyphs[(Math.random() * glyphs.length) | 0];
        }
        node.textContent = out;
      }, 55); /* ~0.5 s total */
    });
  }

  var bandIo = null;

  /* Image lightbox: same shell and keys as the video one, an <img> instead of
     an iframe. Used by the awards certificate. */
  function openImageLightbox(src, label) {
    var lb = document.createElement('div');
    lb.className = 'video-lightbox img-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-label', label);
    var img = document.createElement('img');
    img.src = src;
    img.alt = label;
    var btn = document.createElement('button');
    btn.className = 'vl-close';
    btn.setAttribute('aria-label', 'Close');
    btn.innerHTML = '&times;';
    var frame = document.createElement('div');
    frame.className = 'vl-frame';
    frame.appendChild(img);
    lb.appendChild(btn);
    lb.appendChild(frame);
    var close = function () {
      lb.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { lb.remove(); }, 380);
    };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target === frame || e.target.classList.contains('vl-close')) close();
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(lb);
    requestAnimationFrame(function () { lb.classList.add('open'); });
    btn.focus();
  }

  function openVideoLightbox(id, title) {
    window.dispatchEvent(new CustomEvent('arstraumur:videoopen'));
    var lb = document.createElement('div');
    lb.className = 'video-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-label', title);
    lb.innerHTML = '<button class="vl-close" aria-label="Close">&times;</button>' +
      '<div class="vl-frame"><iframe src="https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=1&rel=0" title="' + title.replace(/"/g, '&quot;') +
      '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
    var close = function () {
      lb.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { lb.remove(); window.dispatchEvent(new CustomEvent('arstraumur:videoclose')); }, 380);
    };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('vl-close')) close();
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(lb);
    requestAnimationFrame(function () { lb.classList.add('open'); });
    lb.querySelector('.vl-close').focus();
  }

  /* Bind everything that lives inside <main>. Runs at load and again after
     every soft navigation (the scene swaps content without a page turn). */
  function hydrateContent() {
    /* The splash plays every time you arrive at start, first load or a soft-nav
       back later. The swapped-in markup is a fresh element, so it has no
       data-played mark and runs its own fade in, hold, fade out. */
    playAwardSplash();

    /* Anything marked data-lightbox opens its href as an image instead of
       navigating away. Rebound after every soft-nav with the rest of main. */
    document.querySelectorAll('[data-lightbox]:not([data-lb-bound])').forEach(function (a) {
      a.setAttribute('data-lb-bound', '1');
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openImageLightbox(a.getAttribute('href'), a.getAttribute('data-lightbox') || '');
      });
    });

    var decodeEl = document.querySelector('[data-decode]:not([data-decoded])');
    if (decodeEl && !calmActive() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      decodeEl.setAttribute('data-decoded', '1');
      decodeOnce(decodeEl);
    }

    /* Video posters -> lightbox with a large nocookie player. */
    document.querySelectorAll('a.video-poster[data-yt]:not([data-bound])').forEach(function (a) {
      a.setAttribute('data-bound', '1');
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openVideoLightbox(a.getAttribute('data-yt'), a.getAttribute('data-title') || 'Video');
      });
    });

    /* External links leave the site in a new tab. */
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (a.host !== location.host && !a.target) {
        a.target = '_blank';
        if ((a.rel || '').indexOf('noopener') === -1) a.rel = (a.rel ? a.rel + ' ' : '') + 'noopener';
      }
    });

    /* Contact transmission form: soft submit with inline status; falls back
       to a plain POST + redirect without JS. */
    var ctForm = document.querySelector('.ct-form[method]');
    if (ctForm && !ctForm.dataset.bound) {
      ctForm.dataset.bound = '1';
      ctForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = ctForm.querySelector('.ct-send');
        var status = ctForm.querySelector('.ct-status');
        btn.disabled = true;
        status.className = 'ct-status';
        status.textContent = 'Transmitting…';
        fetch(ctForm.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(ctForm),
        }).then(function (r) { return r.json(); }).then(function (j) {
          if (j.ok) {
            ctForm.innerHTML =
              '<p class="ct-sent-title">Transmission received</p>' +
              '<p class="ct-sent-note">We read everything. Expect a reply from the ground station.</p>';
          } else {
            btn.disabled = false;
            status.className = 'ct-status err';
            status.textContent = j.message || 'The transmitter failed.';
          }
        }).catch(function () {
          btn.disabled = false;
          status.className = 'ct-status err';
          status.textContent = 'The transmitter failed. Mail us directly instead.';
        });
      });
    }

    /* Journey band fading: content is fully present near the viewport
       center and quiet otherwise. Opacity only, calm mode exempt. */
    if (bandIo) { bandIo.disconnect(); bandIo = null; }
    document.body.classList.remove('band-fade');
    if (document.body.dataset.scene === 'journey' && 'IntersectionObserver' in window) {
      var bandEls = document.querySelectorAll('.band-content');
      if (bandEls.length) {
        document.body.classList.add('band-fade');
        bandIo = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            en.target.classList.toggle('in-view', en.isIntersecting);
          });
        }, { rootMargin: '-12% 0px -12% 0px', threshold: 0.1 });
        bandEls.forEach(function (el) { bandIo.observe(el); });
      }
    }
  }

  hydrateContent();
  window.arstraumurRehydrate = hydrateContent;

  /* ---------- Award splash ----------------------------------------------
     Fades in under the hero descriptor once the opening film has landed
     (or right away when no film runs), holds 5 s, fades out, then folds
     its space away. Runs on EVERY arrival at start: hydrateContent calls it
     again after each soft-nav, and the fresh element replays. */
  function playAwardSplash(replay) {
    var img = document.querySelector('.hero-awards');
    if (!img) return;
    /* Never two runs at once: the scroll watcher can fire while one is mid-fade. */
    if (img.getAttribute('data-playing')) return;
    /* Guard on the ELEMENT, not a global: a soft-nav back to start brings a
       fresh copy in the swapped markup, and that copy should play again.
       The scroll path passes replay=true, because there the element IS the one
       that already played and the flag would block it forever. */
    if (!replay && img.getAttribute('data-played')) return;
    img.setAttribute('data-played', '1');
    img.setAttribute('data-playing', '1');
    img.classList.remove('on', 'gone');
    img.hidden = true;
    var tries = 0;
    var timer = setInterval(function () {
      /* Opened in a background tab? Hold the whole sequence until the visitor
         actually looks — otherwise the 5 s window burns off unseen (background
         tabs freeze animation frames but not timers). */
      if (document.visibilityState !== 'visible') return;
      tries++;
      var booting = document.documentElement.classList.contains('scene-booting');
      var locked = document.body.classList.contains('film-lock');
      if (!booting && !locked) {
        clearInterval(timer);
        /* Let the hero text land and breathe for 2 s before the splash. */
        setTimeout(function () {
          img.hidden = false;
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { img.classList.add('on'); });
          });
          setTimeout(function () { img.classList.remove('on'); }, 6100);   /* 1.1 s fade-in + 5 s hold */
          setTimeout(function () { img.classList.add('gone'); }, 7300);    /* fade-out done: fold the space */
          setTimeout(function () {
            /* Parked, not removed. The journey is one long scroll, so coming
               back from the planets is not a navigation and there is no fresh
               copy to replay: keep this one and reset it to its starting state. */
            img.hidden = true;
            img.classList.remove('on', 'gone');
            img.removeAttribute('data-playing');
          }, 8200);
        }, 2000);
      } else if (tries > 300) {
        clearInterval(timer);   /* the film never released (edge case): skip quietly */
        img.hidden = true;
        img.removeAttribute('data-playing');
      }
    }, 250);
  }

  /* Flying out to the planets and back is scrolling, not navigating, so
     hydrateContent never runs and the splash would be seen once per page load
     and never again. Watch the scroll instead: every return to the hero
     replays it, which is what the Start link already gave for free. */
  (function watchHeroReturn() {
    var left = false;
    addEventListener('scroll', function () {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      if (y > 600) { left = true; return; }
      if (left && y < 120) { left = false; playAwardSplash(true); }
    }, { passive: true });
  })();

  /* ---------- Scene loader (phases 2-3) --------------------------------- */

  /* The 3D sky is an enhancement layered behind the content. It loads only
     when: not calm, no reduced-motion preference, WebGL2 available. */
  function shouldLoadScene() {
    if (calmActive()) return false;
    /* Reduced motion does NOT block the scene: the app renders the system
       still, replaces flights with holds and calms all idle motion. Only
       an explicit calm choice (or no WebGL) keeps the static sky. */
    var canvas = document.getElementById('sky');
    if (!canvas) return false;
    try {
      var gl = document.createElement('canvas').getContext('webgl2');
      /* Release the probe. iOS Safari caps how many WebGL contexts may live at
         once per process and silently drops the oldest when the cap is reached;
         a probe that is never released holds one of those slots for the whole
         life of the page, for no reason after this single question. */
      if (gl) {
        var lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  var sceneRequested = false;
  function maybeLoadScene() {
    if (sceneRequested || !shouldLoadScene()) return;
    if (!document.body.dataset.scene) return; /* pages opt in via data-scene */
    sceneRequested = true;
    var src = document.body.dataset.sceneSrc;
    if (!src) return;
    import(src).catch(function (err) {
      /* A cached-but-corrupt module is the classic cause: retry once,
         bypassing every cache layer. Otherwise the static sky remains. */
      console.error('[arstraumur] scene load failed, retrying fresh:', err);
      var fresh = src + (src.indexOf('?') > -1 ? '&' : '?') + 'r=' + Date.now();
      import(fresh).catch(function (err2) {
        console.error('[arstraumur] scene unavailable:', err2);
        root.classList.remove('scene-live');
        root.classList.remove('scene-booting');   /* scene won't mount: reveal the static content now */
      });
    });
  }

  maybeLoadScene();
  window.addEventListener('arstraumur:calm', function (e) {
    if (!e.detail.calm) maybeLoadScene();
  });
})();
