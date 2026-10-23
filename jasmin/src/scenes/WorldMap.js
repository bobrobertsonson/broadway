import { fresh } from "./fresh.js";
import { controls } from "../controls.js";
import { startMusic } from "../audio.js";
import { ui } from "../ui.js";
import { game, allLevels, isUnlocked, writeSave, worldTitle, t } from "../state.js";
import { charKey, animKey } from "../art.js";
import { makeEnvironmentTextures } from "../tiles.js";
import { MAPS } from "../maps.js";
import { POWER_ITEMS } from "../powers.js";

const POWER_NAMES = { pen: "the pen", spark: "the magic spark", dash: "the dash", bs: "the Bullshitometer" };

// Hidden secrets (+) in a level's map.
function levelSecrets(id) {
  return (MAPS[id]?.rows || []).join("").split("+").length - 1;
}

// The power waiting in a level: the first power marker in its map.
function levelPower(id) {
  const rows = MAPS[id]?.rows || [];
  const w = Math.max(0, ...rows.map((r) => r.length));
  for (let x = 0; x < w; x++) for (const r of rows) if (POWER_ITEMS[r[x]]) return POWER_ITEMS[r[x]];
  return null;
}

// One node per level along a winding path. Left/right to choose, jump to play,
// pen/action to change outfit.
export class WorldMap extends Phaser.Scene {
  constructor() { super("WorldMap"); }

  init(data) {
    fresh(this);
    this.selectId = data?.select;
  }

  create() {
    ui.clearAll();
    controls.showPad(true);
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
    // A click also pulls keyboard focus back into the game (the page can lose it).
    this.input.on("pointerdown", (p) => { try { window.focus(); } catch {} if (!ui.hitsButton(p)) this.tap(p); });
    startMusic("map");
    this.refreshText();
  }

  layout() {
    const { width, height } = this.scale;
    const n = this.entries.length;
    const margin = 52;
    const usable = width - margin * 2;
    this.nodes = this.entries.map((e, i) => ({
      x: Math.round(margin + (usable * i) / Math.max(1, n - 1)),
      y: Math.round(height * 0.64 + Math.sin(i * 1.3) * height * 0.08),
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
    const unlocked = game.save.outfitsUnlocked.filter((o) => game.outfits[o]);
    const outfitHint = unlocked.length > 1 ? `outfit: ${game.save.outfit} (${controls.device === "touch" ? "pen button" : controls.device === "gamepad" ? controls.padLabels().pen : "X"} to change)` : "";
    const done = game.save.done.includes(e.level.id);
    const power = levelPower(e.level.id);
    const secrets = levelSecrets(e.level.id);
    const found = game.save.secrets?.[e.level.id] || 0;
    const parts = [done && e.level.skill ? t(e.level.skill) : power ? `Power here: ${POWER_NAMES[power]}` : ""];
    if (secrets && isUnlocked(e.level.id)) parts.push(`Secrets ${found} of ${secrets}`);
    const sub = parts.filter(Boolean).join(". ");
    ui.banner(worldTitle(e.world), sub, controls.hint("choose"), "top");
    ui.setHud(outfitHint ? [{ text: outfitHint, tip: true }] : []);
    controls.setActionVisible(unlocked.length > 1);
    this.labelNodes();
  }

  // Names sit right next to their circles, alternating below and above. Places not
  // reached yet stay nameless, and the selected one is named in the banner instead.
  labelNodes() {
    const short = (w) => worldTitle(w).replace(/^Brooklyn: /, "").replace(/^NYC /, "");
    this.nodes.forEach((p, i) => {
      const show = i !== this.idx && isUnlocked(this.entries[i].level.id);
      const below = i % 2 === 0;
      ui.label(`n${i}`, show ? short(this.entries[i].world) : "", p.x, p.y + (below ? 16 : -7), "small");
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
    const e = this.entries[this.idx];
    this.scene.start(e.level.intro ? "Intro" : "Level", { id: e.level.id });
    ui.fade(false, 300);
  }
}

