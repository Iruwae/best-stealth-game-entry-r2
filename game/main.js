// main.js — VELVET HOUR game loop: menu -> heist -> caught / win.
// Staged screenshot modes via ?shot=cover|play|near|win render a fixed,
// fully-playable-looking frame from the game's own code (real renders).
import { RELICS, EXIT } from "./level.js";
import { makeGuards, updateGuard, distractGuards } from "./guards.js";
import { makePlayer, movePlayer, refreshPlayer, tossCoin } from "./player.js";
import { makeDetection, updateDetection, isCaught } from "./detection.js";
import { render } from "./render.js";
import { makeInput } from "./input.js";
import { formatTime } from "./hud.js";
import { footstep, coinRing, alarm, relicChime, winChime } from "./audio.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const params = new URLSearchParams(location.search);
const SHOT = params.get("shot") || "";

function freshState() {
  return {
    phase: "menu", // menu | play | caught | win
    player: makePlayer(),
    guards: makeGuards(),
    relics: RELICS.map(r => ({ ...r })),
    coin: null,
    det: makeDetection(),
    elapsed: 0,
    showNotes: true,
    shot: SHOT,
    time: "00:00",
    _stepSnd: 0,
    _wasSpotted: false,
  };
}

let s = freshState();

// ---- staged screenshot states (fixed frames, drawn by the same code) ----
function stageCover() {
  s.phase = "play";
  s.player.x = 300; s.player.y = 330;
  s.player.coins = 3; s.player.relics = 0;
  s.elapsed = 0;
  const [ash, rue, mire] = s.guards;
  ash.x = 300; ash.y = 150; ash.angle = Math.PI / 2; ash.pause = 9;
  rue.x = 760; rue.y = 240; rue.angle = Math.PI / 2; rue.pause = 9;
  rue.state = "suspicious"; rue.suspicion = 0.5;
  rue.investigate = { x: 760, y: 268, t: 9 };
  s.coin = { x: 760, y: 268, t: 1.2 };
  mire.x = 1100; mire.y = 200; mire.angle = Math.PI; mire.pause = 9;
  s.det.level = 0.5;
  s.det.banner = "A WARDEN IS SUSPICIOUS";
  s.det.suspiciousCount = 1;
  refreshPlayer(s.player);
}

function stagePlay() {
  s.phase = "play";
  s.player.x = 520; s.player.y = 470;
  s.player.coins = 2; s.player.relics = 1;
  s.relics[0].taken = true;
  s.elapsed = 72;
  const [ash, rue, mire] = s.guards;
  ash.x = 200; ash.y = 300; ash.angle = 0.3; ash.pause = 9;
  rue.x = 640; rue.y = 380; rue.angle = Math.PI * 0.75; rue.pause = 9;
  mire.x = 1000; mire.y = 300; mire.angle = -Math.PI / 2; mire.pause = 9;
  s.det.level = 0.2;
  refreshPlayer(s.player);
}

function stageNear() {
  s.phase = "play";
  s.player.x = 760; s.player.y = 660;
  s.player.coins = 1; s.player.relics = 2;
  s.relics[0].taken = true; s.relics[1].taken = true;
  s.elapsed = 151;
  const [ash, rue, mire] = s.guards;
  ash.x = 200; ash.y = 500; ash.angle = 0; ash.pause = 9;
  rue.x = 700; rue.y = 480; rue.angle = Math.PI / 2; rue.pause = 9;
  rue.state = "suspicious"; rue.suspicion = 0.78;
  mire.x = 1080; mire.y = 600; mire.angle = Math.PI; mire.pause = 9;
  s.det.level = 0.78;
  s.det.banner = "A WARDEN IS SUSPICIOUS";
  s.det.suspiciousCount = 1;
  refreshPlayer(s.player);
}

function stageWin() {
  s.phase = "win";
  s.player.x = 1200; s.player.y = 720;
  s.player.coins = 2; s.player.relics = 3;
  s.relics.forEach(r => { r.taken = true; });
  s.elapsed = 227;
  s.det.spottedCount = 0;
  s.det.suspiciousCount = 0;
  refreshPlayer(s.player);
}

if (SHOT === "cover") stageCover();
else if (SHOT === "play") stagePlay();
else if (SHOT === "near") stageNear();
else if (SHOT === "win") stageWin();

// ---- live loop ----
const input = makeInput();
let last = performance.now();
let t = 0;

function restart() {
  s = freshState();
  s.phase = "play";
  if (SHOT) {
    if (SHOT === "cover") stageCover();
    else if (SHOT === "play") stagePlay();
    else if (SHOT === "near") stageNear();
    else if (SHOT === "win") stageWin();
  }
}

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  t += dt;

  const staged = SHOT !== "";
  if (!staged && s.phase === "play") {
    s.elapsed += dt;
    const [ax, ay] = input.axis();
    s.player.running = input.running();
    movePlayer(s.player, ax, ay, dt);
    refreshPlayer(s.player);

    if (s.player.moving) {
      s._stepSnd += dt * (s.player.running ? 2.4 : 1.4);
      if (s._stepSnd > 1) { s._stepSnd = 0; footstep(s.player.running); }
    }

    if (input.was("c")) {
      const coin = tossCoin(s.player);
      if (coin) {
        s.coin = coin;
        distractGuards(s.guards, coin);
        coinRing();
      }
    }
    if (s.coin) {
      s.coin.t += dt;
      if (s.coin.t > 5) s.coin = null;
    }

    for (const g of s.guards) updateGuard(g, dt, s.player, s.coin);
    updateDetection(s.det, s.guards, s.player, dt);
    if (s.det.spotted && !s._wasSpotted) alarm();
    s._wasSpotted = s.det.spotted;

    // pick up relics
    for (const r of s.relics) {
      if (!r.taken && Math.hypot(s.player.x - r.x, s.player.y - r.y) < 28) {
        r.taken = true;
        s.player.relics += 1;
        relicChime();
      }
    }
    // reach the exit once all relics are held
    if (s.player.relics >= 3 &&
        s.player.x > EXIT.x - 6 && s.player.x < EXIT.x + EXIT.w + 6 &&
        s.player.y > EXIT.y - 6 && s.player.y < EXIT.y + EXIT.h + 6) {
      s.phase = "win";
      winChime();
    }
    if (isCaught(s.guards, s.player)) s.phase = "caught";
  }

  if (!staged) {
    if (input.was("enter") && s.phase === "menu") s.phase = "play";
    if (input.was("r") && (s.phase === "caught" || s.phase === "win")) restart();
    if (input.was("h")) s.showNotes = !s.showNotes;
  }

  s.time = formatTime(s.elapsed);
  render(ctx, s, t);
  requestAnimationFrame(tick);
}

// Exposed for automated checks: live state + a way to force a fresh run.
window.__VELVET__ = {
  get state() { return s; },
  restart,
};

requestAnimationFrame(tick);
