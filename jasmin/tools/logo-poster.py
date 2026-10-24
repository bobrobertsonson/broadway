# Poster-art version of the high-def logo: same lettering, restyled for the painted poster
# (velvet purple face, metallic gold edge, cool-left / warm-right glow, a sparkle trail like the
# pen's ribbon through "A New Magic"). Pure vectors, text converted to outlines.
# usage: python3 -I make.py <fonts dir> <out.svg>
import sys, math
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

FONTS, OUT = sys.argv[1], sys.argv[2]
DISPLAY = TTFont(f"{FONTS}/LilitaOne.ttf")
SCRIPT = TTFont(f"{FONTS}/Pacifico.ttf")

W, H = 2000, 1300


def glyph_path(font, ch, x, y, size, rot=0):
    """SVG path for one character, baseline at (x, y), em = size px. Returns (d, advance)."""
    gs = font.getGlyphSet()
    name = font.getBestCmap().get(ord(ch))
    if not name:
        return "", size * 0.3
    s = size / font["head"].unitsPerEm
    adv = font["hmtx"][name][0] * s
    pen = SVGPathPen(gs)
    # font units (y up) -> pixels (y down), then rotate by `rot` about the glyph's bottom center
    cx = x + adv / 2
    c, si = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    gs[name].draw(TransformPen(pen, (s * c, s * si, s * si, -s * c, cx + c * (x - cx), y + si * (x - cx))))
    return pen.getCommands(), adv


def word(font, text, x, y, size, track=0.0, bounce=0.0, tilt=0.0):
    """Paths for a word, with an optional bouncy baseline and alternating tilt."""
    parts, cx = [], x
    for i, ch in enumerate(text):
        if ch == " ":
            cx += size * 0.28
            continue
        dy = -bounce if i % 2 else bounce * 0.4
        rot = tilt if i % 2 else -tilt
        d, adv = glyph_path(font, ch, cx, y + dy, size, rot)
        parts.append(d)
        cx += adv + track * size
    return " ".join(parts), cx - x


def measure(font, text, size, track=0.0):
    return word(font, text, 0, 0, size, track)[1]


# ---- layout ----
J_SIZE, W_SIZE, S_SIZE, M_SIZE = 300, 165, 120, 150
jw = measure(DISPLAY, "JASMIN", J_SIZE, 0.02)
jx, jy = (W - jw) / 2, 640
jasmin, _ = word(DISPLAY, "JASMIN", jx, jy, J_SIZE, 0.02, bounce=10, tilt=2.5)
sw = measure(DISPLAY, "SUPER", S_SIZE, 0.04)
super_, _ = word(DISPLAY, "SUPER", jx + jw * 0.34, jy - J_SIZE * 0.78, S_SIZE, 0.04, bounce=5, tilt=3)
ww = measure(DISPLAY, "WORLD 3:", W_SIZE, 0.03)
world, _ = word(DISPLAY, "WORLD 3:", (W - ww) / 2, jy + W_SIZE * 1.05, W_SIZE, 0.03, bounce=6, tilt=2)
mw = measure(SCRIPT, "A New Magic", M_SIZE)
magic, _ = word(SCRIPT, "A New Magic", (W - mw) / 2, jy + W_SIZE * 1.05 + M_SIZE * 1.15, M_SIZE)
magic_box = ((W - mw) / 2, jy + W_SIZE * 1.05 + M_SIZE * 0.35, mw)


import random
random.seed(7)
DEPTH = 10


def layer(d, ink, gold, face, gloss_id):
    """Stack: two-tone outer glow, short dark extrusion, gold edge, face, soft top light."""
    out = []
    # glow: cool blue-white from the left, warm sunset gold from the right (matches the split art)
    out.append(f'<path d="{d}" fill="url(#glowGrad)" stroke="url(#glowGrad)" stroke-width="{ink*4}" stroke-linejoin="round" opacity=".55" filter="url(#bigblur)"/>')
    out.append(f'<path d="{d}" transform="translate(6 22)" fill="#05020c" stroke="#05020c" stroke-width="{ink*2}" stroke-linejoin="round" opacity=".55" filter="url(#blur)"/>')
    for k in range(DEPTH, 0, -1):
        col = "#12061f" if k > DEPTH * 0.5 else "#1d0b33"
        out.append(f'<path d="{d}" transform="translate({k*0.5:.1f} {k*1.4:.1f})" fill="{col}" stroke="{col}" stroke-width="{ink*1.6}" stroke-linejoin="round"/>')
    out.append(f'<path d="{d}" fill="url(#gold)" stroke="url(#gold)" stroke-width="{gold*2}" stroke-linejoin="round"/>')
    out.append(f'<path d="{d}" fill="none" stroke="#fffbe6" stroke-width="{max(2, gold*0.35):.1f}" stroke-linejoin="round" transform="translate(-1 -2)" opacity=".85"/>')
    out.append(f'<path d="{d}" fill="{face}"/>')
    out.append(f'<clipPath id="{gloss_id}"><path d="{d}"/></clipPath>')
    out.append(f'<g clip-path="url(#{gloss_id})"><rect x="0" y="0" width="{W}" height="{H}" fill="url(#{gloss_id}g)"/><rect x="0" y="0" width="{W}" height="{H}" fill="url(#rimR)"/></g>')
    return "\n".join(out)


def gloss_grad(gid, y0, y1):
    return f'''<linearGradient id="{gid}g" gradientUnits="userSpaceOnUse" x1="0" y1="{y0}" x2="0" y2="{y1}">
  <stop offset="0" stop-color="#e9d8ff" stop-opacity=".55"/><stop offset=".35" stop-color="#ffffff" stop-opacity=".08"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>'''


def face_grad(gid, y0, y1, top, mid, bot):
    return f'''<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="{y0}" x2="0" y2="{y1}">
  <stop offset="0" stop-color="{top}"/><stop offset=".5" stop-color="{mid}"/><stop offset="1" stop-color="{bot}"/></linearGradient>'''


def hat(x, y, scale, rot):
    """The poster's hat: deep violet velvet, no band, a soft highlight down the cone."""
    return f'''<g transform="translate({x} {y}) rotate({rot}) scale({scale})">
  <ellipse cx="6" cy="34" rx="150" ry="36" fill="#05020c" opacity=".5" filter="url(#blur)"/>
  <path d="M-150 0 C -150 -26, 150 -26, 150 0 C 150 26, -150 26, -150 0 Z" fill="url(#hatBrim)" stroke="#12061f" stroke-width="7"/>
  <path d="M-78 -6 C -70 -90, -40 -170, 10 -230 C 40 -265, 95 -285, 128 -262 C 96 -258, 70 -235, 58 -200 C 46 -160, 60 -80, 78 -6 Z" fill="url(#hatCone)" stroke="#12061f" stroke-width="7" stroke-linejoin="round"/>
  <path d="M-30 -120 C -20 -170, 5 -205, 30 -225" fill="none" stroke="#c9a4ff" stroke-width="9" stroke-linecap="round" opacity=".45"/>
  <path d="M-150 0 C -150 -26, 150 -26, 150 0" fill="none" stroke="#ffd98a" stroke-width="5" opacity=".55"/>
</g>'''


def sparkle(x, y, r, color="#ffffff"):
    return (f'<path d="M{x} {y-r} C {x+r*0.12} {y-r*0.12}, {x+r*0.12} {y-r*0.12}, {x+r} {y} C {x+r*0.12} {y+r*0.12}, {x+r*0.12} {y+r*0.12}, {x} {y+r} '
            f'C {x-r*0.12} {y+r*0.12}, {x-r*0.12} {y+r*0.12}, {x-r} {y} C {x-r*0.12} {y-r*0.12}, {x-r*0.12} {y-r*0.12}, {x} {y-r} Z" fill="{color}" filter="url(#glow)"/>')


mx, my, mww = magic_box
# Sparkle ribbon: a glowing arc sweeping under and through "A New Magic", like the pen's trail.
x0, x1 = mx - 140, mx + mww + 160
yb = my + 150
ribbon = f'M{x0} {yb + 40} C {x0 + 300} {yb + 120}, {x1 - 380} {yb - 40}, {x1} {my - 60}'
dots = []
for i in range(140):
    t = random.random()
    # cubic bezier point
    P = [(x0, yb + 40), (x0 + 300, yb + 120), (x1 - 380, yb - 40), (x1, my - 60)]
    bx = sum(c * p[0] for c, p in zip([(1-t)**3, 3*(1-t)**2*t, 3*(1-t)*t*t, t**3], P))
    by = sum(c * p[1] for c, p in zip([(1-t)**3, 3*(1-t)**2*t, 3*(1-t)*t*t, t**3], P))
    spread = 10 + 50 * t
    dots.append(f'<circle cx="{bx + random.uniform(-spread, spread):.1f}" cy="{by + random.uniform(-spread, spread):.1f}" r="{random.uniform(1.2, 4.5) * (0.5 + t):.1f}" fill="{random.choice(["#fff6d0", "#ffd56a", "#ffffff", "#ffb347"])}" opacity="{random.uniform(.5, 1):.2f}"/>')
trail = f'''<path d="{ribbon}" fill="none" stroke="#ffcc66" stroke-width="26" opacity=".35" filter="url(#bigblur)" stroke-linecap="round"/>
<path d="{ribbon}" fill="none" stroke="#fff4cc" stroke-width="5" opacity=".9" filter="url(#glow)" stroke-linecap="round"/>
<g filter="url(#glow)">{"".join(dots)}</g>'''
sparkles = "\n".join([
    sparkle(x1 + 10, my - 70, 46, "#fff3b0"), sparkle(mx - 70, my + 10, 26), sparkle(mx + mww * 0.5, my - 40, 20),
    sparkle(jx + jw + 40, jy - 230, 30, "#fff3b0"), sparkle(jx - 50, jy - 120, 18),
])

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<title>Super Jasmin World 3: A New Magic</title>
<defs>
  <filter id="blur" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>
  <filter id="bigblur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="28"/></filter>
  <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff4c2"/><stop offset=".4" stop-color="#e8b850"/><stop offset=".72" stop-color="#b98425"/><stop offset="1" stop-color="#6e4810"/></linearGradient>
  <linearGradient id="glowGrad" gradientUnits="userSpaceOnUse" x1="{W*0.15}" y1="0" x2="{W*0.85}" y2="0">
    <stop offset="0" stop-color="#9fc4ff"/><stop offset=".5" stop-color="#e6c8ff"/><stop offset="1" stop-color="#ffb070"/></linearGradient>
  <linearGradient id="rimR" gradientUnits="userSpaceOnUse" x1="{W*0.45}" y1="0" x2="{W*0.9}" y2="0">
    <stop offset="0" stop-color="#ff9a50" stop-opacity="0"/><stop offset="1" stop-color="#ff9a50" stop-opacity=".28"/></linearGradient>
  {face_grad("purpleJ", jy - J_SIZE * 0.75, jy + 10, "#9a62ec", "#5a22a8", "#2a0c5c")}
  {face_grad("purpleW", jy + W_SIZE * 1.05 - W_SIZE * 0.75, jy + W_SIZE * 1.05 + 10, "#9a62ec", "#5a22a8", "#2a0c5c")}
  {face_grad("purpleS", jy - J_SIZE * 0.78 - S_SIZE * 0.75, jy - J_SIZE * 0.78 + 10, "#9a62ec", "#5a22a8", "#2a0c5c")}
  {face_grad("goldM", my - 40, my + M_SIZE * 0.9, "#ffffff", "#ffe9a8", "#f2b04a")}
  {gloss_grad("gJ", jy - J_SIZE * 0.78, jy + 5)}
  {gloss_grad("gW", jy + W_SIZE * 1.05 - W_SIZE * 0.78, jy + W_SIZE * 1.05 + 5)}
  {gloss_grad("gS", jy - J_SIZE * 0.78 - S_SIZE * 0.78, jy - J_SIZE * 0.78 + 5)}
  {gloss_grad("gM", my - 40, my + M_SIZE * 0.9)}
  <linearGradient id="hatCone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#240a4a"/><stop offset=".45" stop-color="#6a2fc0"/><stop offset="1" stop-color="#240a4a"/></linearGradient>
  <linearGradient id="hatBrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a2fc0"/><stop offset="1" stop-color="#1c0838"/></linearGradient>
</defs>
{trail}
{layer(super_, 14, 8, "url(#purpleS)", "gS")}
{layer(jasmin, 22, 12, "url(#purpleJ)", "gJ")}
{layer(world, 16, 9, "url(#purpleW)", "gW")}
<path d="{magic}" fill="#ffcc66" stroke="#ffcc66" stroke-width="18" stroke-linejoin="round" opacity=".55" filter="url(#bigblur)"/>
<path d="{magic}" fill="#3a1a10" stroke="#3a1a10" stroke-width="10" stroke-linejoin="round" transform="translate(3 8)" opacity=".6" filter="url(#blur)"/>
<path d="{magic}" fill="url(#goldM)" stroke="#8a5a14" stroke-width="3"/>
{hat(jx + J_SIZE * 0.26, jy - J_SIZE * 0.6, 0.98, -14)}
{sparkles}
</svg>'''
open(OUT, "w").write(svg)
print("wrote", OUT, len(svg) // 1024, "KB")
