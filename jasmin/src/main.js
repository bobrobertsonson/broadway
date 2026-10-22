import { initControls } from "./controls.js";
import { unlockAudio, setMuted } from "./audio.js";
import { ui } from "./ui.js";
import { Boot } from "./scenes/Boot.js";
import { Title } from "./scenes/Title.js";
import { WorldMap } from "./scenes/WorldMap.js";
import { Level } from "./scenes/Level.js";
import { Credits } from "./scenes/Credits.js";

// Internal resolution is dynamic: about 180 to 220 px tall, width fills the
// screen, scaled by a whole-number zoom so pixels stay square.
function viewSize() {
  const W = window.innerWidth, H = window.innerHeight;
  const zoom = Math.max(1, Math.min(Math.floor(H / 176), Math.floor(W / 300)));
  return { w: Math.floor(W / zoom), h: Math.floor(H / zoom), zoom };
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
  input: { activePointers: 3 },
  fps: { target: 60 },
  scene: [Boot, Title, WorldMap, Level, Credits],
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
  }, 100);
});

let muted = false;
try { muted = localStorage.getItem("jg-muted") === "1"; } catch {}
ui.setMuted(muted);
setMuted(muted);
ui.onMute(() => { muted = !muted; setMuted(muted); ui.setMuted(muted); });

initControls(() => unlockAudio());
