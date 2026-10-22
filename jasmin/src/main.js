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
import { UI } from "./scenes/UI.js";
import { state as uiState } from "./ui.js";

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
  // UI is last so the text overlay renders above every other scene.
  scene: [Boot, Title, Intro, WorldMap, Level, Ending, Credits, UI],
};

const phaser = new Phaser.Game(config);
window.__game = phaser; // handy for debugging and automated tests
window.__ui = uiState;

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const s = viewSize();
    phaser.scale.setZoom(s.zoom);
    phaser.scale.resize(s.w, s.h);
  }, 100);
});

let muted = false;
try { muted = localStorage.getItem("jg-muted") === "1"; } catch {}
ui.setMuted(muted);
setMuted(muted);
const toggleMute = () => { muted = !muted; setMuted(muted); ui.setMuted(muted); };
ui.onMute(toggleMute);
window.addEventListener("keydown", (e) => { if (e.code === "KeyM" && !e.repeat && !uiState.name.active) toggleMute(); });

// Try to start audio right away: works when the browser allows autoplay (the Mac
// launcher starts Chrome that way); otherwise the first key, click or tap does it.
unlockAudio();

initControls(() => { unlockAudio(); keepAwake(); }, phaser);

// ---------- Big screen (Mac + HDMI TV) helpers ----------

// Full screen hides all browser chrome. Needs a key press or click: browsers do not
// accept a controller button as permission for this.
function toggleFullscreen() {
  const el = document.documentElement;
  const on = document.fullscreenElement || document.webkitFullscreenElement;
  try {
    const r = on ? (document.exitFullscreen || document.webkitExitFullscreen).call(document)
      : (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    r?.catch?.(() => {});
  } catch {}
}
const canFullscreen = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
ui.showFull(canFullscreen && !window.matchMedia("(pointer: coarse)").matches);
ui.onFull(toggleFullscreen);
window.addEventListener("keydown", (e) => { if (e.code === "KeyF" && !e.repeat && !uiState.name.active) toggleFullscreen(); });
const syncFull = () => document.body.classList.toggle("fullscreen", !!(document.fullscreenElement || document.webkitFullscreenElement));
document.addEventListener("fullscreenchange", syncFull);
document.addEventListener("webkitfullscreenchange", syncFull);

// Keep the Mac and TV awake: controller input may not count as activity for sleep.
let wakeLock = null;
async function keepAwake() {
  if (wakeLock || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => { wakeLock = null; });
  } catch {}
}
keepAwake();
document.addEventListener("visibilitychange", keepAwake);

// Hide the mouse pointer over the TV picture when it isn't moving.
let idleTimer = 0;
window.addEventListener("mousemove", () => {
  document.body.classList.remove("idle-cursor");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => document.body.classList.add("idle-cursor"), 2000);
});

// If the window loses focus (e.g. a click on the Mac's other screen), the browser may
// stop sending controller input: pause instead of letting her run into a pit.
phaser.events.on("blur", () => {
  const level = phaser.scene.getScene("Level");
  if (level?.sys.isActive() && level.mode === "play" && !level.cut) level.togglePause();
});
