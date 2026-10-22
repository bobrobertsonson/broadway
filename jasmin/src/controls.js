// Unified keyboard + touch + gamepad input. Game code reads `controls.left` etc. and
// `controls.pressed("jump")` for edges. Call `controls.update()` once per frame.
//
// Gamepad (Phaser gamepad plugin, standard mapping): d-pad or left stick to move,
// A jump (hold to glide), X pen, Start pause/confirm, B back.

const KEYMAP = {
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  ArrowUp: "jump", KeyW: "jump", Space: "jump", KeyZ: "jump",
  KeyX: "action", ShiftLeft: "action", ShiftRight: "action", KeyE: "action",
  Enter: "start", KeyP: "start", Escape: "back", KeyM: "mute",
};

const STICK_ON = 0.5;   // stick hysteresis: press past 0.5, release under 0.3
const STICK_OFF = 0.3;
const START = 9;        // standard mapping index of the Start button

const held = { left: false, right: false, up: false, down: false, jump: false, action: false, start: false, back: false, mute: false };
const touchHeld = { left: false, right: false, jump: false, action: false };
let prev = { ...held };
// Presses are latched so a tap shorter than one frame is never lost.
const latch = {};
let edges = {};
let padHeld = {};
let phaserGame = null;
let onGesture = null;

export const controls = {
  left: false, right: false, jump: false, action: false,
  isTouch: false,
  device: "keyboard",    // last used: "keyboard" | "touch" | "gamepad"

  update() {
    pollGamepads();
    const now = {};
    for (const k of Object.keys(held)) now[k] = held[k] || !!touchHeld[k] || !!padHeld[k];
    edges = {};
    for (const k of Object.keys(now)) edges[k] = (now[k] && !prev[k]) || !!latch[k];
    for (const k of Object.keys(latch)) delete latch[k];
    prev = now;
    this.left = now.left; this.right = now.right; this.jump = now.jump; this.action = now.action;
  },

  pressed(name) { return !!edges[name]; },

  // Any "confirm" press: jump (A) or start (tap edges are set by the scenes).
  confirmed() { return this.pressed("jump") || this.pressed("start"); },

  // On-screen hint text for the device in use. kind: "confirm" | "skip" | "pen".
  hint(kind) {
    const d = this.device === "touch" || (this.isTouch && this.device !== "gamepad") ? "touch" : this.device;
    const words = {
      confirm: { touch: "tap", gamepad: "press A", keyboard: "press jump" },
      skip: { touch: "tap to skip", gamepad: "A to skip", keyboard: "jump to skip" },
      pen: { touch: "Tap the pen button to write a platform", gamepad: "Press X to write a platform", keyboard: "Press X to write a platform" },
    };
    return words[kind][d];
  },

  // Movement buttons only during play; menus and cutscene screens use taps.
  showPad(visible) {
    document.getElementById("touch")?.classList.toggle("off", !visible);
  },

  setActionVisible(visible) {
    const b = document.querySelector('#touch button[data-key="action"]');
    if (b) b.classList.toggle("hidden", !visible);
  },

  release() {
    for (const k of Object.keys(held)) held[k] = false;
    for (const k of Object.keys(touchHeld)) touchHeld[k] = false;
    for (const k of Object.keys(latch)) delete latch[k];
    document.querySelectorAll("#touch button").forEach((b) => b.classList.remove("down"));
  },
};

// Reads every connected pad through the Phaser gamepad plugin of an active scene.
function pollGamepads() {
  const scene = phaserGame?.scene.getScenes(true).find((s) => s.input?.gamepad);
  const plugin = scene?.input.gamepad;
  const was = padHeld;
  padHeld = {};
  if (!plugin || !plugin.total) return;
  for (const pad of plugin.getAll()) {
    if (!pad || !pad.connected) continue;
    const x = pad.leftStick.x, y = pad.leftStick.y;
    const axis = (name, v) => (was[name] ? v > STICK_OFF : v > STICK_ON);
    padHeld.left ||= pad.left || axis("stickL", -x);
    padHeld.right ||= pad.right || axis("stickR", x);
    padHeld.up ||= pad.up || axis("stickU", -y);
    padHeld.down ||= pad.down || axis("stickD", y);
    padHeld.stickL ||= axis("stickL", -x);
    padHeld.stickR ||= axis("stickR", x);
    padHeld.stickU ||= axis("stickU", -y);
    padHeld.stickD ||= axis("stickD", y);
    padHeld.jump ||= pad.A;
    padHeld.action ||= pad.X;
    padHeld.back ||= pad.B;
    padHeld.start ||= !!pad.buttons[START]?.pressed;
  }
  const active = ["left", "right", "up", "down", "jump", "action", "back", "start"].some((k) => padHeld[k]);
  if (active) {
    controls.device = "gamepad";
    onGesture?.(); // harmless if the browser does not count it as a user gesture
  }
}

// game: the Phaser.Game (its config must enable input.gamepad).
export function initControls(onFirstGesture, game) {
  phaserGame = game;
  onGesture = onFirstGesture;
  // Called on every gesture: iOS only unlocks audio from certain events, and the
  // callback (unlockAudio) is cheap and idempotent.
  const gesture = () => onFirstGesture?.();

  window.addEventListener("keydown", (e) => {
    const k = KEYMAP[e.code];
    if (e.target?.tagName === "INPUT") return; // typing a name
    if (k) { if (!e.repeat) latch[k] = true; held[k] = true; e.preventDefault(); }
    controls.device = "keyboard";
    gesture();
  });
  window.addEventListener("keyup", (e) => {
    const k = KEYMAP[e.code];
    if (k) { held[k] = false; e.preventDefault(); }
  });
  window.addEventListener("blur", () => controls.release());

  const enableTouch = () => {
    controls.isTouch = true;
    controls.device = "touch";
    document.body.classList.add("touch");
  };
  if (window.matchMedia("(pointer: coarse)").matches) enableTouch();
  window.addEventListener("touchstart", () => { enableTouch(); gesture(); }, { passive: true });
  window.addEventListener("pointerdown", gesture);
  window.addEventListener("touchend", gesture, { passive: true });
  window.addEventListener("click", gesture);

  // Each button tracks its own pointers so multitouch (run + jump) works.
  document.querySelectorAll("#touch button").forEach((btn) => {
    const key = btn.dataset.key;
    const pointers = new Set();
    const sync = () => { touchHeld[key] = pointers.size > 0; btn.classList.toggle("down", pointers.size > 0); };
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      pointers.add(e.pointerId);
      latch[key] = true;
      try { btn.releasePointerCapture(e.pointerId); } catch {}
      sync();
    });
    const up = (e) => { pointers.delete(e.pointerId); sync(); };
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("pointerleave", up);
    // Sliding a thumb from left to right should switch buttons.
    btn.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch" && e.buttons) { pointers.add(e.pointerId); sync(); }
    });
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
  });
}
