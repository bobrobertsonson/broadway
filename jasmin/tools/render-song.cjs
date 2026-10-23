// Renders a game song (src/songs/<key>.js) offline with the same voices as src/audio.js, to a WAV
// you can listen to. Serve the jasmin folder on port 8124 first.
// usage: node tools/render-song.cjs <song key> <seconds> <out.wav>
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [key, secs, out] = [process.argv[2], Number(process.argv[3]), process.argv[4]];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.goto('http://localhost:8124/gallery.html');
  const data = await p.evaluate(async ([key, secs]) => {
    const song = (await import(`./src/songs/${key}.js`)).default;
    const sr = 32000, ctx = new OfflineAudioContext(1, Math.ceil(sr * secs), sr);
    const bus = ctx.createGain(); bus.gain.value = 0.16; bus.connect(ctx.destination);
    const noiseBuf = ctx.createBuffer(1, sr, sr); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const pulses = {};
    const wave = (o, type) => { if (type.startsWith('pulse')) { if (!pulses[type]) { const d = type === 'pulse12' ? 0.125 : 0.25, n = 48, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d); pulses[type] = ctx.createPeriodicWave(re, im); } o.setPeriodicWave(pulses[type]); } else o.type = type; };
    const held = (type, f, t, dur, vol) => { const o = ctx.createOscillator(), g = ctx.createGain(); wave(o, type); o.frequency.setValueAtTime(f, t); const end = t + Math.max(0.04, dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.setValueAtTime(vol * 0.8, Math.max(t + 0.007, end - 0.03)); g.gain.linearRampToValueAtTime(0.0001, end); o.connect(g); g.connect(bus); o.start(t); o.stop(end + 0.02); };
    const tone = (type, f0, f1, t, dur, vol) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02); };
    const noise = (t, dur, vol, freq, ftype, q) => { const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = ftype || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 1;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02); };
    const drum = (k, t) => { if (k === 'k') tone('sine', 150, 45, t, 0.14, 1); else if (k === 's') noise(t, 0.1, 0.5, 1800, 'bandpass', 0.8); else if (k === 'h') noise(t, 0.03, 0.25, 7000, 'highpass', 1); else if (k === 'm') noise(t, 0.05, 0.18, 5000, 'highpass', 1); };
    const spb = 60 / song.bpm;
    for (const v of song.voices) for (const e of (v.notes || v.hits)) {
      const t = 0.05 + e[0] * spb; if (t > secs - 0.2) continue;
      if (v.hits) drum(e[1], t); else held(v.wave || 'square', hz(e[2]), t, e[1] * spb * 0.95, v.vol ?? 0.4);
    }
    const buf = await ctx.startRendering();
    const ch = buf.getChannelData(0); let peak = 0; for (const x of ch) peak = Math.max(peak, Math.abs(x));
    const gain = 0.89 / (peak || 1), pcm = new Int16Array(ch.length);
    for (let i = 0; i < ch.length; i++) pcm[i] = Math.max(-32767, Math.min(32767, ch[i] * gain * 32767));
    return { sr, pcm: Array.from(new Uint8Array(pcm.buffer)), peak };
  }, [key, secs]);
  const pcm = Buffer.from(data.pcm), h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(data.sr, 24); h.writeUInt32LE(data.sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(out, Buffer.concat([h, pcm]));
  console.log('wrote', out, 'peak', data.peak.toFixed(3));
  await b.close();
})();
