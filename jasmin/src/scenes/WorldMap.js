import { controls } from "../controls.js";
import { startMusic } from "../audio.js";
import { ui, clean } from "../ui.js";
import { game, allLevels, isUnlocked, writeSave, text } from "../state.js";
import { charKey, animKey } from "../art.js";
import { makeEnvironmentTextures } from "../tiles.js";

// One node per level along a winding path. Left/right to choose, jump to play,
// pen/action to change outfit.
export class WorldMap extends Phaser.Scene {
  constructor() { super("WorldMap"); }

  init(data) {
    this.selectId = data?.select;
  }

  create() {
    ui.clearAll();
    ui.showHome(false);
    controls.release();
    makeEnvironmentTextures(this, "day");
    this.cameras.main.setBackgroundColor("#7cc8f0");
    this.entries = allLevels();

    // Default selection: requested level, else first unfinished unlocked level.
    let idx = this.entries.findIndex((e) => e.level.id === this.selectId);
    if (idx < 0 || !isUnlocked(this.entries[idx].level.id)) {
      idx = this.entries.findIndex((e) => !game.save.done.includes(e.level.id) && isUnlocked(e.level.id));
      if (idx < 0) idx = this.entries.length - 1;
    }
    this.idx = idx;

    this.g = this.add.graphics();
    this.hills = this.add.tileSprite(0, 0, 10, 64, "bg-hills").setOrigin(0, 1).setDepth(-1);
    this.walker = this.add.sprite(0, 0, charKey("jasmin", { outfit: game.save.outfit })).setOrigin(0.5, 1).setDepth(5);
    this.followers = [];
    this.layout();
    this.walker.setPosition(this.nodes[idx].x, this.nodes[idx].y);
    this.refreshWalker();

    this.scale.on("resize", this.layout, this);
    this.events.once("shutdown", () => { this.scale.off("resize", this.layout, this); ui.clearAll(); });
    this.input.on("pointerdown", (p) => this.tap(p));
    startMusic("map");
    this.refreshText();
  }

  layout() {
    const { width, height } = this.scale;
    const n = this.entries.length;
    const margin = 28;
    const usable = width - margin * 2;
    this.nodes = this.entries.map((e, i) => ({
      x: Math.round(margin + (usable * i) / Math.max(1, n - 1)),
      y: Math.round(height * 0.6 + Math.sin(i * 1.3) * height * 0.1),
    }));
    this.hills.setSize(width, 64).setPosition(0, height);
    const g = this.g.clear();
    g.lineStyle(3, 0xf4f1ea, 0.8);
    g.beginPath();
    this.nodes.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.strokePath();
    this.nodes.forEach((p, i) => {
      const id = this.entries[i].level.id;
      const done = game.save.done.includes(id);
      const open = isUnlocked(id);
      g.fillStyle(done ? 0xe0a43a : open ? 0xf4f1ea : 0x4a4552, 1);
      g.fillCircle(p.x, p.y, 5);
      g.lineStyle(2, 0x141012, 1).strokeCircle(p.x, p.y, 5);
    });
    if (this.walker && !this.moving) this.walker.setPosition(this.nodes[this.idx].x, this.nodes[this.idx].y);
  }

  refreshWalker() {
    const key = charKey("jasmin", { outfit: game.save.outfit });
    this.walker.setTexture(key, 0);
    this.walker.play(animKey(key, this.moving ? "run" : "idle"));
  }

  refreshText() {
    const e = this.entries[this.idx];
    const title = text(e.world.title).startsWith("TODO") ? `World ${e.world.id}` : e.world.title;
    const unlocked = game.save.outfitsUnlocked.filter((o) => game.outfits[o]);
    const outfitHint = unlocked.length > 1 ? `outfit: ${game.save.outfit} (${controls.isTouch ? "pen button" : "X"} to change)` : "";
    ui.banner(title, `Level ${e.level.id}`, controls.isTouch ? "tap a level, then tap again to play" : "left/right to choose, jump to play", "top");
    ui.setHud(`<span class="item">${clean(outfitHint)}</span>`);
    controls.setActionVisible(unlocked.length > 1);
    this.labelNodes();
  }

  labelNodes() {
    const z = this.game.scale.zoom;
    const r = this.game.canvas.getBoundingClientRect();
    this.nodes.forEach((p, i) => {
      ui.label(`n${i}`, this.entries[i].level.id, r.left + p.x * z, r.top + (p.y + 20) * z, i === this.idx ? "sel" : "plain");
    });
  }

  select(i) {
    if (i < 0 || i >= this.entries.length || this.moving) return;
    if (!isUnlocked(this.entries[i].level.id)) return;
    this.idx = i;
    this.moving = true;
    this.refreshWalker();
    const to = this.nodes[i];
    this.walker.setFlipX(to.x < this.walker.x);
    this.tweens.add({
      targets: this.walker, x: to.x, y: to.y, duration: 260,
      onComplete: () => { this.moving = false; this.refreshWalker(); },
    });
    this.refreshText();
  }

  tap(p) {
    let best = -1, bd = 22;
    this.nodes.forEach((n, i) => {
      const d = Math.hypot(n.x - p.x, n.y - p.y);
      if (d < bd) { bd = d; best = i; }
    });
    if (best < 0) return;
    if (best === this.idx) this.play();
    else this.select(best);
  }

  cycleOutfit() {
    const list = game.save.outfitsUnlocked.filter((o) => game.outfits[o]);
    if (list.length < 2) return;
    const i = list.indexOf(game.save.outfit);
    game.save.outfit = list[(i + 1) % list.length];
    writeSave();
    this.refreshWalker();
    this.refreshText();
  }

  update() {
    controls.update();
    this.labelNodes();
    if (this.starting) return;
    if (controls.pressed("left")) this.select(this.idx - 1);
    if (controls.pressed("right")) this.select(this.idx + 1);
    if (controls.pressed("action")) this.cycleOutfit();
    if (controls.confirmed() && !this.moving) this.play();
  }

  async play() {
    if (this.starting) return;
    this.starting = true;
    await ui.fade(true, 300);
    ui.clearAll();
    this.scene.start("Level", { id: this.entries[this.idx].level.id });
    ui.fade(false, 300);
  }
}

