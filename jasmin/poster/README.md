# Poster logo

- `logo.svg`: the high-def logo as pure vectors (text converted to outlines), any size.
- `logo-print.png`: 4113 x 3159, transparent background.

Same layout and colors as the in-game logo, with the 3D treatment allowed for print: extruded depth, glossy purple face, gold bevel, soft drop shadow, a shaded witch hat sitting on the J, sparkles around "A New Magic".

Fonts (SIL Open Font License, outlines embedded): Lilita One for SUPER / JASMIN / WORLD 3:, Pacifico for "A New Magic".

Rebuild: download both fonts into a folder, then
`python3 -I tools/logo-hd.py <fonts dir> poster/logo.svg` and `node tools/logo-hd-render.cjs` (run from `poster/`; trims the canvas and renders the PNGs).

## Poster-art version (matches the painted key art)

- `logo-poster.svg` / `logo-poster.png` (transparent, about 3950 px wide): same lettering, restyled for the painted poster: deep violet velvet face like her hat, metallic gold edge like her belt, a cool-left / warm-right glow matching the split background, and a golden sparkle trail through "A New Magic" like the pen's ribbon.
- `poster-preview-a.jpg`: placed top-left over the dark sky. `poster-preview-b.jpg`: centered, with the sky stretched to 2:3 (rough stretch, shows the seam: for print, extend the sky properly).
- Rebuild: `python3 -I tools/logo-poster.py <fonts dir> poster/logo-poster.svg`.
