(function () {
  "use strict";

  var STORAGE_KEY = "bronze-front-v1";
  var W = 1100;
  var H = 420;
  var GROUND = 318;
  var PLAYER_BASE_X = 78;
  var ENEMY_BASE_X = 1022;
  var LANE_Y = [292, 308, 324];

  var UNIT_DEFS = {
    spear:    { name: "矛兵", age: 0, cost: 15,  hp: 40,  atk: 7,  range: 22,  speed: 42, reload: 0.72, kind: "melee", siege: 1 },
    sling:    { name: "投石", age: 0, cost: 22,  hp: 24,  atk: 7,  range: 108, speed: 36, reload: 0.95, kind: "range", siege: 0.7 },
    scout:    { name: "斥候", age: 0, cost: 28,  hp: 32,  atk: 11, range: 20,  speed: 68, reload: 0.62, kind: "melee", siege: 0.8 },
    shield:   { name: "重盾", age: 1, cost: 48,  hp: 110, atk: 13, range: 24,  speed: 30, reload: 0.85, kind: "melee", siege: 1 },
    archer:   { name: "弓手", age: 1, cost: 55,  hp: 34,  atk: 13, range: 142, speed: 38, reload: 0.88, kind: "range", siege: 0.75 },
    rider:    { name: "騎手", age: 1, cost: 78,  hp: 62,  atk: 20, range: 22,  speed: 78, reload: 0.7,  kind: "melee", siege: 0.9 },
    ram:      { name: "攻城槌", age: 2, cost: 120, hp: 170, atk: 16, range: 26,  speed: 24, reload: 1.05, kind: "melee", siege: 3.2 },
    ballista: { name: "連弩", age: 2, cost: 140, hp: 52,  atk: 24, range: 188, speed: 28, reload: 1.15, kind: "range", siege: 1.4 },
    banner:   { name: "旗手", age: 2, cost: 190, hp: 175, atk: 30, range: 26,  speed: 44, reload: 0.68, kind: "melee", siege: 1.2 }
  };

  var UNIT_ORDER = ["spear", "sling", "scout", "shield", "archer", "rider", "ram", "ballista", "banner"];
  var AGE_NAMES = ["銅器", "鐵器", "鑄鋼"];
  var AGE_COST = [0, 260, 620];
  var TURRET_COST = [0, 90, 200, 420];
  var TURRET_STATS = [
    { dmg: 6, range: 150, reload: 1.15 },
    { dmg: 11, range: 175, reload: 0.95 },
    { dmg: 18, range: 200, reload: 0.8 },
    { dmg: 28, range: 230, reload: 0.68 }
  ];

  var BATTLES = [
    { name: "河岸斥候", blurb: "敵軍只會出銅器。先學會存錢再推。", playerGold: 95, playerIncome: 9, playerHp: 440, enemyGold: 28, enemyIncome: 4.4, enemyHp: 340, enemyMaxAge: 0, enemyStartAge: 0, enemyAgeAt: 999, aiGap: 1.15, aiSave: 0.22 },
    { name: "渡口爭奪", blurb: "對面上投石了。用斥候繞、用矛兵頂。", playerGold: 90, playerIncome: 9.2, playerHp: 460, enemyGold: 40, enemyIncome: 5.4, enemyHp: 380, enemyMaxAge: 0, enemyStartAge: 0, enemyAgeAt: 999, aiGap: 1.02, aiSave: 0.18 },
    { name: "丘陵營地", blurb: "敵營較厚。這場開始要考慮升鐵器。", playerGold: 100, playerIncome: 9.6, playerHp: 480, enemyGold: 55, enemyIncome: 6.2, enemyHp: 460, enemyMaxAge: 0, enemyStartAge: 0, enemyAgeAt: 999, aiGap: 0.95, aiSave: 0.16 },
    { name: "鐵器初現", blurb: "對方會升到鐵器。你的年代不能落後太久。", playerGold: 110, playerIncome: 10, playerHp: 500, enemyGold: 90, enemyIncome: 7.2, enemyHp: 520, enemyMaxAge: 1, enemyStartAge: 0, enemyAgeAt: 18, aiGap: 0.84, aiSave: 0.14 },
    { name: "關隘夜襲", blurb: "進帳更快，雙方都在搶節奏。", playerGold: 120, playerIncome: 10.6, playerHp: 520, enemyGold: 120, enemyIncome: 8.2, enemyHp: 560, enemyMaxAge: 1, enemyStartAge: 1, enemyAgeAt: 36, aiGap: 0.76, aiSave: 0.12 },
    { name: "鑄鋼對峙", blurb: "敵方會摸到鑄鋼。攻城槌是拆營的刀。", playerGold: 130, playerIncome: 11, playerHp: 560, enemyGold: 160, enemyIncome: 9.0, enemyHp: 640, enemyMaxAge: 2, enemyStartAge: 1, enemyAgeAt: 28, aiGap: 0.7, aiSave: 0.12 },
    { name: "攻城前夜", blurb: "厚營、連弩、旗手。亂出會被射穿。", playerGold: 140, playerIncome: 11.6, playerHp: 600, enemyGold: 200, enemyIncome: 12.4, enemyHp: 760, enemyMaxAge: 2, enemyStartAge: 1, enemyAgeAt: 20, aiGap: 0.64, aiSave: 0.1 },
    { name: "王庭決戰", blurb: "最後一場。對方幾乎不手軟。", playerGold: 160, playerIncome: 12.2, playerHp: 680, enemyGold: 280, enemyIncome: 13.8, enemyHp: 880, enemyMaxAge: 2, enemyStartAge: 2, enemyAgeAt: 12, aiGap: 0.52, aiSave: 0.06 }
  ];

  var canvas = document.getElementById("field");
  var ctx = canvas.getContext("2d");
  var tokens = {};
  var state = null;
  var raf = 0;
  var lastTs = 0;
  var audio = { ctx: null, mute: false };
  var flashTimers = {};

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { unlocked: 1, mute: false };
      var data = JSON.parse(raw);
      return {
        unlocked: Math.max(1, Math.min(8, Number(data.unlocked) || 1)),
        mute: !!data.mute
      };
    } catch (err) {
      return { unlocked: 1, mute: false };
    }
  }

  function saveProgress(extra) {
    var cur = loadProgress();
    var next = {
      unlocked: extra && extra.unlocked != null ? extra.unlocked : cur.unlocked,
      mute: extra && extra.mute != null ? extra.mute : audio.mute
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function readTokens() {
    var styles = getComputedStyle(document.documentElement);
    [
      "--color-paper", "--color-paper-2", "--color-paper-3", "--color-ink",
      "--color-ink-2", "--color-muted", "--color-accent", "--color-accent-ink",
      "--color-sky", "--color-horizon", "--color-ground", "--color-road",
      "--color-player", "--color-player-deep", "--color-enemy", "--color-enemy-deep",
      "--color-hp", "--color-hp-low", "--color-ok", "--color-bad", "--font-display",
      "--font-body"
    ].forEach(function (name) {
      tokens[name] = styles.getPropertyValue(name).trim();
    });
  }

  function ensureAudio() {
    if (audio.ctx || audio.mute) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio.ctx = new AC();
  }

  function beep(freq, dur, type, gain) {
    if (audio.mute) return;
    ensureAudio();
    if (!audio.ctx) return;
    var now = audio.ctx.currentTime;
    var osc = audio.ctx.createOscillator();
    var g = audio.ctx.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(gain || 0.035, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g);
    g.connect(audio.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  }

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function availableUnits(age) {
    return UNIT_ORDER.filter(function (id) {
      return UNIT_DEFS[id].age <= age;
    });
  }

  function createBattle(index) {
    var spec = BATTLES[index];
    return {
      index: index,
      spec: spec,
      gold: spec.playerGold,
      income: spec.playerIncome,
      php: spec.playerHp,
      phpMax: spec.playerHp,
      ehp: spec.enemyHp,
      ehpMax: spec.enemyHp,
      egold: spec.enemyGold,
      eincome: spec.enemyIncome,
      age: 0,
      eage: spec.enemyStartAge || 0,
      turret: 0,
      eturret: 0,
      units: [],
      shots: [],
      parts: [],
      floats: [],
      horn: 0,
      hornCd: 0,
      volleyCd: 0,
      pReload: 0,
      eReload: 0,
      aiWait: 1.2,
      elapsed: 0,
      over: null,
      paused: false,
      hint: "金幣會自己長。先出兩三個矛兵頂住。"
    };
  }

  function spawn(side, typeId, jitter) {
    var def = UNIT_DEFS[typeId];
    var lane = LANE_Y[(state.units.length + (jitter || 0)) % LANE_Y.length];
    state.units.push({
      id: uid(),
      side: side,
      type: typeId,
      x: side === 1 ? PLAYER_BASE_X + 54 : ENEMY_BASE_X - 54,
      y: lane,
      hp: def.hp,
      hpMax: def.hp,
      cd: 0,
      walking: true
    });
  }

  function tryRecruit(typeId) {
    if (!state || state.over) return false;
    var def = UNIT_DEFS[typeId];
    if (def.age > state.age) {
      flash("unit-" + typeId, "error", "這個單位要先升年代。");
      return false;
    }
    if (state.gold < def.cost) {
      flash("unit-" + typeId, "error", "金幣不夠，再等一下。");
      return false;
    }
    state.gold -= def.cost;
    spawn(1, typeId, Math.floor(Math.random() * 3));
    flash("unit-" + typeId, "success", "");
    beep(320 + def.age * 40, 0.07, "square", 0.03);
    return true;
  }

  function tryAge() {
    if (!state || state.over) return false;
    if (state.age >= 2) {
      flash("cmd-age", "error", "已經是鑄鋼。");
      return false;
    }
    var cost = AGE_COST[state.age + 1];
    if (state.gold < cost) {
      flash("cmd-age", "error", "升年代還差 " + Math.ceil(cost - state.gold) + " 金。");
      return false;
    }
    state.gold -= cost;
    state.age += 1;
    flash("cmd-age", "success", "進入" + AGE_NAMES[state.age] + "。舊兵仍可出。");
    beep(180, 0.16, "sawtooth", 0.04);
    beep(260, 0.18, "triangle", 0.03);
    return true;
  }

  function tryTurret() {
    if (!state || state.over) return false;
    if (state.turret >= 3) {
      flash("cmd-turret", "error", "砲塔已經升滿。");
      return false;
    }
    var cost = TURRET_COST[state.turret + 1];
    if (state.gold < cost) {
      flash("cmd-turret", "error", "砲塔還差 " + Math.ceil(cost - state.gold) + " 金。");
      return false;
    }
    state.gold -= cost;
    state.turret += 1;
    flash("cmd-turret", "success", "砲塔改到 " + (state.turret + 1) + " 級。");
    beep(140, 0.12, "triangle", 0.04);
    return true;
  }

  function tryHorn() {
    if (!state || state.over) return false;
    if (state.hornCd > 0) {
      flash("cmd-horn", "error", "戰號還在冷卻。");
      return false;
    }
    state.horn = 8;
    state.hornCd = 26;
    flash("cmd-horn", "success", "戰號響起，己方傷害提高。");
    beep(90, 0.28, "sawtooth", 0.05);
    return true;
  }

  function tryVolley() {
    if (!state || state.over) return false;
    if (state.age < 1) {
      flash("cmd-volley", "error", "火箭要鐵器才有。");
      return false;
    }
    if (state.volleyCd > 0) {
      flash("cmd-volley", "error", "火箭還在冷卻。");
      return false;
    }
    state.volleyCd = 38;
    var dmg = 28 + state.age * 10;
    state.units.forEach(function (u) {
      if (u.side === -1 && u.x > 360 && u.x < 760) {
        hurtUnit(u, dmg, 1);
      }
    });
    for (var i = 0; i < 18; i += 1) {
      state.parts.push({
        x: 380 + Math.random() * 360,
        y: 210 + Math.random() * 90,
        vx: (Math.random() - 0.5) * 40,
        vy: 40 + Math.random() * 80,
        life: 0.45 + Math.random() * 0.3,
        color: tokens["--color-accent"]
      });
    }
    flash("cmd-volley", "success", "火箭落到中段。");
    beep(420, 0.09, "square", 0.04);
    beep(210, 0.14, "sawtooth", 0.03);
    return true;
  }

  function flash(id, kind, msg) {
    if (msg) {
      state.hint = msg;
      var hint = document.getElementById("console-hint");
      if (hint) hint.textContent = msg;
    }
    var el = document.getElementById(id);
    if (!el) return;
    el.setAttribute("data-state", kind);
    clearTimeout(flashTimers[id]);
    flashTimers[id] = setTimeout(function () {
      el.removeAttribute("data-state");
    }, 420);
  }

  function hurtUnit(unit, amount, fromSide) {
    unit.hp -= amount;
    state.floats.push({
      x: unit.x,
      y: unit.y - 28,
      text: String(Math.round(amount)),
      life: 0.7,
      color: fromSide === 1 ? tokens["--color-accent"] : tokens["--color-bad"]
    });
    if (unit.hp <= 0) {
      var bounty = Math.round(UNIT_DEFS[unit.type].cost * 0.42);
      if (unit.side === -1) state.gold += bounty;
      else state.egold += bounty;
      for (var i = 0; i < 7; i += 1) {
        state.parts.push({
          x: unit.x,
          y: unit.y,
          vx: (Math.random() - 0.5) * 90,
          vy: -20 - Math.random() * 50,
          life: 0.4 + Math.random() * 0.25,
          color: unit.side === 1 ? tokens["--color-player"] : tokens["--color-enemy"]
        });
      }
      state.units = state.units.filter(function (u) { return u !== unit; });
      beep(unit.side === 1 ? 110 : 190, 0.06, "triangle", 0.025);
    }
  }

  function hurtBase(side, amount) {
    if (side === -1) {
      state.ehp = Math.max(0, state.ehp - amount);
      if (state.ehp <= 0) finish("win");
    } else {
      state.php = Math.max(0, state.php - amount);
      if (state.php <= 0) finish("lose");
    }
  }

  function finish(kind) {
    if (state.over) return;
    state.over = kind;
    state.paused = true;
    if (kind === "win") {
      var unlocked = Math.max(loadProgress().unlocked, state.index + 2);
      saveProgress({ unlocked: Math.min(9, unlocked) });
      renderMenuMeta();
      renderCampaign();
      beep(262, 0.12, "triangle", 0.04);
      beep(330, 0.14, "triangle", 0.04);
      beep(392, 0.22, "triangle", 0.045);
      showOverlay(
        state.index === 7 ? "王庭已破" : "這場打下了",
        state.index === 7
          ? "八場都過了。戰役表還可以重打任何一場。"
          : "敵營倒下。下一場會更會存錢、更早升年代。",
        kind
      );
    } else {
      beep(140, 0.2, "sawtooth", 0.04);
      beep(90, 0.28, "sawtooth", 0.035);
      showOverlay("己營被推平", "金幣節奏或年代落後都會這樣。從戰役表再開一場。", kind);
    }
  }

  function nearestEnemy(unit) {
    var best = null;
    var bestD = 1e9;
    for (var i = 0; i < state.units.length; i += 1) {
      var other = state.units[i];
      if (other.side === unit.side) continue;
      var d = (other.x - unit.x) * unit.side;
      if (d > -8 && d < bestD) {
        bestD = d;
        best = other;
      }
    }
    return best ? { unit: best, dist: Math.abs(best.x - unit.x) } : null;
  }

  function friendlyAhead(unit) {
    var best = null;
    var bestD = 14;
    for (var i = 0; i < state.units.length; i += 1) {
      var other = state.units[i];
      if (other === unit || other.side !== unit.side) continue;
      var d = (other.x - unit.x) * unit.side;
      if (d > 2 && d < bestD && Math.abs(other.y - unit.y) < 10) {
        bestD = d;
        best = other;
      }
    }
    return best;
  }

  function fireShot(fromX, fromY, toX, toY, dmg, side) {
    var dx = toX - fromX;
    var dy = toY - fromY;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    state.shots.push({
      x: fromX,
      y: fromY,
      vx: (dx / len) * 420,
      vy: (dy / len) * 420,
      dmg: dmg,
      side: side,
      life: 0.9
    });
  }

  function stepUnits(dt) {
    var list = state.units.slice();
    for (var i = 0; i < list.length; i += 1) {
      var unit = list[i];
      if (state.units.indexOf(unit) < 0) continue;
      var def = UNIT_DEFS[unit.type];
      var foe = nearestEnemy(unit);
      var baseX = unit.side === 1 ? ENEMY_BASE_X : PLAYER_BASE_X;
      var baseDist = Math.abs(baseX - unit.x);
      var targetDist = foe ? foe.dist : baseDist;
      var inRange = targetDist <= def.range + 4;
      unit.cd = Math.max(0, unit.cd - dt);

      if (inRange && (foe || baseDist <= def.range + 8)) {
        unit.walking = false;
        if (unit.cd <= 0) {
          var mul = unit.side === 1 && state.horn > 0 ? 1.35 : 1;
          var dmg = def.atk * mul;
          if (foe && foe.dist <= def.range + 4) {
            if (def.kind === "range") {
              fireShot(unit.x + unit.side * 10, unit.y - 18, foe.unit.x, foe.unit.y - 16, dmg, unit.side);
            } else {
              hurtUnit(foe.unit, dmg, unit.side);
            }
          } else {
            var siege = dmg * def.siege;
            if (def.kind === "range") {
              fireShot(unit.x + unit.side * 10, unit.y - 18, baseX, GROUND - 70, siege, unit.side);
            } else {
              hurtBase(unit.side === 1 ? -1 : 1, siege);
            }
          }
          unit.cd = def.reload;
        }
      } else if (def.kind === "range" || !friendlyAhead(unit)) {
        unit.walking = true;
        unit.x += unit.side * def.speed * dt;
        unit.x = clamp(unit.x, PLAYER_BASE_X + 20, ENEMY_BASE_X - 20);
      } else {
        unit.walking = false;
      }
    }
  }

  function stepShots(dt) {
    var keep = [];
    for (var i = 0; i < state.shots.length; i += 1) {
      var s = state.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      var hit = null;
      var hitD = 18;
      if (s.side === 1 && Math.abs(s.x - ENEMY_BASE_X) < 22 && s.y < GROUND) {
        hurtBase(-1, s.dmg);
        continue;
      }
      if (s.side === -1 && Math.abs(s.x - PLAYER_BASE_X) < 22 && s.y < GROUND) {
        hurtBase(1, s.dmg);
        continue;
      }
      for (var j = 0; j < state.units.length; j += 1) {
        var u = state.units[j];
        if (u.side === s.side) continue;
        var d = Math.abs(u.x - s.x) + Math.abs(u.y - 16 - s.y) * 0.4;
        if (d < hitD) {
          hitD = d;
          hit = u;
        }
      }
      if (hit) {
        hurtUnit(hit, s.dmg, s.side);
      } else if (s.life > 0 && s.x > 20 && s.x < W - 20) {
        keep.push(s);
      }
    }
    state.shots = keep;
  }

  function stepTurret(dt, side) {
    var key = side === 1 ? "pReload" : "eReload";
    var level = side === 1 ? state.turret : state.eturret;
    var stat = TURRET_STATS[level];
    state[key] -= dt;
    if (state[key] > 0) return;
    var originX = side === 1 ? PLAYER_BASE_X + 18 : ENEMY_BASE_X - 18;
    var originY = GROUND - 92;
    var best = null;
    var bestD = stat.range;
    for (var i = 0; i < state.units.length; i += 1) {
      var u = state.units[i];
      if (u.side === side) continue;
      var d = Math.abs(u.x - originX);
      if (d < bestD) {
        bestD = d;
        best = u;
      }
    }
    if (best) {
      var mul = side === 1 && state.horn > 0 ? 1.25 : 1;
      fireShot(originX, originY, best.x, best.y - 14, stat.dmg * mul, side);
      state[key] = stat.reload;
    }
  }

  function aiPickUnit(age) {
    var pool = availableUnits(age);
    var bag = [];
    pool.forEach(function (id) {
      var def = UNIT_DEFS[id];
      var w = def.kind === "melee" ? 3 : 2;
      if (def.siege > 2) w += 1;
      for (var i = 0; i < w; i += 1) bag.push(id);
    });
    return bag[Math.floor(Math.random() * bag.length)];
  }

  function stepAi(dt) {
    var spec = state.spec;
    state.aiWait -= dt;
    if (state.elapsed > spec.enemyAgeAt && state.eage < spec.enemyMaxAge) {
      var need = AGE_COST[state.eage + 1];
      if (state.egold >= need) {
        state.egold -= need;
        state.eage += 1;
      }
    }
    if (state.eturret < Math.min(3, state.eage + 1) && state.egold > TURRET_COST[state.eturret + 1] * 1.3) {
      state.egold -= TURRET_COST[state.eturret + 1];
      state.eturret += 1;
    }
    if (state.aiWait > 0) return;
    state.aiWait = spec.aiGap + Math.random() * 0.35;
    if (Math.random() < spec.aiSave) return;
    var pick = aiPickUnit(state.eage);
    var def = UNIT_DEFS[pick];
    if (state.egold >= def.cost) {
      state.egold -= def.cost;
      spawn(-1, pick, Math.floor(Math.random() * 3));
    }
  }

  function stepFx(dt) {
    state.parts = state.parts.filter(function (p) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 140 * dt;
      p.life -= dt;
      return p.life > 0;
    });
    state.floats = state.floats.filter(function (f) {
      f.y -= 24 * dt;
      f.life -= dt;
      return f.life > 0;
    });
  }

  function tick(dt) {
    if (!state || state.paused || state.over) return;
    dt = Math.min(dt, 0.05);
    state.elapsed += dt;
    state.gold += state.income * dt;
    state.egold += state.eincome * dt;
    state.horn = Math.max(0, state.horn - dt);
    state.hornCd = Math.max(0, state.hornCd - dt);
    state.volleyCd = Math.max(0, state.volleyCd - dt);
    stepAi(dt);
    stepUnits(dt);
    stepShots(dt);
    stepTurret(dt, 1);
    stepTurret(dt, -1);
    stepFx(dt);
  }

  function drawKeep(x, facing, color, deep, hp, hpMax) {
    ctx.save();
    ctx.translate(x, GROUND);
    ctx.fillStyle = deep;
    ctx.fillRect(-28 * facing, -118, 46 * facing, 118);
    ctx.fillStyle = color;
    ctx.fillRect(-20 * facing, -108, 32 * facing, 28);
    ctx.fillRect(-8 * facing, -148, 16 * facing, 40);
    ctx.beginPath();
    ctx.moveTo(-30 * facing, -118);
    ctx.lineTo(0, -168);
    ctx.lineTo(26 * facing, -118);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = tokens["--color-paper"];
    ctx.fillRect(-6 * facing, -72, 14 * facing, 22);
    ctx.fillStyle = color;
    ctx.fillRect(-2 * facing, -132, 6 * facing, 18);
    ctx.beginPath();
    ctx.arc(1 * facing, -136, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    var ratio = hpMax ? hp / hpMax : 0;
    ctx.fillStyle = tokens["--color-paper-3"];
    ctx.fillRect(x - 36, GROUND - 184, 72, 7);
    ctx.fillStyle = ratio < 0.34 ? tokens["--color-hp-low"] : tokens["--color-hp"];
    ctx.fillRect(x - 36, GROUND - 184, 72 * ratio, 7);
  }

  function drawUnit(unit) {
    var def = UNIT_DEFS[unit.type];
    var color = unit.side === 1 ? tokens["--color-player"] : tokens["--color-enemy"];
    var deep = unit.side === 1 ? tokens["--color-player-deep"] : tokens["--color-enemy-deep"];
    var dir = unit.side;
    var bob = unit.walking ? Math.sin(state.elapsed * 10 + unit.x * 0.05) * 1.4 : 0;
    ctx.save();
    ctx.translate(unit.x, unit.y + bob);
    ctx.scale(dir, 1);
    ctx.fillStyle = deep;
    if (def.kind === "melee" && def.speed > 60) {
      ctx.fillRect(-16, -8, 28, 8);
      ctx.fillStyle = color;
      ctx.fillRect(-4, -26, 10, 20);
    } else if (unit.type === "ram") {
      ctx.fillRect(-22, -16, 40, 14);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(-10, -2, 5, 0, Math.PI * 2);
      ctx.arc(12, -2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (def.kind === "range") {
      ctx.fillRect(-5, -22, 8, 20);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(8, -18, 10, -0.9, 0.9);
      ctx.stroke();
    } else {
      ctx.fillRect(-6, -24, 11, 22);
      ctx.fillStyle = color;
      ctx.fillRect(4, -28, 16, 2);
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -30, 5, 0, Math.PI * 2);
    ctx.fill();
    if (unit.type === "banner") {
      ctx.fillRect(8, -48, 14, 10);
    }
    if (unit.type === "shield") {
      ctx.beginPath();
      ctx.ellipse(-8, -16, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    var ratio = unit.hp / unit.hpMax;
    ctx.fillStyle = tokens["--color-paper-3"];
    ctx.fillRect(unit.x - 12, unit.y - 42, 24, 3);
    ctx.fillStyle = ratio < 0.35 ? tokens["--color-hp-low"] : tokens["--color-hp"];
    ctx.fillRect(unit.x - 12, unit.y - 42, 24 * ratio, 3);
  }

  function drawField() {
    ctx.clearRect(0, 0, W, H);
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, tokens["--color-sky"]);
    sky.addColorStop(0.62, tokens["--color-horizon"]);
    sky.addColorStop(1, tokens["--color-ground"]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = tokens["--color-paper-3"];
    ctx.beginPath();
    ctx.moveTo(0, GROUND - 8);
    ctx.lineTo(0, 268);
    ctx.quadraticCurveTo(160, 228, 310, 262);
    ctx.quadraticCurveTo(480, 214, 640, 256);
    ctx.quadraticCurveTo(820, 230, W, 260);
    ctx.lineTo(W, GROUND - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = tokens["--color-paper-2"];
    ctx.beginPath();
    ctx.moveTo(240, GROUND - 8);
    ctx.quadraticCurveTo(400, 236, 560, GROUND - 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = tokens["--color-ground"];
    ctx.fillRect(0, GROUND - 8, W, H - GROUND + 8);
    ctx.fillStyle = tokens["--color-road"];
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 8);
    ctx.quadraticCurveTo(W / 2, GROUND - 18, W, GROUND + 10);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = tokens["--color-accent"];
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(W * 0.72, 78, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    drawKeep(PLAYER_BASE_X, 1, tokens["--color-player"], tokens["--color-player-deep"], state.php, state.phpMax);
    drawKeep(ENEMY_BASE_X, -1, tokens["--color-enemy"], tokens["--color-enemy-deep"], state.ehp, state.ehpMax);

    if (state.horn > 0) {
      ctx.strokeStyle = tokens["--color-accent"];
      ctx.globalAlpha = 0.25 + Math.sin(state.elapsed * 8) * 0.08;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(PLAYER_BASE_X, GROUND - 70, 36 + (8 - state.horn) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    state.units.forEach(drawUnit);

    ctx.fillStyle = tokens["--color-accent"];
    state.shots.forEach(function (s) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });

    state.parts.forEach(function (p) {
      ctx.globalAlpha = clamp(p.life * 2, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1;

    ctx.font = "600 12px " + tokens["--font-body"];
    state.floats.forEach(function (f) {
      ctx.globalAlpha = clamp(f.life * 1.6, 0, 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x - 6, f.y);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = tokens["--color-ink-2"];
    ctx.font = "500 13px " + tokens["--font-body"];
    ctx.fillText("己營", 18, 28);
    ctx.textAlign = "right";
    ctx.fillText("敵營", W - 18, 28);
    ctx.textAlign = "left";
  }

  function paintHud() {
    if (!state) return;
    document.getElementById("play-title").textContent = state.spec.name;
    document.getElementById("hud-age").textContent = AGE_NAMES[state.age];
    document.getElementById("hud-gold").textContent = String(Math.floor(state.gold));
    document.getElementById("hud-income").textContent = state.income.toFixed(1) + "／秒";
    document.getElementById("hud-php").textContent = String(Math.ceil(state.php));
    document.getElementById("hud-ehp").textContent = String(Math.ceil(state.ehp));
    document.getElementById("console-hint").textContent = state.hint;
    refreshButtons();
  }

  function setDisabled(el, on) {
    if (!el) return;
    el.disabled = on;
    el.setAttribute("aria-disabled", on ? "true" : "false");
  }

  function refreshButtons() {
    UNIT_ORDER.forEach(function (id) {
      var def = UNIT_DEFS[id];
      var btn = document.getElementById("unit-" + id);
      if (!btn) return;
      var locked = def.age > state.age;
      var poor = state.gold < def.cost;
      btn.classList.toggle("is-locked", locked);
      setDisabled(btn, locked || poor || !!state.over);
      btn.querySelector(".u-meta").textContent = locked
        ? AGE_NAMES[def.age] + "解鎖 · " + def.cost + " 金"
        : def.cost + " 金 · " + (def.kind === "range" ? "遠程" : "近戰");
    });
    var ageBtn = document.getElementById("cmd-age");
    if (ageBtn) {
      var next = state.age + 1;
      setDisabled(ageBtn, state.age >= 2 || state.gold < AGE_COST[next] || !!state.over);
      ageBtn.querySelector(".u-name").textContent = state.age >= 2 ? "年代已滿" : "升到" + AGE_NAMES[next];
      ageBtn.querySelector(".u-meta").textContent = state.age >= 2 ? "鑄鋼" : AGE_COST[next] + " 金";
    }
    var turBtn = document.getElementById("cmd-turret");
    if (turBtn) {
      setDisabled(turBtn, state.turret >= 3 || state.gold < TURRET_COST[state.turret + 1] || !!state.over);
      turBtn.querySelector(".u-name").textContent = state.turret >= 3 ? "砲塔已滿" : "升砲塔";
      turBtn.querySelector(".u-meta").textContent = state.turret >= 3 ? "4 級" : TURRET_COST[state.turret + 1] + " 金 · 現 " + (state.turret + 1) + " 級";
    }
    var hornBtn = document.getElementById("cmd-horn");
    if (hornBtn) {
      setDisabled(hornBtn, state.hornCd > 0 || !!state.over);
      hornBtn.querySelector(".u-meta").textContent = state.hornCd > 0 ? Math.ceil(state.hornCd) + " 秒冷卻" : "8 秒增傷";
    }
    var volBtn = document.getElementById("cmd-volley");
    if (volBtn) {
      var volLock = state.age < 1 || state.volleyCd > 0;
      setDisabled(volBtn, volLock || !!state.over);
      volBtn.querySelector(".u-meta").textContent = state.age < 1
        ? "鐵器解鎖"
        : (state.volleyCd > 0 ? Math.ceil(state.volleyCd) + " 秒冷卻" : "打中段敵兵");
    }
  }

  function renderUnitBar() {
    var row = document.getElementById("unit-row");
    row.innerHTML = UNIT_ORDER.map(function (id, i) {
      var def = UNIT_DEFS[id];
      return (
        '<button type="button" class="unit-btn" id="unit-' + id + '" data-unit="' + id + '">' +
          '<span class="u-name">' + (i + 1) + " " + def.name + "</span>" +
          '<span class="u-meta">' + def.cost + " 金</span>" +
        "</button>"
      );
    }).join("");
    document.getElementById("cmd-row").innerHTML = [
      '<button type="button" class="cmd-btn" id="cmd-age"><span class="u-name">升年代</span><span class="u-meta">A</span></button>',
      '<button type="button" class="cmd-btn" id="cmd-turret"><span class="u-name">升砲塔</span><span class="u-meta">T</span></button>',
      '<button type="button" class="cmd-btn" id="cmd-horn"><span class="u-name">戰號</span><span class="u-meta">H</span></button>',
      '<button type="button" class="cmd-btn" id="cmd-volley"><span class="u-name">火箭</span><span class="u-meta">V</span></button>'
    ].join("");
  }

  function renderCampaign() {
    var unlocked = loadProgress().unlocked;
    var list = document.getElementById("campaign");
    list.innerHTML = BATTLES.map(function (b, i) {
      var open = i < unlocked;
      return (
        "<li>" +
          '<span class="campaign-idx">' + String(i + 1).padStart(2, "0") + "</span>" +
          '<div class="campaign-copy"><h3>' + b.name + "</h3><p>" + b.blurb + "</p></div>" +
          (open
            ? '<button type="button" class="btn-primary" data-battle="' + i + '">進入這場</button>'
            : '<button type="button" class="btn-ghost" disabled>未開</button>') +
        "</li>"
      );
    }).join("");
  }

  function renderMenuMeta() {
    var unlocked = loadProgress().unlocked;
    var el = document.getElementById("progress-stat");
    var copy = document.getElementById("progress-copy");
    if (unlocked > 8) {
      el.textContent = "八場都過了";
      copy.textContent = "戰役表仍可重打。想換節奏就從河岸斥候再走一輪。";
    } else {
      el.textContent = "下一場 · " + BATTLES[Math.min(unlocked, 8) - 1].name;
      copy.textContent = unlocked === 1
        ? "從河岸斥候開始。過關會解鎖下一場，存在這台瀏覽器裡。"
        : "已打開第 " + unlocked + " 場。進度只留在這台瀏覽器。";
    }
  }

  function showScreen(id) {
    ["menu", "battles", "how", "play"].forEach(function (name) {
      var el = document.getElementById("screen-" + name);
      var on = name === id;
      el.hidden = !on;
      el.classList.toggle("is-on", on);
    });
    document.getElementById("nav").classList.toggle("is-play", id === "play");
    document.body.classList.toggle("is-play", id === "play");
    if (id !== "play") stopLoop();
  }

  function showOverlay(title, copy, kind) {
    var box = document.getElementById("overlay");
    document.getElementById("overlay-title").textContent = title;
    document.getElementById("overlay-copy").textContent = copy;
    var actions = document.getElementById("overlay-actions");
    var buttons = [];
    if (kind === "pause") {
      buttons.push('<button type="button" class="btn-primary" data-act="resume">繼續打</button>');
      buttons.push('<button type="button" class="btn-ghost" data-act="leave">回到戰役表</button>');
    } else if (kind === "win") {
      if (state.index < 7) {
        buttons.push('<button type="button" class="btn-primary" data-act="next">下一場</button>');
      }
      buttons.push('<button type="button" class="btn-ghost" data-act="again">再打這場</button>');
      buttons.push('<button type="button" class="btn-ghost" data-act="leave">戰役表</button>');
    } else {
      buttons.push('<button type="button" class="btn-primary" data-act="again">再打這場</button>');
      buttons.push('<button type="button" class="btn-ghost" data-act="leave">戰役表</button>');
    }
    actions.innerHTML = buttons.join("");
    box.hidden = false;
  }

  function hideOverlay() {
    document.getElementById("overlay").hidden = true;
  }

  function startBattle(index) {
    readTokens();
    state = createBattle(index);
    renderUnitBar();
    paintHud();
    showScreen("play");
    hideOverlay();
    lastTs = 0;
    stopLoop();
    raf = requestAnimationFrame(loop);
    document.getElementById("btn-pause").setAttribute("aria-pressed", "false");
    document.getElementById("btn-pause").textContent = "暫停";
  }

  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function loop(ts) {
    if (!state) return;
    if (!lastTs) lastTs = ts;
    var dt = (ts - lastTs) / 1000;
    lastTs = ts;
    tick(dt);
    drawField();
    paintHud();
    raf = requestAnimationFrame(loop);
  }

  function togglePause() {
    if (!state || state.over) return;
    state.paused = !state.paused;
    document.getElementById("btn-pause").setAttribute("aria-pressed", state.paused ? "true" : "false");
    document.getElementById("btn-pause").textContent = state.paused ? "繼續" : "暫停";
    if (state.paused) showOverlay("暫停", "戰場停住。金幣與出兵都暫停。", "pause");
    else hideOverlay();
  }

  function bind() {
    document.getElementById("nav").addEventListener("click", function (ev) {
      var go = ev.target.closest("[data-screen]");
      if (!go) return;
      ev.preventDefault();
      if (state && !state.over && !document.getElementById("screen-play").hidden) {
        if (!window.confirm("現在撤出會輸掉這一場。要回選單嗎？")) return;
        state = null;
      }
      showScreen(go.getAttribute("data-screen"));
    });

    document.getElementById("screen-menu").addEventListener("click", function (ev) {
      var go = ev.target.closest("[data-screen]");
      if (!go) return;
      showScreen(go.getAttribute("data-screen"));
    });

    document.getElementById("campaign").addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-battle]");
      if (!btn || btn.disabled) return;
      startBattle(Number(btn.getAttribute("data-battle")));
    });

    document.getElementById("console").addEventListener("click", function (ev) {
      var unit = ev.target.closest("[data-unit]");
      if (unit && !unit.disabled) {
        ensureAudio();
        tryRecruit(unit.getAttribute("data-unit"));
        return;
      }
      var cmd = ev.target.closest(".cmd-btn");
      if (!cmd || cmd.disabled) return;
      ensureAudio();
      if (cmd.id === "cmd-age") tryAge();
      if (cmd.id === "cmd-turret") tryTurret();
      if (cmd.id === "cmd-horn") tryHorn();
      if (cmd.id === "cmd-volley") tryVolley();
    });

    document.getElementById("btn-pause").addEventListener("click", togglePause);
    document.getElementById("btn-retreat").addEventListener("click", function () {
      if (!state) return;
      if (state.over || window.confirm("撤出這一場，回到戰役表？")) {
        state = null;
        hideOverlay();
        showScreen("battles");
      }
    });
    document.getElementById("btn-mute").addEventListener("click", function () {
      audio.mute = !audio.mute;
      saveProgress({ mute: audio.mute });
      this.setAttribute("aria-pressed", audio.mute ? "true" : "false");
      this.textContent = audio.mute ? "聲音關" : "聲音開";
    });

    document.getElementById("overlay-actions").addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-act]");
      if (!btn || !state) return;
      var act = btn.getAttribute("data-act");
      if (act === "resume") {
        state.paused = false;
        document.getElementById("btn-pause").setAttribute("aria-pressed", "false");
        document.getElementById("btn-pause").textContent = "暫停";
        hideOverlay();
      } else if (act === "again") {
        startBattle(state.index);
      } else if (act === "next") {
        startBattle(state.index + 1);
      } else if (act === "leave") {
        state = null;
        hideOverlay();
        showScreen("battles");
        renderMenuMeta();
      }
    });

    window.addEventListener("keydown", function (ev) {
      if (!state || document.getElementById("screen-play").hidden) return;
      if (ev.target && /input|textarea|select/i.test(ev.target.tagName)) return;
      var key = ev.key.toLowerCase();
      if (ev.code === "Space") {
        ev.preventDefault();
        togglePause();
        return;
      }
      if (state.paused || state.over) return;
      var map = { "1": "spear", "2": "sling", "3": "scout", "4": "shield", "5": "archer", "6": "rider", "7": "ram", "8": "ballista", "9": "banner" };
      if (map[ev.key]) {
        ev.preventDefault();
        tryRecruit(map[ev.key]);
      } else if (key === "a") tryAge();
      else if (key === "t") tryTurret();
      else if (key === "h") tryHorn();
      else if (key === "v") tryVolley();
    });
  }

  function init() {
    readTokens();
    audio.mute = loadProgress().mute;
    var muteBtn = document.getElementById("btn-mute");
    muteBtn.setAttribute("aria-pressed", audio.mute ? "true" : "false");
    muteBtn.textContent = audio.mute ? "聲音關" : "聲音開";
    renderMenuMeta();
    renderCampaign();
    bind();
    function applyHash() {
      var hash = (location.hash || "").replace("#", "");
      if (hash === "battles" || hash === "how" || hash === "menu") showScreen(hash);
      else showScreen("menu");
    }
    window.addEventListener("hashchange", applyHash);
    applyHash();
  }

  window.BronzeFront = {
    startBattle: startBattle,
    getState: function () { return state; },
    recruit: tryRecruit,
    tick: tick
  };

  init();
})();
