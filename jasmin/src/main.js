import { initControls } from "./controls.js";
import { unlockAudio, setMuted } from "./audio.js";
import { ui } from "./ui.js";
import { Boot } from "./scenes/Boot.js";
import { Title } from "./scenes/Title.js";
import { WorldMap } from "./scenes/WorldMap.js";
import { Level } from "./scenes/Level.js";
import { Credits } from "./scenes/Credits.js";
import { Intro } from "./scenes/Intro.js";
import { Ending } from "./scenes/Ending.js";

// Internal resolution is dynamic: about 180 to 220 px tall, width fills the
// screen. The whole-number zoom is picked in *device* pixels, so every game pixel
// is an exact block of screen pixels even when the browser reports a fractional
// devicePixelRatio (TVs, Windows at 125/150%). A 1920x1080 screen gets zoom 6:
// 320x180 game pixels, filling the panel exactly. Phaser's zoom is in CSS pixels,
// hence zoom / dpr.
function viewSize() {
  const dpr = window.devicePixelRatio || 1;
  const W = Math.round(window.innerWidth * dpr), H = Math.round(window.innerHeight * dpr);
  const zoom = Math.max(1, Math.min(Math.floor(H / 176), Math.floor(W / 300)));
  return { w: Math.floor(W / zoom), h: Math.floor(H / zoom), zoom: zoom / dpr };
}

// DOM text (captions, HUD, menus) grows on big screens so it reads from the sofa.
function uiScale() {
  const k = Math.min(2, Math.max(1, window.innerHeight / 600));
  document.documentElement.style.setProperty("--ui", k.toFixed(3));
}
uiScale();

const v = viewSize();
const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: v.w,
  height: v.h,
  zoom: v.zoom,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: "#141012",
  scale: { mode: Phaser.Scale.NONE },
  physics: { default: "arcade", arcade: { gravity: { y: 900 }, debug: false, tileBias: 20 } },
  input: { activePointers: 3, gamepad: true },
  fps: { target: 60 },
  scene: [Boot, Title, Intro, WorldMap, Level, Ending, Credits],
};

const phaser = new Phaser.Game(config);
window.__game = phaser; // handy for debugging and automated tests

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const s = viewSize();
    phaser.scale.setZoom(s.zoom);
    phaser.scale.resize(s.w, s.h);
    uiScale();
  }, 100);
});

let muted = false;
try { muted = localStorage.getItem("jg-muted") === "1"; } catch {}
ui.setMuted(muted);
setMuted(muted);
ui.onMute(() => { muted = !muted; setMuted(muted); ui.setMuted(muted); });

initControls(() => unlockAudio(), phaser);
