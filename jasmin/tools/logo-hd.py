# Builds the high-def poster logo as a pure-vector SVG (text converted to outlines).
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

DEPTH = 14


def layer(d, kind, ink, gold, face, gloss_id):
    """Stack: soft shadow, extrusion, ink outline, gold bevel, face, gloss."""
    out = []
    out.append(f'<path d="{d}" transform="translate(10 30)" fill="#140a24" stroke="#140a24" stroke-width="{ink*2}" stroke-linejoin="round" opacity=".45" filter="url(#blur)"/>')
    for k in range(DEPTH, 0, -1):
        t = k / DEPTH
        col = "#1d0d38" if k > DEPTH * 0.6 else "#2c1552"
        out.append(f'<path d="{d}" transform="translate({k*0.7:.1f} {k*1.6:.1f})" fill="{col}" stroke="{col}" stroke-width="{ink*2}" stroke-linejoin="round"/>')
    out.append(f'<path d="{d}" fill="#3a1d63" stroke="#3a1d63" stroke-width="{ink*2}" stroke-linejoin="round"/>')
    out.append(f'<path d="{d}" fill="url(#gold)" stroke="url(#gold)" stroke-width="{gold*2}" stroke-linejoin="round"/>')
    out.append(f'<path d="{d}" fill="none" stroke="#fff6c4" stroke-width="{max(2, gold*0.45):.1f}" stroke-linejoin="round" transform="translate(-1.5 -2.5)" opacity=".7"/>')
    out.append(f'<path d="{d}" fill="{face}"/>')
    out.append(f'<clipPath id="{gloss_id}"><path d="{d}"/></clipPath>')
    out.append(f'<g clip-path="url(#{gloss_id})"><rect x="0" y="0" width="{W}" height="{H}" fill="url(#{gloss_id}g)"/></g>')
    return "\n".join(out)


def gloss_grad(gid, y0, y1):
    return f'''<linearGradient id="{gid}g" gradientUnits="userSpaceOnUse" x1="0" y1="{y0}" x2="0" y2="{y1}">
  <stop offset="0" stop-color="#ffffff" stop-opacity=".65"/><stop offset=".42" stop-color="#ffffff" stop-opacity=".18"/>
  <stop offset=".43" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>'''


def face_grad(gid, y0, y1, top, mid, bot):
    return f'''<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="{y0}" x2="0" y2="{y1}">
  <stop offset="0" stop-color="{top}"/><stop offset=".55" stop-color="{mid}"/><stop offset="1" stop-color="{bot}"/></linearGradient>'''


def hat(x, y, scale, rot):
    """A shaded witch hat, brim center at (x, y)."""
    return f'''<g transform="translate({x} {y}) rotate({rot}) scale({scale})">
  <ellipse cx="6" cy="34" rx="150" ry="36" fill="#140a24" opacity=".4" filter="url(#blur)"/>
  <path d="M-150 0 C -150 -26, 150 -26, 150 0 C 150 26, -150 26, -150 0 Z" fill="url(#hatBrim)" stroke="#1e1236" stroke-width="9"/>
  <path d="M-78 -6 C -70 -90, -40 -170, 10 -230 C 40 -265, 95 -285, 128 -262 C 96 -258, 70 -235, 58 -200 C 46 -160, 60 -80, 78 -6 Z" fill="url(#hatCone)" stroke="#1e1236" stroke-width="9" stroke-linejoin="round"/>
  <path d="M-30 -120 C -20 -170, 5 -205, 30 -225" fill="none" stroke="#9c7ad6" stroke-width="10" stroke-linecap="round" opacity=".55"/>
  <path d="M-80 -8 C -40 -24, 40 -24, 80 -8 L 76 -40 C 40 -54, -40 -54, -74 -40 Z" fill="url(#gold)" stroke="#1e1236" stroke-width="7" stroke-linejoin="round"/>
  <path d="M-70 -36 C -36 -48, 36 -48, 70 -36" fill="none" stroke="#fff6c4" stroke-width="4" opacity=".8"/>
  <rect x="-16" y="-48" width="32" height="34" rx="5" fill="none" stroke="#1e1236" stroke-width="7"/>
</g>'''


def sparkle(x, y, r, color="#ffffff"):
    return (f'<path d="M{x} {y-r} C {x+r*0.12} {y-r*0.12}, {x+r*0.12} {y-r*0.12}, {x+r} {y} C {x+r*0.12} {y+r*0.12}, {x+r*0.12} {y+r*0.12}, {x} {y+r} '
            f'C {x-r*0.12} {y+r*0.12}, {x-r*0.12} {y+r*0.12}, {x-r} {y} C {x-r*0.12} {y-r*0.12}, {x-r*0.12} {y-r*0.12}, {x} {y-r} Z" fill="{color}" filter="url(#glow)"/>')


mx, my, mww = magic_box
sparkles = "\n".join([
    sparkle(mx - 40, my + 30, 34), sparkle(mx + mww + 30, my + 10, 42, "#fff3b0"),
    sparkle(mx + mww * 0.55, my - 30, 22), sparkle(mx + mww + 75, my + 95, 18, "#fff3b0"),
    sparkle(mx - 80, my + 120, 16), sparkle(jx + jw + 30, jy - 220, 26, "#fff3b0"),
])

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<title>Super Jasmin World 3: A New Magic</title>
<defs>
  <filter id="blur" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="12"/></filter>
  <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff0a0"/><stop offset=".45" stop-color="#f2bd4a"/><stop offset=".7" stop-color="#e0a43a"/><stop offset="1" stop-color="#9a6618"/></linearGradient>
  {face_grad("purpleJ", jy - J_SIZE * 0.75, jy + 10, "#a77be6", "#6a35b0", "#43207a")}
  {face_grad("purpleW", jy + W_SIZE * 1.05 - W_SIZE * 0.75, jy + W_SIZE * 1.05 + 10, "#a77be6", "#6a35b0", "#43207a")}
  {face_grad("purpleS", jy - J_SIZE * 0.78 - S_SIZE * 0.75, jy - J_SIZE * 0.78 + 10, "#a77be6", "#6a35b0", "#43207a")}
  {face_grad("goldM", my - 40, my + M_SIZE * 0.9, "#fff6c4", "#f6cf6f", "#e09a2e")}
  {gloss_grad("gJ", jy - J_SIZE * 0.78, jy + 5)}
  {gloss_grad("gW", jy + W_SIZE * 1.05 - W_SIZE * 0.78, jy + W_SIZE * 1.05 + 5)}
  {gloss_grad("gS", jy - J_SIZE * 0.78 - S_SIZE * 0.78, jy - J_SIZE * 0.78 + 5)}
  {gloss_grad("gM", my - 40, my + M_SIZE * 0.9)}
  <linearGradient id="hatCone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1a48"/><stop offset=".45" stop-color="#5b3f8f"/><stop offset="1" stop-color="#2a1a48"/></linearGradient>
  <linearGradient id="hatBrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b3f8f"/><stop offset="1" stop-color="#22143c"/></linearGradient>
</defs>
{layer(super_, "super", 14, 9, "url(#purpleS)", "gS")}
{layer(jasmin, "jasmin", 22, 14, "url(#purpleJ)", "gJ")}
{layer(world, "world", 16, 10, "url(#purpleW)", "gW")}
{layer(magic, "magic", 14, 0.01, "url(#goldM)", "gM")}
{hat(jx + J_SIZE * 0.26, jy - J_SIZE * 0.6, 0.98, -14)}
{sparkles}
</svg>'''
open(OUT, "w").write(svg)
print("wrote", OUT, len(svg) // 1024, "KB")
