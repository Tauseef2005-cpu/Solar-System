/* ============================================================
   Árstraumur — Web Audio Ambient Synth & Audio Player
   Procedural ambient synth pads, real-time waveform visualizer,
   playlist track selector, and volume controls.
   ============================================================ */

(function () {
  'use strict';

  var playlist = [
    { title: "Aurora III (feat. Vince Clarke)", sub: "Single · 2025", baseFreq: 110.0 }, // A2
    { title: "Europa Clipper", sub: "Deep Space Travellers · 2024", baseFreq: 130.81 }, // C3
    { title: "Cassini (feat. vi/de)", sub: "Deep Space Travellers · 2024", baseFreq: 146.83 }, // D3
    { title: "Viking 2", sub: "Airwaves · 2024", baseFreq: 98.0 }, // G2
    { title: "Airwaves Part 3", sub: "Airwaves · 2024", baseFreq: 164.81 } // E3
  ];

  var currentTrackIndex = 0;
  var isPlaying = false;
  var audioCtx = null;
  var masterGain = null;
  var osc1 = null, osc2 = null, filter = null, lfo = null;
  var analyser = null;
  var visualizerCanvas = document.getElementById('ap-visualizer');
  var vCtx = visualizerCanvas ? visualizerCanvas.getContext('2d') : null;
  var animFrameId = null;

  var playBtn = document.getElementById('ap-play');
  var trackTitleEl = document.getElementById('ap-title');
  var artistEl = document.getElementById('ap-artist');
  var volumeSlider = document.getElementById('ap-volume');

  function initAudioContext() {
    if (audioCtx) return;
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = volumeSlider ? parseFloat(volumeSlider.value) : 0.7;

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 32;

    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  function startSynth(freq) {
    if (!audioCtx) initAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    stopSynth();

    /* Dual Detuned Oscillators for Lush Ambient Pad */
    osc1 = audioCtx.createOscillator();
    osc2 = audioCtx.createOscillator();
    filter = audioCtx.createBiquadFilter();
    lfo = audioCtx.createOscillator();
    var lfoGain = audioCtx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.501; // Perfect Fifth detune

    filter.type = 'lowpass';
    filter.frequency.value = 450;

    lfo.type = 'sine';
    lfo.frequency.value = 0.2; // Slow ambient sweep
    lfoGain.gain.value = 150;

    lfo.connect(filter.frequency);
    osc1.connect(filter);
    osc2.connect(filter);

    var voiceGain = audioCtx.createGain();
    voiceGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    voiceGain.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 1.5);

    filter.connect(voiceGain);
    voiceGain.connect(masterGain);

    osc1.start();
    osc2.start();
    lfo.start();
  }

  function stopSynth() {
    if (osc1) { try { osc1.stop(); osc1.disconnect(); } catch (e) {} osc1 = null; }
    if (osc2) { try { osc2.stop(); osc2.disconnect(); } catch (e) {} osc2 = null; }
    if (lfo) { try { lfo.stop(); lfo.disconnect(); } catch (e) {} lfo = null; }
  }

  function updateTrackDisplay() {
    var track = playlist[currentTrackIndex];
    if (trackTitleEl) trackTitleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.sub;
  }

  function togglePlay() {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack(currentTrackIndex);
    }
  }

  function playTrack(index) {
    currentTrackIndex = index;
    isPlaying = true;
    updateTrackDisplay();
    startSynth(playlist[index].baseFreq);
    if (playBtn) {
      playBtn.setAttribute('aria-label', 'Pause');
      playBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    }
    renderVisualizer();
  }

  function pauseTrack() {
    isPlaying = false;
    stopSynth();
    if (playBtn) {
      playBtn.setAttribute('aria-label', 'Play');
      playBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    }
    if (animFrameId) cancelAnimationFrame(animFrameId);
    clearVisualizer();
  }

  function renderVisualizer() {
    if (!vCtx || !analyser) return;
    var dataArray = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      if (!isPlaying) return;
      animFrameId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      vCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
      var barWidth = (visualizerCanvas.width / dataArray.length) * 1.5;
      var x = 0;

      for (var i = 0; i < dataArray.length; i++) {
        var barHeight = (dataArray[i] / 255) * visualizerCanvas.height * 0.85 + 2;
        vCtx.fillStyle = '#8fc7a4';
        vCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    }
    draw();
  }

  function clearVisualizer() {
    if (!vCtx) return;
    vCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    vCtx.fillStyle = 'rgba(143, 199, 164, 0.25)';
    vCtx.fillRect(0, visualizerCanvas.height - 2, visualizerCanvas.width, 2);
  }

  if (playBtn) playBtn.addEventListener('click', togglePlay);

  if (volumeSlider) {
    volumeSlider.addEventListener('input', function () {
      if (masterGain && audioCtx) {
        masterGain.gain.value = parseFloat(volumeSlider.value);
      }
    });
  }

  /* Listen to external play requests from cards */
  window.addEventListener('arstraumur:playtrack', function (e) {
    var title = e.detail ? e.detail.title : null;
    var foundIndex = playlist.findIndex(function (t) { return t.title.toLowerCase().indexOf(title.toLowerCase()) !== -1; });
    playTrack(foundIndex !== -1 ? foundIndex : 0);
  });

  updateTrackDisplay();
  clearVisualizer();
})();
