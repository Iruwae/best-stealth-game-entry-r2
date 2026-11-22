// guards.js — the three Night Wardens: patrol, pause, investigate, chase.
import { PATROLS, losBlocked } from "./level.js";

export const CONE_RANGE = 235;
export const CONE_HALF = 0.56; // radians, ~32 degrees each side
const PATROL_SPEED = 58;
const CHASE_SPEED = 132;
const INVESTIGATE_SPEED = 95;
const PAUSE_TIME = 1.7;

export function makeGuards() {
  return PATROLS.map(p => ({
    name: p.name,
    color: p.color,
    waypoints: p.waypoints,
    wp: 0,
    x: p.waypoints[0][0],
    y: p.waypoints[0][1],
    angle: 0,
    pause: 1.2,
    // state: "calm" | "suspicious" | "spotted"
    state: "calm",
    suspicion: 0, // 0..1 while calm; 1 tips into suspicious
    investigate: null, // {x, y, t} when walking to a heard coin / last seen spot
    chaseT: 0,
    heard: null, // coin position currently being investigated
  }));
}

// Steer a guard toward (tx, ty) at speed; returns true when arrived.
function stepToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) return true;
  const s = Math.min(speed * dt, d);
  g.x += (dx / d) * s;
  g.y += (dy / d) * s;
  g.angle = Math.atan2(dy, dx);
  return d - s < 4;
}

export function updateGuard(g, dt, player, coin) {
  if (g.state === "spotted") {
    g.chaseT -= dt;
    stepToward(g, player.x, player.y, CHASE_SPEED, dt);
    if (g.chaseT <= 0) {
      g.state = "suspicious";
      g.suspicion = 0.6;
      g.investigate = { x: player.x, y: player.y, t: 3 };
    }
    return;
  }

  if (g.investigate) {
    const arrived = stepToward(g, g.investigate.x, g.investigate.y, INVESTIGATE_SPEED, dt);
    if (arrived) {
      g.investigate.t -= dt;
      // look around while searching
      g.angle += dt * 1.6;
      if (g.investigate.t <= 0) {
        g.investigate = null;
        g.heard = null;
        g.state = "calm";
        g.suspicion = 0;
      }
    }
    return;
  }

  if (g.state === "suspicious") {
    // A suspicious warden walks to where it last saw / heard something.
    if (g.investigate) return;
    g.suspicion = Math.max(0, g.suspicion - dt * 0.12);
    if (g.suspicion <= 0) g.state = "calm";
  }

  // Calm patrol: walk waypoints, pausing at each one so routes stay learnable.
  if (g.pause > 0) {
    g.pause -= dt;
    return;
  }
  const [tx, ty] = g.waypoints[g.wp];
  if (stepToward(g, tx, ty, PATROL_SPEED, dt)) {
    g.wp = (g.wp + 1) % g.waypoints.length;
    g.pause = PAUSE_TIME;
  }
}

// A tossed coin pulls the nearest calm/suspicious warden off patrol.
export function distractGuards(guards, coin) {
  let best = null, bestD = 340;
  for (const g of guards) {
    if (g.state === "spotted") continue;
    const d = Math.hypot(g.x - coin.x, g.y - coin.y);
    if (d < bestD) { best = g; bestD = d; }
  }
  if (best) {
    best.heard = { x: coin.x, y: coin.y };
    best.investigate = { x: coin.x, y: coin.y, t: 4 };
    if (best.state === "calm") { best.state = "suspicious"; best.suspicion = 0.45; }
  }
  return best;
}

// Can this guard see point (x, y)? Cone + range + line of sight.
export function guardSees(g, x, y) {
  const dx = x - g.x, dy = y - g.y;
  const d = Math.hypot(dx, dy);
  if (d > CONE_RANGE) return false;
  if (d > 12) {
    let a = Math.atan2(dy, dx) - g.angle;
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    if (Math.abs(a) > CONE_HALF) return false;
  }
  return !losBlocked(g.x, g.y, x, y);
}
