// Original soundtrack for the brag video, synthesised from scratch.
// 120 BPM (beat = 0.5 s), key of D. Every cut, click and accent sits on that grid.
// Output: work/audio.wav (44.1 kHz, 16-bit stereo, 22.5 s)
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SR = 44100;
const DUR = 22.5;
const N = Math.round(DUR * SR);
const L = new Float32Array(N), R = new Float32Array(N);
const sendL = new Float32Array(N), sendR = new Float32Array(N); // reverb bus

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

const NOTE = { D2: 73.42, A2: 110, D3: 146.83, B1: 61.74, G1: 49.0, A1: 55.0, D4: 293.66, E4: 329.63, "F#4": 369.99, A4: 440, B4: 493.88,
  D5: 587.33, E5: 659.26, "F#5": 739.99, A5: 880, D6: 1174.66 };

function put(t0, samples, gain = 1, pan = 0, send = 0) {
  const s0 = Math.round(t0 * SR);
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < samples.length; i++) {
    const n = s0 + i;
    if (n < 0 || n >= N) continue;
    L[n] += samples[i] * gl; R[n] += samples[i] * gr;
    if (send) { sendL[n] += samples[i] * gl * send; sendR[n] += samples[i] * gr * send; }
  }
}

// Karplus–Strong plucked string (sitar / tanpura colour)
function pluck(freq, dur, { decay = 0.996, bright = 0.5 } = {}) {
  const len = Math.round(dur * SR), period = Math.max(2, Math.round(SR / freq));
  const buf = new Float32Array(period);
  for (let i = 0; i < period; i++) buf[i] = rnd();
  const out = new Float32Array(len);
  let idx = 0, prev = 0;
  for (let n = 0; n < len; n++) {
    const cur = buf[idx];
    const next = buf[(idx + 1) % period];
    const v = decay * (bright * cur + (1 - bright) * next);
    buf[idx] = v;
    out[n] = cur + 0.25 * (cur - prev); // slight edge, sitar-like buzz
    prev = cur;
    idx = (idx + 1) % period;
  }
  const fade = Math.min(len, Math.round(0.03 * SR));
  for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade;
  return out;
}

// Temple bell: inharmonic partials with long decay
function bell(freq, dur = 4) {
  const len = Math.round(dur * SR), out = new Float32Array(len);
  const parts = [[1, 1, 3.5], [2.0, 0.45, 2.2], [2.76, 0.35, 1.8], [4.07, 0.2, 1.1], [5.4, 0.12, 0.8], [6.8, 0.06, 0.5]];
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    let v = 0;
    for (const [r, a, d] of parts) v += a * Math.sin(2 * Math.PI * freq * r * t) * Math.exp(-t / d);
    out[n] = v * Math.min(1, t / 0.003) * 0.4;
  }
  return out;
}

function sineHit(f0, f1, dur, curve = 30) {
  const len = Math.round(dur * SR), out = new Float32Array(len);
  let ph = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR, f = f1 + (f0 - f1) * Math.exp(-t * curve);
    ph += 2 * Math.PI * f / SR;
    out[n] = Math.sin(ph) * Math.exp(-t / (dur / 4)) * Math.min(1, t / 0.002);
  }
  return out;
}

function noiseHit(dur, { hp = 0.0, lp = 1.0, attack = 0.001, decayTo = 4 } = {}) {
  const len = Math.round(dur * SR), out = new Float32Array(len);
  let low = 0, last = 0;
  for (let n = 0; n < len; n++) {
    const t = n / SR, x = rnd();
    low += lp * (x - low);              // one-pole low-pass
    const h = low - last * hp; last = low; // crude high-pass
    out[n] = h * Math.min(1, t / attack) * Math.exp(-t * decayTo / dur);
  }
  return out;
}

// Whoosh that swells into a cut at `tCut`
function whoosh(tCut, length = 0.45, gain = 0.12) {
  const len = Math.round(length * SR), out = new Float32Array(len);
  let low = 0;
  for (let n = 0; n < len; n++) {
    const x = n / len;                          // 0..1
    const env = Math.pow(x, 2.2) * (x < 0.92 ? 1 : (1 - x) / 0.08);
    const cutoff = 0.02 + 0.25 * x;
    low += cutoff * (rnd() - low);
    out[n] = low * env;
  }
  put(tCut - length, out, gain, 0, 0.3);
}

function bass(freq, dur) {
  const len = Math.round(dur * SR), out = new Float32Array(len);
  for (let n = 0; n < len; n++) {
    const t = n / SR;
    const env = Math.min(1, t / 0.005) * Math.exp(-t / 0.35);
    out[n] = (Math.sin(2 * Math.PI * freq * t) + 0.35 * Math.sin(4 * Math.PI * freq * t)) * env;
  }
  return out;
}

// ---------- drone: tanpura cycle Pa–Sa–Sa–Sa (A2, D3, D3, D2) on every beat ----------
const tanpura = [NOTE.A2, NOTE.D3, NOTE.D3, NOTE.D2];
for (let k = 0; k * 0.5 < 21.5; k++) {
  const t = k * 0.5;
  const fadeIn = Math.min(1, (t + 0.5) / 1.5);
  put(t, pluck(tanpura[k % 4], 2.2, { decay: 0.9993, bright: 0.5 }), 0.07 * fadeIn, k % 2 ? 0.35 : -0.35, 0.5);
}

// ---------- bells ----------
put(0.0, bell(NOTE.D5, 4.5), 0.36, 0, 0.6);
put(19.5, bell(NOTE.D5, 3.0), 0.32, 0, 0.6);
put(19.5, bell(NOTE.A4, 3.0), 0.16, -0.2, 0.6);

// ---------- melody (sitar-like plucks, D major pentatonic) ----------
const mel = [
  [0.5, "A4"], [1.5, "D5"], [2.0, "A4"],                        // hook: toast, "Now what?"
  [3.0, "D5"], [3.5, "A4"], [4.0, "B4"], [4.5, "A4"], [5.0, "F#4"], [5.5, "E4"], [5.75, "F#4"], [6.0, "A4"], [6.5, "F#4"],
  [7.0, "D5"], [7.5, "E5"], [8.0, "F#5"], [8.5, "E5"], [9.0, "D5"], [9.5, "B4"], [10.0, "A4"], [10.5, "B4"],
  [11.5, "F#5"], [12.0, "E5"], [12.5, "D5"], [13.0, "A4"],
  [13.5, "B4"], [14.0, "A4"], [14.5, "F#4"], [15.0, "A4"], [15.5, "B4"], [16.0, "D5"],
  [16.5, "E5"], [17.0, "D5"], [17.5, "B4"], [18.0, "A4"], [18.5, "B4"], [19.0, "D5"],
  [19.5, "D4"], [19.53, "A4"], [19.56, "D5"], [20.5, "A4"], [21.0, "D5"],
];
for (const [t, n] of mel) put(t, pluck(NOTE[n], 1.6, { decay: 0.997, bright: 0.55 }), 0.2, 0.2, 0.35);

// success chime on "Confirmed" (11.0): A5 then D6
put(11.0, pluck(NOTE.A5, 1.4, { decay: 0.998, bright: 0.6 }), 0.2, 0.25, 0.5);
put(11.25, pluck(NOTE.D6, 1.6, { decay: 0.998, bright: 0.6 }), 0.2, 0.3, 0.5);
put(11.0, bell(NOTE.A5, 1.5), 0.12, 0.2, 0.5);

// ---------- groove: 3.0 → 19.5 ----------
const chordRoot = (t) => [NOTE.D2, NOTE.B1 * 2, NOTE.G1 * 2, NOTE.A1 * 2][Math.floor((t - 3) / 2) % 4];
for (let t = 3.0; t < 19.5; t += 0.5) {
  const beatInBar = Math.round(((t - 3) % 2) / 0.5); // 0..3
  if (beatInBar === 0 || beatInBar === 2) put(t, sineHit(140, 48, 0.32), 0.24, 0);                        // kick (kept under the music)
  if (beatInBar === 1 || beatInBar === 3) put(t, noiseHit(0.14, { hp: 0.95, lp: 0.5, decayTo: 6 }), 0.07, -0.05, 0.25); // soft clap
  put(t + 0.25, noiseHit(0.04, { hp: 0.99, lp: 0.9, decayTo: 5 }), 0.03, 0.35);                             // off-beat hat
  if (beatInBar === 0) put(t, bass(chordRoot(t), 0.9), 0.17, 0);
  if (beatInBar === 1) put(t + 0.25, bass(chordRoot(t), 0.5), 0.12, 0);
}
put(19.5, bass(NOTE.D2, 2.5), 0.17, 0);

// ---------- sound effects, in key and on the grid ----------
put(0.5, sineHit(880, 880, 0.12, 0), 0.05, 0.1, 0.3);                 // toast pop (A)
for (const t of [6.5, 6.75, 7.0, 7.25, 7.5]) put(t, noiseHit(0.018, { hp: 0.9, lp: 0.6, decayTo: 4 }), 0.05, 0.15); // typing
for (const t of [9.0, 11.0]) {                                          // clicks (A6)
  put(t, sineHit(1760, 1760, 0.03, 0), 0.06, 0.1);
  put(t, noiseHit(0.012, { hp: 0.9, lp: 0.7 }), 0.04, 0.1);
}
put(13.5, sineHit(160, 73.4, 0.5, 18), 0.25, 0, 0.2);                  // low D tom: attention
whoosh(3.0, 0.5, 0.14);
whoosh(9.5, 0.35, 0.08);
whoosh(13.5, 0.35, 0.08);
whoosh(16.75, 0.45, 0.1);
whoosh(19.5, 0.5, 0.12);

// ---------- reverb on the send bus (Schroeder: 4 combs + 2 allpasses) ----------
function reverb(input, offset) {
  const out = new Float32Array(N);
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ d: d + offset, buf: new Float32Array(d + offset), i: 0, fb: 0.8 }));
  for (let n = 0; n < N; n++) {
    let s = 0;
    for (const c of combs) { const y = c.buf[c.i]; c.buf[c.i] = input[n] + y * c.fb; c.i = (c.i + 1) % c.d; s += y; }
    out[n] = s / 4;
  }
  for (const d of [225 + offset, 556 + offset]) {
    const buf = new Float32Array(d); let i = 0;
    for (let n = 0; n < N; n++) { const b = buf[i]; const y = -out[n] + b; buf[i] = out[n] + b * 0.5; i = (i + 1) % d; out[n] = y; }
  }
  return out;
}
const wetL = reverb(sendL, 0), wetR = reverb(sendR, 23);
for (let n = 0; n < N; n++) { L[n] += wetL[n] * 0.35; R[n] += wetR[n] * 0.35; }

// ---------- master: fade out, soft clip, normalise to -1 dBFS ----------
for (let n = 0; n < N; n++) {
  const t = n / SR;
  const g = t > DUR - 1.2 ? Math.max(0, (DUR - t) / 1.2) : 1;
  L[n] = Math.tanh(L[n] * 1.2 * g); R[n] = Math.tanh(R[n] * 1.2 * g);
}
let peak = 0, sumSq = 0;
for (let n = 0; n < N; n++) { peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n])); sumSq += L[n] * L[n] + R[n] * R[n]; }
const norm = 0.891 / peak;
const pcm = Buffer.alloc(44 + N * 4);
pcm.write("RIFF", 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write("WAVE", 8); pcm.write("fmt ", 12);
pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22); pcm.writeUInt32LE(SR, 24);
pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34); pcm.write("data", 36); pcm.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * norm)) * 32767), 44 + n * 4);
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[n] * norm)) * 32767), 46 + n * 4);
}
writeFileSync(resolve(here, "audio.wav"), pcm);
const rmsDb = 20 * Math.log10(Math.sqrt(sumSq / (2 * N)) * norm);
console.log(`audio.wav: ${DUR}s, peak -1.0 dBFS, RMS ${rmsDb.toFixed(1)} dBFS`);
