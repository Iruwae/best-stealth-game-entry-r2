// audio.js — tiny WebAudio cues, no assets: footsteps, coin ring, alarm.
// All sound is synthesized; the game plays silently if audio is unavailable.
let ctx = null;

function ac() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = AC ? new AC() : null;
  } catch (e) { ctx = null; }
  return ctx;
}

function blip(freq, dur, type = "sine", vol = 0.05) {
  const a = ac();
  if (!a) return;
  try {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur);
  } catch (e) { /* silent */ }
}

export function footstep(running) {
  blip(running ? 140 : 90, 0.07, "triangle", running ? 0.06 : 0.025);
}

export function coinRing() {
  blip(1320, 0.35, "sine", 0.06);
  setTimeout(() => blip(1760, 0.3, "sine", 0.05), 90);
}

export function alarm() {
  blip(520, 0.25, "square", 0.05);
  setTimeout(() => blip(392, 0.3, "square", 0.05), 160);
}

export function relicChime() {
  [880, 1108, 1318].forEach((f, i) => setTimeout(() => blip(f, 0.3, "sine", 0.05), i * 90));
}

export function winChime() {
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.4, "sine", 0.06), i * 120));
}
