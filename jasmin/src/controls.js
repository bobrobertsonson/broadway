// Unified keyboard + touch input. Game code reads `controls.left` etc. and
// `controls.pressed("jump")` for edges. Call `controls.update()` once per frame.

const KEYMAP = {
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  ArrowUp: "jump", KeyW: "jump", Space: "jump", KeyZ: "jump",
  KeyX: "action", ShiftLeft: "action", ShiftRight: "action", KeyE: "action",
  Enter: "start", Escape: "back", KeyM: "mute",
};

const held = { left: false, right: false, jump: false, action: false, start: false, back: false, mute: false };
const touchHeld = { left: false, right: false, jump: false, action: false };
let prev = { ...held };
let edges = {};

export const controls = {
  left: false, right: false, jump: false, action: false,
  isTouch: false,

  update() {
    const now = {};
    for (const k of Object.keys(held)) now[k] = held[k] || !!touchHeld[k];
    edges = {};
    for (const k of Object.keys(now)) edges[k] = now[k] && !prev[k];
    prev = now;
    this.left = now.left; this.right = now.right; this.jump = now.jump; this.action = now.action;
  },

  pressed(name) { return !!edges[name]; },

  // Any "confirm" press: jump, start, or a tap (tap edges are set by the scene via tapped()).
  confirmed() { return this.pressed("jump") || this.pressed("start"); },

  setActionVisible(visible) {
    const b = document.querySelector('#touch button[data-key="action"]');
    if (b) b.classList.toggle("hidden", !visible);
  },

  release() {
    for (const k of Object.keys(held)) held[k] = false;
    for (const k of Object.keys(touchHeld)) touchHeld[k] = false;
    document.querySelectorAll("#touch button").forEach((b) => b.classList.remove("down"));
  },
};

export function initControls(onFirstGesture) {
  // Called on every gesture: iOS only unlocks audio from certain events, and the
  // callback (unlockAudio) is cheap and idempotent.
  const gesture = () => onFirstGesture?.();

  window.addEventListener("keydown", (e) => {
    const k = KEYMAP[e.code];
    if (k) { held[k] = true; e.preventDefault(); }
    gesture();
  });
  window.addEventListener("keyup", (e) => {
    const k = KEYMAP[e.code];
    if (k) { held[k] = false; e.preventDefault(); }
  });
  window.addEventListener("blur", () => controls.release());

  const enableTouch = () => {
    controls.isTouch = true;
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
