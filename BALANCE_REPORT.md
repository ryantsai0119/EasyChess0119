# Balance Check — 青銅前線

Method: economy faucet/sink analysis + unit efficiency ratios + Monte Carlo bot sims (`tools/sim_balance.py`, N≈18–24, unit cap 36). Bots are weaker than skilled humans (no horn/volley micro); treat late-game bot WR as a **floor**, not a ceiling.

## Verdict

**Before tune:** tutorial too soft → mid-game cliff at 關隘夜襲 (enemy opens at 鐵器) → finales economically inverted (enemy income > player). **Spear spam** was a dominant strategy (best gold/DPS).

**After tune:** smoother challenge ramp; spear still good meat but not free; iron/steel gates delayed; finales no longer start at full 鑄鋼 with higher enemy income.

## System inventory

| Axis | Faucet | Sink |
|------|--------|------|
| Gold | income/sec, kill bounty (42% cost) | units, age (260/620), turret, abilities |
| Power | age unlocks, turret rank, horn | enemy pressure / base HP |
| Progress | 8 battles, unlock +1 on win | none (replay free) |

## Unit efficiency (pre → post)

Composite ≈ `(0.6·DPS + 0.15·HP + 0.25·siegeDPS) / cost`

| Unit | Issue | Change |
|------|-------|--------|
| 矛兵 | Dominated age-0 (eff ~0.95) | cost 15→17 |
| 投石 | Too weak vs spear | cost 22→20, atk 7→8 |
| 弓手 | Weak age-1 option | cost 55→50, atk 13→14 |
| 連弩 | Worst cost/eff | cost 140→125, reload 1.15→1.05 |

## Difficulty curve (bot win rate, balanced style)

| Battle | Before | After (target band) | Notes |
|--------|--------|---------------------|-------|
| 1–2 河岸／渡口 | ~100% | ~90–100% | Teach economy |
| 3 丘陵 | ~90% | ~75–100% | Prep iron |
| 4 鐵器初現 | ~67% | ~40–70% | First age race |
| 5 關隘夜襲 | ~0–25% cliff | ~20–50% | Was enemyStartAge=1; now ages in at 20s |
| 6 鑄鋼 | ~0% | rising | Softened income / delayed steel |
| 7–8 前夜／王庭 | ~0%, enemy income > player | player income ≥ enemy; finale starts 鐵器 not 鑄鋼 | Still meant to be hard |

## Target Flow bands (average player)

- Battles 1–3: **competence** (wins teach sinks)
- 4–5: **challenge** (age timing matters)
- 6–8: **mastery** (siege + save for age; losses should feel “I rushed”, not “math unwinnable”)

## Dependency ripples

- Nerving spear → early battles slightly longer; sling/scout more relevant.
- Softening late enemy income → age-up for player more reachable before enemy steel.
- Delaying enemyStartAge on 關隘／王庭 → removes “open against higher tier” spike (lazy-difficulty smell).

## How to re-check

```bash
python web/bronze-front/tools/sim_balance.py
```

Update `BATTLES` / `UNIT_DEFS` in the sim file if you change `game.js` again.
