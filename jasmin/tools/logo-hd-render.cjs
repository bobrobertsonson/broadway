const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  let svg = fs.readFileSync('logo.svg', 'utf8');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 2000, height: 1300 } });
  await p.setContent(svg);
  const bb = await p.evaluate(() => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const el of document.querySelectorAll('svg > path, svg > g:not([clip-path]) path, svg > g:not([clip-path]) ellipse')) { const r = el.getBoundingClientRect(); if (!r.width) continue; a = Math.min(a, r.left); b = Math.min(b, r.top); c = Math.max(c, r.right); d = Math.max(d, r.bottom); } return [a, b, c - a, d - b]; });
  const m = 50, [x, y, w, h] = [Math.floor(bb[0] - m), Math.floor(bb[1] - m), Math.ceil(bb[2] + 2 * m + 20), Math.ceil(bb[3] + 2 * m + 40)];
  svg = svg.replace(/viewBox="[^"]*" width="\d+" height="\d+"/, `viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}"`);
  fs.writeFileSync('logo.svg', svg);
  for (const [scale, out] of [[0.5, 'logo-preview.png'], [3, 'logo-4k.png']]) {
    const q = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    await q.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await q.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  }
  console.log('bbox', x, y, w, h); await b.close();
})();
