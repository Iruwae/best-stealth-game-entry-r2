// level.js — the Gilded Vault: rooms, walls, cover, lamps, grass, relics, exit.
// Canvas is 1280x800. HUD bar occupies y 0..64; the playable floor is y 72..792.
export const W = 1280, H = 800, HUD_H = 64;

// Walls are solid rectangles that block movement and line of sight.
// Doors are simply gaps between wall segments.
export const WALLS = [
  // outer border
  { x: 8, y: 72, w: 1264, h: 10 },
  { x: 8, y: 782, w: 1264, h: 10 },
  { x: 8, y: 72, w: 10, h: 720 },
  { x: 1262, y: 72, w: 10, h: 720 },
  // divider Entry Hall | Gallery (door gap y 380..460)
  { x: 420, y: 72, w: 16, h: 308 },
  { x: 420, y: 460, w: 16, h: 332 },
  // divider Gallery | Vault (door gap y 480..560)
  { x: 860, y: 72, w: 16, h: 408 },
  { x: 860, y: 560, w: 16, h: 232 },
  // low gallery partition, south (door gap x 600..680)
  { x: 436, y: 600, w: 164, h: 14 },
  { x: 680, y: 600, w: 180, h: 14 },
];

// Cover furniture. kind: shelf | crate | statue | planter | pedestal.
// All of these block line of sight (and movement) — crouch behind them.
export const COVER = [
  // Entry Hall
  { kind: "shelf", x: 40, y: 96, w: 180, h: 26 },
  { kind: "statue", x: 130, y: 210, w: 44, h: 44 },
  { kind: "crate", x: 250, y: 280, w: 52, h: 52 },
  { kind: "crate", x: 306, y: 280, w: 52, h: 52 },
  { kind: "crate", x: 278, y: 336, w: 52, h: 52 },
  { kind: "planter", x: 60, y: 470, w: 46, h: 46 },
  { kind: "planter", x: 340, y: 640, w: 46, h: 46 },
  // Gallery
  { kind: "shelf", x: 480, y: 100, w: 150, h: 26 },
  { kind: "shelf", x: 660, y: 100, w: 150, h: 26 },
  { kind: "statue", x: 618, y: 300, w: 44, h: 44 },
  { kind: "crate", x: 480, y: 420, w: 52, h: 52 },
  { kind: "crate", x: 536, y: 420, w: 52, h: 52 },
  { kind: "pedestal", x: 760, y: 180, w: 40, h: 40 },
  { kind: "planter", x: 470, y: 660, w: 46, h: 46 },
  { kind: "planter", x: 800, y: 660, w: 46, h: 46 },
  // Vault
  { kind: "shelf", x: 920, y: 100, w: 150, h: 26 },
  { kind: "statue", x: 1130, y: 220, w: 44, h: 44 },
  { kind: "crate", x: 960, y: 300, w: 52, h: 52 },
  { kind: "crate", x: 1016, y: 300, w: 52, h: 52 },
  { kind: "pedestal", x: 1180, y: 420, w: 40, h: 40 },
  { kind: "shelf", x: 920, y: 660, w: 150, h: 26 },
  { kind: "planter", x: 900, y: 470, w: 46, h: 46 },
];

// Tall grass: standing inside hides you unless a warden is very close.
export const GRASS = [
  { x: 90, y: 560, w: 190, h: 96 },
  { x: 700, y: 640, w: 130, h: 90 },
  { x: 980, y: 520, w: 150, h: 90 },
  { x: 1100, y: 96, w: 130, h: 70 },
];

// Warm lamp pools. Inside a pool you are LIT: wardens spot you from afar.
// Outside them you are in SHADOW: suspicion rises slowly.
export const LAMPS = [
  { x: 220, y: 150, r: 115 },
  { x: 650, y: 150, r: 115 },
  { x: 1080, y: 150, r: 115 },
  { x: 650, y: 700, r: 105 },
  { x: 240, y: 700, r: 95 },
];

// The three Gilded Relics.
export const RELICS = [
  { id: 0, name: "Sun Idol", x: 640, y: 210, taken: false },
  { id: 1, name: "Moon Chalice", x: 1100, y: 330, taken: false },
  { id: 2, name: "Star Cross", x: 210, y: 640, taken: false },
];

// Exit hatch: opens only once all three relics are held.
export const EXIT = { x: 1200, y: 720, w: 56, h: 56 };

// Patrol loops, one per Night Warden. Guards pause at each waypoint.
export const PATROLS = [
  { name: "Warden Ash", color: "#e5484d", waypoints: [[130, 150], [350, 150], [350, 520], [130, 520]] },
  { name: "Warden Rue", color: "#f76b15", waypoints: [[500, 200], [800, 200], [800, 480], [500, 480]] },
  { name: "Warden Mire", color: "#d6409f", waypoints: [[940, 200], [1200, 200], [1200, 690], [940, 690]] },
];

export const PLAYER_START = { x: 70, y: 730 };

// All solid rectangles (walls + cover) for collision and line of sight.
export function solids() {
  return WALLS.concat(COVER);
}

// Point inside any solid rect (with a small margin).
export function insideSolid(x, y, margin = 0) {
  for (const s of solids()) {
    if (x > s.x - margin && x < s.x + s.w + margin && y > s.y - margin && y < s.y + s.h + margin) return true;
  }
  return false;
}

// Does segment (x1,y1)-(x2,y2) cross any solid? Liang-Barsky clip test.
function segHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return false; }
    else {
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
  }
  return true;
}

export function losBlocked(x1, y1, x2, y2) {
  for (const s of solids()) {
    if (segHitsRect(x1, y1, x2, y2, s)) return true;
  }
  return false;
}

export function inGrass(x, y) {
  return GRASS.some(g => x > g.x && x < g.x + g.w && y > g.y && y < g.y + g.h);
}

export function inLamp(x, y) {
  return LAMPS.some(l => {
    const dx = x - l.x, dy = y - l.y;
    return dx * dx + dy * dy < l.r * l.r;
  });
}
