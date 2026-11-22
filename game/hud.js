// hud.js — HUD text state: clock, objective line, visibility.
// (The drawing itself lives in render.js; this file owns the strings.)
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function objectiveLine(player) {
  if (player.relics >= 3) return "All relics held — reach the EXIT HATCH, unseen.";
  return `Steal the relics — ${3 - player.relics} left.`;
}

export function visibilityWord(player, det) {
  if (det.spotted) return "SEEN";
  if (player.lit) return "LIT";
  if (player.hidden) return "HIDDEN";
  return "SHADOW";
}
