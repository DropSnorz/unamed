/**
 * Procedural cockpit sound effects, synthesized with the WebAudio API
 * (no audio assets to load). Browsers only allow audio after a user gesture:
 * `unlock()` is called on the first pointer/key event, sounds requested before
 * that are silently dropped.
 */
let context = null;
let master = null;
let noise = null;
let hum = null;
let enabled = true;

function audio() {
  if (!context || context.state !== 'running' || !enabled) return null;
  return context;
}

export function unlock() {
  if (typeof window === 'undefined' || !(window.AudioContext || window.webkitAudioContext)) return;
  if (!context) {
    context = new (window.AudioContext || window.webkitAudioContext)();
    master = context.createGain();
    master.gain.value = 0.4;
    master.connect(context.destination);
    noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (context.state === 'suspended') context.resume();
}

export function setEnabled(value) {
  enabled = value;
  if (master) master.gain.value = value ? 0.4 : 0;
}

export function isEnabled() {
  return enabled;
}

function envelope(ctx, gainNode, { attack = 0.002, peak = 1, decay = 0.1, at = 0 }) {
  const t = ctx.currentTime + at;
  gainNode.gain.setValueAtTime(0.0001, t);
  gainNode.gain.exponentialRampToValueAtTime(peak, t + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return t + attack + decay;
}

function noiseBurst({ frequency = 3000, q = 1, type = 'bandpass', peak = 0.5, decay = 0.03, at = 0, rate = 1 }) {
  const ctx = audio();
  if (!ctx) return;
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.playbackRate.value = rate;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const gain = ctx.createGain();
  source.connect(filter).connect(gain).connect(master);
  const end = envelope(ctx, gain, { peak, decay, at });
  source.start(ctx.currentTime + at, Math.random() * 0.5);
  source.stop(end + 0.05);
}

function tone({ frequency, to, type = 'sine', peak = 0.3, attack = 0.005, decay = 0.2, at = 0 }) {
  const ctx = audio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  osc.type = type;
  const t = ctx.currentTime + at;
  osc.frequency.setValueAtTime(frequency, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
  const gain = ctx.createGain();
  osc.connect(gain).connect(master);
  const end = envelope(ctx, gain, { attack, peak, decay, at });
  osc.start(t);
  osc.stop(end + 0.05);
}

export const sfx = {
  /** Mechanical keyboard key */
  key() {
    noiseBurst({ frequency: 2500 + Math.random() * 1500, q: 2, peak: 0.25, decay: 0.025 });
    tone({ frequency: 180 + Math.random() * 40, type: 'triangle', peak: 0.08, decay: 0.03 });
  },
  /** The heavy return key hit that sends a command */
  enter() {
    noiseBurst({ frequency: 1400, q: 1.2, peak: 0.5, decay: 0.05 });
    tone({ frequency: 120, to: 60, type: 'sine', peak: 0.5, decay: 0.12 });
  },
  /** Chunky bakelite push button */
  button() {
    noiseBurst({ frequency: 900, q: 3, peak: 0.45, decay: 0.04 });
    tone({ frequency: 240, to: 110, type: 'square', peak: 0.08, decay: 0.05 });
    noiseBurst({ frequency: 1800, q: 4, peak: 0.2, decay: 0.02, at: 0.07 });
  },
  /** Metal toggle switch / safety cover */
  toggle() {
    noiseBurst({ frequency: 4200, q: 6, peak: 0.5, decay: 0.015 });
    noiseBurst({ frequency: 2100, q: 3, peak: 0.25, decay: 0.03, at: 0.01 });
  },
  /** Short confirmation beep of the navigation computer */
  beep() {
    tone({ frequency: 1320, type: 'square', peak: 0.06, decay: 0.06 });
  },
  error() {
    tone({ frequency: 110, type: 'sawtooth', peak: 0.15, decay: 0.25 });
    tone({ frequency: 116, type: 'sawtooth', peak: 0.12, decay: 0.25 });
  },
  /** Relays clacking and generators spinning up */
  powerUp() {
    for (let i = 0; i < 6; i++) {
      noiseBurst({ frequency: 1200 + i * 300, q: 5, peak: 0.35, decay: 0.03, at: 0.1 + i * 0.18 + Math.random() * 0.05 });
    }
    tone({ frequency: 40, to: 110, type: 'sawtooth', peak: 0.12, attack: 0.6, decay: 1.4 });
    tone({ frequency: 400, to: 2400, type: 'sine', peak: 0.04, attack: 0.8, decay: 1.2 });
    startHum();
  },
  powerDown() {
    stopHum();
    tone({ frequency: 180, to: 30, type: 'sawtooth', peak: 0.12, attack: 0.05, decay: 1.2 });
  },
  /** Radar ping when a signature is detected */
  ping() {
    tone({ frequency: 1760, type: 'sine', peak: 0.12, decay: 0.35 });
    tone({ frequency: 1760 * 1.5, type: 'sine', peak: 0.03, decay: 0.25 });
  },
  /** Rotating scanner dish */
  sweep() {
    noiseBurst({ frequency: 600, q: 8, peak: 0.15, decay: 1.2, rate: 0.5 });
    tone({ frequency: 300, to: 900, type: 'triangle', peak: 0.05, attack: 0.3, decay: 1.0 });
  },
  /** Jump drive: charging whine then the warp itself */
  charge() {
    tone({ frequency: 200, to: 1400, type: 'sawtooth', peak: 0.05, attack: 0.9, decay: 0.3 });
  },
  warp() {
    const ctx = audio();
    if (!ctx) return;
    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2;
    const t = ctx.currentTime;
    filter.frequency.setValueAtTime(150, t);
    filter.frequency.exponentialRampToValueAtTime(3500, t + 1.8);
    filter.frequency.exponentialRampToValueAtTime(200, t + 2.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.6, t + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    source.connect(filter).connect(gain).connect(master);
    source.start(t);
    source.stop(t + 2.5);
    tone({ frequency: 55, to: 35, type: 'sine', peak: 0.4, attack: 0.8, decay: 1.6 });
  }
};

/** Low cockpit ambience while the ship is powered */
function startHum() {
  const ctx = audio();
  if (!ctx || hum) return;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 50;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 160;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 2);
  osc.connect(filter).connect(gain).connect(master);
  osc.start();
  hum = { osc, gain };
}

function stopHum() {
  if (!hum || !context) return;
  const { osc, gain } = hum;
  gain.gain.cancelScheduledValues(context.currentTime);
  gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.8);
  osc.stop(context.currentTime + 0.9);
  hum = null;
}
