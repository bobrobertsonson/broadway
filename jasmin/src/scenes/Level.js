import { controls } from "../controls.js";
import { sfx, startMusic } from "../audio.js";
import { ui, icon, clearIconCache } from "../ui.js";
import { game, findLevel, nextLevelId, companionsFor, hasCharm, displayName, text, writeSave } from "../state.js";
import { MAPS } from "../maps.js";
import { THEMES, makeEnvironmentTextures } from "../tiles.js";
import { Player } from "../player.js";
import { Trail } from "../companions.js";
import { makeEnemyAnims, spawnEnemy, updateEnemy, squash } from "../enemies.js";
import { charKey, animKey } from "../art.js";

const T = 16;
const TILE = { ground: 0, top: 1, brick: 2, oneway: 3 };
const ENEMY_CHARS = "itla";
const PEN_WIDTH = 4;     // tiles per pen line
const PEN_PER_PICKUP = 3;
const REVEAL_RADIUS = 60;

export class Level extends Phaser.Scene {
  constructor() { super("Level"); }

  init(data) {
    this.levelId = data.id;
    const found = findLevel(data.id);
    this.world = found.world;
    this.level = found.level;
    this.map = MAPS[data.id] || MAPS["1-1"];
  }

  create() {
    ui.clearAll();
    clearIconCache();
    controls.release();
    this.mode = "play";
    this.dark = !!this.level.dark;
    const themeName = this.dark ? "night" : this.map.theme || "day";
    this.theme = THEMES[themeName] || THEMES.day;
    makeEnvironmentTextures(this, this.theme);
    makeEnemyAnims(this);
    this.makeSpark();

    this.parseMap();
    this.buildBackground();
    this.buildTiles();

    const outline = this.dark;
    this.player = new Player(this, this.spawn.x, this.spawn.y, {
      outfit: game.save.outfit,
      outline,
      charm: hasCharm(this.world),
    });
    this.checkpoint = { ...this.spawn };

    const names = companionsFor(this.world);
    this.trail = new Trail(this, this.player, names, outline);
    this.applyCompanionMods(names);

    this.buildObjects();

    this.physics.add.collider(this.player.sprite, this.layer);
    this.physics.add.collider(this.player.sprite, this.penLines);
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.overlap(this.player.sprite, this.enemies, (_p, e) => this.touchEnemy(e));

    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, true, 0.18, 0.18);
    cam.setDeadzone(24, 40);
    this.setCameraBounds();
    this.scale.on("resize", this.onResize, this);
    this.events.once("shutdown", () => {
      this.scale.off("resize", this.onResize, this);
      ui.clearAll();
    });
    this.events.on("charm-used", () => this.refreshHud());

    this.input.on("pointerdown", () => { this.tapped = true; });
    ui.showHome(true);
    ui.onHome(() => this.leave());

    this.penUses = 0;
    this.score = 0;
    this.refreshHud();
    startMusic(this.dark ? "night" : this.map.music || "level");
    this.intro();
  }

  // ---------- map ----------

  parseMap() {
    const rows = this.map.rows;
    this.rowsN = rows.length;
    this.colsN = Math.max(...rows.map((r) => r.length));
    this.cells = rows.map((r) => r.padEnd(this.colsN, "."));
    this.mapW = this.colsN * T;
    this.mapH = this.rowsN * T;
    this.spawn = { x: 3 * T, y: (this.rowsN - 3) * T };
    this.horizon = (this.rowsN - 3) * T; // where the background hills sit
    for (let y = 0; y < this.rowsN; y++)
      for (let x = 0; x < this.colsN; x++)
        if (this.cells[y][x] === "S") this.spawn = { x: x * T + 8, y: (y + 1) * T };
  }

  cell(x, y) {
    return this.cells[y]?.[x] ?? ".";
  }

  buildTiles() {
    // Compose a tileset texture from the procedural tiles.
    if (this.textures.exists("tileset")) this.textures.remove("tileset");
    const ts = this.textures.createCanvas("tileset", T * 4, T);
    const ctx = ts.getContext();
    ["tile-ground", "tile-ground-top", "tile-brick", "tile-oneway"].forEach((k, i) => {
      ctx.drawImage(this.textures.get(k).getSourceImage(), i * T, 0);
    });
    ts.refresh();

    const data = [];
    this.hidden = [];
    for (let y = 0; y < this.rowsN; y++) {
      const row = [];
      for (let x = 0; x < this.colsN; x++) {
        const c = this.cell(x, y);
        if (c === "#") row.push(this.cell(x, y - 1) === "#" ? TILE.ground : TILE.top);
        else if (c === "=") row.push(TILE.brick);
        else if (c === "-") row.push(TILE.oneway);
        else {
          if (c === "h") this.hidden.push({ x, y, revealed: false });
          row.push(-1);
        }
      }
      data.push(row);
    }
    const map = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
    const tileset = map.addTilesetImage("tileset", "tileset", T, T, 0, 0);
    this.layer = map.createLayer(0, tileset, 0, 0).setDepth(2);
    this.layer.setCollision([TILE.ground, TILE.top, TILE.brick, TILE.oneway]);
    this.layer.forEachTile((t) => {
      if (t.index === TILE.oneway) t.setCollision(false, false, true, false);
    });
    this.physics.world.setBounds(0, -200, this.mapW, this.mapH + 400);
    this.physics.world.checkCollision.down = false;
  }

  buildBackground() {
    const sky = (this.sky = this.add.graphics().setScrollFactor(0).setDepth(-10));
    this.hills = this.add.tileSprite(0, 0, 10, 64, "bg-hills").setOrigin(0, 1).setScrollFactor(0).setDepth(-8);
    this.clouds = this.add.tileSprite(0, 8, 10, 32, "bg-clouds").setOrigin(0, 0).setScrollFactor(0).setDepth(-9);
    this.layoutBackground();
    this.drawSky = () => {
      const { width, height } = this.scale;
      const top = Phaser.Display.Color.HexStringToColor(this.theme.sky[0]).color;
      const bot = Phaser.Display.Color.HexStringToColor(this.theme.sky[1]).color;
      sky.clear();
      sky.fillGradientStyle(top, top, bot, bot, 1);
      sky.fillRect(0, 0, width, height);
    };
    this.drawSky();
  }

  layoutBackground() {
    const { width, height } = this.scale;
    this.hills.setSize(width, 64).setPosition(0, height);
    this.clouds.setSize(width, 32);
  }

  setCameraBounds() {
    const h = this.scale.height;
    const top = Math.min(0, this.mapH - h);
    this.cameras.main.setBounds(0, top, this.mapW, this.mapH - top);
  }

  onResize() {
    this.layoutBackground();
    this.drawSky();
    this.setCameraBounds();
  }

  buildObjects() {
    this.enemies = this.physics.add.group();
    this.penLines = this.physics.add.staticGroup();
    this.items = [];
    this.hatPickups = [];
    this.checkpoints = [];
    let slot = 0;
    const content = this.level.collectibles || [];
    const placed = content.filter((c) => c.x || c.y);
    const slotted = content.filter((c) => !c.x && !c.y);

    for (let y = 0; y < this.rowsN; y++) {
      for (let x = 0; x < this.colsN; x++) {
        const c = this.cell(x, y);
        const wx = x * T + 8, wy = (y + 1) * T;
        if (ENEMY_CHARS.includes(c)) spawnEnemy(this, this.enemies, c, wx, wy);
        else if (c === "*") {
          const data = slotted[slot++];
          if (data) this.addCollectible(wx, wy - 2, data);
        } else if (c === "H") this.hatPickups.push(this.addItem(wx, wy - 2, "item-hat", "hat"));
        else if (c === "p") this.addItem(wx, wy - 2, "item-pen", "pen");
        else if (c === "k") {
          const k = this.add.image(wx, wy, "prop-checkpoint-off").setOrigin(0.5, 1).setDepth(3);
          this.checkpoints.push({ sprite: k, x: wx, y: wy, on: false });
        } else if (c === "F") this.goal = this.add.image(wx, wy, "prop-goal").setOrigin(0.5, 1).setDepth(3);
        else if (c === "D") this.door = this.add.image(wx, wy, "prop-door").setOrigin(0.5, 1).setDepth(3);
        else if (c === "G") this.gate = this.add.image(wx, wy, "prop-gate-open").setOrigin(0.5, 1).setDepth(11);
        else if (c === "E") this.eggSpot = { x: wx, y: wy, done: false };
        else if (c === "r") {
          const key = charKey("rabbit", { outline: this.dark });
          this.otherRabbit = this.add.sprite(wx, wy, key, 0).setOrigin(0.5, 1).setDepth(8);
          this.otherRabbit.play(animKey(key, "idle"));
          this.otherRabbit.setFlipX(true);
        }
      }
    }
    for (const c of placed) this.addCollectible(c.x * T + 8, (c.y + 1) * T - 2, c);
    if (slot < slotted.length) console.warn(`${this.levelId}: ${slotted.length - slot} collectibles have no * slot in the map`);
    this.collectTotal = this.items.filter((i) => i.type === "collectible").length;
  }

  addItem(x, y, key, type) {
    const s = this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(5);
    const it = { sprite: s, type, x, y, taken: false };
    this.tweens.add({ targets: s, y: y - 3, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.items.push(it);
    return it;
  }

  addCollectible(x, y, data) {
    const it = this.addItem(x, y, "item-collectible", "collectible");
    it.data = data;
  }

  makeSpark() {
    if (this.textures.exists("spark")) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff).fillRect(0, 0, 2, 2);
    g.generateTexture("spark", 2, 2);
    g.destroy();
  }

  puff(x, y, tint = 0xfff2a8, n = 10) {
    for (let i = 0; i < n; i++) {
      const p = this.add.image(x, y, "spark").setTint(tint).setDepth(20);
      const a = (i / n) * Math.PI * 2;
      this.tweens.add({
        targets: p, x: x + Math.cos(a) * 14, y: y + Math.sin(a) * 14, alpha: 0,
        duration: 420, ease: "Quad.out", onComplete: () => p.destroy(),
      });
    }
  }

  // ---------- companions ----------

  applyCompanionMods(names) {
    const m = this.player.mods;
    if (names.includes("rabbit")) m.jump = Math.max(m.jump, 1.15);
    if (names.includes("daughter")) m.speed = 0.85;
    this.double = names.includes("daughter");
  }

  // ---------- loop ----------

  update(_t, deltaMs) {
    const dt = Math.min(deltaMs, 50) / 1000;
    controls.update();
    if (controls.pressed("back")) return this.leave();

    const p = this.player;
    const andrewReady = this.trail.isNext("andrew");
    p.update(dt, { andrewReady });
    this.trail.update(dt);
    for (const e of this.enemies.getChildren()) updateEnemy(e, dt, this.layer);

    const cam = this.cameras.main;
    this.hills.tilePositionX = cam.scrollX * 0.3;
    this.hills.y = Math.round(this.horizon - cam.scrollY * 0.85 + 8);
    this.clouds.tilePositionX = this.cameras.main.scrollX * 0.12 + this.time.now * 0.002;

    this.updateLabels(andrewReady);

    if (this.mode === "await") {
      if (controls.confirmed() || this.tapped) { this.mode = "done"; this.onConfirm?.(); }
      this.tapped = false;
      return;
    }
    this.tapped = false;
    if (this.mode !== "play") return;

    if (p.sprite.y > this.mapH + 24 && !p.dead) p.die();
    if (p.dead) {
      if (!this.respawning) this.respawnSoon();
      return;
    }

    if (controls.pressed("action")) this.usePen();
    this.checkItems();
    this.checkCheckpoints();
    this.revealHidden();
    this.checkTriggers();
  }

  updateLabels(andrewReady) {
    const cam = this.cameras.main, z = cam.zoom * this.game.scale.zoom;
    const canvas = this.game.canvas.getBoundingClientRect();
    const toScreen = (x, y) => [canvas.left + (x - cam.worldView.x) * z, canvas.top + (y - cam.worldView.y) * z];
    if (this.door) {
      const [sx, sy] = toScreen(this.door.x, this.door.y - this.door.height - 2);
      ui.label("door", "next level", sx, sy);
    }
    const andrew = this.trail.get("andrew");
    if (andrew && andrewReady && this.mode === "play" && !this.player.dead) {
      const [sx, sy] = toScreen(andrew.sprite.x, andrew.sprite.y - 33);
      ui.label("boost", "boost!", sx, sy, "plain");
    } else ui.label("boost", "", -999, -999, "plain");
  }

  // ---------- interactions ----------

  touchEnemy(e) {
    const p = this.player, b = p.sprite.body;
    if (p.dead || e.squashed || this.mode !== "play") return;
    if (b.velocity.y > 0 && b.bottom - e.body.top < 10) {
      squash(this, e);
      sfx.stomp();
      b.setVelocityY(controls.jump ? -330 : -220);
      p.cut = !controls.jump;
      return;
    }
    const hadHat = p.hasHat;
    const r = p.hurt(e.x);
    if (r === "hat" && hadHat) this.dropHat();
    this.refreshHud();
  }

  dropHat() {
    const s = this.player.sprite;
    const h = this.add.image(s.x, s.y - 30, "item-hat").setDepth(12);
    this.tweens.add({ targets: h, x: h.x - this.player.facing * 30, y: h.y - 20, angle: -120, duration: 300, ease: "Quad.out" });
    this.tweens.add({ targets: h, y: h.y + 80, alpha: 0, delay: 300, duration: 600, ease: "Quad.in", onComplete: () => h.destroy() });
  }

  checkItems() {
    const pb = this.player.sprite.body;
    for (const it of this.items) {
      if (it.taken) continue;
      const s = it.sprite;
      if (Math.abs(s.x - pb.center.x) > 12 || s.y < pb.top - 2 || s.y - s.height > pb.bottom + 2) continue;
      it.taken = true;
      s.setVisible(false);
      this.puff(s.x, s.y - 6);
      if (it.type === "collectible") {
        this.score += this.double ? 2 : 1;
        sfx.collect();
        ui.caption(text(it.data.label), text(it.data.caption));
      } else if (it.type === "hat") {
        if (!this.player.hasHat) this.player.setHat(true);
        sfx.hat();
        if (!this.hatTaught) { this.hatTaught = true; ui.caption("witch hat", "Hold jump while falling to glide", 3000); }
      } else if (it.type === "pen") {
        this.penUses += PEN_PER_PICKUP;
        sfx.hat();
        if (!this.penTaught) {
          this.penTaught = true;
          ui.caption("pen", controls.isTouch ? "Tap the pen button to draw a platform" : "Press X to draw a platform", 3200);
        }
      }
      this.refreshHud();
    }
  }

  usePen() {
    if (this.penUses <= 0) return;
    const p = this.player, b = p.sprite.body;
    this.penUses--;
    const top = Math.round(b.bottom);
    const startX = p.facing > 0 ? Math.round(b.center.x - 10) : Math.round(b.center.x + 10 - PEN_WIDTH * T);
    for (let i = 0; i < PEN_WIDTH; i++) {
      const seg = this.penLines.create(startX + i * T + 8, top + 2, "prop-pen-line");
      seg.setDepth(4).refreshBody();
      seg.setAlpha(0);
      this.tweens.add({ targets: seg, alpha: 1, duration: 80, delay: i * 50 });
    }
    sfx.pen();
    this.refreshHud();
  }

  checkCheckpoints() {
    const s = this.player.sprite;
    for (const k of this.checkpoints) {
      if (k.on || Math.abs(k.x - s.x) > 10 || Math.abs(k.y - s.y) > 30) continue;
      k.on = true;
      k.sprite.setTexture("prop-checkpoint-on");
      this.checkpoint = { x: k.x, y: k.y };
      this.puff(k.x, k.y - 28);
      sfx.checkpoint();
    }
  }

  revealHidden() {
    const son = this.trail.get("son");
    if (!son || !this.hidden.length) return;
    for (const h of this.hidden) {
      if (h.revealed) continue;
      const cx = h.x * T + 8, cy = h.y * T + 8;
      if (Math.hypot(son.sprite.x - cx, son.sprite.y - 8 - cy) > REVEAL_RADIUS) continue;
      h.revealed = true;
      this.layer.putTileAt(TILE.brick, h.x, h.y);
      this.puff(cx, cy, 0xd6b8ff, 8);
      if (!this.revealSound) { this.revealSound = true; sfx.checkpoint(); }
    }
  }

  checkTriggers() {
    const s = this.player.sprite;
    if (this.goal && Math.abs(s.x - this.goal.x) < 10 && s.y > this.goal.y - 48) return this.reachGoal();
    if (this.gate && s.x > this.gate.x - 36) return this.sendoff();
    if (this.eggSpot && !this.eggSpot.done && s.x > this.eggSpot.x) this.hatchEgg();
    if (this.door && Math.abs(s.x - this.door.x) < 10 && this.player.onGround) return this.enterDoor();
  }

  respawnSoon() {
    this.respawning = true;
    this.time.delayedCall(900, async () => {
      await ui.fade(true, 250);
      this.player.respawn(this.checkpoint.x, this.checkpoint.y);
      this.trail.reset();
      for (const h of this.hatPickups) { h.taken = false; h.sprite.setVisible(true); }
      this.cameras.main.centerOn(this.checkpoint.x, this.checkpoint.y);
      this.refreshHud();
      this.respawning = false;
      ui.fade(false, 250);
    });
  }

  refreshHud() {
    const g = this.game, p = this.player;
    const parts = [];
    parts.push(`<span class="item">${icon(g, "item-collectible", 2)}${this.score}</span>`);
    parts.push(`<span class="item ${p.hasHat ? "" : "dim"}">${icon(g, "item-hat", 2)}</span>`);
    if (this.penUses > 0 || this.penTaught) parts.push(`<span class="item">${icon(g, "item-pen", 2)}${this.penUses}</span>`);
    if (hasCharm(this.world)) parts.push(`<span class="item ${p.charmReady ? "" : "dim"}">${icon(g, "item-charm", 2)}</span>`);
    ui.setHud(parts.join(""));
    controls.setActionVisible(this.penUses > 0);
  }

  // ---------- flow ----------

  intro() {
    const w = this.world;
    ui.banner(text(w.title).replace("TODO: caption", `World ${w.id}`), `Level ${this.levelId}`);
    this.time.delayedCall(1600, () => ui.hideBanner());
    const firstOfWorld = w.levels[0].id === this.levelId;
    if (firstOfWorld && (w.companionsJoin || []).length) {
      const who = w.companionsJoin.map(displayName).join(" and ");
      this.time.delayedCall(1900, () => ui.caption("new friend", `${who} joined you`, 3200));
    }
  }

  freeze() {
    this.mode = "cutscene";
    const p = this.player;
    p.locked = true;
    p.sprite.body.setVelocityX(0);
    controls.setActionVisible(false);
  }

  reachGoal() {
    this.freeze();
    sfx.win();
    this.tweens.add({ targets: this.goal, y: this.goal.y - 4, duration: 150, yoyo: true, repeat: 2 });
    this.time.delayedCall(700, () => this.complete());
  }

  complete() {
    const id = this.levelId;
    const save = game.save;
    if (!save.done.includes(id)) save.done.push(id);
    save.lastLevel = id;
    const lastOfWorld = this.world.levels[this.world.levels.length - 1].id === id;
    let sub = text(this.level.endCaption);
    if (lastOfWorld) {
      const u = this.world.outfitUnlock;
      if (u?.name && !save.outfitsUnlocked.includes(u.name)) {
        save.outfitsUnlocked.push(u.name);
        sub += `  New outfit: ${u.name}`;
      }
    }
    writeSave();
    ui.hideCaption();
    ui.banner(lastOfWorld ? "World complete" : "Level complete", sub, controls.isTouch ? "tap to continue" : "press jump to continue");
    this.time.delayedCall(600, () => {
      this.mode = "await";
      this.onConfirm = () => this.goTo("WorldMap", { select: nextLevelId(id) || id });
    });
  }

  leave() {
    if (this.leaving) return;
    this.goTo("WorldMap", { select: this.levelId });
  }

  async goTo(scene, data) {
    this.leaving = true;
    await ui.fade(true, 300);
    ui.clearAll();
    this.scene.start(scene, data);
    ui.fade(false, 300);
  }

  // The rabbit send-off at the end of World 3.
  sendoff() {
    this.gate.triggered = true;
    const gate = this.gate;
    this.gate = null;
    this.freeze();
    startMusic("sendoff");
    const p = this.player;
    this.time.delayedCall(900, () => {
      const rabbit = this.trail.detach("rabbit");
      if (!rabbit) return this.finishSendoff(gate);
      const key = charKey("rabbit", { outline: this.dark });
      rabbit.play(animKey(key, "hop"));
      rabbit.setFlipX(false);
      rabbit.setDepth(12);
      const past = gate.x + 30;
      const dest = this.otherRabbit ? this.otherRabbit.x - 22 : gate.x + 90;
      this.tweens.chain({
        targets: rabbit,
        tweens: [
          { x: past, duration: Math.max(600, (past - rabbit.x) * 12), ease: "Linear" },
          { x: past, duration: 1400, onStart: () => { rabbit.play(animKey(key, "idle")); rabbit.setFlipX(true); } },
          { x: dest, duration: Math.max(700, (dest - past) * 14), onStart: () => { rabbit.setFlipX(false); rabbit.play(animKey(key, "hop")); } },
        ],
        onComplete: () => {
          rabbit.play(animKey(key, "idle"));
          this.finishSendoff(gate);
        },
      });
      this.time.delayedCall(Math.max(600, (past - rabbit.x) * 12) + 2200, () => {
        gate.setTexture("prop-gate-closed");
        sfx.gate();
        p.forcedAnim = "wave";
        ui.caption("", text(game.content.rabbitSendoffCaption), 0);
      });
    });
  }

  finishSendoff() {
    this.time.delayedCall(4200, () => {
      this.player.forcedAnim = null;
      ui.hideCaption();
      ui.caption("keepsake", "You kept his charm: one extra high jump per level, in mid air", 4200);
      this.time.delayedCall(2600, () => this.complete());
    });
  }

  hatchEgg() {
    this.eggSpot.done = true;
    const son = this.trail.get("son");
    if (!son) return;
    this.freeze();
    this.time.delayedCall(700, () => {
      const s = son.sprite;
      sfx.hatch();
      this.tweens.add({ targets: s, angle: { from: -6, to: 6 }, duration: 90, yoyo: true, repeat: 5,
        onComplete: () => {
          s.setAngle(0);
          const freeKey = charKey("sonFree", { outline: this.dark });
          son.key = freeKey;
          s.setTexture(freeKey, 0);
          son.anim = null;
          this.puff(s.x + 8, s.y - 10, 0xf5d342, 16);
          this.puff(s.x + 8, s.y - 10, 0x7b4fbf, 10);
          ui.caption("the egg hatched", text(game.content.eggHatchesInto), 4500);
          this.time.delayedCall(2200, () => { this.mode = "play"; this.player.locked = false; this.refreshHud(); });
        } });
    });
  }

  enterDoor() {
    const door = this.door;
    this.door = null;
    this.freeze();
    sfx.win();
    this.time.delayedCall(1200, async () => {
      const save = game.save;
      if (!save.done.includes(this.levelId)) save.done.push(this.levelId);
      writeSave();
      const p = this.player.sprite;
      this.tweens.add({ targets: [p, ...this.trail.members.filter((m) => m.present).map((m) => m.sprite)],
        alpha: 0, x: door.x, duration: 900 });
      this.time.delayedCall(1000, () => this.goTo("Credits", {}));
    });
  }
}
