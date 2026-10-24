import { fresh } from "./fresh.js";
import { controls } from "../controls.js";
import { startMusic, sfx } from "../audio.js";
import { ui } from "../ui.js";
import { game, writeSave, worldTitle, t } from "../state.js";
import { charKey, animKey } from "../art.js";
import { makeEnvironmentTextures } from "../tiles.js";
import { makePropTextures } from "../props.js";
import { PALETTE } from "../sprites.js";

// After the fire boss: 1) inventory of skills, 2) the map zooms out into fog,
// 3) she names World 9 with the pen, Jennifer wobbles and stays an egg. Then credits.
export class Ending extends Phaser.Scene {
  constructor() { super("Ending"); }

  init() {
    fresh(this);
  }

  create() {
    ui.clearAll();
    controls.showPad(false);
    ui.showHome(false);
    controls.release();
    controls.setActionVisible(false);
    makePropTextures(this);
    makeEnvironmentTextures(this, "day");
    this.makeEgg();
    this.input.on("pointerdown", (ptr) => { if (!ui.hitsButton(ptr)) this.tapped = true; });
    startMusic("cestlavie");
    this.cameras.main.setBackgroundColor("#2b2d63");
    this.inventory();
  }

  update() {
    controls.update();
    this.updateLabelsFrame();
    if (this.naming) {
      // Keyboard types directly (handled in ui.js); taps hit the letter grid (UI scene);
      // the gamepad moves over the grid: d-pad/stick move, A types, X deletes, Start finishes.
      ui.namePicker(true, controls.hint("name"));
      if (controls.device !== "gamepad") { this.tapped = false; return; }
      if (controls.pressed("left")) ui.nameNav(-1, 0);
      if (controls.pressed("right")) ui.nameNav(1, 0);
      if (controls.pressed("up")) ui.nameNav(0, -1);
      if (controls.pressed("down")) ui.nameNav(0, 1);
      if (controls.pressed("jump")) ui.namePress();
      if (controls.pressed("action")) ui.nameDelete();
      if (controls.pressed("start")) ui.nameSubmit();
      this.tapped = false;
      return;
    }
    const go = this.tapped || controls.confirmed();
    this.tapped = false;
    if (go && this.waiting) {
      const fn = this.waiting;
      this.waiting = null;
      fn();
    }
  }

  wait(fn, delay = 700) {
    this.time.delayedCall(delay, () => (this.waiting = fn));
  }

  // 1. Everything she gathered, as skills, one per world.
  inventory() {
    const ending = game.content.ending || {};
    const rows = game.content.worlds
      .filter((w) => w.levels.some((l) => l.skill))
      .map((w) => {
        const skill = w.levels.map((l) => l.skill).find(Boolean);
        return [worldTitle(w), t(skill)];
      });
    ui.panel(t(ending.inventoryTitle), rows, `${controls.hint("confirm")} to continue`);
    this.wait(() => { ui.hideBanner(); this.fogMap(); }, 1200);
  }

  // 2. The world map zooms out past Brooklyn into unexplored fog.
  fogMap() {
    const { width, height } = this.scale;
    const worlds = game.content.worlds;
    const n = worlds.length;
    const step = Math.max(40, Math.round((width - 40) / n));
    this.nodes = worlds.map((w, i) => ({ x: 24 + i * step, y: Math.round(height * 0.55 + Math.sin(i * 1.3) * height * 0.1), w }));
    const last = this.nodes[n - 1];
    const fogX = last.x + step;
    const g = this.add.graphics();
    g.fillStyle(0x7cc8f0).fillRect(-width, -height, width * 5, height * 3);
    g.lineStyle(3, 0xf4f1ea, 0.8).beginPath();
    this.nodes.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.strokePath();
    for (const p of this.nodes) g.fillStyle(0xe0a43a).fillCircle(p.x, p.y, 5).lineStyle(2, 0x141012).strokeCircle(p.x, p.y, 5);
    // Fog: soft clouds with question marks.
    this.fog = [];
    for (let i = 0; i < 26; i++) {
      const c = this.add.image(fogX + Math.random() * width * 1.6, height * (0.1 + Math.random() * 0.9), "bg-clouds")
        .setScale(Math.random() < 0.5 ? 1 : 2).setAlpha(0.85).setTint(0xd8d8e8);
      this.fog.push(c);
      this.tweens.add({ targets: c, x: c.x + 10, duration: 3000 + Math.random() * 2000, yoyo: true, repeat: -1 });
    }
    this.qmarks = [...Array(6)].map((_, i) => ({ x: fogX + 30 + i * (width / 4), y: height * (0.3 + (i % 3) * 0.2) }));
    this.fogX = fogX;
    this.walker = this.add.sprite(last.x, last.y, charKey("jasmin", { outfit: game.save.outfit })).setOrigin(0.5, 1);
    this.walker.play(animKey(charKey("jasmin", { outfit: game.save.outfit }), "idle"));

    const cam = this.cameras.main;
    cam.centerOn(last.x, last.y);
    // Zoom out in whole steps (3x, 2x, 1x) so pixels stay crisp, then pan into the fog.
    cam.setZoom(3);
    cam.centerOn(last.x, last.y - 10);
    this.time.delayedCall(700, () => { cam.setZoom(2); cam.centerOn(last.x, last.y - 10); });
    this.time.delayedCall(1400, () => { cam.setZoom(1); cam.centerOn(last.x, last.y - 10); this.showLabels = true; });
    this.time.delayedCall(1600, () => {
      this.tweens.add({ targets: cam, scrollX: Math.round(fogX - width / 2 + 40), duration: 2000, ease: "Sine.inOut" });
    });
    this.time.delayedCall(3700, () => {
      ui.caption("", t(game.content.ending?.fogCaption), 0);
      this.wait(() => this.nameWorld(), 1200);
    });
  }

  // 3. She names World 9 with the pen.
  async nameWorld() {
    ui.hideCaption();
    const spot = { x: this.fogX + 80, y: this.scale.height * 0.5 };
    const pen = this.add.image(spot.x, spot.y - 60, "item-pen").setScale(3).setAlpha(0);
    this.tweens.add({ targets: pen, alpha: 1, y: spot.y - 20, duration: 800, ease: "Back.out" });
    sfx.pen();
    this.naming = true;
    const name = await ui.askName(t(game.content.ending?.namePrompt), { picker: controls.device === "gamepad", hint: controls.hint("name") });
    this.naming = false;
    game.save.world9 = name;
    try { localStorage.setItem("jg-world9", name); } catch {}
    writeSave();
    sfx.checkpoint();
    this.tweens.add({ targets: pen, angle: 25, x: spot.x + 12, duration: 200, yoyo: true, repeat: 3 });
    const g = this.add.graphics();
    g.lineStyle(3, 0xf4f1ea, 0.8).lineBetween(this.nodes[this.nodes.length - 1].x, this.nodes[this.nodes.length - 1].y, spot.x, spot.y);
    g.fillStyle(0xd6b8ff).fillCircle(spot.x, spot.y, 7).lineStyle(2, 0x141012).strokeCircle(spot.x, spot.y, 7);
    this.world9 = { ...spot, name };
    this.tweens.add({ targets: pen, alpha: 0, delay: 1200, duration: 600 });
    this.time.delayedCall(2600, () => this.jennifer());
  }

  // Jennifer wobbles, light flickers through cracks, everyone leans in, she settles: still an egg.
  jennifer() {
    this.showLabels = false;
    ui.clearLabels();
    const cam = this.cameras.main;
    const { width, height } = this.scale;
    cam.setZoom(1).setScroll(0, 0);
    this.children.removeAll(true);
    makeEnvironmentTextures(this, "home");
    this.add.tileSprite(0, height - 16, width, 64, "bg-hills").setOrigin(0, 1);
    this.add.tileSprite(0, height - 16, width, 16, "tile-ground-top").setOrigin(0, 0);
    this.cameras.main.setBackgroundColor("#f0a878");

    const floor = height - 16, cx = width / 2;
    const fam = [
      ["andrew", cx - 46, false], ["jasmin", cx - 26, false], ["isaac", cx + 14, true], ["aya", cx + 42, true], ["nube", cx + 62, true],
    ];
    const sprites = fam.map(([n, x, flip]) => {
      const key = n === "jasmin" ? charKey("jasmin", { outfit: game.save.outfit }) : charKey(n);
      return this.add.sprite(x, floor, key).setOrigin(0.5, 1).setFlipX(flip).play(animKey(key, "idle"));
    });
    // Isaac holds Jennifer up in front of him (covers the small egg in his sprite).
    const isaac = sprites[2];
    const egg = this.add.image(isaac.x - 8, floor - 5, "egg-big").setOrigin(0.5, 1).setDepth(3);
    const cracks = this.add.graphics().setDepth(5);

    this.tweens.add({ targets: egg, angle: { from: -10, to: 10 }, duration: 110, yoyo: true, repeat: 9, delay: 900, onStart: () => sfx.hatch(), onComplete: () => egg.setAngle(0) });
    this.tweens.add({ targets: sprites, x: (tg) => tg.x + (tg.x < cx ? 4 : -4), duration: 600, delay: 900, yoyo: true, hold: 2200 });
    let flick = 0;
    const ev = this.time.addEvent({ delay: 90, repeat: 30, startAt: 0, callback: () => {
      cracks.clear();
      if ((flick++ % 3) === 0) return;
      cracks.lineStyle(1, 0xfff6c8, 1);
      const ex = egg.x, ey = egg.y - 7;
      cracks.lineBetween(ex - 4, ey - 1, ex - 1, ey + 1).lineBetween(ex - 1, ey + 1, ex + 2, ey - 2).lineBetween(ex + 2, ey - 2, ex + 4, ey);
    } });
    this.time.delayedCall(3800, () => {
      ev.remove();
      cracks.clear();
      this.tweens.add({ targets: egg, y: floor + 1, duration: 200, yoyo: true });
      ui.caption("", t(game.content.ending?.jenniferCaption), 0);
      this.wait(() => this.finish(), 2500);
    });
  }

  makeEgg() {
    if (this.textures.exists("egg-big")) return;
    const w = 10, h = 13;
    const tex = this.textures.createCanvas("egg-big", w, h);
    const ctx = tex.getContext();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = (x + 0.5 - w / 2) / (w / 2), ny = (y + 0.5 - h * 0.58) / (y < h * 0.58 ? h * 0.58 : h * 0.42);
        if (nx * nx + ny * ny > 1) continue;
        ctx.fillStyle = x < 3 ? PALETTE.l : PALETTE.L;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = PALETTE.A;
    for (const [x, y] of [[4, 3], [7, 5], [3, 7], [6, 9], [7, 11], [4, 11]]) ctx.fillRect(x, y, 1, 1);
    tex.refresh();
  }

  finish() {
    ui.hideCaption();
    // Finishing the game unlocks the jukebox on the title screen.
    game.save.beaten = true;
    writeSave();
    ui.fade(true, 600).then(() => {
      ui.clearAll();
      this.scene.start("Credits", {});
      ui.fade(false, 600);
    });
  }

  // Labels for the fog map (question marks, cities and World 9), in screen pixels.
  updateLabelsFrame() {
    if (!this.showLabels) return;
    const cam = this.cameras.main;
    const toS = (x, y) => [(x - cam.worldView.x) * cam.zoom, (y - cam.worldView.y) * cam.zoom];
    this.qmarks?.forEach((q, i) => { const [sx, sy] = toS(q.x, q.y); ui.label(`q${i}`, "?", sx, sy, "plain"); });
    if (this.world9) { const [sx, sy] = toS(this.world9.x, this.world9.y + 26); ui.label("w9", this.world9.name, sx, sy, "sel"); }
    // Only the last city (Brooklyn) is labeled: the fog is the point here.
    const last = this.nodes?.[this.nodes.length - 1];
    if (last) { const [sx, sy] = toS(last.x, last.y - 8); ui.label("e-last", worldTitle(last.w).replace(/^Brooklyn: /, ""), sx, sy, "small"); }
  }
}
