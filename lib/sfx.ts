"use client";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function play(freq: number, duration: number, type: OscillatorType = "square", volume = 0.15) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export function sfxPunch() {
  play(200, 0.08, "square", 0.12);
  play(80, 0.1, "sawtooth", 0.06);
}

export function sfxCombo(streak: number) {
  const base = 400 + streak * 40;
  play(base, 0.12, "square", 0.1);
  setTimeout(() => play(base + 100, 0.1, "sine", 0.08), 50);
}

export function sfxTimerWarning() {
  play(600, 0.15, "square", 0.08);
  setTimeout(() => play(600, 0.15, "square", 0.08), 200);
}

export function sfxTimesUp() {
  play(500, 0.2, "sawtooth", 0.12);
  setTimeout(() => play(700, 0.3, "square", 0.1), 150);
  setTimeout(() => play(900, 0.4, "sine", 0.08), 300);
}
