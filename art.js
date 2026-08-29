(function (global) {
  "use strict";

  function tok(tokens, name, fallback) {
    return (tokens && tokens[name]) || fallback;
  }

  function hill(ctx, y, amp, seed, w, color) {
    ctx.beginPath();
    ctx.moveTo(0, y + 40);
    ctx.lineTo(0, y);
    var x = 0;
    while (x <= w) {
      var n = Math.sin((x + seed) * 0.006) * amp + Math.sin((x + seed) * 0.013) * amp * 0.45;
      ctx.lineTo(x, y + n);
      x += 28;
    }
    ctx.lineTo(w, y + 80);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function pine(ctx, x, y, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + h * 0.38, y - h * 0.18);
    ctx.lineTo(x + h * 0.22, y - h * 0.18);
    ctx.lineTo(x + h * 0.42, y);
    ctx.lineTo(x - h * 0.42, y);
    ctx.lineTo(x - h * 0.22, y - h * 0.18);
    ctx.lineTo(x - h * 0.38, y - h * 0.18);
    ctx.closePath();
    ctx.fill();
  }

  function paintWorld(ctx, opt) {
    var W = opt.w;
    var H = opt.h;
    var GROUND = opt.ground;
    var t = opt.t || 0;
    var tokens = opt.tokens || {};
    var sky = tok(tokens, "--color-sky", "#141820");
    var horizon = tok(tokens, "--color-horizon", "#6a3a18");
    var ground = tok(tokens, "--color-ground", "#2a2218");
    var road = tok(tokens, "--color-road", "#3a2c1c");
    var moon = tok(tokens, "--color-moon", "#e6c37a");
    var dust = tok(tokens, "--color-dust", "#c4a06a");
    var grass = tok(tokens, "--color-grass", "#3d4a28");
    var water = tok(tokens, "--color-water", "#2a3d44");
    var stone = tok(tokens, "--color-stone", "#3a3228");

    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, sky);
    g.addColorStop(0.42, "#1c2438");
    g.addColorStop(0.68, horizon);
    g.addColorStop(1, ground);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = moon;
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.arc(W * 0.72, 118, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(W * 0.72, 118, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = horizon;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(W * 0.735, 108, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    var i;
    ctx.fillStyle = dust;
    ctx.globalAlpha = 0.22;
    for (i = 0; i < 28; i += 1) {
      var sx = (i * 137 + 40) % W;
      var sy = 36 + ((i * 53) % 160);
      ctx.globalAlpha = 0.12 + ((i * 17) % 10) * 0.02;
      ctx.fillRect(sx, sy, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;

    hill(ctx, GROUND - 168, 26, 80, W, "#1a2230");
    hill(ctx, GROUND - 118, 22, 240, W, "#241c18");
    for (i = 0; i < 9; i += 1) {
      pine(ctx, 70 + i * 142 + (i % 2) * 18, GROUND - 108, 34 + (i % 3) * 8, "#161410");
    }
    hill(ctx, GROUND - 58, 16, 20, W, stone);

    ctx.fillStyle = water;
    ctx.globalAlpha = 0.35 + Math.sin(t * 1.4) * 0.04;
    ctx.beginPath();
    ctx.ellipse(168, GROUND - 10, 90, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = ground;
    ctx.fillRect(0, GROUND - 6, W, H - GROUND + 6);

    ctx.fillStyle = road;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 10);
    ctx.quadraticCurveTo(W / 2, GROUND - 14, W, GROUND + 12);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = tok(tokens, "--color-copper", "#8a6238");
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 28);
    ctx.quadraticCurveTo(W / 2, GROUND + 6, W, GROUND + 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 44);
    ctx.quadraticCurveTo(W / 2, GROUND + 22, W, GROUND + 46);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = grass;
    for (i = 0; i < 22; i += 1) {
      var gx = 24 + i * 58;
      var gy = GROUND + 4 + (i % 3) * 6;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx - 3, gy - 10);
      ctx.lineTo(gx + 2, gy - 5);
      ctx.lineTo(gx + 5, gy - 12);
      ctx.lineTo(gx + 3, gy);
      ctx.fill();
    }

    ctx.fillStyle = dust;
    ctx.globalAlpha = 0.18;
    for (i = 0; i < 14; i += 1) {
      ctx.beginPath();
      ctx.arc(80 + i * 86, GROUND + 38 + (i % 4) * 8, 3 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function crenel(ctx, x, y, w, n, color) {
    var step = w / n;
    ctx.fillStyle = color;
    var i;
    for (i = 0; i < n; i += 1) {
      if (i % 2 === 0) ctx.fillRect(x + i * step, y - 10, step * 0.7, 10);
    }
  }

  function paintKeep(ctx, x, facing, hp, hpMax, turret, tokens, side, t, ground) {
    var G = ground || 548;
    var color = side === 1 ? tok(tokens, "--color-player", "#d4a24a") : tok(tokens, "--color-enemy", "#c45a48");
    var deep = side === 1 ? tok(tokens, "--color-player-deep", "#7a4e22") : tok(tokens, "--color-enemy-deep", "#6a241c");
    var wood = tok(tokens, "--color-wood", "#5a3a22");
    var stone = tok(tokens, "--color-stone-2", "#4a4034");
    var ember = tok(tokens, "--color-ember", "#e07030");
    ctx.save();
    ctx.translate(x, 0);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, G + 8, 48, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = deep;
    ctx.fillRect(-36 * facing, G - 132, 58 * facing, 132);
    ctx.fillStyle = stone;
    ctx.fillRect(-28 * facing, G - 122, 42 * facing, 18);
    crenel(ctx, facing > 0 ? -36 : -22, G - 132, 58, 5, color);

    ctx.fillStyle = wood;
    ctx.fillRect(-10 * facing, G - 52, 18 * facing, 36);
    ctx.fillStyle = color;
    ctx.fillRect(-8 * facing, G - 48, 6 * facing, 10);

    ctx.fillStyle = deep;
    ctx.fillRect(10 * facing, G - 168, 20 * facing, 50);
    crenel(ctx, facing > 0 ? 10 : -30, G - 168, 20, 3, color);

    ctx.fillStyle = color;
    ctx.fillRect(16 * facing, G - 210, 4 * facing, 44);
    ctx.beginPath();
    ctx.moveTo(18 * facing, G - 210);
    ctx.lineTo(40 * facing, G - 198);
    ctx.lineTo(18 * facing, G - 186);
    ctx.closePath();
    ctx.fill();

    var flicker = 0.65 + Math.sin((t || 0) * 14 + x) * 0.25;
    ctx.fillStyle = ember;
    ctx.globalAlpha = flicker;
    ctx.beginPath();
    ctx.arc(-18 * facing, G - 98, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.2 * flicker;
    ctx.beginPath();
    ctx.arc(-18 * facing, G - 98, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (turret > 0) {
      ctx.fillStyle = stone;
      ctx.fillRect(-6 * facing, G - 188, 14 * facing, 22);
      ctx.fillStyle = color;
      ctx.fillRect(-2 * facing, G - 196, 18 * facing, 4);
    }

    ctx.restore();

    var ratio = hpMax ? hp / hpMax : 0;
    ctx.fillStyle = tok(tokens, "--color-paper-3", "#2a2620");
    ctx.fillRect(x - 40, G - 226, 80, 7);
    ctx.fillStyle = ratio < 0.34 ? tok(tokens, "--color-hp-low", "#c44") : tok(tokens, "--color-hp", "#6c9a4a");
    ctx.fillRect(x - 40, G - 226, 80 * ratio, 7);
  }

  function metalForAge(age, tokens) {
    if (age >= 2) return tok(tokens, "--color-steel", "#d8d2c4");
    if (age >= 1) return tok(tokens, "--color-iron", "#8a9098");
    return tok(tokens, "--color-bronze", "#c48a3a");
  }

  function paintGlyphBody(ctx, type, color, deep, metal) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    function legs(spread) {
      ctx.fillStyle = deep;
      ctx.fillRect(-5, -8, 4, 10);
      ctx.fillRect(spread, -8, 4, 10);
    }
    function torso() {
      ctx.fillStyle = deep;
      ctx.fillRect(-6, -24, 12, 16);
    }
    function head(helmet) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -30, 5.2, 0, Math.PI * 2);
      ctx.fill();
      if (helmet) {
        ctx.fillStyle = metal;
        ctx.fillRect(-6, -34, 12, 4);
      }
    }

    if (type === "rider") {
      ctx.fillStyle = deep;
      ctx.beginPath();
      ctx.ellipse(-2, -6, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-14, -4, 3, 10);
      ctx.fillRect(8, -4, 3, 10);
      ctx.fillRect(-18, -12, 8, 6);
      ctx.fillStyle = color;
      ctx.fillRect(-4, -22, 8, 12);
      ctx.beginPath();
      ctx.arc(-1, -26, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = metal;
      ctx.fillRect(6, -20, 14, 2);
      return;
    }
    if (type === "ram") {
      ctx.fillStyle = deep;
      ctx.fillRect(-20, -14, 38, 10);
      ctx.fillStyle = metal;
      ctx.beginPath();
      ctx.arc(20, -9, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(-10, -2, 5, 0, Math.PI * 2);
      ctx.arc(8, -2, 5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (type === "ballista") {
      ctx.fillStyle = deep;
      ctx.fillRect(-14, -10, 26, 8);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(-8, -1, 4, 0, Math.PI * 2);
      ctx.arc(8, -1, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = metal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(10, -18, 12, -0.9, 0.9);
      ctx.stroke();
      ctx.fillStyle = metal;
      ctx.fillRect(4, -20, 16, 2);
      return;
    }

    legs(type === "shield" ? 3 : 2);
    torso();
    head(type !== "sling" && type !== "scout");

    ctx.fillStyle = metal;
    if (type === "spear") {
      ctx.fillRect(4, -36, 2, 28);
      ctx.beginPath();
      ctx.moveTo(5, -40);
      ctx.lineTo(9, -32);
      ctx.lineTo(1, -32);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(-8, -16, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === "sling") {
      ctx.strokeStyle = metal;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(6, -22);
      ctx.quadraticCurveTo(16, -34, 12, -14);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(13, -14, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === "scout") {
      ctx.fillStyle = deep;
      ctx.beginPath();
      ctx.moveTo(-4, -24);
      ctx.lineTo(14, -10);
      ctx.lineTo(-4, -8);
      ctx.fill();
      ctx.fillStyle = metal;
      ctx.fillRect(6, -16, 12, 2);
    } else if (type === "shield") {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(-8, -16, 8, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = metal;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (type === "archer") {
      ctx.strokeStyle = metal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(10, -20, 11, -1, 1);
      ctx.stroke();
      ctx.fillRect(4, -21, 14, 1.6);
    } else if (type === "banner") {
      ctx.fillRect(6, -50, 3, 36);
      ctx.fillStyle = color;
      ctx.fillRect(9, -50, 16, 12);
      ctx.fillStyle = metal;
      ctx.fillRect(11, -47, 10, 3);
    } else {
      ctx.fillRect(4, -28, 16, 2);
    }
  }

  function paintUnit(ctx, unit, def, tokens, elapsed) {
    var color = unit.side === 1 ? tok(tokens, "--color-player", "#d4a24a") : tok(tokens, "--color-enemy", "#c45a48");
    var deep = unit.side === 1 ? tok(tokens, "--color-player-deep", "#7a4e22") : tok(tokens, "--color-enemy-deep", "#6a241c");
    var metal = metalForAge(def.age, tokens);
    var bob = unit.walking ? Math.sin(elapsed * 10 + unit.x * 0.05) * 1.5 : 0;
    ctx.save();
    ctx.translate(unit.x, unit.y + bob);
    ctx.scale(unit.side * 2.15, 2.15);
    paintGlyphBody(ctx, unit.type, color, deep, metal);
    ctx.restore();
    var ratio = unit.hp / unit.hpMax;
    ctx.fillStyle = tok(tokens, "--color-paper-3", "#2a2620");
    ctx.fillRect(unit.x - 16, unit.y - 66, 32, 3);
    ctx.fillStyle = ratio < 0.35 ? tok(tokens, "--color-hp-low", "#c44") : tok(tokens, "--color-hp", "#6c9a4a");
    ctx.fillRect(unit.x - 16, unit.y - 66, 32 * ratio, 3);
  }

  function paintShot(ctx, s, tokens) {
    var accent = tok(tokens, "--color-accent", "#e0b15a");
    var ember = tok(tokens, "--color-ember", "#e07030");
    if (s.trail && s.trail.length > 1) {
      var i;
      for (i = 0; i < s.trail.length - 1; i += 1) {
        var a = s.trail[i];
        var b = s.trail[i + 1];
        ctx.strokeStyle = ember;
        ctx.globalAlpha = 0.15 + (i / s.trail.length) * 0.45;
        ctx.lineWidth = 1.2 + (i / s.trail.length) * 1.8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.atan2(s.vy, s.vx));
    ctx.fillStyle = accent;
    ctx.fillRect(-7, -1.1, 12, 2.2);
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(2, -3);
    ctx.lineTo(2, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ember;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(-6, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function paintGlyph(canvas, type, tokens, side) {
    if (!canvas) return;
    var c = canvas.getContext("2d");
    var w = canvas.width;
    var h = canvas.height;
    c.clearRect(0, 0, w, h);
    var color = side === -1 ? tok(tokens, "--color-enemy", "#c45a48") : tok(tokens, "--color-player", "#d4a24a");
    var deep = side === -1 ? tok(tokens, "--color-enemy-deep", "#6a241c") : tok(tokens, "--color-player-deep", "#7a4e22");
    var ages = { spear: 0, sling: 0, scout: 0, shield: 1, archer: 1, rider: 1, ram: 2, ballista: 2, banner: 2 };
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.translate(w * 0.5, h * 0.82);
    c.scale(1.45, 1.45);
    paintGlyphBody(c, type, color, deep, metalForAge(ages[type] || 0, tokens));
  }

  function paintCmdGlyph(canvas, cmd, tokens) {
    if (!canvas) return;
    var c = canvas.getContext("2d");
    var w = canvas.width;
    var h = canvas.height;
    var metal = tok(tokens, "--color-bronze", "#c48a3a");
    c.clearRect(0, 0, w, h);
    c.strokeStyle = metal;
    c.fillStyle = metal;
    c.lineWidth = 2;
    c.lineJoin = "round";
    if (cmd === "age") {
      c.beginPath();
      c.moveTo(w * 0.28, h * 0.7);
      c.lineTo(w * 0.5, h * 0.28);
      c.lineTo(w * 0.72, h * 0.7);
      c.closePath();
      c.stroke();
      c.fillRect(w * 0.46, h * 0.62, w * 0.08, h * 0.14);
    } else if (cmd === "turret") {
      c.fillRect(w * 0.36, h * 0.42, w * 0.28, h * 0.36);
      c.fillRect(w * 0.3, h * 0.34, w * 0.4, h * 0.08);
      c.fillRect(w * 0.54, h * 0.24, w * 0.22, h * 0.06);
    } else if (cmd === "horn") {
      c.beginPath();
      c.moveTo(w * 0.28, h * 0.38);
      c.quadraticCurveTo(w * 0.7, h * 0.2, w * 0.72, h * 0.58);
      c.quadraticCurveTo(w * 0.48, h * 0.7, w * 0.28, h * 0.58);
      c.closePath();
      c.stroke();
    } else {
      c.beginPath();
      c.moveTo(w * 0.28, h * 0.32);
      c.lineTo(w * 0.7, h * 0.5);
      c.lineTo(w * 0.28, h * 0.4);
      c.fill();
      c.beginPath();
      c.moveTo(w * 0.32, h * 0.5);
      c.lineTo(w * 0.68, h * 0.66);
      c.lineTo(w * 0.32, h * 0.58);
      c.fill();
    }
  }

  function paintTitle(canvas, tokens, t) {
    if (!canvas) return;
    var dw = Math.max(1, window.innerWidth);
    var dh = Math.max(1, window.innerHeight);
    if (canvas.width !== dw || canvas.height !== dh) {
      canvas.width = dw;
      canvas.height = dh;
    }
    var ctx = canvas.getContext("2d");
    var W = 1280;
    var H = 720;
    var GROUND = 548;
    var scale = dw / W;
    var oy = dh - H * scale;
    if (oy < 0) {
      scale = dh / H;
      oy = 0;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = tok(tokens, "--color-sky", "#141820");
    ctx.fillRect(0, 0, dw, dh);
    ctx.setTransform(scale, 0, 0, scale, 0, oy);
    paintWorld(ctx, { w: W, h: H, ground: GROUND, t: t, tokens: tokens });
    paintKeep(ctx, 90, 1, 1, 1, 1, tokens, 1, t, GROUND);
    paintKeep(ctx, 1190, -1, 1, 1, 1, tokens, -1, t, GROUND);
  }

  global.BronzeArt = {
    paintWorld: paintWorld,
    paintKeep: paintKeep,
    paintUnit: paintUnit,
    paintShot: paintShot,
    paintGlyph: paintGlyph,
    paintCmdGlyph: paintCmdGlyph,
    paintTitle: paintTitle
  };
})(window);
