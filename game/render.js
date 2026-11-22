// render.js — every pixel the judge sees: floor, cones, figures, HUD,
// FIELD NOTES legend and the staged cover callouts. All art is drawn code.
import { W, H, HUD_H, WALLS, COVER, GRASS, LAMPS, RELICS, EXIT } from "./level.js";
import { CONE_RANGE, CONE_HALF } from "./guards.js";

const INK = "#e8e0c8";
const DIM = "#9a90a8";

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = "600", align = "left", font = "Georgia, serif") {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(s, x, y);
}

// ---------- floor & rooms ----------
function drawFloor(ctx, t) {
  ctx.fillStyle = "#141a2e";
  ctx.fillRect(0, HUD_H, W, H - HUD_H);
  // checker flagstones, two deep-blue tones
  const s = 46;
  for (let y = HUD_H; y < H; y += s) {
    for (let x = 0; x < W; x += s) {
      if (((x / s) | 0) % 2 === ((y / s) | 0) % 2) continue;
      ctx.fillStyle = "#182038";
      ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
    }
  }
  // scattered gold flecks so no area reads as empty dead floor
  ctx.fillStyle = "rgba(214,178,94,0.16)";
  for (let i = 0; i < 90; i++) {
    const x = (i * 173) % W, y = HUD_H + ((i * 311) % (H - HUD_H - 8));
    ctx.fillRect(x, y, 2, 2);
  }
  // room name plates on the floor (below the bookshelf band)
  text(ctx, "ENTRY HALL", 30, 152, 13, "rgba(232,224,200,0.35)", "700", "left", "Verdana, sans-serif");
  text(ctx, "THE GALLERY", 460, 152, 13, "rgba(232,224,200,0.35)", "700", "left", "Verdana, sans-serif");
  text(ctx, "THE VAULT", 900, 152, 13, "rgba(232,224,200,0.35)", "700", "left", "Verdana, sans-serif");
  void t;
}

function drawGrass(ctx, t) {
  for (const g of GRASS) {
    ctx.fillStyle = "rgba(46,94,52,0.85)";
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.strokeStyle = "#5da864";
    ctx.lineWidth = 2;
    for (let i = 0; i < g.w; i += 9) {
      const x = g.x + i, sway = Math.sin(t * 1.4 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(x, g.y + g.h);
      ctx.lineTo(x + sway, g.y + 6 + (i % 13));
      ctx.stroke();
    }
  }
}

function drawLamps(ctx) {
  for (const l of LAMPS) {
    const g = ctx.createRadialGradient(l.x, l.y, 8, l.x, l.y, l.r);
    g.addColorStop(0, "rgba(255,196,90,0.34)");
    g.addColorStop(0.7, "rgba(255,180,70,0.13)");
    g.addColorStop(1, "rgba(255,180,70,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
    ctx.fill();
    // the lamp itself: brass post + warm flame
    ctx.fillStyle = "#8a6a2f";
    ctx.fillRect(l.x - 3, l.y - 3, 6, 6);
    ctx.fillStyle = "#ffd97a";
    ctx.beginPath();
    ctx.arc(l.x, l.y - 3, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = "#3d2b3f";
    ctx.fillRect(w.x, w.y, w.w, w.h);
    // brick courses
    ctx.fillStyle = "#54384a";
    const horizontal = w.w > w.h;
    if (horizontal) {
      for (let x = w.x + 8; x < w.x + w.w; x += 18) ctx.fillRect(x, w.y + 2, 2, w.h - 4);
    } else {
      for (let y = w.y + 8; y < w.y + w.h; y += 18) ctx.fillRect(w.x + 2, y, w.w - 4, 2);
    }
    ctx.fillStyle = "rgba(232,224,200,0.25)";
    ctx.fillRect(w.x, w.y, w.w, 2);
  }
}

function drawCover(ctx) {
  for (const c of COVER) {
    if (c.kind === "shelf") {
      ctx.fillStyle = "#4a2f1d";
      ctx.fillRect(c.x, c.y, c.w, c.h);
      const cols = ["#b3543f", "#3f7ab3", "#4f9e57", "#c9a227", "#7a4fa3"];
      for (let i = 0; i < c.w - 8; i += 7) {
        ctx.fillStyle = cols[(i / 7 | 0) % cols.length];
        ctx.fillRect(c.x + 4 + i, c.y + 4, 4, c.h - 8);
      }
    } else if (c.kind === "crate") {
      ctx.fillStyle = "#6b4a22";
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = "#3f2a10";
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
      ctx.beginPath();
      ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y); ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
    } else if (c.kind === "statue") {
      ctx.fillStyle = "#8d8fa3";
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c9cbdd";
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2 - 4, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5c5e73";
      ctx.fillRect(c.x + 2, c.y + c.h - 8, c.w - 4, 6);
    } else if (c.kind === "planter") {
      ctx.fillStyle = "#5a3a22";
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = "#3f7a44";
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5da864";
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2 - 6, c.y + c.h / 2 - 6, 6, 0, Math.PI * 2);
      ctx.fill();
    } else { // pedestal
      ctx.fillStyle = "#6a5a7a";
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = "#d6b25e";
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawRelics(ctx, relics, t) {
  const glyphs = ["☀", "♛", "✦"];
  const names = ["SUN IDOL", "MOON CHALICE", "STAR CROSS"];
  relics.forEach((r, i) => {
    if (r.taken) return;
    const pulse = 0.5 + 0.3 * Math.sin(t * 2.4 + i);
    const g = ctx.createRadialGradient(r.x, r.y, 2, r.x, r.y, 34);
    g.addColorStop(0, `rgba(255,215,110,${0.5 * pulse + 0.25})`);
    g.addColorStop(1, "rgba(255,215,110,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd76e";
    ctx.beginPath();
    ctx.arc(r.x, r.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7a5a10";
    ctx.font = "700 15px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(glyphs[i], r.x, r.y + 5);
    text(ctx, names[i], r.x, r.y + 30, 10, "#ffd76e", "700", "center", "Verdana, sans-serif");
  });
}

function drawExit(ctx, open, t) {
  const e = EXIT;
  ctx.fillStyle = open ? "#2e5e34" : "#3a3f52";
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? "#7ed491" : "#8a90a8";
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4);
  text(ctx, open ? "OPEN" : "LOCKED", e.x + e.w / 2, e.y - 6, 11, open ? "#7ed491" : "#8a90a8", "700", "center", "Verdana, sans-serif");
  text(ctx, "EXIT HATCH", e.x + e.w / 2, e.y + e.h / 2 + 5, 10, open ? "#c9f2d2" : INK, "700", "center", "Verdana, sans-serif");
  if (open) {
    ctx.fillStyle = `rgba(126,212,145,${0.4 + 0.3 * Math.sin(t * 3)})`;
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + e.h / 2, 24, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- actors ----------
function drawCones(ctx, guards) {
  for (const g of guards) {
    const base = g.state === "spotted" ? "229,72,77" : g.state === "suspicious" ? "247,140,60" : "255,196,90";
    const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, CONE_RANGE);
    grad.addColorStop(0, `rgba(${base},0.42)`);
    grad.addColorStop(1, `rgba(${base},0.05)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.arc(g.x, g.y, CONE_RANGE, g.angle - CONE_HALF, g.angle + CONE_HALF);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(${base},0.55)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawGuard(ctx, g, t) {
  // noise / hearing ring
  ctx.strokeStyle = "rgba(232,224,200,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(g.x, g.y, 26 + 3 * Math.sin(t * 2 + g.x), 0, Math.PI * 2);
  ctx.stroke();
  // body: crimson-robed warden figure
  ctx.fillStyle = g.color;
  ctx.beginPath();
  ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a0e12";
  ctx.beginPath();
  ctx.arc(g.x, g.y - 2, 8, 0, Math.PI * 2);
  ctx.fill();
  // facing tick
  ctx.strokeStyle = "#ffd9d9";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * 20, g.y + Math.sin(g.angle) * 20);
  ctx.stroke();
  // state mark
  const mark = g.state === "spotted" ? "!" : g.state === "suspicious" ? "?" : "";
  if (mark) {
    const bob = Math.sin(t * 5) * 2;
    text(ctx, mark, g.x, g.y - 24 + bob, 26, g.state === "spotted" ? "#ff5a5a" : "#ffb347", "800", "center", "Verdana, sans-serif");
  }
  text(ctx, g.name.toUpperCase(), g.x, g.y + 30, 9, "rgba(232,224,200,0.75)", "700", "center", "Verdana, sans-serif");
}

function drawPlayer(ctx, p, t) {
  // shadow ring when sneaking, loud rings when running
  if (p.running && p.moving) {
    const ph = (t * 2) % 1;
    ctx.strokeStyle = `rgba(255,220,120,${0.6 * (1 - ph)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16 + ph * 46, 0, Math.PI * 2);
    ctx.stroke();
  }
  // pale-gold figure, clearly distinct from the crimson wardens
  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a6a2f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
  ctx.stroke();
  // cloak + hood
  ctx.fillStyle = "#d6b25e";
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 13);
  ctx.lineTo(p.x - 9, p.y + 10);
  ctx.lineTo(p.x + 9, p.y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#2a2118";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 2, 5, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, "WREN — YOU", p.x, p.y + 30, 10, "#ffe9a8", "700", "center", "Verdana, sans-serif");
  if (p.hidden) text(ctx, "HIDDEN", p.x, p.y - 24, 10, "#7ed491", "800", "center", "Verdana, sans-serif");
}

function drawCoin(ctx, coin) {
  if (!coin) return;
  const age = coin.t;
  ctx.strokeStyle = `rgba(255,215,110,${Math.max(0, 0.8 - age * 0.15)})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 2; i++) {
    const ph = ((age * 0.7 + i * 0.5) % 1);
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 8 + ph * 42, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#ffd76e";
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7a5a10";
  ctx.font = "700 8px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("¢", coin.x, coin.y + 3);
}

// ---------- HUD ----------
export function drawHUD(ctx, s) {
  ctx.fillStyle = "#0d1120";
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = "#d6b25e";
  ctx.fillRect(0, HUD_H - 2, W, 2);
  text(ctx, "VELVET HOUR", 16, 26, 22, "#ffe9a8", "800");
  text(ctx, "THE GILDED VAULT — steal the 3 Gilded Relics and vanish before dawn", 16, 50, 12, DIM, "400", "left", "Verdana, sans-serif");
  // objective + counts
  let x = 560;
  text(ctx, `RELICS  ${s.player.relics}/3`, x, 30, 15, "#ffd76e", "700", "left", "Verdana, sans-serif");
  text(ctx, `COINS  ${s.player.coins}`, x + 130, 30, 15, INK, "700", "left", "Verdana, sans-serif");
  text(ctx, s.time, x + 240, 30, 15, INK, "700", "left", "Verdana, sans-serif");
  // visibility pill
  const vis = s.player.lit ? ["LIT — SEEN", "#ffb347"] : s.det.spotted ? ["SEEN", "#ff5a5a"] : ["SHADOW", "#7ed491"];
  ctx.fillStyle = vis[1];
  rr(ctx, x + 340, 12, 118, 26, 13);
  ctx.fill();
  text(ctx, vis[0], x + 399, 30, 13, "#0d1120", "800", "center", "Verdana, sans-serif");
  // detection meter
  const mx = 1090;
  text(ctx, "ALARM", mx, 22, 10, DIM, "700", "left", "Verdana, sans-serif");
  ctx.fillStyle = "#262c44";
  rr(ctx, mx, 28, 150, 10, 5);
  ctx.fill();
  ctx.fillStyle = s.det.level > 0.66 ? "#ff5a5a" : s.det.level > 0.33 ? "#ffb347" : "#7ed491";
  if (s.det.level > 0.01) { rr(ctx, mx, 28, 150 * s.det.level, 10, 5); ctx.fill(); }
  // banner under the bar
  if (s.det.banner) {
    const bw = s.det.banner.length * 9 + 30;
    ctx.fillStyle = s.det.spotted ? "rgba(120,20,24,0.92)" : "rgba(120,74,10,0.92)";
    rr(ctx, (W - bw) / 2, HUD_H + 8, bw, 30, 6);
    ctx.fill();
    text(ctx, (s.det.spotted ? "!  " : "?  ") + s.det.banner, W / 2, HUD_H + 29, 14, "#fff", "800", "center", "Verdana, sans-serif");
  }
}

// ---------- FIELD NOTES legend ----------
export const FIELD_NOTES = [
  ["Warden + cone", "what they see"],
  ["Blind spot behind cover", "safe"],
  ["Lamplight", "seen from afar"],
  ["Tall grass", "hidden unless close"],
  ["Coin toss", "pulls a warden off patrol"],
  ["Exit hatch", "opens with all 3 relics"],
];

export function drawFieldNotes(ctx) {
  const x = 1006, y = 84, w = 258, h = 208;
  ctx.fillStyle = "rgba(10,13,26,0.88)";
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = "#d6b25e";
  ctx.lineWidth = 1.5;
  rr(ctx, x, y, w, h, 8);
  ctx.stroke();
  text(ctx, "FIELD NOTES", x + 14, y + 26, 14, "#ffd76e", "800", "left", "Verdana, sans-serif");
  FIELD_NOTES.forEach(([a, b], i) => {
    const yy = y + 52 + i * 25;
    ctx.fillStyle = "#d6b25e";
    ctx.fillRect(x + 14, yy - 8, 5, 5);
    text(ctx, a, x + 26, yy, 12, INK, "700", "left", "Verdana, sans-serif");
    const aw = ctx.measureText(a).width;
    text(ctx, "— " + b, x + 26 + aw + 4, yy, 11, DIM, "400", "left", "Verdana, sans-serif");
  });
}

// ---------- cover callouts ----------
function callout(ctx, lx, ly, px, py, label, sub) {
  ctx.strokeStyle = "rgba(255,233,168,0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lx, ly);
  ctx.lineTo(px, py);
  ctx.stroke();
  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(10,13,26,0.92)";
  const w = Math.max(label.length, sub ? sub.length : 0) * 7.4 + 20;
  rr(ctx, lx - 8, ly - 30, w, sub ? 44 : 26, 6);
  ctx.fill();
  ctx.strokeStyle = "#d6b25e";
  ctx.lineWidth = 1;
  rr(ctx, lx - 8, ly - 30, w, sub ? 44 : 26, 6);
  ctx.stroke();
  text(ctx, label, lx, ly - 12, 13, "#ffe9a8", "800", "left", "Verdana, sans-serif");
  if (sub) text(ctx, sub, lx, ly + 6, 11, DIM, "400", "left", "Verdana, sans-serif");
}

export function drawCoverCallouts(ctx, s) {
  // LAMPLIGHT -> gallery lamp pool
  callout(ctx, 470, 130, 650, 150, "LAMPLIGHT", "seen from across the room");
  // HEARD THE COIN -> coin ringing near Warden Rue
  callout(ctx, 700, 330, 760, 268, "?  HEARD THE COIN", "off to look — pulled off patrol");
  // YOU hidden -> player behind the crates
  callout(ctx, 180, 420, 300, 332, "YOU: HIDDEN", "safe where the cone stops");
  // EXIT HATCH
  callout(ctx, 1010, 640, 1200, 720, "EXIT HATCH", "opens once you hold the prize");
}

// ---------- full frame ----------
export function render(ctx, s, t) {
  drawFloor(ctx, t);
  drawGrass(ctx, t);
  drawLamps(ctx);
  drawRelics(ctx, s.relics, t);
  drawExit(ctx, s.player.relics >= 3, t);
  drawWalls(ctx);
  drawCover(ctx);
  drawCones(ctx, s.guards);
  drawCoin(ctx, s.coin);
  for (const g of s.guards) drawGuard(ctx, g, t);
  drawPlayer(ctx, s.player, t);
  if (s.showNotes !== false) drawFieldNotes(ctx);
  if (s.shot === "cover") drawCoverCallouts(ctx, s);
  drawHUD(ctx, s);

  if (s.phase === "win") {
    ctx.fillStyle = "rgba(8,10,20,0.82)";
    ctx.fillRect(0, 0, W, H);
    text(ctx, "VANISHED BEFORE DAWN", W / 2, 300, 44, "#ffe9a8", "800", "center");
    text(ctx, "The three Gilded Relics are yours. No warden ever saw your face.", W / 2, 344, 17, INK, "400", "center", "Verdana, sans-serif");
    text(ctx, `RELICS 3/3      TIME ${s.time}      COINS LEFT ${s.player.coins}`, W / 2, 400, 18, "#ffd76e", "700", "center", "Verdana, sans-serif");
    const ghost = s.det.spottedCount === 0 && s.det.suspiciousCount === 0;
    text(ctx, ghost ? "★  GHOST RATING  ★" : s.det.spottedCount === 0 ? "★  PHANTOM RATING  ★" : "RATING: SEEN", W / 2, 462, 26, ghost ? "#7ed491" : "#ffb347", "800", "center", "Verdana, sans-serif");
    text(ctx, ghost ? "Never spotted. Never even suspected. A perfect heist." : "You escaped — but the wardens know someone was here.", W / 2, 498, 14, DIM, "400", "center", "Verdana, sans-serif");
    text(ctx, "Press R to steal again", W / 2, 560, 14, DIM, "400", "center", "Verdana, sans-serif");
  } else if (s.phase === "caught") {
    ctx.fillStyle = "rgba(60,8,10,0.78)";
    ctx.fillRect(0, 0, W, H);
    text(ctx, "CAUGHT IN THE LAMPLIGHT", W / 2, 320, 40, "#ff8a8a", "800", "center");
    text(ctx, "A warden laid hands on Wren. The vault keeps its relics — this time.", W / 2, 364, 16, INK, "400", "center", "Verdana, sans-serif");
    text(ctx, `Relics stolen: ${s.player.relics}/3`, W / 2, 420, 18, "#ffd76e", "700", "center", "Verdana, sans-serif");
    text(ctx, "Press R to try again — slower, quieter, through the grass.", W / 2, 480, 14, DIM, "400", "center", "Verdana, sans-serif");
  } else if (s.phase === "menu") {
    ctx.fillStyle = "rgba(8,10,20,0.66)";
    ctx.fillRect(0, HUD_H, W, H - HUD_H);
    text(ctx, "VELVET HOUR", W / 2, 300, 52, "#ffe9a8", "800", "center");
    text(ctx, "Steal the 3 Gilded Relics from The Gilded Vault — and vanish before dawn.", W / 2, 344, 17, INK, "400", "center", "Verdana, sans-serif");
    text(ctx, "WASD / arrows — move      SHIFT — run (fast, LOUD)      C — toss a coin      H — hide these notes", W / 2, 400, 14, DIM, "400", "center", "Verdana, sans-serif");
    text(ctx, "Lamp pools light you up. Shadow and tall grass keep you safe. Break line of sight to cool down.", W / 2, 430, 14, DIM, "400", "center", "Verdana, sans-serif");
    text(ctx, "Press ENTER to begin the heist", W / 2, 490, 18, "#ffd76e", "700", "center", "Verdana, sans-serif");
  }
}
