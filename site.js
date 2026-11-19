/* ============================================================
   Árstraumur — Site Navigation, Telemetry HUD, Scientific Planet HUD,
   Modals, & Interactive Controls.
   ============================================================ */

(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- Planet Data Model for Scientific Observation HUD ---------- */
  var planetData = {
    'earth-surface': {
      code: 'SYS-01',
      name: 'EARTH SURFACE',
      sub: 'REAL SATELLITE STREET VIEW · GÄVLE (60.6737° N)',
      diameter: '12,742 KM',
      distance: '149.6M KM (1.0 AU)',
      temp: '15°C (MEAN)',
      moonsCount: '1 MOON',
      moonsList: 'The Moon (Luna)',
      atmo: '78% Nitrogen, 21% Oxygen, 1% Argon',
      env: 'Habitable climate, liquid water oceans, magnetosphere & dense atmosphere.',
      align: 'left'
    },
    'earth-city': {
      code: 'SYS-01B',
      name: 'EARTH ATMOSPHERE',
      sub: 'TROPOSPHERE & REGIONAL CLIMATE',
      diameter: '12,742 KM',
      distance: '149.6M KM',
      temp: '8°C',
      moonsCount: '1 MOON',
      moonsList: 'The Moon',
      atmo: 'Nitrogen-Oxygen Troposphere',
      env: 'Active weather systems, cloud dynamics, precipitation, atmospheric haze.',
      align: 'right'
    },
    'earth-atmosphere': {
      code: 'SYS-01C',
      name: 'EARTH CURVATURE',
      sub: 'STRATOSPHERE & LOW EARTH ORBIT',
      diameter: '12,742 KM',
      distance: '149.6M KM',
      temp: '-50°C',
      moonsCount: '1 MOON',
      moonsList: 'The Moon',
      atmo: 'Ozone Layer & Stratosphere',
      env: 'Low pressure boundary shielding cosmic radiation and solar UV rays.',
      align: 'left'
    },
    'earth-orbit': {
      code: 'SYS-01D',
      name: 'EARTH GLOBE',
      sub: 'OCEAN WORLD · TERRESTRIAL',
      diameter: '12,742 KM',
      distance: '149.6M KM (1.0 AU)',
      temp: '15°C (MEAN)',
      moonsCount: '1 MOON',
      moonsList: 'The Moon (Luna)',
      atmo: '78% Nitrogen (N2), 21% Oxygen (O2), 1% Argon',
      env: 'Abundant liquid surface oceans (71%), active plate tectonics, biosphere.',
      align: 'right'
    },
    'moon': {
      code: 'SYS-01M',
      name: 'THE MOON',
      sub: 'EARTH NATURAL SATELLITE',
      diameter: '3,474 KM',
      distance: '384,400 KM FROM EARTH',
      temp: '-20°C (NIGHT -130°C / DAY 120°C)',
      moonsCount: 'SATELLITE OF EARTH',
      moonsList: 'Primary Lunar Body',
      atmo: 'Trace Exosphere (He, Ne, H)',
      env: 'Barren rocky lunar maria, heavy meteor cratering, extreme thermal shifts.',
      align: 'left'
    },
    'mercury': {
      code: 'SYS-02',
      name: 'MERCURY',
      sub: 'BARREN TERRESTRIAL WORLD',
      diameter: '4,879 KM',
      distance: '57.9M KM (0.39 AU)',
      temp: '167°C (MAX 430°C / MIN -180°C)',
      moonsCount: '0 MOONS',
      moonsList: 'No natural satellites',
      atmo: 'Surface-Bound Exosphere (O, Na, H)',
      env: 'Extreme solar radiation, cratered silicate crust, massive iron core.',
      align: 'right'
    },
    'venus': {
      code: 'SYS-03',
      name: 'VENUS',
      sub: 'TOXIC ATMOSPHERIC GIANT',
      diameter: '12,104 KM',
      distance: '108.2M KM (0.72 AU)',
      temp: '464°C (EXTREME GREENHOUSE)',
      moonsCount: '0 MOONS',
      moonsList: 'No natural satellites',
      atmo: '96.5% Carbon Dioxide (CO2), 3.5% N2',
      env: 'Runaway greenhouse effect, crushing surface pressure (92 atm), dense clouds.',
      align: 'left'
    },
    'mars': {
      code: 'SYS-04',
      name: 'MARS',
      sub: 'THE RED PLANET',
      diameter: '6,779 KM',
      distance: '227.9M KM (1.52 AU)',
      temp: '-63°C (MEAN)',
      moonsCount: '2 MOONS',
      moonsList: 'Phobos, Deimos',
      atmo: '95.3% Carbon Dioxide (CO2), 2.6% N2, 1.9% Ar',
      env: 'Iron oxide dust, massive impact craters, Olympus Mons volcano, polar ice caps.',
      align: 'right'
    },
    'jupiter': {
      code: 'SYS-05',
      name: 'JUPITER',
      sub: 'GAS GIANT · GREAT RED SPOT',
      diameter: '139,822 KM',
      distance: '778.5M KM (5.20 AU)',
      temp: '-110°C',
      moonsCount: '95 MOONS',
      moonsList: 'Io, Europa, Ganymede, Callisto',
      atmo: '89.8% Hydrogen, 10.2% Helium',
      env: 'Massive gas pressure, Great Red Spot storm, jet streams, radiation belts.',
      align: 'left'
    },
    'saturn': {
      code: 'SYS-06',
      name: 'SATURN',
      sub: 'RINGED GAS GIANT',
      diameter: '116,460 KM',
      distance: '1.43B KM (9.58 AU)',
      temp: '-140°C',
      moonsCount: '146 MOONS',
      moonsList: 'Titan, Enceladus, Rhea, Mimas',
      atmo: '96.3% Hydrogen, 3.25% Helium',
      env: 'Spectacular 3D ice-rock ring system, hexagonal vortex, methane lakes on Titan.',
      align: 'right'
    },
    'uranus': {
      code: 'SYS-07',
      name: 'URANUS',
      sub: 'ICE GIANT · 98° AXIAL TILT',
      diameter: '50,724 KM',
      distance: '2.87B KM (19.2 AU)',
      temp: '-195°C (COLDEST PLANET)',
      moonsCount: '28 MOONS',
      moonsList: 'Titania, Oberon, Ariel, Miranda',
      atmo: '83% Hydrogen, 15% Helium, 2% Methane',
      env: 'Rotates on its side (98° tilt), ice mantle of water, ammonia, methane.',
      align: 'left'
    },
    'neptune': {
      code: 'SYS-08',
      name: 'NEPTUNE',
      sub: 'DEEP BLUE ICE GIANT',
      diameter: '49,244 KM',
      distance: '4.50B KM (30.1 AU)',
      temp: '-200°C',
      moonsCount: '16 MOONS',
      moonsList: 'Triton (Retrograde Orbit), Proteus',
      atmo: '80% H₂, 19% He, 1.5% Methane',
      env: 'Fastest winds in solar system (2,100 km/h), Dark Spot storms, nitrogen geysers.',
      align: 'right'
    },
    'sun': {
      code: 'SYS-00-STAR',
      name: 'THE SUN',
      sub: 'G-TYPE MAIN-SEQUENCE STAR · 1 SOLAR MASS',
      diameter: '1,392,700 KM',
      distance: '0 KM (CENTER)',
      temp: '5,500°C (SURFACE) / 15M°C (CORE)',
      moonsCount: '8 PLANETS + 290+ MOONS',
      moonsList: 'All Solar Orbiting Bodies',
      atmo: '73% Hydrogen, 25% Helium, 2% Metals',
      env: 'Primary energy source and gravitational anchor. Radiant plasma convection, dynamic magnetic flares & solar corona.',
      align: 'right'
    },
    'solar-system': {
      code: 'SYS-00',
      name: 'SOL SYSTEM',
      sub: 'HELIOSPHERE & PLANETARY ORBITS',
      diameter: '1.39M KM (SUN)',
      distance: '0 KM (CENTER)',
      temp: '5,500°C (SOLAR SURFACE)',
      moonsCount: '8 PLANETS + 290+ MOONS',
      moonsList: 'All Major Solar Moons',
      atmo: 'Solar Wind Plasma & Interstellar Medium',
      env: 'Gravitationally bound system of 8 planets orbiting main-sequence star Sun.',
      align: 'left'
    },
    'contact': {
      code: 'SYS-00',
      name: 'SOL SYSTEM OVERVIEW',
      sub: 'GROUND STATION TRANSMISSION RELAY',
      diameter: '1.39M KM (SUN)',
      distance: '0 KM (CENTER)',
      temp: '5,500°C',
      moonsCount: '8 PLANETS + 290+ MOONS',
      moonsList: 'All Major Solar Moons',
      atmo: 'Solar Wind Plasma',
      env: 'Complete Solar System perspective.',
      align: 'left'
    }
  };

  /* ---------- Planet Information HUD Controller ---------- */
  var phOverlay = document.getElementById('planet-hud');
  var phCode = document.getElementById('ph-code');
  var phName = document.getElementById('ph-name');
  var phSub = document.getElementById('ph-sub');
  var phDia = document.getElementById('ph-diameter');
  var phDist = document.getElementById('ph-distance');
  var phTemp = document.getElementById('ph-temp');
  var phMoons = document.getElementById('ph-moons');
  var phMoonsList = document.getElementById('ph-moons-list');
  var phAtmo = document.getElementById('ph-atmo');
  var phEnv = document.getElementById('ph-env');

  var lastStageName = '';

  function updatePlanetHUD(stageName, progress) {
    if (!phOverlay) return;
    var data = planetData[stageName];

    // Fade out HUD when near bottom contact hub (progress > 0.95 or stageName === 'contact')
    if (!data || progress > 0.95 || stageName === 'contact') {
      phOverlay.classList.remove('open');
      return;
    }

    if (stageName !== lastStageName) {
      lastStageName = stageName;

      if (phCode) phCode.textContent = data.code;
      if (phName) phName.textContent = data.name;
      if (phSub) phSub.textContent = data.sub;
      if (phDia) phDia.textContent = data.diameter;
      if (phDist) phDist.textContent = data.distance;
      if (phTemp) phTemp.textContent = data.temp;
      if (phMoons) phMoons.textContent = data.moonsCount;
      if (phMoonsList) phMoonsList.textContent = data.moonsList;
      if (phAtmo) phAtmo.textContent = data.atmo;
      if (phEnv) phEnv.textContent = data.env;

      if (data.align === 'right') {
        phOverlay.classList.remove('align-left');
        phOverlay.classList.add('align-right');
      } else {
        phOverlay.classList.remove('align-right');
        phOverlay.classList.add('align-left');
      }

      phOverlay.classList.add('open');
    }
  }

  /* ---------- Dynamic Telemetry Altitude HUD Controller ---------- */
  var altValEl = document.querySelector('.altitude-value');
  var altBandEl = document.querySelector('.altitude-band');

  var altitudeMap = [
    { name: 'earth-surface', val: 'ALTITUDE 0 KM', band: 'EARTH SURFACE · GÄVLE 60.6737° N' },
    { name: 'earth-city', val: 'ALTITUDE 12 KM', band: 'EARTH ATMOSPHERE · TROPOSPHERE' },
    { name: 'earth-atmosphere', val: 'ALTITUDE 100 KM', band: 'KARMAN LINE · SPACE BOUNDARY' },
    { name: 'earth-orbit', val: 'ALTITUDE 2,000 KM', band: 'LOW EARTH ORBIT · GLOBE VIEW' },
    { name: 'moon', val: 'ALTITUDE 384,400 KM', band: 'THE MOON · DEEP SPACE GATEWAY' },
    { name: 'mercury', val: 'DISTANCE 57.9M KM', band: 'MERCURY · BARREN TERRESTRIAL' },
    { name: 'venus', val: 'DISTANCE 108.2M KM', band: 'VENUS · TOXIC ATMOSPHERE' },
    { name: 'mars', val: 'DISTANCE 227.9M KM', band: 'MARS · THE RED PLANET' },
    { name: 'jupiter', val: 'DISTANCE 778.5M KM', band: 'JUPITER · GREAT RED SPOT' },
    { name: 'saturn', val: 'DISTANCE 1.43B KM', band: 'SATURN · YEAR RINGS' },
    { name: 'uranus', val: 'DISTANCE 2.87B KM', band: 'URANUS · 98° AXIAL TILT' },
    { name: 'neptune', val: 'DISTANCE 4.50B KM', band: 'NEPTUNE · FURTHER OUT' },
    { name: 'sun', val: 'SOLAR PROXIMITY 12.0M KM', band: 'THE SUN · SOLAR CORONA & PLASMA' },
    { name: 'solar-system', val: 'DISTANCE 15.0B KM', band: 'SOL SYSTEM · HELIOSPHERE RE-ENTRY' },
    { name: 'contact', val: 'GROUND STATION RELAY', band: 'SIGNAL TRANSMISSION HUB' }
  ];

  /* ---------- Active Navigation Menu Highlighter & Smooth Scroller ---------- */
  var navLinks = document.querySelectorAll('.site-menu a');
  var stageToNavHref = {
    'earth-surface': '#ground',
    'earth-city': '#earth-rise',
    'earth-atmosphere': '#earth-rise',
    'earth-orbit': '#music',
    'moon': '#news',
    'mercury': '#mercury-sec',
    'venus': '#venus-sec',
    'mars': '#mars-sec',
    'jupiter': '#jupiter-sec',
    'saturn': '#orbit',
    'uranus': '#videos-band',
    'neptune': '#deep-space',
    'sun': '#sun-sec',
    'solar-system': '#solar-sec',
    'contact': '#contact-hub'
  };

  function updateActiveNav(stageName) {
    var targetHref = stageToNavHref[stageName];
    if (!targetHref) return;
    navLinks.forEach(function (link) {
      if (link.getAttribute('href') === targetHref) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // Smooth scroll directly to section top on link click
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        var targetEl = document.querySelector(href);
        if (targetEl) {
          e.preventDefault();
          window.scrollTo({
            top: targetEl.offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  window.addEventListener('arstraumur:scrollstage', function (e) {
    var st = e.detail;
    if (!st) return;

    updatePlanetHUD(st.name, st.progress);
    updateActiveNav(st.name);

    if (st.altStr && altValEl) {
      altValEl.textContent = st.altStr;
    } else {
      var altInfo = altitudeMap.find(function (a) { return a.name === st.name; });
      if (altInfo && altValEl) altValEl.textContent = altInfo.val;
    }

    if (st.altBand && altBandEl) {
      altBandEl.textContent = st.altBand;
    } else {
      var altInfo2 = altitudeMap.find(function (a) { return a.name === st.name; });
      if (altInfo2 && altBandEl) altBandEl.textContent = altInfo2.band;
    }
  });

  /* ---------- Calm Mode & Mobile Navigation ---------- */
  var calmBtn = document.querySelector('.btn-calm');
  if (calmBtn) {
    calmBtn.addEventListener('click', function () {
      var isCalm = root.classList.toggle('calm');
      calmBtn.setAttribute('aria-pressed', isCalm ? 'true' : 'false');
      calmBtn.textContent = isCalm ? 'CALM: ON' : 'CALM: OFF';
    });
  }

  var siteNav = document.querySelector('.site-nav');
  var navToggle = document.querySelector('.nav-toggle');
  if (siteNav && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Contact Signal Transmission Form ---------- */
  var ctForm = document.querySelector('.ct-form');
  if (ctForm) {
    ctForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = ctForm.querySelector('.ct-status');
      var btn = ctForm.querySelector('.btn-submit');
      if (btn) btn.disabled = true;
      if (status) status.textContent = 'Transmitting signal to Gävle ground station...';

      setTimeout(function () {
        if (status) status.textContent = '✓ Signal received. Relay transmission confirmed.';
        ctForm.reset();
        if (btn) btn.disabled = false;
      }, 1500);
    });
  }

  /* ---------- Modal Controller ---------- */
  var modalOverlay = document.getElementById('modal-overlay');
  var modalBox = document.getElementById('modal-box');
  var modalClose = document.getElementById('modal-close');

  function openModal(htmlContent) {
    if (!modalOverlay || !modalBox) return;
    modalBox.querySelector('.modal-body').innerHTML = htmlContent;
    modalOverlay.classList.add('open');
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('open');
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  window.openModal = openModal;
})();
