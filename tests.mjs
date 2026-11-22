// tests.mjs — logic tests for the pure modules (no DOM needed).
// Run: node tests.mjs   (exit 0 = all pass)
import { WALLS, COVER, GRASS, LAMPS, RELICS, EXIT, PATROLS, PLAYER_START,
         insideSolid, losBlocked, inGrass, inLamp } from "./game/level.js";
import { makeGuards, updateGuard, distractGuards, guardSees } from "./game/guards.js";
import { makePlayer, movePlayer, refreshPlayer, tossCoin } from "./game/player.js";
import { makeDetection, updateDetection, isCaught } from "./game/detection.js";
import { formatTime } from "./game/hud.js";

let pass = 0, fail = 0;
function check(name, ok) {
  if (ok) { pass++; console.log("ok  " + name); }
  else { fail++; console.log("FAIL " + name); }
}

// level geometry
check("3 patrols, 3 relics, 5 lamps", PATROLS.length === 3 && RELICS.length === 3 && LAMPS.length === 5);
check("walls + cover all solid", WALLS.length > 0 && COVER.length >= 15);
check("player start is on open floor", !insideSolid(PLAYER_START.x, PLAYER_START.y, 14));
check("relic spots are on open floor", RELICS.every(r => !insideSolid(r.x, r.y, 14)));
check("exit is on open floor", !insideSolid(EXIT.x + 28, EXIT.y + 28, 0));
check("door gaps are open (entry->gallery)", !losBlocked(400, 420, 450, 420));
check("wall blocks sight (through divider)", losBlocked(100, 200, 500, 200));
check("grass detection", inGrass(120, 600) && !inGrass(600, 600));
check("lamp detection", inLamp(220, 150) && !inLamp(600, 600));

// guards
const guards = makeGuards();
check("3 guards made, all calm", guards.length === 3 && guards.every(g => g.state === "calm"));
const g0 = guards[0];
check("guard sees player in open cone", (() => {
  g0.x = 200; g0.y = 200; g0.angle = 0;
  return guardSees(g0, 300, 200);
})());
check("guard does NOT see behind (outside cone)", !guardSees(g0, 100, 200));
check("guard does NOT see through a wall", (() => {
  g0.x = 100; g0.y = 200; g0.angle = 0;
  return !guardSees(g0, 500, 200); // divider wall at x 420 blocks
})());
check("patrol advances along waypoints", (() => {
  const g = makeGuards()[1];
  g.pause = 0;
  const x0 = g.x;
  for (let i = 0; i < 300; i++) updateGuard(g, 1 / 60, makePlayer(), null);
  return g.x !== x0 || g.wp !== 0;
})());
check("coin distracts nearest guard", (() => {
  const gs = makeGuards();
  const coin = { x: 500, y: 200, t: 0 };
  const d = distractGuards(gs, coin);
  return d && d.investigate && d.state === "suspicious";
})());

// player
const p = makePlayer();
check("player starts with 3 coins, 0 relics", p.coins === 3 && p.relics === 0);
check("player moves", (() => {
  const x0 = p.x, y0 = p.y;
  movePlayer(p, 1, 0, 0.5);
  return p.x > x0 && p.y === y0;
})());
check("player cannot walk through a wall", (() => {
  const q = makePlayer();
  q.x = 400; q.y = 200; // just west of the divider wall
  movePlayer(q, 1, 0, 1);
  return q.x < 420;
})());
check("sneak is slower than run", (() => {
  const a = makePlayer(); a.x = 100; a.y = 700;
  const b = makePlayer(); b.x = 100; b.y = 700; b.running = true;
  movePlayer(a, 1, 0, 1); movePlayer(b, 1, 0, 1);
  return b.x > a.x;
})());
check("coin toss spends a coin and lands ahead", (() => {
  const q = makePlayer();
  q.angle = 0;
  const c = tossCoin(q);
  return q.coins === 2 && c && c.x > q.x;
})());
check("no coin when broke", (() => {
  const q = makePlayer();
  q.coins = 0;
  return tossCoin(q) === null;
})());
check("grass hides, lamp lights", (() => {
  const q = makePlayer();
  q.x = 120; q.y = 600; refreshPlayer(q);
  const inG = q.hidden;
  q.x = 220; q.y = 150; refreshPlayer(q);
  return inG && q.lit;
})());

// detection: 3 states + recovery
check("suspicion rises in the open, lit", (() => {
  const gs = makeGuards();
  const pl = makePlayer();
  pl.x = 300; pl.y = 200; pl.lit = true;
  gs[0].x = 200; gs[0].y = 200; gs[0].angle = 0; gs[0].pause = 9;
  const det = makeDetection();
  for (let i = 0; i < 120; i++) updateDetection(det, gs, pl, 1 / 60);
  return gs[0].suspicion > 0.8;
})());
check("suspicion drains out of sight (recovery)", (() => {
  const gs = makeGuards();
  const pl = makePlayer();
  gs[0].suspicion = 0.9; gs[0].state = "suspicious";
  pl.x = 60; pl.y = 730; // far away, out of cone
  gs[0].x = 1200; gs[0].y = 200; gs[0].angle = Math.PI;
  const det = makeDetection();
  for (let i = 0; i < 600; i++) updateDetection(det, gs, pl, 1 / 60);
  return gs[0].suspicion < 0.1 && gs[0].state === "calm";
})());
check("grass conceals at range", (() => {
  const gs = makeGuards();
  const pl = makePlayer();
  pl.x = 150; pl.y = 620; pl.hidden = true; // in entry grass
  gs[0].x = 150; gs[0].y = 450; gs[0].angle = Math.PI / 2; gs[0].pause = 9;
  const det = makeDetection();
  for (let i = 0; i < 120; i++) updateDetection(det, gs, pl, 1 / 60);
  return gs[0].suspicion < 0.2;
})());
check("spotted guard chases, catch triggers", (() => {
  const gs = makeGuards();
  const pl = makePlayer();
  gs[0].state = "spotted"; gs[0].chaseT = 4;
  gs[0].x = pl.x + 20; gs[0].y = pl.y;
  return isCaught(gs, pl);
})());
check("no false catch at distance", (() => {
  const gs = makeGuards();
  const pl = makePlayer();
  gs[0].state = "spotted";
  gs[0].x = pl.x + 200; gs[0].y = pl.y;
  return !isCaught(gs, pl);
})());

// hud
check("clock formats", formatTime(0) === "00:00" && formatTime(227) === "03:47" && formatTime(72) === "01:12");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
