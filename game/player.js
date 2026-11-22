// player.js — Wren: sneak slow + quiet, run fast + loud, toss coins.
import { PLAYER_START, insideSolid, inGrass, inLamp } from "./level.js";

export const SNEAK_SPEED = 96;
export const RUN_SPEED = 198;
const RADIUS = 13;

export function makePlayer() {
  return {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    angle: -Math.PI / 2,
    running: false,
    moving: false,
    coins: 3,
    relics: 0,
    // noise 0..1: running near a warden raises suspicion even unseen
    noise: 0,
    hidden: false, // in tall grass
    lit: false, // standing in a lamp pool
    steps: 0, // footstep ring timer
  };
}

// Move with collision: substep so no single step can tunnel through a
// thin wall, trying the full step then sliding along each axis.
export function movePlayer(p, dx, dy, dt) {
  const sp = p.running ? RUN_SPEED : SNEAK_SPEED;
  const len = Math.hypot(dx, dy);
  if (len < 0.01) { p.moving = false; return; }
  p.moving = true;
  const stepX = (dx / len) * sp * dt, stepY = (dy / len) * sp * dt;
  const n = Math.max(1, Math.ceil(Math.hypot(stepX, stepY) / 8));
  p.angle = Math.atan2(dy, dx);
  for (let i = 0; i < n; i++) {
    const nx = stepX / n, ny = stepY / n;
    if (!insideSolid(p.x + nx, p.y, RADIUS)) p.x += nx;
    if (!insideSolid(p.x, p.y + ny, RADIUS)) p.y += ny;
  }
  // keep inside the floor
  p.x = Math.max(18 + RADIUS, Math.min(1262 - RADIUS, p.x));
  p.y = Math.max(82 + RADIUS, Math.min(782 - RADIUS, p.y));
  p.steps += dt * (p.running ? 7 : 3.5);
}

// Refresh derived stealth state after movement.
export function refreshPlayer(p) {
  p.hidden = inGrass(p.x, p.y);
  p.lit = inLamp(p.x, p.y);
  p.noise = p.running && p.moving ? 1 : 0;
}

// A tossed coin lands ahead of the player and rings to pull a warden over.
export function tossCoin(p) {
  if (p.coins <= 0) return null;
  p.coins -= 1;
  const cx = p.x + Math.cos(p.angle) * 120;
  const cy = p.y + Math.sin(p.angle) * 120;
  return {
    x: Math.max(30, Math.min(1250, cx)),
    y: Math.max(90, Math.min(770, cy)),
    t: 0, // age in seconds; rings fade after ~5s
  };
}
