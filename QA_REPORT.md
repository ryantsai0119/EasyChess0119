# QA Report — 青銅前線

Tester role: QA Lead smoke + functional + art defect triage  
Build: Pages `?v=20260829d` / branch `cursor/bronze-qa-art-37b9`

## Release gate (web prototype)

| Gate | Result |
|------|--------|
| Smoke (title → battle → leave) | **PASS** |
| Core loop (recruit / age / turret / horn / pause) | **PASS** |
| Win / lose overlays + again | **PASS** |
| Keyboard 1-recruit / Esc pause | **PASS** |
| No console errors in stress ticks | **PASS** |
| Art: unit silhouette distinctiveness | **FIXED** (was FAIL / S2 immersion) |

## Bug log

| ID | Severity | Freq | Priority | Status | Summary |
|----|----------|------|----------|--------|---------|
| QA-01 | S2 immersion | F1 | P1 | **Fixed** | Infantry silhouettes shared same stick body; battlefield reads as anonymous blobs |
| QA-02 | S3 UX | F1 | P2 | **Fixed** | Pause mute labels `聲音開/關` ambiguous; mute state could desync vs `localStorage` when battle restarts without full reload |
| QA-03 | S4 | F2 | P3 | Open | Dirty HUD means affordance buttons update next frame after huge gold cheats (not player-visible in normal income tick) |
| QA-04 | S4 | F3 | P4 | Open | No mute control on title screen (only in pause) — discoverability |

## Test notes

- Progress text depends on `localStorage` unlock; fresh profile shows「第 1 戰 · 河岸斥候」.
- Age/turret clicks require enabled buttons — gold must refresh HUD (≥1 frame). Normal play is fine.
- Art fix: per-type exaggerated silhouettes (shield wall, raised sling, cloaked scout, bow+quiver, banner cape, etc.) + larger battlefield scale.

## Suggested next playtest

1. Cold load → 開戰 → distinguish 矛/投石/斥候 at a glance on the road  
2. Mute in pause → refresh page → confirm bed stays muted  
3. Win battle 1 → unlock flow → start battle 2 from campaign list  
