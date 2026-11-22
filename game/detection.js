// detection.js — the 3-state alarm: calm / suspicious "?" / spotted "!".
// Suspicion rises when a warden sees Wren; rate depends on light, distance
// and grass cover. Break line of sight and it drains back down.
import { guardSees } from "./guards.js";

export function makeDetection() {
  return {
    // highest suspicion across wardens, 0..1 — drives the HUD meter
    level: 0,
    spotted: false,
    spottedCount: 0,
    suspiciousCount: 0,
    banner: "", // HUD banner text, "" when calm
  };
}

// One tick: for each guard, raise or lower its suspicion.
export function updateDetection(det, guards, player, dt) {
  let top = 0;
  let anySpotted = false;
  let anySuspicious = false;

  for (const g of guards) {
    const d = Math.hypot(player.x - g.x, player.y - g.y);
    const sees = guardSees(g, player.x, player.y);
    // Tall grass hides you unless the warden is almost on top of you.
    const concealed = player.hidden && d > 65;
    if (sees && !concealed && g.state !== "spotted") {
      // Lit by a lamp: seen from afar, fast rise. In shadow: slow rise.
      // Close range always rises fast.
      let rate = player.lit ? 0.9 : 0.34;
      if (d < 80) rate = 1.4;
      if (d > 170) rate *= 0.6;
      g.suspicion = Math.min(1, g.suspicion + rate * dt);
      if (g.suspicion >= 1) {
        g.state = "spotted";
        g.chaseT = 4;
        g.investigate = null;
        det.spottedCount += 1;
      } else if (g.suspicion >= 0.45 && g.state === "calm") {
        g.state = "suspicious";
        det.suspiciousCount += 1;
      }
    } else if (g.state !== "spotted") {
      // Out of sight: suspicion cools off.
      g.suspicion = Math.max(0, g.suspicion - dt * 0.22);
      if (g.state === "suspicious" && g.suspicion <= 0.08 && !g.investigate) {
        g.state = "calm";
      }
    }

    // Loud running nearby makes a warden suspicious even without sight.
    if (player.noise > 0 && d < 110 && g.state === "calm") {
      g.suspicion = Math.min(1, g.suspicion + dt * 0.55);
      if (g.suspicion >= 0.45) {
        g.state = "suspicious";
        g.investigate = { x: player.x, y: player.y, t: 3 };
        det.suspiciousCount += 1;
      }
    }

    if (g.state === "spotted") anySpotted = true;
    else if (g.state === "suspicious") anySuspicious = true;
    top = Math.max(top, g.state === "spotted" ? 1 : g.suspicion);
  }

  det.level = top;
  det.spotted = anySpotted;
  det.banner = anySpotted
    ? "SPOTTED — BREAK LINE OF SIGHT!"
    : anySuspicious
      ? "A WARDEN IS SUSPICIOUS"
      : "";
  return det;
}

// Caught when a spotting warden touches the player.
export function isCaught(guards, player) {
  return guards.some(g => g.state === "spotted" && Math.hypot(g.x - player.x, g.y - player.y) < 26);
}
