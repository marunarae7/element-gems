// Tiny Web Audio synth. Browsers only allow audio after a user gesture, so call unlock() from input handlers.
let ac = null;
let enabled = true;

function tone(freq, dur = 0.12, type = 'sine', vol = 0.12, delay = 0) {
  if (!enabled || !ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  const t0 = ac.currentTime + delay;
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(ac.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

export const sound = {
  unlock() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* no audio */ }
    }
    if (ac && ac.state === 'suspended') ac.resume();
  },
  get enabled() { return enabled; },
  toggle() { enabled = !enabled; return enabled; },
  match(combo) {
    const b = 440 * Math.pow(1.122, Math.min(combo - 1, 10));
    tone(b, 0.15, 'triangle', 0.14);
    tone(b * 1.26, 0.15, 'triangle', 0.11, 0.06);
    tone(b * 1.5, 0.2, 'triangle', 0.1, 0.12);
  },
  swap() { tone(330, 0.08, 'sine', 0.08); },
  bad() { tone(180, 0.12, 'square', 0.05); tone(140, 0.15, 'square', 0.05, 0.08); },
  boom() { tone(110, 0.3, 'sawtooth', 0.08); tone(880, 0.25, 'triangle', 0.08, 0.05); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, i * 0.12)); },
};
