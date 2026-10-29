import { fresh } from "./fresh.js";
import { controls } from "../controls.js";
import { sfx, startMusic } from "../audio.js";
import { ui } from "../ui.js";
import { game, findLevel, nextLevelId, companionsAtStart, hasCharm, writeSave, arriveOutfit, worldTitle } from "../state.js";
import { t, has, joinCaption } from "../content.js";
import { MAPS } from "../maps.js";
import { THEMES, makeEnvironmentTextures } from "../tiles.js";
import { makePropTextures } from "../props.js";
import { Player, PHYS } from "../player.js";
import { Powers, POWER_ITEMS, TILE_CRACK, TILE_FAKE_BRICK, TILE_FAKE_TOP } from "../powers.js";
import { PLACES } from "../places/index.js";
import { Trail } from "../companions.js";
import { makeEnemyAnims, spawnEnemy, updateEnemy, squash, ENEMY_CHARS } from "../enemies.js";
import { Ghosts } from "../ghosts.js";
import { Boss } from "../boss.js";
import { charKey, animKey } from "../art.js";
import { FONTS, fontSafe, drawPlain, measure } from "../font.js";

const T = 16;
const TILE = { ground: 0, top: 1, brick: 2, oneway: 3 };
const PEN_WIDTH = 4;
const PEN_PER_PICKUP = 3;
const REVEAL_RADIUS = 84;
const JOIN_MARKERS = { R: "rupert", I: "isaac", Y: "aya", N: "nube" };
const HIDE_KEYS = ["prop-hide-snowbank", "prop-hide-shelter", "prop-hide-door"];
const ITEM_KEYS = { chicken: "item-chicken", nandos: "item-nandos", record: "item-record", message: "item-message", crowd: "item-crowd", dumpling: "item-dumpling", backpack: "item-backpack", stamp: "item-stamp" };

export class Level extends Phaser.Scene {
  constructor() { super("Level"); }

  init(data) {
    fresh(this);
    this.levelId = data.id;
    const found = findLevel(data.id);
    this.world = found.world;
    this.level = found.level;
    this.mapId = data.map || data.id;
    this.map = MAPS[this.mapId] || MAPS[Object.keys(MAPS)[0]];
  }

  create() {
    ui.clearAll();
    controls.showPad(true);
    controls.release();
    this.mode = "play";
    this.cut = null;
    this.dark = !!this.level.dark;
    makePropTextures(this);
    this.themeName = this.dark ? "minneapolisNight" : this.map.theme || "day";
    this.theme = THEMES[this.themeName] || THEMES.day;
    makeEnvironmentTextures(this, this.theme);
    makeEnemyAnims(this);
    this.makeSpark();

    this.newOutfit = arriveOutfit(this.world);
    this.parseMap();
    this.buildBackground();
    this.buildTiles();

    this.player = new Player(this, this.spawn.x, this.spawn.y, {
      outfit: game.save.outfit,
      outline: this.dark,
      charm: hasCharm(this.world),
    });
    this.player.ice = !!this.map.ice;
    this.checkpoint = { ...this.spawn };
    this.lastSafe = { ...this.spawn };

    this.trail = new Trail(this, this.player, companionsAtStart(this.world), this.dark);
    this.buildObjects();
    this.buildSigns();
    this.applyCompanionMods();

    this.physics.add.collider(this.player.sprite, this.layer);
    this.physics.add.collider(this.player.sprite, this.penLines);
    this.physics.add.collider(this.player.sprite, this.movers);
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
    this.events.off("charm-used");
    this.events.on("charm-used", () => this.refreshHud());
    this.input.on("pointerdown", (ptr) => { if (!ui.hitsButton(ptr)) this.tapped = true; });
    ui.showHome(true);
    ui.onHome(() => this.leave());

    this.penUses = 0;
    this.score = 0;
    this.refreshHud();
    startMusic(this.map.music || "level");
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
    this.horizon = (this.rowsN - 3) * T;
    for (let y = 0; y < this.rowsN; y++)
      for (let x = 0; x < this.colsN; x++)
        if (this.cells[y][x] === "S") this.spawn = { x: x * T + 8, y: (y + 1) * T };
  }

  cell(x, y) {
    return this.cells[y]?.[x] ?? ".";
  }

  composeTileset() {
    const ts = this.textures.exists("tileset") ? this.textures.get("tileset") : this.textures.createCanvas("tileset", T * 7, T);
    const ctx = ts.getContext();
    ctx.clearRect(0, 0, T * 7, T);
    ["tile-ground", "tile-ground-top", "tile-brick", "tile-oneway"].forEach((k, i) => {
      ctx.drawImage(this.textures.get(k).getSourceImage(), i * T, 0);
    });
    Powers.composeTiles(this, ctx);
    ts.refresh();
  }

  buildTiles() {
    if (this.textures.exists("tileset")) this.textures.remove("tileset");
    this.composeTileset();
    const data = [];
    this.hidden = [];
    this.water = [];
    for (let y = 0; y < this.rowsN; y++) {
      const row = [];
      for (let x = 0; x < this.colsN; x++) {
        const c = this.cell(x, y);
        if (c === "#") row.push(this.cell(x, y - 1) === "#" ? TILE.ground : TILE.top);
        else if (c === "=") row.push(TILE.brick);
        else if (c === "-") row.push(TILE.oneway);
        else if (c === "%") row.push(TILE_CRACK);
        else if (c === "~") row.push(TILE_FAKE_BRICK);
        else if (c === "_") row.push(TILE_FAKE_TOP);
        else {
          if (c === "h") this.hidden.push({ x, y, revealed: false });
          if (c === "w") this.water.push({ x, y });
          row.push(-1);
        }
      }
      data.push(row);
    }
    const map = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
    const tileset = map.addTilesetImage("tileset", "tileset", T, T, 0, 0);
    this.layer = map.createLayer(0, tileset, 0, 0).setDepth(2);
    this.layer.setCollision([TILE.ground, TILE.top, TILE.brick, TILE.oneway, TILE_CRACK, TILE_FAKE_BRICK, TILE_FAKE_TOP]);
    this.layer.forEachTile((tile) => {
      if (tile.index === TILE.oneway) tile.setCollision(false, false, true, false);
    });
    this.shadePits();
    this.waterImgs = this.water.map((w) => this.add.image(w.x * T, w.y * T, "tile-water").setOrigin(0).setDepth(12).setAlpha(0.75));
    this.physics.world.setBounds(0, -200, this.mapW, this.mapH + 400);
    this.physics.world.checkCollision.down = false;
  }

  // Pits would show the sky's bottom color, which in sunset or brick-toned levels
  // reads as solid floor. A dark void behind the tiles makes every hole look like one.
  shadePits() {
    const solid = (x, y) => "#=%~_".includes(this.cell(x, y));
    // Top of the solid block that reaches the bottom of the map (rowsN if none).
    const groundTop = (x) => { let r = this.rowsN; while (r > 0 && solid(x, r - 1)) r--; return r; };
    const isPit = (x) => !solid(x, this.rowsN - 1) && !this.water.some((w) => w.x === x);
    const g = this.add.graphics().setDepth(1);
    for (let x = 0; x < this.colsN; x++) {
      if (!isPit(x)) continue;
      let b = x;
      while (b + 1 < this.colsN && isPit(b + 1)) b++;
      const edges = [x - 1, b + 1].filter((c) => c >= 0 && c < this.colsN).map(groundTop).filter((r) => r < this.rowsN);
      if (edges.length) {
        const top = Math.min(...edges) * T + 3, w = (b - x + 1) * T;
        g.fillGradientStyle(0x141012, 0x141012, 0x141012, 0x141012, 0.45, 0.45, 0.92, 0.92);
        g.fillRect(x * T, top, w, 18);
        g.fillStyle(0x141012, 0.92).fillRect(x * T, top + 18, w, this.mapH + 64 - top);
      }
      x = b;
    }
  }

  buildBackground() {
    const sky = (this.sky = this.add.graphics().setScrollFactor(0).setDepth(-10));
    this.far = this.add.tileSprite(0, 0, 10, 96, "bg-far").setOrigin(0, 1).setScrollFactor(0).setDepth(-9);
    this.hills = this.add.tileSprite(0, 0, 10, 64, "bg-hills").setOrigin(0, 1).setScrollFactor(0).setDepth(-8);
    this.clouds = this.add.tileSprite(0, 8, 10, 32, "bg-clouds").setOrigin(0, 0).setScrollFactor(0).setDepth(-9);
    this.night = this.add.rectangle(0, 0, 10, 10, 0x0a0a28, 1).setOrigin(0).setScrollFactor(0).setDepth(30).setAlpha(0);
    this.rain = [];
    this.layoutBackground();
    this.drawSky();
  }

  drawSky() {
    const { width, height } = this.scale;
    const top = Phaser.Display.Color.HexStringToColor(this.theme.sky[0]).color;
    const bot = Phaser.Display.Color.HexStringToColor(this.theme.sky[1]).color;
    this.sky.clear();
    this.sky.fillGradientStyle(top, top, bot, bot, 1);
    this.sky.fillRect(0, 0, width, height);
    // London rain.
    for (const r of this.rain) r.destroy();
    this.rain = [];
    if (this.theme.rain) {
      for (let i = 0; i < 40; i++) {
        this.rain.push(this.add.image(Math.random() * width, Math.random() * height, "fx-rain").setScrollFactor(0).setDepth(25).setAlpha(0.45));
      }
    }
  }

  layoutBackground() {
    const { width, height } = this.scale;
    this.hills.setSize(width, 64);
    this.far.setSize(width, 96);
    this.clouds.setSize(width, 32);
    this.night.setSize(width, height);
  }

  // Switch sky, background and tiles to another theme (segments, picnic night).
  setTheme(name) {
    if (this.themeName === name || !THEMES[name]) return;
    this.themeName = name;
    this.theme = THEMES[name];
    makeEnvironmentTextures(this, this.theme, { themeOnly: true });
    this.composeTileset();
    this.hills.setTexture("bg-hills");
    this.far.setTexture("bg-far");
    this.clouds.setTexture("bg-clouds");
    for (const w of this.waterImgs) w.setTexture("tile-water");
    for (const h of this.hidden) if (h.revealed) this.layer.putTileAt(TILE.brick, h.x, h.y);
    this.drawSky();
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
    this.powers = new Powers(this);
    // The map's place module (src/places/): its own scenery, markers and mechanics.
    const Place = PLACES[this.map.place];
    this.place = Place ? new Place(this) : null;
    const placeMarkers = this.place?.markers || {};
    this.penLines = this.physics.add.staticGroup();
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
    this.items = [];
    this.hatPickups = [];
    this.checkpoints = [];
    this.joiners = [];
    this.npcs = [];
    this.triggers = [];
    this.ghosts = null;
    this.boss = null;
    let slot = 0, stamp = 0;
    const collectibles = this.level.collectibles || [];
    const segments = this.level.segments || [];

    // Column-major so collectible and stamp slots fill left to right.
    for (let x = 0; x < this.colsN; x++) {
      for (let y = 0; y < this.rowsN; y++) {
        const c = this.cell(x, y);
        const wx = x * T + 8, wy = (y + 1) * T;
        if (ENEMY_CHARS.includes(c)) spawnEnemy(this, this.enemies, c, wx, wy);
        else if (c === "*") {
          const data = collectibles[slot++];
          if (data) this.addCollectible(wx, wy - 2, ITEM_KEYS[data.type] || "item-collectible", t(data.label), t(data.caption));
        } else if (c === "$") {
          const seg = segments[stamp++];
          if (seg) this.addCollectible(wx, wy - 2, "item-stamp", t(seg.country), t(seg.stampCaption));
        } else if (c === "H") this.hatPickups.push(this.addItem(wx, wy - 2, "item-hat", "hat"));
        else if (POWER_ITEMS[c]) this.addItem(wx, wy - 2, `item-${POWER_ITEMS[c]}`, "power").power = POWER_ITEMS[c];
        else if (c === "?") this.powers.addMimic(wx, wy - 2);
        else if (c === "+") { this.addItem(wx, wy - 2, "item-secret", "secret"); this.secretsTotal = (this.secretsTotal || 0) + 1; }
        else if (c === "k") {
          const k = this.add.image(wx, wy, "prop-checkpoint-off").setOrigin(0.5, 1).setDepth(3);
          this.checkpoints.push({ sprite: k, x: wx, y: wy, on: false });
        } else if (c === "F") this.goal = this.add.image(wx, wy, "prop-goal").setOrigin(0.5, 1).setDepth(3);
        else if (c === "G") this.gate = this.add.image(wx, wy, "prop-gate-open").setOrigin(0.5, 1).setDepth(11);
        else if (c === "B") this.trigger(wx, wy, this.add.image(wx, wy, "prop-door").setOrigin(0.5, 1).setDepth(3), () => this.enterBoss(), "boss");
        else if (c === "r") {
          const key = charKey("rupert", { outline: this.dark });
          this.otherRabbit = this.add.sprite(wx, wy, key, 0).setOrigin(0.5, 1).setDepth(8).setFlipX(true);
          this.otherRabbit.play(animKey(key, "idle"));
        } else if (JOIN_MARKERS[c]) this.addJoiner(JOIN_MARKERS[c], wx, wy);
        else if (c === "P") this.addPicnic(wx, wy);
        else if (c === "g") (this.ghosts ||= new Ghosts(this)).addGhost(wx, wy);
        else if (c === "b") (this.ghosts ||= new Ghosts(this)).addHide(wx, wy, HIDE_KEYS[(x + y) % HIDE_KEYS.length]);
        else if (c === "X") {
          this.add.image(wx, wy, "prop-exit").setOrigin(0.5, 1).setDepth(3);
          this.exitX = wx;
        } else if (c === "u" || c === "o") this.addMover(c, x * T, y * T);
        else if (c === "L" || c === "Q") {
          const key = c === "L" ? "deco-sealion" : "deco-iguana";
          this.ensureAnim(key, 2, 2);
          this.add.sprite(wx, wy, `${key}-0`).setOrigin(0.5, 1).setDepth(4).play(key);
        } else if (c === "T") this.addTim(wx, wy);
        else if (c === "K") this.addChickenShop(wx, wy);
        else if (c === "c") this.addCop(wx, wy);
        else if (c === "C") this.addHut(wx, wy);
        else if (c === "Z") this.bossAt = { x: wx, y: wy };
        else if (c === "V") (this.valveSpots ||= []).push({ x: wx, y: wy });
        else if (placeMarkers[c]) placeMarkers[c](wx, wy, x, y);
      }
    }
    this.place?.create?.();
    if (this.ghosts && this.exitX) this.ghosts.setExit(this.exitX);
    if (this.bossAt) {
      this.boss = new Boss(this, this.bossAt.x, this.bossAt.y);
      for (const v of this.valveSpots || []) this.boss.addValve(v.x, v.y);
    }
    if (slot < collectibles.length) console.warn(`${this.levelId}: ${collectibles.length - slot} collectibles have no * slot`);
  }

  ensureAnim(key, n, rate) {
    if (this.anims.exists(key)) return;
    this.anims.create({ key, frames: [...Array(n).keys()].map((i) => ({ key: `${key}-${i}` })), frameRate: rate, repeat: -1 });
  }

  trigger(x, y, sprite, fn, id) {
    this.triggers.push({ x, y, sprite, fn, id, done: false });
  }

  addItem(x, y, key, type) {
    const s = this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(5);
    const it = { sprite: s, type, x, y, taken: false };
    this.tweens.add({ targets: s, y: y - 3, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.items.push(it);
    return it;
  }

  addCollectible(x, y, key, label, caption) {
    const it = this.addItem(x, y, key, "collectible");
    it.label = label;
    it.caption = caption;
  }

  addMover(c, x, y) {
    const key = c === "u" ? "plat-bus" : "plat-tortoise-0";
    const m = this.movers.create(x, y, key).setOrigin(0, 0).setDepth(4);
    m.body.setAllowGravity(false).setImmovable(true);
    m.body.checkCollision.down = false;
    m.body.checkCollision.left = false;
    m.body.checkCollision.right = false;
    if (c === "o") {
      this.ensureAnim("plat-tortoise", 2, 2);
      m.play("plat-tortoise");
      m.body.setSize(32, 10).setOffset(0, 0);
    } else m.body.setSize(48, 8).setOffset(0, 0);
    m.home = x;
    m.range = 4 * T;
    m.speed = c === "u" ? 34 : 18;
    m.body.setVelocityX(m.speed);
  }

  addJoiner(name, x, y) {
    const key = charKey(name, { outline: this.dark });
    const s = this.add.sprite(x, y, key, 0).setOrigin(0.5, 1).setDepth(7).setFlipX(true);
    s.play(animKey(key, "idle"));
    this.joiners.push({ name, x, y, sprite: s, done: false });
  }

  addPicnic(x, y) {
    this.add.image(x, y, "prop-picnic").setOrigin(0.5, 1).setDepth(3);
    const key = charKey("andrew", { outline: this.dark });
    const s = this.add.sprite(x + 10, y, key, 0).setOrigin(0.5, 1).setDepth(7).setFlipX(true);
    s.play(animKey(key, "idle"));
    this.picnic = { x, y, sprite: s, done: false };
  }

  // Street signs from the map's `signs` list: London style, white plate, black
  // capitals, red stripe, on a post. Text is drawn in the pixel font's glyphs.
  buildSigns() {
    for (const sg of this.map.signs || []) {
      const park = sg.style === "park";
      const text = fontSafe(park ? sg.text : sg.text.toUpperCase());
      const key = `sign-${sg.style || "street"}-${text}`;
      const tw = measure(text);
      const w = tw + 8, h = 15, postH = 18;
      if (!this.textures.exists(key)) {
        const tex = this.textures.createCanvas(key, w, h + postH);
        const ctx = tex.getContext();
        if (park) {
          // Brown wooden park sign with cream lettering, on two posts.
          ctx.fillStyle = "#4a3020"; ctx.fillRect(3, h, 2, postH); ctx.fillRect(w - 5, h, 2, postH);
          ctx.fillStyle = "#3a2416"; ctx.fillRect(1, 0, w - 2, h); ctx.fillRect(0, 1, w, h - 2);
          ctx.fillStyle = "#6b4528"; ctx.fillRect(1, 1, w - 2, h - 2);
          drawPlain(ctx, text, 4, 4, "#f2e6c8");
        } else {
          ctx.fillStyle = "#5a5a66"; ctx.fillRect(Math.floor(w / 2) - 1, h, 2, postH);     // post
          ctx.fillStyle = "#2a2a34"; ctx.fillRect(1, 0, w - 2, h); ctx.fillRect(0, 1, w, h - 2); // frame
          ctx.fillStyle = "#f8f6f0"; ctx.fillRect(1, 1, w - 2, h - 2);                        // plate
          drawPlain(ctx, text, 4, 3, "#141012");
          ctx.fillStyle = "#d8262a"; ctx.fillRect(2, h - 4, w - 4, 1);                        // red stripe
        }
        tex.refresh();
      }
      // At street level: the top of the ground block that reaches the bottom of the map,
      // not a fire escape or platform overhead (else the first solid tile from the top).
      let row = this.rowsN;
      while (row > 0 && "#=%~_".includes(this.cell(sg.col, row - 1))) row--;
      if (row === this.rowsN) {
        row = this.rowsN - 1;
        for (let r = 0; r < this.rowsN; r++) if ("#=-".includes(this.cell(sg.col, r))) { row = r; break; }
      }
      this.add.image(sg.col * T + 8 + (sg.dx || 0), row * T, key).setOrigin(0.5, 1).setDepth(1);
    }
  }

  // London chicken shop front (decor behind the action), sign lettered in the pixel font.
  addChickenShop(x, y) {
    const shop = this.add.image(x, y, "prop-chickenshop").setOrigin(0.5, 1).setDepth(1);
    const sign = this.add.bitmapText(0, 0, FONTS.small, fontSafe("CHICKEN")).setDepth(1);
    sign.setPosition(Math.round(x - sign.width / 2), Math.round(shop.y - shop.height + 4));
  }

  addTim(x, y) {
    const key = charKey("tim", { outline: this.dark });
    const s = this.add.sprite(x, y, key, 0).setOrigin(0.5, 1).setDepth(7).setFlipX(true);
    s.play(animKey(key, "idle"));
    this.npcs.push({ kind: "tim", sprite: s, key, waved: false });
  }

  addCop(x, y) {
    const s = this.add.sprite(x, y, "npc-cop-0").setOrigin(0.5, 1).setDepth(7).setFlipX(true);
    this.cop = { x, y, sprite: s, done: false };
  }

  addHut(x, y) {
    const hut = this.add.image(x, y, "prop-hut").setOrigin(0.5, 1).setDepth(3);
    this.ensureAnim("prop-candle", 2, 5);
    for (const dx of [-30, -24, 24, 30]) this.add.sprite(x + dx, y, "prop-candle-0").setOrigin(0.5, 1).setDepth(4).play("prop-candle");
    this.hut = { x, y, sprite: hut, done: false };
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

  applyCompanionMods() {
    const m = this.player.mods, names = this.trail.names();
    m.jump = names.includes("rupert") ? 1.15 : 1;
    m.speed = names.includes("aya") && !names.includes("nube") ? 0.85 : 1;
    this.double = names.includes("aya");
  }

  join(name, x, y) {
    this.trail.add(name, x, y);
    this.applyCompanionMods();
    const cap = joinCaption(this.level, name);
    if (has(cap)) ui.caption("", t(cap), 3800);
    sfx.checkpoint();
  }

  // Ghosts caught them together: Andrew goes back to wait at the last checkpoint.
  sendAndrewBack() {
    const m = this.trail.get("andrew");
    if (!m) return;
    this.trail.detach("andrew");
    m.scripted = true;
    const cp = this.checkpoint;
    this.tweens.add({
      targets: m.sprite, alpha: 0, duration: 400,
      onComplete: () => {
        m.sprite.setPosition(cp.x + 12, cp.y).setFlipX(false);
        this.trail.playOn(m, "idle");
        this.tweens.add({ targets: m.sprite, alpha: 1, duration: 400 });
        this.andrewWaiting = m;
      },
    });
  }

  // ---------- loop ----------

  update(_t, deltaMs) {
    const dt = Math.min(deltaMs, 50) / 1000;
    controls.update();
    if (controls.pressed("back")) return this.leave();
    // Start (gamepad) or Enter/P (keyboard) pauses during play.
    if (controls.pressed("start") && (this.mode === "play" || this.mode === "paused") && !this.cut) this.togglePause();
    if (this.mode === "paused") return;

    const p = this.player;
    const andrewReady = this.trail.isNext("andrew");
    p.update(dt, { andrewReady, inWater: this.inWater() });
    this.trail.update(dt);
    for (const e of this.enemies.getChildren()) updateEnemy(e, dt, this.layer);
    const pb = p.sprite.body;
    for (const m of this.movers.getChildren()) {
      if (m.x > m.home + m.range) m.body.setVelocityX(-m.speed);
      if (m.x < m.home - m.range) m.body.setVelocityX(m.speed);
      // Carry Jasmin when she stands on a moving platform (bus, tortoise).
      const riding = Math.abs(pb.bottom - m.body.top) < 2 && pb.right > m.body.left && pb.left < m.body.right && pb.velocity.y >= 0;
      if (riding && !p.dead) p.sprite.x += m.body.deltaX();
      m.setFlipX(m.body.velocity.x < 0 && m.texture.key !== "plat-bus");
    }
    this.ghosts?.update(dt);
    this.boss?.update(dt);
    this.updateScenery(dt);
    this.updateLabels(andrewReady);

    if (this.cut) {
      this.cut.age += dt;
      if (this.cut.age > 0.5 && (this.tapped || controls.confirmed())) this.endCut();
      this.tapped = false;
      return;
    }
    if (this.mode === "await") {
      if (controls.confirmed() || this.tapped) { this.mode = "done"; this.onConfirm?.(); }
      this.tapped = false;
      return;
    }
    this.tapped = false;
    if (this.mode !== "play") return;

    if (p.onGround && !p.sprite.body.touching.down && !p.dead) this.lastSafe = { x: p.sprite.x, y: p.sprite.y };
    if (p.sprite.y > this.mapH + 24 && !p.dead) {
      if (!this.cloudCatch()) p.die();
    }
    if (p.dead) {
      if (!this.respawning) this.respawnSoon();
      return;
    }

    this.powers.update(dt);
    this.place?.update?.(dt);
    this.checkItems();
    this.checkCheckpoints();
    this.revealHidden();
    this.checkTriggers();
  }

  inWater() {
    if (!this.water.length) return false;
    const s = this.player.sprite;
    return this.cell(Math.floor(s.x / T), Math.floor((s.y - 10) / T)) === "w";
  }

  updateScenery(dt) {
    const cam = this.cameras.main, { height } = this.scale;
    this.hills.tilePositionX = cam.scrollX * 0.3;
    this.far.tilePositionX = cam.scrollX * 0.15;
    this.hills.y = Math.round(this.horizon - cam.scrollY * 0.85 + 8);
    this.far.y = Math.round(this.horizon - cam.scrollY * 0.9 - 10);
    this.clouds.tilePositionX = cam.scrollX * 0.08 + this.time.now * 0.002;
    for (const r of this.rain) {
      r.y += 260 * dt;
      r.x -= 40 * dt;
      if (r.y > height) { r.y = -6; r.x = Math.random() * this.scale.width; }
    }
    // South America: palette changes per country.
    const segs = this.map.segments;
    if (segs) {
      const x = this.player.sprite.x / T;
      let seg = segs[0];
      for (const s of segs) if (x >= s.col) seg = s;
      if (seg && seg.theme !== this.themeName) {
        this.setTheme(seg.theme);
        if (this.seenCountry !== seg.country) {
          this.seenCountry = seg.country;
          ui.banner(seg.country, "", "", "top");
          this.time.delayedCall(1800, () => ui.hideBanner());
        }
      }
    }
    // Tim waves when Jasmin passes.
    for (const n of this.npcs) {
      if (n.kind === "tim" && !n.waved && Math.abs(n.sprite.x - this.player.sprite.x) < 48) {
        n.waved = true;
        n.sprite.play(animKey(n.key, "wave"));
        this.time.delayedCall(2600, () => n.sprite.play(animKey(n.key, "idle")));
      }
    }
    // Jennifer glows when a hidden block is near Isaac.
    const isaac = this.trail.get("isaac");
    if (isaac && this.hidden.some((h) => !h.revealed && Math.abs(h.x * T - isaac.sprite.x) < 140)) {
      if (!this.glow) this.glow = this.add.image(0, 0, "fx-glow").setDepth(11).setBlendMode(Phaser.BlendModes.ADD);
      this.glow.setPosition(isaac.sprite.x + (isaac.sprite.flipX ? -9 : 9), isaac.sprite.y - 8);
      this.glow.setAlpha(0.5 + Math.sin(this.time.now / 160) * 0.3).setVisible(true);
    } else if (this.glow) this.glow.setVisible(false);
  }

  // True when a ledge is close by that a plain jump can't reach but Andrew's boost can,
  // so the "boost!" hint only shows where it matters.
  boostLedgeNear() {
    const b = this.player.sprite.body;
    if (!b.blocked.down && !b.touching.down) return false;
    const feet = b.bottom;
    const g2 = 2 * this.physics.world.gravity.y;
    const plain = PHYS.jump ** 2 / g2 + 2;
    const boosted = (PHYS.jump * PHYS.boostAndrew) ** 2 / g2;
    const col = Math.floor(b.center.x / T);
    for (let x = col - 5; x <= col + 5; x++) {
      for (let y = 1; y < this.rowsN; y++) {
        if (!"#=-%~_".includes(this.cell(x, y)) || "#=-%~_".includes(this.cell(x, y - 1))) continue;
        const rise = feet - y * T;
        if (rise > plain && rise <= boosted) return true;
      }
    }
    return false;
  }

  updateLabels(andrewReady) {
    const cam = this.cameras.main;
    const toScreen = (x, y) => [(x - cam.worldView.x) * cam.zoom, (y - cam.worldView.y) * cam.zoom];
    const andrew = this.trail.get("andrew");
    if (andrew && andrewReady && this.mode === "play" && !this.player.dead && this.boostLedgeNear()) {
      const [sx, sy] = toScreen(andrew.sprite.x, andrew.sprite.y - 33);
      ui.label("boost", "boost!", sx, sy, "plain");
    } else ui.label("boost", "", -999, -999, "plain");
    if (this.speech) {
      const [sx, sy] = toScreen(this.speech.sprite.x, this.speech.sprite.y - this.speech.sprite.height - 2);
      ui.label("speech", this.speech.text, sx, sy);
    } else ui.label("speech", "", -999, -999);
  }

  // ---------- interactions ----------

  // A short speech line over someone's head (drawn by updateLabels).
  say(sprite, text, ms = 1500) {
    this.speech = { sprite, text };
    this.time.delayedCall(ms, () => { if (this.speech?.text === text) this.speech = null; });
  }

  touchEnemy(e) {
    const p = this.player, b = p.sprite.body;
    if (p.dead || e.squashed || this.mode !== "play") return;
    // A stomp from above, or bowling into it mid-dash.
    if (p.dashT > 0 || (b.velocity.y > 0 && b.bottom - e.body.top < 10)) {
      squash(this, e);
      sfx.stomp();
      if (p.dashT > 0) return;
      b.setVelocityY(controls.jump ? -330 : -220);
      p.cut = !controls.jump;
      return;
    }
    this.hurtPlayer(e.x);
  }

  hurtPlayer(fromX) {
    const p = this.player;
    const hadHat = p.hasHat;
    const r = p.hurt(fromX);
    if (r === "hat" && hadHat) this.dropHat();
    this.refreshHud();
  }

  dropHat() {
    const s = this.player.sprite;
    const h = this.add.image(s.x, s.y - 30, "item-hat").setDepth(12);
    this.tweens.add({ targets: h, x: h.x - this.player.facing * 30, y: h.y - 20, angle: -120, duration: 300, ease: "Quad.out" });
    this.tweens.add({ targets: h, y: h.y + 80, alpha: 0, delay: 300, duration: 600, ease: "Quad.in", onComplete: () => h.destroy() });
  }

  // Nube's cloud catches one pit fall per level.
  cloudCatch() {
    if (!this.trail.has("nube") || this.cloudUsed) return false;
    this.cloudUsed = true;
    const p = this.player, s = p.sprite;
    const to = this.lastSafe;
    const cloud = this.add.image(s.x, this.mapH, "fx-cloud").setDepth(13);
    p.locked = true;
    s.body.setVelocity(0, 0).setAllowGravity(false);
    this.tweens.add({ targets: [s, cloud], x: to.x, duration: 900, ease: "Sine.inOut" });
    this.tweens.add({ targets: s, y: to.y - 4, duration: 900, ease: "Sine.inOut" });
    this.tweens.add({
      targets: cloud, y: to.y + 6, duration: 900, ease: "Sine.inOut",
      onComplete: () => {
        s.body.setAllowGravity(true);
        p.locked = false;
        this.tweens.add({ targets: cloud, alpha: 0, y: cloud.y - 30, duration: 600, onComplete: () => cloud.destroy() });
      },
    });
    ui.caption("Nube's cloud", "Caught you. Once per level.", 2400);
    sfx.hat();
    return true;
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
        ui.caption(it.label, it.caption);
      } else if (it.type === "hat") {
        if (!this.player.hasHat) this.player.setHat(true);
        sfx.hat();
        if (!this.hatTaught) {
          this.hatTaught = true;
          ui.caption("witch hat", this.player.cloaked ? "Hold jump to glide (not while cloaked)" : "Hold jump while falling to glide", 3000);
        }
      } else if (it.type === "secret") {
        this.secretsFound = (this.secretsFound || 0) + 1;
        const best = game.save.secrets || (game.save.secrets = {});
        best[this.levelId] = Math.max(best[this.levelId] || 0, this.secretsFound);
        writeSave();
        sfx.hat();
        ui.caption("secret", `${this.secretsFound} of ${this.secretsTotal} found here`, 2000);
      } else if (it.type === "power") {
        if (it.power === "pen") { this.penUses += PEN_PER_PICKUP; this.penTaught = true; }
        sfx.hat();
        this.powers.set(it.power);
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
    if (!p.cloaked) {
      p.forcedAnim = "write";
      this.time.delayedCall(350, () => { if (p.forcedAnim === "write") p.forcedAnim = null; });
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
    const isaac = this.trail.get("isaac");
    if (!isaac || !this.hidden.length) return;
    for (const h of this.hidden) {
      if (h.revealed) continue;
      const cx = h.x * T + 8, cy = h.y * T + 8;
      if (Math.hypot(isaac.sprite.x - cx, isaac.sprite.y - 8 - cy) > REVEAL_RADIUS) continue;
      h.revealed = true;
      this.layer.putTileAt(TILE.brick, h.x, h.y);
      this.puff(cx, cy, 0xd6b8ff, 8);
      if (!this.revealSound) { this.revealSound = true; sfx.checkpoint(); }
    }
  }

  checkTriggers() {
    const s = this.player.sprite, x = s.x;
    if (this.andrewWaiting && Math.abs(this.andrewWaiting.sprite.x - x) < 18 && Math.abs(this.andrewWaiting.sprite.y - s.y) < 20) {
      const m = this.andrewWaiting;
      this.andrewWaiting = null;
      m.scripted = false;
      this.trail.rejoin("andrew");
      this.trail.reset();
      sfx.checkpoint();
    }
    for (const j of this.joiners) {
      if (j.done || x < j.x - 24) continue;
      j.done = true;
      j.sprite.destroy();
      this.join(j.name, j.x, j.y);
    }
    if (this.picnic && !this.picnic.done && x > this.picnic.x - 40) return this.picnicScene();
    if (this.cop && !this.cop.done && x > this.cop.x - 44) {
      // Only when she is actually at the cop; if she is somehow far past him, he just leaves.
      if (x < this.cop.x + 80) return this.copScene();
      this.cop.done = true;
      this.cop.sprite.setVisible(false);
    }
    if (this.hut && !this.hut.done && x > this.hut.x - 30) return this.proposalScene();
    for (const tr of this.triggers) {
      if (!tr.done && Math.abs(x - tr.x) < 10 && this.player.onGround) { tr.done = true; return tr.fn(); }
    }
    if (this.goal && Math.abs(x - this.goal.x) < 10 && s.y > this.goal.y - 48) {
      // The ghosts sent Andrew back: she has to go and get him first.
      if (this.andrewWaiting) {
        if (!this.toldAndrew || this.time.now - this.toldAndrew > 5000) {
          this.toldAndrew = this.time.now;
          ui.caption("", "Andrew is waiting at the last checkpoint", 3000);
        }
        return;
      }
      return this.reachGoal();
    }
    if (this.gate && x > this.gate.x - 36) return this.sendoff();
  }

  respawnSoon() {
    this.respawning = true;
    this.time.delayedCall(900, async () => {
      await ui.fade(true, 250);
      this.player.respawn(this.checkpoint.x, this.checkpoint.y);
      this.powers.reset();
      this.trail.reset();
      for (const h of this.hatPickups) { h.taken = false; h.sprite.setVisible(true); }
      this.cameras.main.centerOn(this.checkpoint.x, this.checkpoint.y);
      this.refreshHud();
      this.respawning = false;
      ui.fade(false, 250);
    });
  }

  refreshHud() {
    const p = this.player;
    const items = [{ icon: "item-collectible", text: String(this.score) }, { icon: "item-hat", dim: !p.hasHat }];
    if (this.powers) items.push(...this.powers.hudItems());
    if (hasCharm(this.world)) items.push({ icon: "item-charm", dim: !p.charmReady });
    if (this.boss) items.push({ icon: "prop-valve-1", text: `${this.boss.opened}/3` });
    ui.setHud(items);
    controls.setActionVisible(!!this.powers?.actionReady());
  }

  // ---------- flow ----------

  intro() {
    if (this.boss) {
      this.time.delayedCall(600, () => this.boss.intro());
      return;
    }
    const sub = has(this.level.startCaption) ? t(this.level.startCaption) : "";
    ui.banner(worldTitle(this.world), sub, "", "top");
    this.time.delayedCall(2600, () => ui.hideBanner());
    if (this.newOutfit) this.time.delayedCall(2900, () => ui.caption("new outfit", this.newOutfit, 2600));
    if (this.levelId === "3-1" && this.trail.has("andrew")) this.pairedWalk();
  }

  togglePause() {
    const on = this.mode !== "paused";
    this.mode = on ? "paused" : "play";
    if (on) {
      this.physics.pause();
      this.tweens.pauseAll();
      this.anims.pauseAll();
      this.time.paused = true;
      ui.banner("Paused", this.powers?.describe() || "", controls.hint("pause"), "dim");
    } else {
      this.physics.resume();
      this.tweens.resumeAll();
      this.anims.resumeAll();
      this.time.paused = false;
      ui.hideBanner();
    }
  }

  freeze() {
    this.mode = "cutscene";
    const p = this.player;
    p.locked = true;
    p.sprite.body.setVelocityX(0);
    controls.setActionVisible(false);
  }

  unfreeze() {
    this.mode = "play";
    this.player.locked = false;
    this.player.forcedAnim = null;
    this.speech = null;
    this.refreshHud();
  }

  // Skippable cutscene. finish() must leave everything in its end state.
  startCut(finish) {
    this.freeze();
    this.cut = { finish, timers: [], tweens: [], age: 0 };
    ui.label("skip", controls.hint("skip"), this.scale.width - 40, this.scale.height - 4, "plain");
  }

  cutDelay(ms, fn) {
    if (this.cut) this.cut.timers.push(this.time.delayedCall(ms, fn));
  }

  cutTween(cfg) {
    const tw = this.tweens.add(cfg);
    this.cut?.tweens.push(tw);
    return tw;
  }

  endCut() {
    const c = this.cut;
    if (!c) return;
    this.cut = null;
    for (const tm of c.timers) tm.remove(false);
    for (const tw of c.tweens) tw.stop();
    ui.label("skip", "", -999, -999);
    c.finish();
  }

  // Walk a scripted character to x at a given speed (inside a cutscene).
  walkTo(sprite, key, x, speed = 70, anim = "run") {
    sprite.setFlipX(x < sprite.x);
    sprite.play(animKey(key, anim), true);
    return new Promise((res) => {
      this.cutTween({
        targets: sprite, x, duration: Math.min(2500, Math.max(80, (Math.abs(x - sprite.x) / speed) * 1000)),
        onComplete: () => { sprite.play(animKey(key, anim === "hop" ? "idle" : "idle")); res(); },
      });
    });
  }

  // Chicago opens with Jasmin and Andrew walking hand in hand.
  pairedWalk() {
    const p = this.player, s = p.sprite;
    const m = this.trail.detach("andrew");
    m.scripted = true;
    const endX = s.x + 110;
    const finish = () => {
      m.sprite.setPosition(endX - 11, s.y);
      s.x = endX;
      s.body.reset(endX, s.y);
      m.scripted = false;
      this.trail.rejoin("andrew");
      this.trail.reset();
      this.unfreeze();
    };
    this.startCut(finish);
    m.sprite.setPosition(s.x - 11, s.y).setDepth(9).setFlipX(false);
    p.forcedAnim = "run";
    m.sprite.play(animKey(m.key, "run"));
    this.cutTween({ targets: [s, m.sprite], x: `+=110`, duration: 4200, onUpdate: () => s.body.reset(s.x, s.y) });
    this.cutDelay(4400, () => this.endCut());
  }

  // Minneapolis: night picnic by the lake, Andrew joins, the level turns to night.
  picnicScene() {
    const pc = this.picnic;
    pc.done = true;
    const p = this.player;
    // The lake song starts the moment they meet and plays on through the night.
    const meet = this.map.meetMusic || "night";
    startMusic(meet);
    const finish = () => {
      this.night.setAlpha(0);
      this.setTheme("minneapolisNight");
      this.dark = true;
      p.setOutline(true);
      this.trail.setOutline(true);
      pc.sprite.destroy();
      if (!this.trail.has("andrew")) this.join("andrew", p.sprite.x - 14, p.sprite.y);
      this.trail.reset();
      this.checkpoint = { x: pc.x, y: pc.y };
      startMusic(meet);
      this.unfreeze();
    };
    this.startCut(finish);
    this.cutTween({ targets: this.night, alpha: 0.85, duration: 900, yoyo: true, hold: 200 });
    this.cutDelay(1000, () => {
      this.setTheme("minneapolisNight");
      p.setOutline(true);
      this.trail.setOutline(true);
      const key = charKey("andrew", { outline: true });
      pc.sprite.setTexture(key, 0).play(animKey(key, "idle"));
      ui.caption("", t(this.level.andrewJoinScene?.caption), 0);
    });
    this.cutDelay(2600, () => {
      const key = charKey("andrew", { outline: true });
      this.cutTween({ targets: pc.sprite, y: pc.y - 8, duration: 180, yoyo: true });
      this.cutDelay(500, () => this.walkTo(pc.sprite, key, p.sprite.x + 16, 50));
    });
    this.cutDelay(7500, () => { ui.hideCaption(); this.endCut(); });
  }

  // Mexico: Andrew deals with the cop. Short and automatic.
  copScene() {
    const cop = this.cop;
    cop.done = true;
    const m = this.trail.get("andrew") ? this.trail.detach("andrew") : null;
    const finish = () => {
      cop.sprite.setVisible(false);
      if (m) { m.scripted = false; m.sprite.setAlpha(1); this.trail.rejoin("andrew"); this.trail.reset(); }
      this.unfreeze();
    };
    this.startCut(finish);
    if (!m) { this.cutDelay(600, () => this.endCut()); return; }
    m.scripted = true;
    m.sprite.setDepth(11);
    this.walkTo(m.sprite, m.key, cop.x - 14, 90).then(() => {
      cop.sprite.setTexture("npc-cop-1");
      this.speech = { sprite: m.sprite, text: "grumble grumble" };
      sfx.collect();
      this.cutDelay(1600, () => {
        this.speech = null;
        cop.sprite.setTexture("npc-cop-0");
        this.cutTween({ targets: cop.sprite, x: cop.x + 26, alpha: 0, duration: 900 });
        this.cutDelay(1100, () => this.endCut());
      });
    });
  }

  // Argentina: the candlelit hut, Andrew proposes again.
  proposalScene() {
    const hut = this.hut;
    hut.done = true;
    const p = this.player, s = p.sprite;
    const m = this.trail.get("andrew") ? this.trail.detach("andrew") : null;
    const hearts = [];
    const finish = () => {
      for (const h of hearts) h.destroy();
      this.night.setAlpha(0);
      ui.hideCaption();
      if (m) { m.scripted = false; m.sprite.setY(s.y); this.trail.rejoin("andrew"); this.trail.reset(); }
      startMusic(this.map.music || "level");
      this.unfreeze();
    };
    this.startCut(finish);
    startMusic("whatislove"); // Andrew: the proposal uses one of the bonus songs; it opens on the bare "What is love?" vocal
    this.cutTween({ targets: this.night, alpha: 0.5, duration: 1200 });
    p.sprite.setFlipX(false);
    if (m) {
      m.scripted = true;
      m.sprite.setDepth(11);
      this.walkTo(m.sprite, m.key, s.x + 18, 60).then(() => {
        m.sprite.setFlipX(true);
        this.cutTween({ targets: m.sprite, y: s.y + 3, duration: 400 });
        sfx.win();
        for (let i = 0; i < 8; i++) {
          this.cutDelay(300 + i * 350, () => {
            const h = this.add.image(s.x + 9 + Phaser.Math.Between(-10, 10), s.y - 30, "fx-heart").setDepth(20);
            hearts.push(h);
            this.cutTween({ targets: h, y: h.y - 40, alpha: 0, duration: 1600 });
          });
        }
        this.cutDelay(800, () => ui.caption("", t(this.hut && this.segmentField("Argentina", "proposalCaption")), 0));
        this.cutDelay(8200, () => this.endCut());
      });
    } else this.cutDelay(2000, () => this.endCut());
  }

  segmentField(country, field) {
    return (this.level.segments || []).find((sg) => sg.country === country)?.[field];
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
    writeSave();
    ui.hideCaption();
    const sub = has(this.level.endCaption) ? t(this.level.endCaption) : "";
    ui.banner(`${worldTitle(this.world)} complete`, sub, `${controls.hint("confirm")} to continue`, "top");
    this.time.delayedCall(600, () => {
      this.mode = "await";
      this.onConfirm = () => this.goTo("WorldMap", { select: nextLevelId(id) || id });
    });
  }

  enterBoss() {
    this.freeze();
    sfx.gate();
    this.time.delayedCall(500, () => this.goTo("Level", { id: this.levelId, map: "7-boss" }));
  }

  finishGame() {
    const save = game.save;
    if (!save.done.includes(this.levelId)) save.done.push(this.levelId);
    writeSave();
    this.goTo("Ending", {});
  }

  leave() {
    if (this.leaving) return;
    if (this.mode === "paused") this.togglePause();
    this.goTo("WorldMap", { select: this.levelId });
  }

  async goTo(scene, data) {
    this.leaving = true;
    await ui.fade(true, 300);
    ui.clearAll();
    this.scene.start(scene, data);
    ui.fade(false, 300);
  }

  // The rabbit send-off at the end of NYC Chinatown.
  sendoff() {
    const gate = this.gate;
    this.gate = null;
    const p = this.player;
    startMusic("sendoff");
    const m = this.trail.get("rupert") ? this.trail.detach("rupert") : null;
    const rabbit = m?.sprite;
    const past = gate.x + 30;
    const dest = this.otherRabbit ? this.otherRabbit.x - 22 : gate.x + 90;
    const finish = () => {
      this.night.setAlpha(0).setFillStyle(0x0a0a28);
      this.setTheme("garden");
      if (rabbit) { rabbit.setPosition(dest, gate.y).setFlipX(false); rabbit.play(animKey(m.key, "idle")); }
      gate.setTexture("prop-gate-closed");
      p.forcedAnim = null;
      this.trail.remove("rupert");
      this.time.delayedCall(10, () => {
        ui.caption("keepsake", "Rupert's charm: one extra high jump per level, in mid air", 4200);
        this.time.delayedCall(2600, () => this.complete());
      });
    };
    this.startCut(finish);
    if (!rabbit) { this.cutDelay(1000, () => this.endCut()); return; }
    m.scripted = true;
    rabbit.setDepth(12);
    // The big sunny yard: the light changes as they reach the gate.
    this.night.setFillStyle(0xffffff);
    this.cutTween({ targets: this.night, alpha: 0.8, duration: 350, yoyo: true, onYoyo: () => this.setTheme("garden"),
      onComplete: () => this.night.setFillStyle(0x0a0a28) });
    this.cutDelay(900, () => {
      rabbit.play(animKey(m.key, "hop"));
      rabbit.setFlipX(false);
      const d1 = Math.max(600, (past - rabbit.x) * 12);
      this.cutTween({ targets: rabbit, x: past, duration: d1 });
      this.cutDelay(d1, () => { rabbit.play(animKey(m.key, "idle")); rabbit.setFlipX(true); });
      this.cutDelay(d1 + 1400, () => {
        rabbit.setFlipX(false);
        rabbit.play(animKey(m.key, "hop"));
        this.cutTween({ targets: rabbit, x: dest, duration: Math.max(700, (dest - past) * 14), onComplete: () => rabbit.play(animKey(m.key, "idle")) });
      });
      this.cutDelay(d1 + 2200, () => {
        gate.setTexture("prop-gate-closed");
        sfx.gate();
        p.forcedAnim = "wave";
        ui.caption("", t(this.level.rabbitSendoffCaption), 0);
      });
      this.cutDelay(d1 + 7200, () => { ui.hideCaption(); this.endCut(); });
    });
  }
}
