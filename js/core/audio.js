// Sons doux (Web Audio, gamme pentatonique) et voix française.
// Tout échec audio (pas de son, pas de voix) se dégrade en silence.

import { RECORDINGS } from '../data/recordings.js';

// Do majeur pentatonique : do ré mi sol la, sur deux octaves et demie.
const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
const VOLUME = 0.22;
const VOICE_VOLUME = 0.9;

let ctx = null;
let master = null;
let voiceGain = null;
let voiceSource = null;
const buffers = new Map();

const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
let voice = null;
let voicesKnown = false;
let speechWarm = false;

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
    master = ctx.createGain();
    master.gain.value = VOLUME;
    master.connect(comp);
    voiceGain = ctx.createGain();
    voiceGain.gain.value = VOICE_VOLUME;
    voiceGain.connect(comp);
  } catch (_) {
    ctx = null;
  }
  return ctx;
}

function pickVoice() {
  if (!synth) return;
  let list = [];
  try { list = synth.getVoices() || []; } catch (_) { return; }
  if (!list.length) return;
  voicesKnown = true;
  const fr = list.filter((v) => /^fr([-_]|$)/i.test(v.lang));
  const isFR = (v) => /^fr[-_]FR/i.test(v.lang);
  voice = fr.find((v) => isFR(v) && v.localService) || fr.find(isFR) || fr[0] || null;
}

// iOS n'autorise le son qu'après un geste : on (re)débloque à chaque geste si besoin.
export function unlock() {
  const c = ensureContext();
  if (c && c.state !== 'running') {
    c.resume().catch(() => {});
    try {
      const b = c.createBuffer(1, 1, 22050);
      const s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
    } catch (_) { /* rien */ }
  }
  if (synth && !speechWarm) {
    speechWarm = true;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      synth.speak(u);
    } catch (_) { /* rien */ }
  }
}

export function init() {
  const opts = { capture: true, passive: true };
  ['pointerup', 'touchend', 'click', 'keydown'].forEach((t) => document.addEventListener(t, unlock, opts));
  if (synth) {
    pickVoice();
    try { synth.addEventListener('voiceschanged', pickVoice); } catch (_) { /* rien */ }
  }
}

export function suspend() {
  if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
  stopVoice();
}

export function resume() {
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
}

function tone(freq, { type = 'sine', dur = 0.5, vol = 0.5, delay = 0, from = 0 } = {}) {
  if (!ctx || ctx.state !== 'running') return;
  try {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from || freq, t);
    if (from) o.frequency.exponentialRampToValueAtTime(freq, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
    o.onended = () => { o.disconnect(); g.disconnect(); };
  } catch (_) { /* rien */ }
}

const pitch = (i) => PENTA[Math.max(0, Math.min(PENTA.length - 1, i))];

// Note douce quelconque de la gamme.
export function note(i) {
  tone(pitch(i), { type: 'triangle', dur: 0.7, vol: 0.45 });
}

// Petite réaction quand on touche « à côté » : une note grave au hasard.
export function tap() {
  tone(pitch(Math.floor(Math.random() * 5)), { type: 'sine', dur: 0.45, vol: 0.3 });
}

// On attrape un objet.
export function pick(i) {
  tone(pitch(i), { type: 'sine', dur: 0.25, vol: 0.25 });
}

// Un objet arrive à sa place.
export function place(i) {
  tone(pitch(i), { type: 'triangle', dur: 0.8, vol: 0.45 });
  tone(pitch(i + 2), { type: 'sine', dur: 0.9, vol: 0.25, delay: 0.12 });
}

// Bulle qui éclate : « plop » qui glisse vers la note.
export function plop(i) {
  const f = pitch(i);
  tone(f, { type: 'sine', dur: 0.35, vol: 0.6, from: f * 1.5 });
  tone(f * 2, { type: 'sine', dur: 0.2, vol: 0.12, delay: 0.03 });
}

// Petite mélodie de fin de manche.
export function chime() {
  [5, 7, 9].forEach((i, k) => tone(pitch(i), { type: 'sine', dur: 1.0, vol: 0.35, delay: k * 0.16 }));
}

// ---------- Voix ----------

function stopVoice() {
  if (voiceSource) {
    try { voiceSource.stop(); } catch (_) { /* rien */ }
    voiceSource = null;
  }
  if (synth) {
    try { synth.cancel(); } catch (_) { /* rien */ }
  }
}

function speak(text) {
  if (!synth) return;
  if (voicesKnown && !voice) return; // aucune voix française : silence plutôt qu'un accent étranger
  try {
    if (synth.speaking || synth.pending) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    if (voice) u.voice = voice;
    u.rate = 0.85;
    u.pitch = 1.1;
    u.volume = 0.85;
    u.onerror = () => {};
    synth.speak(u);
  } catch (_) { /* rien */ }
}

async function playFile(url) {
  const c = ensureContext();
  if (!c || c.state !== 'running') throw new Error('audio indisponible');
  let buf = buffers.get(url);
  if (!buf) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fichier absent');
    const data = await res.arrayBuffer();
    buf = await new Promise((ok, ko) => c.decodeAudioData(data, ok, ko));
    buffers.set(url, buf);
  }
  stopVoice();
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(voiceGain);
  src.start();
  voiceSource = src;
}

// Dit une phrase : fichier enregistré s'il existe pour cette clé, sinon voix de synthèse.
export function say(key, text) {
  const file = RECORDINGS[key];
  if (file) {
    playFile(file).catch(() => speak(text));
  } else {
    speak(text);
  }
}
