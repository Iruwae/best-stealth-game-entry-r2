# VELVET HOUR — The Gilded Vault

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Iruwae/best-stealth-game-entry-r2/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Iruwae/best-stealth-game-entry-r2/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**VELVET HOUR — steal the three Gilded Relics and vanish before dawn.** A top-down
night-museum stealth game: Wren slips through The Gilded Vault past 3 Night Wardens
with distinct patrol loops and pauses. 3-state detection (calm / suspicious "?" /
spotted "!") with recovery by breaking line of sight. Run fast and loud, or sneak
slow and quiet. Toss a coin to pull a warden off patrol. Lamp pools light you up;
shadow and tall grass keep you safe. Steal all 3 relics, reach the exit hatch, and
earn the Ghost rating if no warden ever spots — or even suspects — you.

## The stealth systems

- **3 Night Wardens** (Ash, Rue, Mire) — patrol waypoints with pauses, filled
  translucent vision cones, hearing rings, investigate-then-return behaviour.
- **Light vs shadow** — standing in a warm lamp pool makes wardens spot you from
  afar; in shadow suspicion rises slowly. Tall grass hides you unless a warden
  is very close.
- **Sound** — running is fast but loud (expanding footstep rings, noise meter);
  sneaking is slow and quiet. A tossed coin (C, limited to 3) rings and pulls the
  nearest warden off patrol to investigate.
- **Detection with recovery** — suspicion climbs in a cone, tips into "?" then
  "!", and drains when you break line of sight. A spotting warden chases; if it
  touches you, you are caught.
- **FIELD NOTES legend + cover callouts** — the game itself draws the legend and
  the annotated cover labels, so the screenshots teach the loop at a glance.

## Play it

Open `game/index.html` in desktop Chrome. No network, no build step.

- **WASD / arrows** — move (sneak)
- **SHIFT** — run (fast, LOUD)
- **C** — toss a coin (distraction)
- **H** — toggle the FIELD NOTES panel
- **ENTER** — begin · **R** — restart

Staged screenshot modes (real renders of the game's own code):
`?shot=cover` (annotated full level), `?shot=play` (mid-play behind cover),
`?shot=near` (near-miss, "?" + high alarm), `?shot=win` (Ghost rating).

## Structure

Single-job files, named for what they do: `game/main.js` (loop + staged shots),
`game/level.js` (rooms, walls, cover, lamps, grass, relics, exit, patrols),
`game/guards.js` (patrol / investigate / chase), `game/player.js` (move, run,
sneak, coin toss), `game/detection.js` (3-state alarm + recovery),
`game/render.js` (all drawn art, HUD, FIELD NOTES, callouts),
`game/hud.js`, `game/audio.js` (synthesized cues, no assets), `game/input.js`.
`main.ts` at the repo root copies `game/` + `screenshots/` and writes the
dossier via `vendor/makefun-game.ts`.

## Run the logic tests

```sh
node tests.mjs   # 28 checks: geometry, patrols, sight, detection, recovery
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=817k0hr2&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
