#!/usr/bin/env node
// MIDI file -> chiptune song module for the game (src/songs/<key>.js).
//
//   node tools/midi2song.mjs song.mid --list
//       shows the MIDI's parts (track/channel, note count, pitch range) to choose from
//   node tools/midi2song.mjs song.mid new-song --title "New Song" [options]
//       writes src/songs/new-song.js; then register it in src/songs/index.js
//
// Options:
//   --lead N --harm N --bass N   pick parts by the number shown in --list (default: automatic:
//                                highest part = lead, lowest = bass, next busiest = harmony)
//   --no-harm  --no-drums        leave a voice out
//   --bars A-B                   keep only bars A..B (1-based, inclusive), e.g. a verse and chorus
//   --transpose N                shift every pitched note by N semitones
//   --bpm N                      override the tempo
//   --lead-wave W --harm-wave W --bass-wave W   pulse12 pulse25 square triangle sawtooth
//   --beat house|dembow|hiphop   add a generated beat when the MIDI has no drum part
//
// Each voice is made monophonic like a real chip channel: on chords the lead and harmony
// keep the top note and the bass keeps the bottom one, and a new note cuts the previous.

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const file = args[0];
if (!file) { console.error("usage: node tools/midi2song.mjs file.mid [key] [--list] [options]"); process.exit(1); }
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i < 0 ? def : args[i + 1]; };
const flag = (name) => args.includes(`--${name}`);
const key = args[1] && !args[1].startsWith("--") ? args[1] : null;

// ---------- parse ----------
const buf = fs.readFileSync(file);
let p = 0;
const u8 = () => buf[p++];
const u16 = () => (buf[p++] << 8) | buf[p++];
const u32 = () => ((buf[p++] << 24) >>> 0) + (buf[p++] << 16) + (buf[p++] << 8) + buf[p++];
const str = (n) => { const s = buf.toString("latin1", p, p + n); p += n; return s; };
const vlq = () => { let v = 0, b; do { b = u8(); v = (v << 7) | (b & 0x7f); } while (b & 0x80); return v; };

if (str(4) !== "MThd") throw new Error("not a MIDI file");
const hlen = u32(); u16(); const ntrks = u16(); const division = u16(); p += hlen - 6;
if (division & 0x8000) throw new Error("SMPTE time division is not supported");
const ppq = division;

let tempo = null, timeSig = [4, 4];
const parts = new Map(); // "track:channel" -> { name, notes: [] }
for (let tr = 0; tr < ntrks; tr++) {
  if (str(4) !== "MTrk") throw new Error("bad track chunk");
  const end = u32() + p;
  let tick = 0, status = 0, tname = "";
  const open = new Map();
  while (p < end) {
    tick += vlq();
    let st = buf[p];
    if (st & 0x80) { p++; status = st; } else st = status;
    if (st === 0xff) {
      const type = u8(), len = vlq(), data = buf.subarray(p, p + len); p += len;
      if (type === 0x51 && tempo == null) tempo = (data[0] << 16) | (data[1] << 8) | data[2];
      if (type === 0x58 && tick === 0) timeSig = [data[0], 2 ** data[1]];
      if (type === 0x03) tname = data.toString("latin1");
    } else if (st === 0xf0 || st === 0xf7) { p += vlq(); }
    else {
      const kind = st >> 4, ch = st & 15;
      const a = u8(), b = kind === 0xc || kind === 0xd ? 0 : u8();
      const id = `${tr}:${ch}`;
      if (!parts.has(id)) parts.set(id, { id, track: tr, ch, name: "", notes: [] });
      const part = parts.get(id);
      if (tname) part.name = tname;
      const k = `${ch}:${a}`;
      if (kind === 0x9 && b > 0) { if (!open.has(k)) open.set(k, []); open.get(k).push({ tick, vel: b }); }
      else if (kind === 0x8 || (kind === 0x9 && b === 0)) {
        const on = open.get(k)?.shift();
        if (on) part.notes.push({ start: on.tick / ppq, len: (tick - on.tick) / ppq, m: a, vel: on.vel });
      }
    }
  }
  p = end;
}
const list = [...parts.values()].filter((x) => x.notes.length).map((x, i) => {
  const ms = x.notes.map((n) => n.m);
  return { ...x, n: i + 1, lo: Math.min(...ms), hi: Math.max(...ms), avg: ms.reduce((s, m) => s + m, 0) / ms.length, drums: x.ch === 9 };
});
const bpm = Number(opt("bpm", 0)) || (tempo ? Math.round(60e6 / tempo) : 120);
const beatsPerBar = timeSig[0] * (4 / timeSig[1]);
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const nn = (m) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;

if (flag("list") || !key) {
  console.log(`tempo ${bpm} bpm, ${timeSig[0]}/${timeSig[1]}, ${Math.ceil(Math.max(...list.flatMap((x) => x.notes.map((n) => n.start + n.len))) / beatsPerBar)} bars`);
  for (const x of list) console.log(`${String(x.n).padStart(2)}  ${x.drums ? "DRUMS " : "      "}track ${x.track} ch ${x.ch + 1}  ${String(x.notes.length).padStart(4)} notes  ${nn(x.lo)}-${nn(x.hi)}  avg ${nn(Math.round(x.avg))}  ${x.name}`);
  process.exit(0);
}

const q = (x) => Math.round(x * 48) / 48;

// ---------- choose voices ----------
const melodic = list.filter((x) => !x.drums && x.notes.length >= 8);
const pick = (name) => { const n = Number(opt(name, 0)); return n ? list.find((x) => x.n === n) : null; };
let lead = pick("lead"), bass = pick("bass"), harm = pick("harm");
const byPitch = [...melodic].sort((a, b) => b.avg - a.avg);
// Lead: a part named like a melody wins; otherwise favor high, busy, single-note lines over chords.
const chordiness = (x) => x.notes.length / new Set(x.notes.map((n) => q(n.start))).size;
const leadScore = (x) => x.avg + Math.min(12, new Set(x.notes.map((n) => q(n.start))).size / 8) - 10 * (chordiness(x) - 1);
lead ||= melodic.find((x) => /melod|vocal|voice|lead|sing|vox/i.test(x.name)) || [...melodic].sort((a, b) => leadScore(b) - leadScore(a))[0];
bass ||= byPitch.filter((x) => x !== lead).at(-1);
harm ||= melodic.filter((x) => x !== lead && x !== bass).sort((a, b) => b.notes.length - a.notes.length)[0];
if (flag("no-harm")) harm = null;
const drums = flag("no-drums") ? null : list.find((x) => x.drums);

// ---------- shape ----------
const [b0, b1] = (opt("bars", "") || "").split("-").map(Number);
const from = b0 ? (b0 - 1) * beatsPerBar : 0;
const to = b1 ? b1 * beatsPerBar : Infinity;
const transpose = Number(opt("transpose", 0));

function mono(part, top, lo, hi) {
  const notes = part.notes.filter((n) => n.start >= from && n.start < to).map((n) => ({ ...n, start: n.start - from, m: n.m + transpose }));
  const byStart = new Map();
  for (const n of notes) {
    const k = q(n.start);
    const cur = byStart.get(k);
    if (!cur || (top ? n.m > cur.m : n.m < cur.m)) byStart.set(k, n);
  }
  const seq = [...byStart.entries()].sort((a, b) => a[0] - b[0]).map(([s, n]) => ({ s, len: n.len, m: n.m }));
  for (let i = 0; i < seq.length; i++) {
    if (i + 1 < seq.length) seq[i].len = Math.min(seq[i].len, seq[i + 1].s - seq[i].s);
    let m = seq[i].m;
    while (m < lo) m += 12;
    while (m > hi) m -= 12;
    seq[i].m = m;
  }
  return seq.filter((n) => n.len > 0.02).map((n) => [q(n.s), q(Math.max(n.len, 1 / 16)), n.m]);
}

function drumHits(part) {
  const map = (m) => (m === 35 || m === 36 ? "k" : m === 38 || m === 40 || m === 37 || m === 39 ? "s" : m === 42 || m === 44 || m === 46 || m === 51 || m === 53 ? "h" : "m");
  const seen = new Set();
  return part.notes.filter((n) => n.start >= from && n.start < to).map((n) => [q(n.start - from), map(n.m)])
    .filter(([b, k]) => { const id = `${b}${k}`; if (seen.has(id)) return false; seen.add(id); return true; })
    .sort((a, b) => a[0] - b[0]);
}

const voices = [];
if (lead) voices.push({ role: "lead", wave: opt("lead-wave", "pulse25"), vol: 0.32, notes: mono(lead, true, 60, 88) });
if (harm) voices.push({ role: "harm", wave: opt("harm-wave", "pulse12"), vol: 0.18, notes: mono(harm, true, 52, 81) });
if (bass) voices.push({ role: "bass", wave: opt("bass-wave", "triangle"), vol: 0.75, notes: mono(bass, false, 31, 55) });
if (drums) voices.push({ role: "drums", vol: 1, hits: drumHits(drums) });

// --beat house|dembow|hiphop: a generated beat for MIDIs without drums, from the first note to the end.
const beat = opt("beat", "");
if (beat && !drums) {
  const first = Math.min(...voices.flatMap((v) => v.notes.map((e) => e[0])));
  const end = Math.max(...voices.flatMap((v) => v.notes.map((e) => e[0] + e[1])));
  const bar = { house: [[0, "k"], [0.5, "h"], [1, "k"], [1, "s"], [1.5, "h"], [2, "k"], [2.5, "h"], [3, "k"], [3, "s"], [3.5, "h"]],
    dembow: [[0, "k"], [0.75, "s"], [1, "k"], [1.5, "s"], [2, "k"], [2.75, "s"], [3, "k"], [3.5, "s"]],
    // half-time hip hop: kick on 1, a pickup kick, one snare on 3, steady eighth-note hats
    hiphop: [[0, "k"], [0, "h"], [0.5, "h"], [1, "h"], [1.5, "h"], [1.75, "k"], [2, "s"], [2, "h"], [2.5, "k"], [2.5, "h"], [3, "h"], [3.5, "h"]] }[beat];
  if (!bar) throw new Error("--beat must be house, dembow or hiphop");
  const hits = [];
  for (let b0 = Math.floor(first / beatsPerBar) * beatsPerBar; b0 < end; b0 += beatsPerBar) for (const [o, k] of bar) hits.push([q(b0 + o), k]);
  voices.push({ role: "drums", vol: 1, hits });
}

const last = Math.max(0, ...voices.flatMap((v) => (v.notes || v.hits).map((e) => e[0] + (e[1] > 0 ? e[1] : 0))));
const loopBeats = Math.max(beatsPerBar, Math.ceil(last / beatsPerBar) * beatsPerBar);
const song = { title: opt("title", key), bpm, loopBeats, voices };

const out = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "src", "songs", `${key}.js`);
const body = JSON.stringify(song).replace(/\],\[/g, "],\n[");
fs.writeFileSync(out, `// ${song.title}: chiptune arrangement made with tools/midi2song.mjs from ${path.basename(file)}.\n// Parts: lead ${lead ? `#${lead.n}` : "-"}, harmony ${harm ? `#${harm.n}` : "-"}, bass ${bass ? `#${bass.n}` : "-"}, drums ${drums ? `#${drums.n}` : "-"}.\nexport default ${body};\n`);
console.log(`wrote ${out}: ${bpm} bpm, ${loopBeats / beatsPerBar} bars, ${voices.map((v) => `${v.role} ${(v.notes || v.hits).length}`).join(", ")}`);
console.log(`register it in src/songs/index.js:  import ${key.replace(/\W+(.)/g, (_, c) => c.toUpperCase())} from "./${key}.js";  and add  "${key}": ...  to SONGS`);
