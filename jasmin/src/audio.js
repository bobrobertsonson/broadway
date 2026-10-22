// Jasmin's Game audio: pure WebAudio, no assets. Every export is a safe no-op until unlockAudio().
let ctx = null, master, sfxBus, musBus, noiseBuf;
let muted = false;
try { muted = localStorage.getItem('jg-muted') === '1'; } catch (e) { /* storage unavailable */ }

const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
// "c5", "f#4", "ab3" -> midi number
function midi(name) {
  const m = /^([a-g])([#b]?)(\d)$/.exec(name);
  if (!m) return 60;
  return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

// ---------- engine ----------
export function unlockAudio() {
  try {
    if (!ctx && AC) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
      musBus = ctx.createGain(); musBus.gain.value = 0.16; musBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx && ctx.state !== 'running') { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); }
    if (ctx && pending && !cur) { const t = pending; pending = null; startMusic(t); }
  } catch (e) { /* never throw */ }
}

export function setMuted(m) {
  muted = !!m;
  try { localStorage.setItem('jg-muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
  try { if (master) master.gain.value = muted ? 0 : 1; } catch (e) { /* ignore */ }
}

// One enveloped oscillator. f1 != f0 sweeps exponentially. `set` collects it for cleanup.
function tone(type, f0, f1, t, dur, vol, dest, set) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || sfxBus);
  if (set) { set.add(o); o.onended = () => { set.delete(o); g.disconnect(); }; }
  o.start(t); o.stop(t + dur + 0.02);
  return o;
}

// Filtered noise burst.
function noise(t, dur, vol, freq, ftype, q) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf;
  f.type = ftype || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxBus);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

// ---------- sound effects ----------
const arp = (notes, t, step, type, dur, vol) =>
  notes.forEach((n, i) => tone(type, hz(n), hz(n), t + i * step, dur, vol));

const defs = {
  jump: (t) => tone('square', 280, 640, t, 0.16, 0.35),
  boost: (t) => { tone('square', 200, 1100, t, 0.32, 0.3); tone('triangle', 400, 1800, t, 0.32, 0.4); },
  land: (t) => { noise(t, 0.07, 0.35, 500); tone('triangle', 130, 60, t, 0.09, 0.5); },
  collect: (t) => { tone('square', hz(83), hz(83), t, 0.08, 0.28); tone('square', hz(88), hz(88), t + 0.08, 0.22, 0.28); },
  hat: (t) => arp([76, 79, 83, 88, 91, 95, 100, 103], t, 0.055, 'triangle', 0.16, 0.4),
  hit: (t) => { tone('square', 340, 70, t, 0.35, 0.3); tone('square', 330, 66, t, 0.35, 0.2); noise(t, 0.12, 0.25, 1200); },
  stomp: (t) => { tone('triangle', 200, 45, t, 0.14, 0.7); noise(t, 0.05, 0.2, 700); },
  pen: (t) => { for (let i = 0; i < 5; i++) noise(t + i * 0.07, 0.06, 0.35, 2500 + Math.random() * 3000, 'bandpass', 3); },
  checkpoint: (t) => arp([72, 76, 79], t, 0.1, 'square', 0.2, 0.28),
  win: (t) => {
    const seq = [[72, 0, .1], [72, .12, .1], [72, .24, .1], [76, .36, .14], [79, .52, .14], [84, .7, .9]];
    seq.forEach(([n, o, d]) => { tone('square', hz(n), hz(n), t + o, d, 0.26); tone('triangle', hz(n - 12), hz(n - 12), t + o, d, 0.4); });
    tone('square', hz(88), hz(88), t + 0.7, 0.9, 0.14);
  },
  gate: (t) => { // wooden creak, then latch
    const o = tone('square', 95, 150, t, 0.8, 0.25);
    o.frequency.setValueAtTime(95, t);
    o.frequency.linearRampToValueAtTime(150, t + 0.3);
    o.frequency.linearRampToValueAtTime(105, t + 0.55);
    o.frequency.linearRampToValueAtTime(135, t + 0.8);
    noise(t, 0.8, 0.12, 700, 'bandpass', 4);
    noise(t + 0.95, 0.04, 0.5, 3000, 'highpass');
    tone('square', 220, 180, t + 0.95, 0.05, 0.3);
    noise(t + 1.08, 0.05, 0.5, 2000, 'highpass');
    tone('square', 160, 120, t + 1.08, 0.08, 0.3);
  },
  hatch: (t) => {
    [0, 0.28].forEach((o) => { noise(t + o, 0.05, 0.6, 2500, 'highpass'); tone('square', 1600, 200, t + o, 0.07, 0.25); });
    arp([84, 88, 91, 96, 100, 103, 108], t + 0.6, 0.075, 'triangle', 0.4, 0.35);
  },
};
export const sfx = {};
for (const k of Object.keys(defs)) {
  sfx[k] = () => { if (!ctx) return; try { defs[k](ctx.currentTime + 0.005); } catch (e) { /* ignore */ } };
}

// ---------- music ----------
// Each bar is 8 eighth-note steps. Tokens: note name = new note, "-" = hold, "." = rest.
// Bass: one root per bar plus a shared 8-step pattern of semitone offsets from that root.
const TRACKS = {
  map: { bpm: 120, wave: 'square', mv: 0.5,
    mel: ['c5 - d5 e5 g5 - e5 -', 'd5 - b4 - g4 - . .', 'a4 - c5 - f5 - e5 -', 'd5 - - - . . g4 .',
          'g4 - c5 - e5 - g5 -', 'f5 - d5 - b4 - d5 -', 'e5 - c5 - a4 - f4 -', 'g4 - - - c5 - - .'],
    roots: ['c3', 'g2', 'f2', 'g2', 'c3', 'g2', 'f2', 'g2'], pat: '0 . 7 . 0 . 7 .' },
  level: { bpm: 152, wave: 'square', mv: 0.45,
    mel: ['d5 . g5 . b5 . g5 .', 'a5 . f#5 . d5 - - .', 'e5 . g5 . c6 . b5 .', 'a5 - g5 - - . d5 .',
          'd5 . g5 . b5 . d6 .', 'c6 . a5 . f#5 . a5 .', 'b5 . g5 . e5 . g5 .', 'a5 - - . g5 - - .'],
    roots: ['g2', 'd3', 'c3', 'd3', 'g2', 'c3', 'e3', 'd3'], pat: '0 . 7 . 0 . 7 12' },
  night: { bpm: 84, wave: 'triangle', mv: 0.8,
    mel: ['a4 - - - c5 - - -', 'e5 - - - d5 - c5 -', 'b4 - - - d5 - - -', 'c5 - - - a4 - - -',
          'f4 - - - a4 - - -', 'c5 - - - b4 - a4 -', 'g4 - b4 - d5 - - -', 'e5 - - - - - - .'],
    roots: ['a2', 'e2', 'g2', 'a2', 'f2', 'c3', 'g2', 'e2'], pat: '0 - - - 7 - - -' },
  sendoff: { bpm: 66, wave: 'triangle', mv: 0.8,
    mel: ['e5 - - - g5 - - -', 'a5 - - - g5 - e5 -', 'd5 - - - f5 - - -', 'e5 - - - - - - .',
          'c5 - - - e5 - - -', 'f5 - e5 - d5 - - -', 'ab4 - c5 - f5 - - -', 'e5 - - - c5 - - .'],
    roots: ['c3', 'a2', 'd3', 'g2', 'c3', 'f2', 'f2', 'c3'], pat: '0 - - - - - 7 -' },
  credits: { bpm: 100, wave: 'triangle', mv: 0.7,
    mel: ['c5 - e5 - g5 - e5 -', 'f5 - a5 - g5 - - .', 'e5 - g5 - c6 - g5 -', 'a5 - g5 - f5 - - -',
          'd5 - f5 - a5 - f5 -', 'g5 - b5 - d6 - - .', 'c6 - g5 - e5 - g5 -', 'c5 - - - - - - .'],
    roots: ['c3', 'f3', 'c3', 'f3', 'd3', 'g2', 'c3', 'c3'], pat: '0 - 7 - 12 - 7 -' },
};

// Expand tokens into a flat step list of {m, len} / null.
function expand(bars, toMidi) {
  const steps = [];
  bars.forEach((bar, bi) => {
    let last = null;
    for (const tok of bar.trim().split(/\s+/).slice(0, 8)) {
      if (tok === '-') { if (last) last.len++; steps.push(null); }
      else if (tok === '.') { last = null; steps.push(null); }
      else { last = { m: toMidi(tok, bi), len: 1 }; steps.push(last); }
    }
  });
  return steps;
}

let cur = null;      // { name, timer, tg, oscs, next, i, step, mel, bass, def }
let pending = null;  // track requested before unlockAudio

function tick() {
  const c = cur;
  if (!c || !ctx) return;
  try {
    while (c.next < ctx.currentTime + 0.1) {
      const i = c.i % c.mel.length, t = c.next, d = c.def;
      const m = c.mel[i], b = c.bass[i];
      if (m) tone(d.wave, hz(m.m), hz(m.m), t, Math.max(0.06, m.len * c.step * 0.92), d.mv, c.tg, c.oscs);
      if (b) tone('triangle', hz(b.m), hz(b.m), t, Math.max(0.06, b.len * c.step * 0.9), 0.9, c.tg, c.oscs);
      c.next += c.step; c.i++;
    }
  } catch (e) { /* ignore */ }
}

export function stopMusic() {
  pending = null;
  const c = cur;
  cur = null;
  if (!c) return;
  try {
    clearInterval(c.timer);
    const now = ctx.currentTime;
    c.tg.gain.cancelScheduledValues(now);
    c.tg.gain.setTargetAtTime(0, now, 0.015);
    c.oscs.forEach((o) => { try { o.stop(now + 0.08); } catch (e) { /* ignore */ } });
    setTimeout(() => { try { c.tg.disconnect(); } catch (e) { /* ignore */ } }, 300);
  } catch (e) { /* ignore */ }
}

export function startMusic(track) {
  try {
    const def = TRACKS[track];
    if (!def) return;
    if (!ctx) { pending = track; return; }
    if (cur && cur.name === track) return;
    stopMusic();
    const pat = def.pat.split(/\s+/);
    const c = {
      name: track, def, oscs: new Set(), step: 60 / def.bpm / 2, i: 0, next: ctx.currentTime + 0.06,
      tg: ctx.createGain(),
      mel: expand(def.mel, (tok) => midi(tok)),
      bass: expand(def.roots.map(() => pat.join(' ')), (tok, bi) => midi(def.roots[bi]) + Number(tok)),
    };
    c.tg.connect(musBus);
    cur = c;
    tick();
    c.timer = setInterval(tick, 25);
  } catch (e) { /* ignore */ }
}
