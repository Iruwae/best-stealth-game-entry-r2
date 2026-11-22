// input.js — keyboard: WASD/arrows move, Shift run, C toss coin,
// Enter start, R restart, H toggle the FIELD NOTES panel.
export function makeInput() {
  const keys = new Set();
  const pressed = new Set(); // edge-triggered, consumed by the loop
  function down(e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    keys.add(e.key.toLowerCase());
    pressed.add(e.key.toLowerCase());
  }
  function up(e) { keys.delete(e.key.toLowerCase()); }
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  return {
    axis() {
      let x = 0, y = 0;
      if (keys.has("a") || keys.has("arrowleft")) x -= 1;
      if (keys.has("d") || keys.has("arrowright")) x += 1;
      if (keys.has("w") || keys.has("arrowup")) y -= 1;
      if (keys.has("s") || keys.has("arrowdown")) y += 1;
      return [x, y];
    },
    running() { return keys.has("shift"); },
    // true once per physical press; the game loop drains it each frame
    was(k) {
      const hit = pressed.has(k);
      if (hit) pressed.delete(k);
      return hit;
    },
    drain() { pressed.clear(); },
  };
}
