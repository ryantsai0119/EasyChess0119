# Technical Director Review — 青銅前線

**Stack verdict:** Custom Canvas 2D + Web Audio IIFE is the right engine for this scope. Do not migrate to Unity/Godot/Phaser for a single-lane recruit-and-push web game.

## Performance budget (web / mid laptop)

| System | Budget | Notes |
|--------|--------|-------|
| Frame total | 16.67ms (60fps) | `requestAnimationFrame` |
| Simulation | ≤3ms | Fixed `1/60` steps, dt spiral capped at 0.25s |
| Render | ≤8ms | Immediate-mode Canvas redraw of 1280×720 logical world |
| DOM HUD | ≤0.5ms | Dirty-flag updates only (not every frame) |
| Audio | ≤1ms | Web Audio oscillators; SFX gated |

Measured on Pages deploy (pre-fix, ~22 units): ~60.3 fps, p95 ≈17.1ms. Headroom is fine at current entity counts (~40 units ceiling for AoW-style lanes).

## Engine architecture (accepted)

- **Sim/render split:** `tick(FIXED_DT)` then `drawField()`; hit-stop freezes sim, FX still drip.
- **No physics engine:** 1D lane + range checks. Correct for the fantasy.
- **Art/audio modules:** `BronzeArt` / `BronzeAudio` keep draw/SFX out of rules code.
- **Persistence:** `localStorage` key `bronze-front-v1` (unlocked + mute).

## Fixes landed in this pass

1. **HUD dirty updates** — gold/age/buttons no longer rewrite DOM 60×/sec (main fluidity risk on low-end).
2. **Fixed timestep** — accumulator + `1/60` steps; avoids spiral-of-death with 0.25s clamp.
3. **Deferred unit compact** — deaths mark `dead`, compact once per step (no mid-loop `filter`/`indexOf`).
4. **Campaign clear sentinel** — `unlocked` may be `9` so “八場都過了” can actually appear (`loadProgress` previously clamped to 8).

## Deliberate debt (prudent)

| Item | Interest | When to pay |
|------|----------|-------------|
| Full-scene redraw every frame | Low at ≤40 units | If mobile drops below 50fps |
| O(n²) nearest-enemy scans | Low | If unit cap rises past ~80 |
| AI = weighted random + save chance | Design, not engine | Designer pass for telegraphed pressure |
| No automated perf CI | Medium | Before any store/PWA push |

## Gameplay / feel (engine-adjacent)

- Core loop (earn → recruit → push → age) is load-bearing and readable.
- Hit-stop + shot trails are cheap juice; keep budgets if particle counts grow.
- Progressive dock unlock matches cognitive load; do not dump all 9 units on battle 1.
- Balance curves live in `BATTLES[]` — treat as data, not code forks.

## Recommendation

Ship on GitHub Pages with the custom stack. Next tech investment: a tiny `?perf=1` overlay (frame ms / unit count) before adding VFX, not a new framework.
