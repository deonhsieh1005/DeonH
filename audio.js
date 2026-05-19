(function () {
  'use strict';

  var ctx   = null;
  var dest  = null;
  var active = false;

  var windSource = null;
  var windLfo    = null;
  var birdTimer  = null;

  function ensureCtx() {
    if (!ctx) {
      ctx  = new (window.AudioContext || window.webkitAudioContext)();
      dest = ctx.destination;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── Wind (brown noise + slow LFO swell) ───────────────────────────────────
  function startWind() {
    var bufLen = 4 * ctx.sampleRate;
    var buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data   = buf.getChannelData(0);
    var last   = 0;
    for (var i = 0; i < bufLen; i++) {
      var w = Math.random() * 2 - 1;
      last  = (last + 0.02 * w) / 1.02;
      data[i] = last * 4.0;
    }

    windSource          = ctx.createBufferSource();
    windSource.buffer   = buf;
    windSource.loop     = true;

    var lp = ctx.createBiquadFilter();
    lp.type            = 'lowpass';
    lp.frequency.value = 380;
    lp.Q.value         = 0.6;

    var masterGain      = ctx.createGain();
    masterGain.gain.value = 0.065;

    windLfo              = ctx.createOscillator();
    var lfoAmt           = ctx.createGain();
    windLfo.frequency.value = 0.07;
    lfoAmt.gain.value       = 0.022;
    windLfo.connect(lfoAmt);
    lfoAmt.connect(masterGain.gain);
    windLfo.start();

    windSource.connect(lp);
    lp.connect(masterGain);
    masterGain.connect(dest);
    windSource.start();
  }

  function stopWind() {
    if (windSource) { try { windSource.stop(); } catch (e) {} windSource = null; }
    if (windLfo)    { try { windLfo.stop();    } catch (e) {} windLfo    = null; }
  }

  // ── Bird chirps (FM sine bursts) ──────────────────────────────────────────
  function playBirdChirp() {
    if (!active || !ctx) return;
    var baseFreq = 1900 + Math.random() * 2200;
    var numNotes = 1 + Math.floor(Math.random() * 5);
    var noteDur  = 0.055 + Math.random() * 0.095;
    var noteGap  = noteDur + 0.028 + Math.random() * 0.04;
    var vol      = 0.09 + Math.random() * 0.07;

    for (var i = 0; i < numNotes; i++) {
      (function (idx) {
        var t0   = ctx.currentTime + idx * noteGap;
        var freq = baseFreq * (1 + (Math.random() - 0.5) * 0.18);
        var endF = freq * (Math.random() < 0.55 ? (1.25 + Math.random() * 0.2) : (0.72 + Math.random() * 0.1));

        var osc = ctx.createOscillator();
        var env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        osc.frequency.exponentialRampToValueAtTime(endF, t0 + noteDur);
        env.gain.setValueAtTime(0,   t0);
        env.gain.linearRampToValueAtTime(vol, t0 + noteDur * 0.28);
        env.gain.linearRampToValueAtTime(0,   t0 + noteDur);
        osc.connect(env);
        env.connect(dest);
        osc.start(t0);
        osc.stop(t0 + noteDur + 0.01);
      })(i);
    }
  }

  function scheduleBird() {
    if (!active) return;
    birdTimer = setTimeout(function () {
      if (!active) return;
      playBirdChirp();
      scheduleBird();
    }, 2800 + Math.random() * 10000);
  }

  // ── Leaves rustle (short filtered noise burst, infrequent) ────────────────
  function playRustle() {
    if (!active || !ctx) return;
    var dur    = 0.18 + Math.random() * 0.22;
    var bufLen = Math.ceil(ctx.sampleRate * (dur + 0.05));
    var buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    var data   = buf.getChannelData(0);
    for (var i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    var src  = ctx.createBufferSource();
    src.buffer = buf;

    var bp   = ctx.createBiquadFilter();
    bp.type            = 'bandpass';
    bp.frequency.value = 3200 + Math.random() * 1200;
    bp.Q.value         = 1.8;

    var env  = ctx.createGain();
    env.gain.setValueAtTime(0,    ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.03);
    env.gain.linearRampToValueAtTime(0,    ctx.currentTime + dur);

    src.connect(bp); bp.connect(env); env.connect(dest);
    src.start(); src.stop(ctx.currentTime + dur + 0.05);
  }

  function scheduleRustle() {
    if (!active) return;
    setTimeout(function () {
      if (!active) return;
      playRustle();
      scheduleRustle();
    }, 5000 + Math.random() * 18000);
  }

  // ── Start / stop ──────────────────────────────────────────────────────────
  function startNature() {
    ensureCtx();
    active = true;
    startWind();
    scheduleBird();
    scheduleRustle();
  }

  function stopNature() {
    active = false;
    clearTimeout(birdTimer);
    birdTimer = null;
    stopWind();
  }

  // ── Click / UI sounds ─────────────────────────────────────────────────────
  function playClick() {
    ensureCtx();
    var osc = ctx.createOscillator();
    var env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.1);
    env.gain.setValueAtTime(0.4, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
    osc.connect(env); env.connect(dest);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.14);
  }

  function playHover() {
    ensureCtx();
    var osc = ctx.createOscillator();
    var env = ctx.createGain();
    osc.type            = 'sine';
    osc.frequency.value = 660;
    env.gain.setValueAtTime(0.08, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    osc.connect(env); env.connect(dest);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.07);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  window.deonAudio = {
    toggle:    function () { if (active) { stopNature(); return false; } else { startNature(); return true; } },
    playClick: playClick,
    playHover: playHover,
    isPlaying: function () { return active; }
  };
})();
