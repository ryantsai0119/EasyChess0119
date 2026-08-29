(function () {
  "use strict";

  var STORAGE_KEY = "bronze-front-v1";
  var W = 1280;
  var H = 720;
  var GROUND = 548;
  var PLAYER_BASE_X = 90;
  var ENEMY_BASE_X = 1190;
  var LANE_Y = [508, 538, 568];

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
  var titleRaf = 0;
  var lastTs = 0;
  var audio = { mute: false };
  var flashTimers = {};
  var hitStop = 0;
  var shotSfxGate = 0;

  function sfx(name) {
    var fn = window.BronzeAudio && window.BronzeAudio.sfx[name];
    if (fn) fn.apply(null, Array.prototype.slice.call(arguments, 1));
  }

  function ensureAudio() {
    if (window.BronzeAudio) {
      window.BronzeAudio.setMute(audio.mute);
      window.BronzeAudio.resume();
    }
  }

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
      "--font-body", "--color-bronze", "--color-copper", "--color-ember", "--color-wood",
      "--color-stone", "--color-stone-2", "--color-moon", "--color-dust", "--color-grass",
      "--color-water", "--color-iron", "--color-steel"
    ].forEach(function (name) {
      tokens[name] = styles.getPropertyValue(name).trim();
    });
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
      sfx("deny");
      return false;
    }
    if (state.gold < def.cost) {
      flash("unit-" + typeId, "error", "金幣不夠，再等一下。");
      sfx("deny");
      return false;
    }
    state.gold -= def.cost;
    spawn(1, typeId, Math.floor(Math.random() * 3));
    flash("unit-" + typeId, "success", "");
    sfx("recruit", def.age);
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
    renderUnitBar();
    flash("cmd-age", "success", "進入" + AGE_NAMES[state.age] + "。舊兵仍可出。");
    sfx("age");
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
    sfx("turret");
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
    sfx("horn");
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
      if (u.side === -1 && u.x > W * 0.32 && u.x < W * 0.68) {
        hurtUnit(u, dmg, 1, true);
      }
    });
    for (var i = 0; i < 18; i += 1) {
      state.parts.push({
        x: W * 0.34 + Math.random() * W * 0.32,
        y: GROUND - 220 + Math.random() * 90,
        vx: (Math.random() - 0.5) * 40,
        vy: 40 + Math.random() * 80,
        life: 0.45 + Math.random() * 0.3,
        color: tokens["--color-accent"]
      });
    }
    flash("cmd-volley", "success", "火箭落到中段。");
    sfx("volley");
    hitStop = Math.max(hitStop, 0.08);
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

  function hurtUnit(unit, amount, fromSide, silent) {
    unit.hp -= amount;
    state.floats.push({
      x: unit.x,
      y: unit.y - 28,
      text: String(Math.round(amount)),
      life: 0.7,
      color: fromSide === 1 ? tokens["--color-accent"] : tokens["--color-bad"]
    });
    if (amount >= 12) hitStop = Math.max(hitStop, 0.055);
    else if (amount >= 7) hitStop = Math.max(hitStop, 0.03);
    if (!silent) sfx("hit");
    if (unit.hp <= 0) {
      var bounty = Math.round(UNIT_DEFS[unit.type].cost * 0.42);
      if (unit.side === -1) state.gold += bounty;
      else state.egold += bounty;
      for (var i = 0; i < 12; i += 1) {
        state.parts.push({
          x: unit.x,
          y: unit.y,
          vx: (Math.random() - 0.5) * 110,
          vy: -20 - Math.random() * 70,
          life: 0.45 + Math.random() * 0.35,
          color: unit.side === 1 ? tokens["--color-player"] : tokens["--color-enemy"],
          size: 2 + Math.random() * 3
        });
      }
      state.units = state.units.filter(function (u) { return u !== unit; });
      if (!silent) sfx("death", unit.side === 1);
      hitStop = Math.max(hitStop, 0.07);
    }
  }

  function hurtBase(side, amount) {
    sfx("baseHit");
    hitStop = Math.max(hitStop, 0.045);
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
    if (window.BronzeAudio) window.BronzeAudio.startBed("title");
    if (kind === "win") {
      var unlocked = Math.max(loadProgress().unlocked, state.index + 2);
      saveProgress({ unlocked: Math.min(9, unlocked) });
      renderMenuMeta();
      renderCampaign();
      sfx("win");
      showOverlay(
        state.index === 7 ? "王庭已破" : "這場打下了",
        state.index === 7
          ? "八場都過了。戰役裡還可以重打任何一場。"
          : "敵營倒下。下一場會更會存錢、更早升年代。",
        kind
      );
    } else {
      sfx("lose");
      showOverlay("己營被推平", "金幣節奏或年代落後都會這樣。再打，或換一場。", kind);
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
      life: 0.9,
      trail: [{ x: fromX, y: fromY }]
    });
    if (shotSfxGate <= 0) {
      sfx("shot");
      shotSfxGate = 0.07;
    }
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
              sfx("melee");
              hurtUnit(foe.unit, dmg, unit.side);
            }
          } else {
            var siege = dmg * def.siege;
            if (def.kind === "range") {
              fireShot(unit.x + unit.side * 10, unit.y - 18, baseX, GROUND - 70, siege, unit.side);
            } else {
              sfx("melee");
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
      if (!s.trail) s.trail = [];
      s.trail.push({ x: s.x, y: s.y });
      if (s.trail.length > 8) s.trail.shift();
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
    if (hitStop > 0) {
      hitStop -= dt;
      stepFx(dt * 0.35);
      return;
    }
    if (shotSfxGate > 0) shotSfxGate -= dt;
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

  function drawKeep(x, facing, hp, hpMax, turret, side) {
    window.BronzeArt.paintKeep(ctx, x, facing, hp, hpMax, turret, tokens, side, state.elapsed, GROUND);
  }

  function drawUnit(unit) {
    window.BronzeArt.paintUnit(ctx, unit, UNIT_DEFS[unit.type], tokens, state.elapsed);
  }

  function fitCanvas() {
    var frame = canvas.parentElement;
    var dw = Math.max(1, frame.clientWidth);
    var dh = Math.max(1, frame.clientHeight);
    if (canvas.width !== dw || canvas.height !== dh) {
      canvas.width = dw;
      canvas.height = dh;
    }
    var scale = dw / W;
    var oy = dh - H * scale;
    if (oy < 0) {
      scale = dh / H;
      oy = 0;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = tokens["--color-sky"] || "#141820";
    ctx.fillRect(0, 0, dw, dh);
    ctx.setTransform(scale, 0, 0, scale, 0, oy);
  }

  function drawField() {
    fitCanvas();
    window.BronzeArt.paintWorld(ctx, {
      w: W,
      h: H,
      ground: GROUND,
      t: state.elapsed,
      tokens: tokens
    });
    drawKeep(PLAYER_BASE_X, 1, state.php, state.phpMax, state.turret, 1);
    drawKeep(ENEMY_BASE_X, -1, state.ehp, state.ehpMax, state.eturret, -1);

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

    state.shots.forEach(function (s) {
      window.BronzeArt.paintShot(ctx, s, tokens);
    });

    state.parts.forEach(function (p) {
      ctx.globalAlpha = clamp(p.life * 2, 0, 1);
      ctx.fillStyle = p.color;
      var sz = p.size || 3;
      ctx.fillRect(p.x, p.y, sz, sz);
    });
    ctx.globalAlpha = 1;

    ctx.font = "600 12px " + tokens["--font-body"];
    state.floats.forEach(function (f) {
      ctx.globalAlpha = clamp(f.life * 1.6, 0, 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x - 6, f.y);
    });
    ctx.globalAlpha = 1;

  }

  function paintHud() {
    if (!state) return;
    document.getElementById("play-title").textContent = state.spec.name;
    document.getElementById("hud-age").textContent = AGE_NAMES[state.age];
    document.getElementById("hud-gold").textContent = String(Math.floor(state.gold));
    document.getElementById("hud-income").textContent = "+" + state.income.toFixed(1) + "／秒";
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
        ? AGE_NAMES[def.age]
        : String(def.cost);
    });
    var ageBtn = document.getElementById("cmd-age");
    if (ageBtn) {
      var next = state.age + 1;
      setDisabled(ageBtn, state.age >= 2 || state.gold < AGE_COST[next] || !!state.over);
      ageBtn.querySelector(".u-name").textContent = state.age >= 2 ? "滿" : AGE_NAMES[next];
      ageBtn.querySelector(".u-meta").textContent = state.age >= 2 ? "—" : String(AGE_COST[next]);
    }
    var turBtn = document.getElementById("cmd-turret");
    if (turBtn) {
      setDisabled(turBtn, state.turret >= 3 || state.gold < TURRET_COST[state.turret + 1] || !!state.over);
      turBtn.querySelector(".u-name").textContent = state.turret >= 3 ? "滿" : "砲塔";
      turBtn.querySelector(".u-meta").textContent = state.turret >= 3 ? "4" : String(TURRET_COST[state.turret + 1]);
    }
    var hornBtn = document.getElementById("cmd-horn");
    if (hornBtn) {
      setDisabled(hornBtn, state.hornCd > 0 || !!state.over);
      hornBtn.querySelector(".u-meta").textContent = state.hornCd > 0 ? Math.ceil(state.hornCd) + "s" : "增傷";
    }
    var volBtn = document.getElementById("cmd-volley");
    if (volBtn) {
      var volLock = state.age < 1 || state.volleyCd > 0;
      setDisabled(volBtn, volLock || !!state.over);
      volBtn.querySelector(".u-meta").textContent = state.age < 1
        ? "鐵器"
        : (state.volleyCd > 0 ? Math.ceil(state.volleyCd) + "s" : "中段");
    }
  }

  function renderUnitBar() {
    var age = state ? state.age : 0;
    var shown = UNIT_ORDER.filter(function (id) {
      return UNIT_DEFS[id].age <= age;
    });
    var row = document.getElementById("unit-row");
    row.innerHTML = shown.map(function (id) {
      var def = UNIT_DEFS[id];
      var key = UNIT_ORDER.indexOf(id) + 1;
      return (
        '<button type="button" class="unit-btn" id="unit-' + id + '" data-unit="' + id + '">' +
          '<span class="u-key">' + key + "</span>" +
          '<canvas class="u-glyph" width="72" height="52" aria-hidden="true"></canvas>' +
          '<span class="u-name">' + def.name + "</span>" +
          '<span class="u-meta">' + def.cost + "</span>" +
        "</button>"
      );
    }).join("");
    var cmds = [
      '<button type="button" class="cmd-btn" id="cmd-age" data-cmd="age"><span class="u-key">A</span><canvas class="u-glyph" width="72" height="52" aria-hidden="true"></canvas><span class="u-name">年代</span><span class="u-meta"></span></button>',
      '<button type="button" class="cmd-btn" id="cmd-turret" data-cmd="turret"><span class="u-key">T</span><canvas class="u-glyph" width="72" height="52" aria-hidden="true"></canvas><span class="u-name">砲塔</span><span class="u-meta"></span></button>',
      '<button type="button" class="cmd-btn" id="cmd-horn" data-cmd="horn"><span class="u-key">H</span><canvas class="u-glyph" width="72" height="52" aria-hidden="true"></canvas><span class="u-name">戰號</span><span class="u-meta"></span></button>'
    ];
    if (age >= 1) {
      cmds.push('<button type="button" class="cmd-btn" id="cmd-volley" data-cmd="volley"><span class="u-key">V</span><canvas class="u-glyph" width="72" height="52" aria-hidden="true"></canvas><span class="u-name">火箭</span><span class="u-meta"></span></button>');
    }
    document.getElementById("cmd-row").innerHTML = cmds.join("");
    paintDockGlyphs();
  }

  function paintDockGlyphs() {
    UNIT_ORDER.forEach(function (id) {
      var btn = document.getElementById("unit-" + id);
      if (!btn) return;
      window.BronzeArt.paintGlyph(btn.querySelector("canvas"), id, tokens, 1);
    });
    ["age", "turret", "horn", "volley"].forEach(function (cmd) {
      var btn = document.querySelector('[data-cmd="' + cmd + '"]');
      if (!btn) return;
      window.BronzeArt.paintCmdGlyph(btn.querySelector("canvas"), cmd, tokens);
    });
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
            ? '<button type="button" class="btn-primary" data-battle="' + i + '">打</button>'
            : '<button type="button" class="btn-ghost" disabled>未開</button>') +
        "</li>"
      );
    }).join("");
  }

  function nextBattleIndex() {
    var unlocked = loadProgress().unlocked;
    if (unlocked > 8) return 0;
    return Math.min(unlocked, 8) - 1;
  }

  function renderMenuMeta() {
    var unlocked = loadProgress().unlocked;
    var el = document.getElementById("progress-stat");
    var go = document.getElementById("btn-continue");
    var idx = nextBattleIndex();
    if (unlocked > 8) {
      el.textContent = "八場都過了 · 可重征任何一場";
      go.textContent = "再征 · " + BATTLES[0].name;
    } else if (unlocked === 1) {
      el.textContent = "第 1 戰 · " + BATTLES[0].name;
      go.textContent = "開戰";
    } else {
      el.textContent = "下一場 · " + BATTLES[idx].name;
      go.textContent = "繼續 · " + BATTLES[idx].name;
    }
    go.setAttribute("data-continue", String(idx));
  }

  function showScreen(id) {
    ["menu", "battles", "play"].forEach(function (name) {
      var el = document.getElementById("screen-" + name);
      var on = name === id;
      el.hidden = !on;
      el.classList.toggle("is-on", on);
    });
    document.body.classList.toggle("is-play", id === "play");
    document.body.classList.toggle("is-title", id === "menu");
    document.body.classList.toggle("is-select", id === "battles");
    if (id !== "play") stopLoop();
    if (id === "menu") {
      startTitleLoop();
      if (window.BronzeAudio) window.BronzeAudio.startBed("title");
    } else {
      stopTitleLoop();
      if (id !== "play" && window.BronzeAudio) window.BronzeAudio.startBed("title");
    }
  }

  function startTitleLoop() {
    if (titleRaf) return;
    function tickTitle(ts) {
      if (!document.body.classList.contains("is-title")) {
        titleRaf = 0;
        return;
      }
      window.BronzeArt.paintTitle(document.getElementById("title-field"), tokens, ts / 1000);
      titleRaf = requestAnimationFrame(tickTitle);
    }
    titleRaf = requestAnimationFrame(tickTitle);
  }

  function stopTitleLoop() {
    if (titleRaf) cancelAnimationFrame(titleRaf);
    titleRaf = 0;
  }

  function showOverlay(title, copy, kind) {
    var box = document.getElementById("overlay");
    document.getElementById("overlay-title").textContent = title;
    document.getElementById("overlay-copy").textContent = copy;
    var actions = document.getElementById("overlay-actions");
    var buttons = [];
    if (kind === "pause") {
      buttons.push('<button type="button" class="btn-primary" data-act="resume">繼續</button>');
      buttons.push('<button type="button" class="btn-ghost" data-act="mute">' + (audio.mute ? "聲音關" : "聲音開") + "</button>");
      buttons.push('<button type="button" class="btn-ghost" data-act="leave">撤出</button>');
    } else if (kind === "win") {
      if (state.index < 7) {
        buttons.push('<button type="button" class="btn-primary" data-act="next">下一場</button>');
      }
      buttons.push('<button type="button" class="btn-ghost" data-act="again">再打這場</button>');
      buttons.push('<button type="button" class="btn-ghost" data-act="leave">戰役</button>');
    } else {
      buttons.push('<button type="button" class="btn-primary" data-act="again">再打這場</button>');
      buttons.push('<button type="button" class="btn-ghost" data-act="leave">戰役</button>');
    }
    actions.innerHTML = buttons.join("");
    box.hidden = false;
  }

  function hideOverlay() {
    document.getElementById("overlay").hidden = true;
  }

  function startBattle(index) {
    readTokens();
    ensureAudio();
    state = createBattle(index);
    hitStop = 0;
    renderUnitBar();
    paintHud();
    showScreen("play");
    if (window.BronzeAudio) window.BronzeAudio.startBed("battle");
    hideOverlay();
    lastTs = 0;
    stopLoop();
    raf = requestAnimationFrame(loop);
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
    if (state.paused) showOverlay("暫停", "戰場停住。金幣與出兵都暫停。", "pause");
    else hideOverlay();
  }

  function leaveBattle() {
    state = null;
    hitStop = 0;
    hideOverlay();
    showScreen("battles");
    renderMenuMeta();
    if (window.BronzeAudio) window.BronzeAudio.startBed("title");
  }

  function setHowOpen(on) {
    document.getElementById("panel-how").hidden = !on;
  }

  function bind() {
    document.getElementById("btn-continue").addEventListener("click", function () {
      startBattle(Number(this.getAttribute("data-continue") || nextBattleIndex()));
    });

    document.getElementById("btn-how").addEventListener("click", function () {
      setHowOpen(true);
    });
    document.getElementById("btn-how-close").addEventListener("click", function () {
      setHowOpen(false);
    });

    document.getElementById("app").addEventListener("click", function (ev) {
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

    document.getElementById("btn-menu").addEventListener("click", function () {
      if (!state) return;
      if (state.over) return;
      if (!state.paused) togglePause();
    });

    document.getElementById("overlay-actions").addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-act]");
      if (!btn || !state) return;
      var act = btn.getAttribute("data-act");
      if (act === "resume") {
        state.paused = false;
        hideOverlay();
      } else if (act === "mute") {
        audio.mute = !audio.mute;
        if (window.BronzeAudio) window.BronzeAudio.setMute(audio.mute);
        saveProgress({ mute: audio.mute });
        btn.textContent = audio.mute ? "聲音關" : "聲音開";
        if (!audio.mute) {
          ensureAudio();
          window.BronzeAudio.startBed(state && !state.over ? "battle" : "title");
        }
      } else if (act === "again") {
        startBattle(state.index);
      } else if (act === "next") {
        startBattle(state.index + 1);
      } else if (act === "leave") {
        leaveBattle();
      }
    });

    window.addEventListener("keydown", function (ev) {
      if (!document.getElementById("panel-how").hidden && ev.key === "Escape") {
        setHowOpen(false);
        return;
      }
      if (!state || document.getElementById("screen-play").hidden) return;
      if (ev.target && /input|textarea|select/i.test(ev.target.tagName)) return;
      var key = ev.key.toLowerCase();
      if (ev.code === "Space" || ev.key === "Escape") {
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
    if (window.BronzeAudio) window.BronzeAudio.setMute(audio.mute);
    renderMenuMeta();
    renderCampaign();
    bind();
    function applyHash() {
      var hash = (location.hash || "").replace("#", "");
      if (hash === "battles") showScreen("battles");
      else if (hash === "how") {
        showScreen("menu");
        setHowOpen(true);
      } else {
        showScreen("menu");
      }
    }
    window.addEventListener("hashchange", applyHash);
    applyHash();
    document.addEventListener("pointerdown", function once() {
      ensureAudio();
      if (!audio.mute && window.BronzeAudio) {
        window.BronzeAudio.startBed(document.body.classList.contains("is-play") ? "battle" : "title");
      }
      document.removeEventListener("pointerdown", once);
    }, { once: true });
  }

  window.BronzeFront = {
    startBattle: startBattle,
    getState: function () { return state; },
    recruit: tryRecruit,
    tick: tick
  };

  init();
})();
