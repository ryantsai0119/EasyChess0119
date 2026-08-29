#!/usr/bin/env python3
"""Lightweight Monte Carlo for Bronze Front battle win rates."""
from __future__ import annotations

import math
import random
import statistics
import time

UNIT_DEFS = {
    "spear": dict(age=0, cost=17, hp=40, atk=7, range=22, speed=42, reload=0.72, kind="melee", siege=1),
    "sling": dict(age=0, cost=20, hp=24, atk=8, range=108, speed=36, reload=0.95, kind="range", siege=0.7),
    "scout": dict(age=0, cost=28, hp=32, atk=11, range=20, speed=68, reload=0.62, kind="melee", siege=0.8),
    "shield": dict(age=1, cost=48, hp=110, atk=13, range=24, speed=30, reload=0.85, kind="melee", siege=1),
    "archer": dict(age=1, cost=50, hp=34, atk=14, range=142, speed=38, reload=0.88, kind="range", siege=0.75),
    "rider": dict(age=1, cost=78, hp=62, atk=20, range=22, speed=78, reload=0.7, kind="melee", siege=0.9),
    "ram": dict(age=2, cost=120, hp=170, atk=16, range=26, speed=24, reload=1.05, kind="melee", siege=3.2),
    "ballista": dict(age=2, cost=125, hp=52, atk=24, range=188, speed=28, reload=1.05, kind="range", siege=1.4),
    "banner": dict(age=2, cost=190, hp=175, atk=30, range=26, speed=44, reload=0.68, kind="melee", siege=1.2),
}
UNIT_ORDER = list(UNIT_DEFS.keys())
AGE_COST = [0, 260, 620]
TURRET_COST = [0, 90, 200, 420]
TURRET_STATS = [
    dict(dmg=6, range=150, reload=1.15),
    dict(dmg=11, range=175, reload=0.95),
    dict(dmg=18, range=200, reload=0.8),
    dict(dmg=28, range=230, reload=0.68),
]
PLAYER_BASE_X, ENEMY_BASE_X, GROUND = 90, 1190, 548
LANE_Y = [508, 538, 568]
MAX_UNITS = 36

BATTLES = [
    { "name": "河岸斥候", "blurb": "敵軍只會出銅器。先學會存錢再推。", "playerGold": 95, "playerIncome": 9, "playerHp": 440, "enemyGold": 28, "enemyIncome": 4.4, "enemyHp": 340, "enemyMaxAge": 0, "enemyStartAge": 0, "enemyAgeAt": 999, "aiGap": 1.15, "aiSave": 0.22 },
    { "name": "渡口爭奪", "blurb": "對面上投石了。用斥候繞、用矛兵頂。", "playerGold": 90, "playerIncome": 9.2, "playerHp": 460, "enemyGold": 40, "enemyIncome": 5.4, "enemyHp": 380, "enemyMaxAge": 0, "enemyStartAge": 0, "enemyAgeAt": 999, "aiGap": 1.02, "aiSave": 0.18 },
    { "name": "丘陵營地", "blurb": "敵營較厚。這場開始要考慮升鐵器。", "playerGold": 100, "playerIncome": 9.6, "playerHp": 480, "enemyGold": 55, "enemyIncome": 6.2, "enemyHp": 460, "enemyMaxAge": 0, "enemyStartAge": 0, "enemyAgeAt": 999, "aiGap": 0.95, "aiSave": 0.16 },
    { "name": "鐵器初現", "blurb": "對方會升到鐵器。你的年代不能落後太久。", "playerGold": 110, "playerIncome": 10, "playerHp": 500, "enemyGold": 85, "enemyIncome": 6.9, "enemyHp": 500, "enemyMaxAge": 1, "enemyStartAge": 0, "enemyAgeAt": 22, "aiGap": 0.90, "aiSave": 0.15 },
    { "name": "關隘夜襲", "blurb": "對方稍後升鐵器。先用銅器頂住，再追年代。", "playerGold": 120, "playerIncome": 10.6, "playerHp": 520, "enemyGold": 110, "enemyIncome": 7.5, "enemyHp": 530, "enemyMaxAge": 1, "enemyStartAge": 0, "enemyAgeAt": 20, "aiGap": 0.84, "aiSave": 0.13 },
    { "name": "鑄鋼對峙", "blurb": "敵方會摸到鑄鋼。攻城槌是拆營的刀。", "playerGold": 135, "playerIncome": 11.4, "playerHp": 580, "enemyGold": 130, "enemyIncome": 8.0, "enemyHp": 580, "enemyMaxAge": 2, "enemyStartAge": 1, "enemyAgeAt": 36, "aiGap": 0.80, "aiSave": 0.12 },
    { "name": "攻城前夜", "blurb": "厚營、連弩、旗手。亂出會被射穿。", "playerGold": 155, "playerIncome": 12.6, "playerHp": 640, "enemyGold": 160, "enemyIncome": 10.2, "enemyHp": 680, "enemyMaxAge": 2, "enemyStartAge": 1, "enemyAgeAt": 28, "aiGap": 0.74, "aiSave": 0.10 },
    { "name": "王庭決戰", "blurb": "最後一場。對方會追到鑄鋼，但你也有喘息空間。", "playerGold": 180, "playerIncome": 13.4, "playerHp": 740, "enemyGold": 200, "enemyIncome": 11.4, "enemyHp": 780, "enemyMaxAge": 2, "enemyStartAge": 1, "enemyAgeAt": 20, "aiGap": 0.64, "aiSave": 0.09 }
  ]


def available(age: int):
    return [u for u in UNIT_ORDER if UNIT_DEFS[u]["age"] <= age]


def ai_pick(age: int, rng: random.Random):
    bag = []
    for uid in available(age):
        d = UNIT_DEFS[uid]
        w = 3 if d["kind"] == "melee" else 2
        if d["siege"] > 2:
            w += 1
        bag.extend([uid] * w)
    return rng.choice(bag)


def count_side(st, side):
    return sum(1 for u in st["units"] if not u["dead"] and u["side"] == side)


def spawn(st, side, typ, lane):
    if count_side(st, side) >= MAX_UNITS // 2:
        return False
    d = UNIT_DEFS[typ]
    st["units"].append(
        {
            "type": typ,
            "side": side,
            "x": PLAYER_BASE_X + 28 if side == 1 else ENEMY_BASE_X - 28,
            "y": LANE_Y[lane],
            "hp": d["hp"],
            "cd": 0.2,
            "dead": False,
        }
    )
    return True


def nearest_enemy(st, unit):
    best = None
    best_d = 1e9
    for other in st["units"]:
        if other["dead"] or other["side"] == unit["side"]:
            continue
        d = (other["x"] - unit["x"]) * unit["side"]
        if -8 < d < best_d:
            best_d = d
            best = other
    if not best:
        return None, None
    return best, abs(best["x"] - unit["x"])


def friendly_ahead(st, unit):
    for other in st["units"]:
        if other["dead"] or other is unit or other["side"] != unit["side"]:
            continue
        d = (other["x"] - unit["x"]) * unit["side"]
        if 2 < d < 14 and abs(other["y"] - unit["y"]) < 10:
            return True
    return False


def hurt_unit(st, unit, amount):
    unit["hp"] -= amount
    if unit["hp"] <= 0:
        unit["dead"] = True
        bounty = round(UNIT_DEFS[unit["type"]]["cost"] * 0.42)
        if unit["side"] == -1:
            st["gold"] += bounty
        else:
            st["egold"] += bounty


def hurt_base(st, side, amount):
    if side == -1:
        st["ehp"] = max(0, st["ehp"] - amount)
    else:
        st["php"] = max(0, st["php"] - amount)


def fire(st, fx, fy, tx, ty, dmg, side):
    if len(st["shots"]) > 48:
        return
    dx, dy = tx - fx, ty - fy
    ln = math.hypot(dx, dy) or 1
    st["shots"].append(
        dict(x=fx, y=fy, vx=dx / ln * 420, vy=dy / ln * 420, dmg=dmg, side=side, life=0.9)
    )


def step_units(st, dt):
    for unit in st["units"]:
        if unit["dead"]:
            continue
        d = UNIT_DEFS[unit["type"]]
        foe, fdist = nearest_enemy(st, unit)
        base_x = ENEMY_BASE_X if unit["side"] == 1 else PLAYER_BASE_X
        base_dist = abs(base_x - unit["x"])
        target_dist = fdist if foe else base_dist
        in_range = target_dist <= d["range"] + 4
        unit["cd"] = max(0, unit["cd"] - dt)
        if in_range and (foe or base_dist <= d["range"] + 8):
            if unit["cd"] <= 0:
                dmg = d["atk"]
                if foe and fdist <= d["range"] + 4:
                    if d["kind"] == "range":
                        fire(
                            st,
                            unit["x"] + unit["side"] * 10,
                            unit["y"] - 18,
                            foe["x"],
                            foe["y"] - 16,
                            dmg,
                            unit["side"],
                        )
                    else:
                        hurt_unit(st, foe, dmg)
                else:
                    siege = dmg * d["siege"]
                    if d["kind"] == "range":
                        fire(
                            st,
                            unit["x"] + unit["side"] * 10,
                            unit["y"] - 18,
                            base_x,
                            GROUND - 70,
                            siege,
                            unit["side"],
                        )
                    else:
                        hurt_base(st, -1 if unit["side"] == 1 else 1, siege)
                unit["cd"] = d["reload"]
        elif d["kind"] == "range" or not friendly_ahead(st, unit):
            unit["x"] += unit["side"] * d["speed"] * dt
            unit["x"] = max(PLAYER_BASE_X + 20, min(ENEMY_BASE_X - 20, unit["x"]))


def step_shots(st, dt):
    keep = []
    for s in st["shots"]:
        s["x"] += s["vx"] * dt
        s["y"] += s["vy"] * dt
        s["life"] -= dt
        if s["side"] == 1 and abs(s["x"] - ENEMY_BASE_X) < 22 and s["y"] < GROUND:
            hurt_base(st, -1, s["dmg"])
            continue
        if s["side"] == -1 and abs(s["x"] - PLAYER_BASE_X) < 22 and s["y"] < GROUND:
            hurt_base(st, 1, s["dmg"])
            continue
        hit = None
        hit_d = 18
        for u in st["units"]:
            if u["dead"] or u["side"] == s["side"]:
                continue
            dist = abs(u["x"] - s["x"]) + abs(u["y"] - 16 - s["y"]) * 0.4
            if dist < hit_d:
                hit_d = dist
                hit = u
        if hit:
            hurt_unit(st, hit, s["dmg"])
        elif s["life"] > 0 and 20 < s["x"] < 1260:
            keep.append(s)
    st["shots"] = keep


def step_turret(st, dt, side):
    key = "pReload" if side == 1 else "eReload"
    level = st["turret"] if side == 1 else st["eturret"]
    stat = TURRET_STATS[level]
    st[key] -= dt
    if st[key] > 0:
        return
    ox = PLAYER_BASE_X + 18 if side == 1 else ENEMY_BASE_X - 18
    best = None
    best_d = stat["range"]
    for u in st["units"]:
        if u["dead"] or u["side"] == side:
            continue
        d = abs(u["x"] - ox)
        if d < best_d:
            best_d = d
            best = u
    if best:
        fire(st, ox, GROUND - 92, best["x"], best["y"] - 14, stat["dmg"], side)
        st[key] = stat["reload"]


def step_ai(st, dt, rng):
    spec = st["spec"]
    st["aiWait"] -= dt
    if st["elapsed"] > spec["enemyAgeAt"] and st["eage"] < spec["enemyMaxAge"]:
        need = AGE_COST[st["eage"] + 1]
        if st["egold"] >= need:
            st["egold"] -= need
            st["eage"] += 1
    if st["eturret"] < min(3, st["eage"] + 1) and st["egold"] > TURRET_COST[st["eturret"] + 1] * 1.3:
        st["egold"] -= TURRET_COST[st["eturret"] + 1]
        st["eturret"] += 1
    if st["aiWait"] > 0:
        return
    st["aiWait"] = spec["aiGap"] + rng.random() * 0.35
    if rng.random() < spec["aiSave"]:
        return
    pick = ai_pick(st["eage"], rng)
    d = UNIT_DEFS[pick]
    if st["egold"] >= d["cost"]:
        st["egold"] -= d["cost"]
        spawn(st, -1, pick, rng.randrange(3))


def player_act(st, style, rng):
    if st["age"] < 2 and style in ("balanced", "siege", "aggressive"):
        need = AGE_COST[st["age"] + 1]
        thr = 1.0 if style == "aggressive" else 1.05
        if st["gold"] >= need * thr and st["elapsed"] > 8 and st["gold"] - need >= 30:
            st["gold"] -= need
            st["age"] += 1
            return
    if (
        st["turret"] < min(2, st["age"] + 1)
        and style in ("balanced", "siege")
        and st["gold"] > TURRET_COST[st["turret"] + 1] * 1.2
    ):
        st["gold"] -= TURRET_COST[st["turret"] + 1]
        st["turret"] += 1
        return
    if st["pWait"] > 0:
        return
    pool = available(st["age"])
    if style == "spear_spam":
        pick = "spear" if "spear" in pool else pool[0]
    elif style == "siege":
        if st["age"] >= 2 and "ram" in pool and st["gold"] >= UNIT_DEFS["ram"]["cost"]:
            pick = "ram"
        else:
            prefer = [u for u in ("ram", "banner", "shield", "spear", "ballista") if u in pool]
            pick = prefer[0] if prefer else pool[0]
    elif style == "aggressive":
        prefer = [u for u in ("scout", "rider", "spear", "banner") if u in pool]
        pick = rng.choice(prefer) if prefer else rng.choice(pool)
    else:
        prefer = [u for u in ("spear", "shield", "archer", "ram", "scout") if u in pool]
        bag = []
        for u in prefer:
            w = 4 if u == "spear" else (3 if u in ("shield", "ram") else 2)
            bag.extend([u] * w)
        pick = rng.choice(bag) if bag else rng.choice(pool)
    d = UNIT_DEFS[pick]
    if st["gold"] >= d["cost"] and spawn(st, 1, pick, rng.randrange(3)):
        st["gold"] -= d["cost"]
        st["pWait"] = 0.4 if style == "spear_spam" else 0.6
    else:
        st["pWait"] = 0.2


def simulate(battle_idx, style, seed, max_t=300.0):
    rng = random.Random(seed)
    spec = BATTLES[battle_idx]
    st = {
        "spec": spec,
        "gold": spec["playerGold"],
        "egold": spec["enemyGold"],
        "income": spec["playerIncome"],
        "eincome": spec["enemyIncome"],
        "php": spec["playerHp"],
        "ehp": spec["enemyHp"],
        "age": 0,
        "eage": spec["enemyStartAge"],
        "turret": 0,
        "eturret": 0,
        "elapsed": 0.0,
        "aiWait": 0.6,
        "pWait": 0.2,
        "pReload": 0.5,
        "eReload": 0.5,
        "units": [],
        "shots": [],
    }
    dt = 1 / 20
    while st["elapsed"] < max_t:
        st["elapsed"] += dt
        st["gold"] += st["income"] * dt
        st["egold"] += st["eincome"] * dt
        st["pWait"] = max(0.0, st["pWait"] - dt)
        player_act(st, style, rng)
        step_ai(st, dt, rng)
        step_units(st, dt)
        step_shots(st, dt)
        step_turret(st, dt, 1)
        step_turret(st, dt, -1)
        if any(u["dead"] for u in st["units"]):
            st["units"] = [u for u in st["units"] if not u["dead"]]
        if st["ehp"] <= 0:
            return "win", st["elapsed"]
        if st["php"] <= 0:
            return "lose", st["elapsed"]
    return "timeout", st["elapsed"]


def main():
    styles = ["spear_spam", "balanced", "siege", "aggressive"]
    n = 24
    t0 = time.time()
    print(f"Monte Carlo win rates (N={n}, max 300s, dt=1/20, unitCap={MAX_UNITS})")
    print("battle\t" + "\t".join(styles))
    summary = {}
    for bi, battle in enumerate(BATTLES):
        row = []
        for style in styles:
            wins = 0
            times = []
            for i in range(n):
                res, t = simulate(bi, style, seed=bi * 10007 + i * 97 + (hash(style) % 997))
                if res == "win":
                    wins += 1
                    times.append(t)
            wr = wins / n
            row.append(wr)
            summary[(bi, style)] = (wr, statistics.mean(times) if times else None)
        print(f"{bi}:{battle['name']}\t" + "\t".join(f"{w:.0%}" for w in row))
    print("\nAvg win across battles by style:")
    for style in styles:
        avg = statistics.mean(summary[(i, style)][0] for i in range(8))
        print(f"  {style}: {avg:.0%}")
    print(f"\nelapsed {time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()
