(function (global) {
  "use strict";

  var audio = {
    ctx: null,
    mute: false,
    master: null,
    sfx: null,
    music: null,
    bedNodes: null,
    bedMode: null,
    drumTimer: null
  };

  function ensure() {
    if (audio.mute) return null;
    if (audio.ctx) {
      if (audio.ctx.state === "suspended") audio.ctx.resume();
      return audio.ctx;
    }
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    audio.ctx = new AC();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.9;
    audio.master.connect(audio.ctx.destination);
    audio.sfx = audio.ctx.createGain();
    audio.sfx.gain.value = 0.85;
    audio.sfx.connect(audio.master);
    audio.music = audio.ctx.createGain();
    audio.music.gain.value = 0.22;
    audio.music.connect(audio.master);
    return audio.ctx;
  }

  function now() {
    return audio.ctx ? audio.ctx.currentTime : 0;
  }

  function envGain(gainNode, peak, attack, hold, release, t0) {
    var g = gainNode.gain;
    g.cancelScheduledValues(t0);
    g.setValueAtTime(0.0001, t0);
    g.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
    g.setValueAtTime(Math.max(0.0002, peak), t0 + attack + hold);
    g.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
  }

  function tone(freq, dur, type, peak, dest, slideTo) {
    var ctx = ensure();
    if (!ctx) return;
    var t0 = now();
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || "triangle";
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    }
    envGain(g, peak || 0.04, 0.01, Math.max(0.01, dur * 0.25), Math.max(0.04, dur * 0.7), t0);
    osc.connect(g);
    g.connect(dest || audio.sfx);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, peak, hpHz, dest) {
    var ctx = ensure();
    if (!ctx) return;
    var t0 = now();
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var i;
    for (i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = hpHz || 800;
    filter.Q.value = 0.7;
    var g = ctx.createGain();
    envGain(g, peak || 0.05, 0.005, 0.01, Math.max(0.03, dur * 0.85), t0);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest || audio.sfx);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  function stopBed() {
    if (audio.drumTimer) {
      clearInterval(audio.drumTimer);
      audio.drumTimer = null;
    }
    if (!audio.bedNodes) {
      audio.bedMode = null;
      return;
    }
    var t0 = now();
    try {
      audio.bedNodes.forEach(function (n) {
        if (n.gain) {
          n.gain.gain.cancelScheduledValues(t0);
          n.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
        }
        if (n.stop) setTimeout(function () { try { n.stop(); } catch (e) {} }, 500);
        if (n.disconnect) setTimeout(function () { try { n.disconnect(); } catch (e) {} }, 520);
      });
    } catch (err) {}
    audio.bedNodes = null;
    audio.bedMode = null;
  }

  function startBed(mode) {
    var ctx = ensure();
    if (!ctx) return;
    if (audio.bedMode === mode && audio.bedNodes) return;
    stopBed();
    audio.bedMode = mode;
    var nodes = [];
    var t0 = now();
    var droneA = ctx.createOscillator();
    var droneB = ctx.createOscillator();
    var gA = ctx.createGain();
    var gB = ctx.createGain();
    droneA.type = "sine";
    droneB.type = "sine";
    droneA.frequency.value = mode === "battle" ? 55 : 46;
    droneB.frequency.value = mode === "battle" ? 82.5 : 69;
    gA.gain.setValueAtTime(0.0001, t0);
    gB.gain.setValueAtTime(0.0001, t0);
    gA.gain.exponentialRampToValueAtTime(mode === "battle" ? 0.035 : 0.02, t0 + 1.2);
    gB.gain.exponentialRampToValueAtTime(mode === "battle" ? 0.018 : 0.012, t0 + 1.4);
    droneA.connect(gA);
    droneB.connect(gB);
    gA.connect(audio.music);
    gB.connect(audio.music);
    droneA.start(t0);
    droneB.start(t0);
    nodes.push(droneA, droneB, { gain: gA }, { gain: gB });

    var windLen = Math.floor(ctx.sampleRate * 2);
    var windBuf = ctx.createBuffer(1, windLen, ctx.sampleRate);
    var windData = windBuf.getChannelData(0);
    var i;
    for (i = 0; i < windLen; i += 1) windData[i] = (Math.random() * 2 - 1) * 0.4;
    var wind = ctx.createBufferSource();
    wind.buffer = windBuf;
    wind.loop = true;
    var windFilter = ctx.createBiquadFilter();
    windFilter.type = "lowpass";
    windFilter.frequency.value = mode === "battle" ? 420 : 280;
    var windGain = ctx.createGain();
    windGain.gain.value = mode === "battle" ? 0.012 : 0.008;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(audio.music);
    wind.start(t0);
    nodes.push(wind, { gain: windGain });

    if (mode === "battle") {
      var pulse = ctx.createOscillator();
      var pulseGain = ctx.createGain();
      pulse.type = "triangle";
      pulse.frequency.value = 110;
      pulseGain.gain.value = 0.0001;
      pulse.connect(pulseGain);
      pulseGain.connect(audio.music);
      pulse.start(t0);
      nodes.push(pulse, { gain: pulseGain });
      audio.drumTimer = setInterval(function () {
        if (audio.mute || audio.bedMode !== "battle") return;
        var peak = 0.018 + Math.random() * 0.01;
        tone(70 + Math.random() * 18, 0.18, "sine", peak, audio.music, 42);
        noiseBurst(0.08, peak * 0.6, 180, audio.music);
      }, 2200 + Math.floor(Math.random() * 900));
    }

    audio.bedNodes = nodes;
  }

  function setMute(on) {
    audio.mute = !!on;
    if (audio.mute) stopBed();
    else if (audio.bedMode) {
      var mode = audio.bedMode;
      audio.bedMode = null;
      startBed(mode);
    }
  }

  function isMute() {
    return !!audio.mute;
  }

  function resume() {
    ensure();
  }

  var SFX = {
    ui: function () {
      tone(520, 0.05, "triangle", 0.02);
    },
    recruit: function (age) {
      noiseBurst(0.05, 0.04, 700);
      tone(160 + (age || 0) * 30, 0.09, "triangle", 0.045, null, 90);
    },
    melee: function () {
      noiseBurst(0.045, 0.055, 420);
      tone(95, 0.08, "square", 0.03, null, 55);
    },
    shot: function () {
      noiseBurst(0.07, 0.035, 1400);
      tone(880, 0.06, "sawtooth", 0.012, null, 220);
    },
    hit: function () {
      tone(140, 0.05, "triangle", 0.028, null, 70);
      noiseBurst(0.03, 0.03, 900);
    },
    death: function (ally) {
      tone(ally ? 90 : 150, 0.12, "sawtooth", 0.035, null, 40);
      noiseBurst(0.1, 0.04, 300);
    },
    baseHit: function () {
      tone(60, 0.14, "sine", 0.04, null, 36);
      noiseBurst(0.08, 0.035, 200);
    },
    age: function () {
      tone(180, 0.22, "triangle", 0.04);
      setTimeout(function () { tone(270, 0.28, "triangle", 0.035); }, 90);
      setTimeout(function () { tone(360, 0.35, "sine", 0.03); }, 180);
    },
    turret: function () {
      noiseBurst(0.06, 0.04, 250);
      tone(120, 0.12, "triangle", 0.035, null, 70);
    },
    horn: function () {
      tone(110, 0.55, "sawtooth", 0.05, null, 70);
      setTimeout(function () { tone(165, 0.45, "sawtooth", 0.035, null, 95); }, 40);
      setTimeout(function () { tone(220, 0.35, "triangle", 0.025); }, 120);
    },
    volley: function () {
      var i;
      for (i = 0; i < 5; i += 1) {
        (function (n) {
          setTimeout(function () {
            noiseBurst(0.08, 0.04, 1100 - n * 80);
            tone(340 - n * 30, 0.1, "square", 0.02, null, 120);
          }, n * 45);
        })(i);
      }
    },
    win: function () {
      tone(262, 0.16, "triangle", 0.04);
      setTimeout(function () { tone(330, 0.18, "triangle", 0.038); }, 110);
      setTimeout(function () { tone(392, 0.28, "triangle", 0.042); }, 230);
      setTimeout(function () { tone(523, 0.4, "sine", 0.03); }, 380);
    },
    lose: function () {
      tone(196, 0.25, "sawtooth", 0.04, null, 110);
      setTimeout(function () { tone(147, 0.35, "sawtooth", 0.035, null, 80); }, 160);
      setTimeout(function () { tone(98, 0.5, "sine", 0.03); }, 320);
    },
    deny: function () {
      tone(180, 0.08, "square", 0.02, null, 110);
    }
  };

  global.BronzeAudio = {
    ensure: ensure,
    resume: resume,
    setMute: setMute,
    isMute: isMute,
    startBed: startBed,
    stopBed: stopBed,
    sfx: SFX
  };
})(window);
