import { fresh } from "./fresh.js";
import { controls } from "../controls.js";
import { startMusic, stopMusic, trackInfo, unlockAudio } from "../audio.js";
import { ui } from "../ui.js";
import { game } from "../state.js";
import { charKey, animKey } from "../art.js";
import { makeEnvironmentTextures } from "../tiles.js";
import { JUKEBOX } from "../songs/index.js";

const ORIGINAL_SECS = 75; // the original tracks loop short patterns: move on after this
const LIGHTS = [0xff8fb3, 0xffe27a, 0x8fd8f5, 0xb48cf0];

// Unlocked by finishing the game: every song in the game on a night stage, with
// the whole cast dancing on the beat. Left/right to choose, jump to play or stop,
// back (or the home button) for the title. A song moves on to the next when it ends.
export class Jukebox extends Phaser.Scene {
  constructor() { super("Jukebox"); }

  init() {
    fresh(this);
  }

  create() {
    ui.clearAll();
    controls.showPad(false);
    controls.setActionVisible(false);
    controls.release();
    ui.showHome(true);
    ui.onHome(() => this.leave());
    makeEnvironmentTextures(this, "night");
    const { width, height } = this.scale;
    const floor = height - 16;

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0f1030, 0x0f1030, 0x2b2d63, 0x2b2d63, 1).fillRect(0, 0, width, height);
    this.stars = [];
    for (let i = 0; i < 40; i++) {
      const s = this.add.rectangle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, floor - 50), 1, 1, 0xffffff, 0.8).setOrigin(0);
      this.tweens.add({ targets: s, alpha: 0.15, duration: Phaser.Math.Between(600, 1600), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1500) });
    }
    this.add.tileSprite(0, floor, width, 64, "bg-hills").setOrigin(0, 1);

    // Stage lights: soft beams from the top that pulse on the beat.
    this.beams = LIGHTS.map((c, i) => {
      const x = Math.round(width * (0.15 + i * 0.233));
      const g = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
      g.fillStyle(c, 0.16).fillTriangle(x, 0, x - 26, floor, x + 26, floor);
      g.setAlpha(0.5);
      return g;
    });
    this.add.tileSprite(0, floor, width, 16, "tile-ground-top").setOrigin(0, 0);

    // The cast, Jasmin in the middle.
    const cast = [
      ["isaac", 0.16], ["andrew", 0.33], ["jasmin", 0.5], ["rupert", 0.66], ["aya", 0.8], ["nube", 0.92],
    ];
    this.dancers = cast.map(([name, fx], i) => {
      const key = name === "jasmin" ? charKey("jasmin", { outfit: game.save.outfit }) : charKey(name);
      const s = this.add.sprite(Math.round(width * fx), floor, key).setOrigin(0.5, 1).setFlipX(fx > 0.5);
      s.play(animKey(key, "idle"));
      return { name, key, s, i, floor };
    });

    this.idx = 0;
    this.playing = null;
    this.lastBeat = -1;
    this.input.on("pointerdown", (p) => { if (!ui.hitsButton(p)) this.tap(p); });
    const restart = () => this.scene.restart();
    this.scale.once("resize", restart);
    this.events.once("shutdown", () => { this.scale.off("resize", restart); ui.clearAll(); ui.showHome(false); });
    this.play(0);
  }

  entry(i = this.idx) {
    const e = JUKEBOX[i];
    const info = trackInfo(e.key) || { bpm: 120, title: e.key, secs: null };
    return { ...e, title: e.title || info.title, bpm: info.bpm, secs: info.secs || ORIGINAL_SECS };
  }

  play(i) {
    this.idx = (i + JUKEBOX.length) % JUKEBOX.length;
    const e = this.entry();
    unlockAudio();
    stopMusic();
    startMusic(e.key);
    this.playing = e;
    this.started = performance.now();
    this.lastBeat = -1;
    this.refresh();
  }

  stop() {
    stopMusic();
    this.playing = null;
    for (const d of this.dancers) { d.s.y = d.floor; d.s.play(animKey(d.key, "idle")); }
    this.refresh();
  }

  choose(dir) {
    if (this.playing) this.play(this.idx + dir);
    else { this.idx = (this.idx + dir + JUKEBOX.length) % JUKEBOX.length; this.refresh(); }
  }

  toggle() {
    if (this.playing) this.stop(); else this.play(this.idx);
  }

  tap(p) {
    const { width } = this.scale;
    if (p.x < width * 0.25) this.choose(-1);
    else if (p.x > width * 0.75) this.choose(1);
    else this.toggle();
  }

  refresh() {
    const e = this.entry();
    ui.banner(e.title, `${e.artist}, ${e.where}`, "", "top");
    this.hint();
  }

  hint() {
    const d = controls.device === "touch" || (controls.isTouch && controls.device !== "gamepad") ? "touch" : controls.device;
    const b = controls.padLabels();
    const what = this.playing ? "stop" : "play";
    const text = {
      touch: `tap the sides to choose, the middle to ${what}`,
      gamepad: `left/right to choose, ${b.jump} to ${what}, ${b.back} to go back`,
      keyboard: `left/right to choose, jump to ${what}, Esc to go back`,
    }[d];
    const { width, height } = this.scale;
    ui.label("jb-hint", text, width / 2, height - 3, "small");
    ui.label("jb-left", "<", 10, height / 2 + 6, "");
    ui.label("jb-right", ">", width - 10, height / 2 + 6, "");
  }

  // Everyone moves on the beat: Jasmin hops and waves, the others bounce in turns.
  dance(beat) {
    for (const d of this.dancers) {
      const mine = d.name === "jasmin" || (beat + d.i) % 2 === 0;
      if (!mine) continue;
      const hop = d.name === "jasmin" ? 5 : 3;
      this.tweens.add({ targets: d.s, y: d.floor - hop, duration: 90, yoyo: true, ease: "Quad.out" });
      if (d.name === "jasmin") {
        const bar = beat % 8;
        d.s.play(animKey(d.key, bar >= 6 ? "wave" : bar % 2 ? "jump" : "idle"), true);
        if (bar === 0) d.s.setFlipX(!d.s.flipX);
      } else if (d.name === "rupert") d.s.play(animKey(d.key, "hop"), true);
      else if (beat % 4 === d.i % 4) d.s.setFlipX(!d.s.flipX);
    }
    this.beams.forEach((g, i) => {
      g.setAlpha(i === beat % this.beams.length ? 1 : 0.35);
    });
  }

  update() {
    controls.update();
    if (controls.pressed("left")) this.choose(-1);
    if (controls.pressed("right")) this.choose(1);
    if (controls.confirmed()) this.toggle();
    if (controls.pressed("back")) this.leave();

    const p = this.playing;
    const secs = p ? (performance.now() - this.started) / 1000 : 0;
    if (p) {
      const beat = Math.floor((secs * p.bpm) / 60);
      if (beat !== this.lastBeat) { this.lastBeat = beat; this.dance(beat); }
      if (secs >= p.secs) return this.play(this.idx + 1);
    }
    const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const n = `${this.idx + 1}/${JUKEBOX.length}`;
    const time = p ? `${mmss(secs)} / ${mmss(p.secs)}` : "";
    if (n + time !== this.hudText) {
      this.hudText = n + time;
      ui.setHud([{ text: "♪ Jukebox" }, { text: n }, ...(time ? [{ text: time }] : [])]);
    }
    if (controls.device !== this.lastDevice) { this.lastDevice = controls.device; this.hint(); }
  }

  async leave() {
    if (this.leaving) return;
    this.leaving = true;
    await ui.fade(true, 300);
    stopMusic();
    this.scene.start("Title", {});
    ui.fade(false, 300);
  }
}
