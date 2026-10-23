// Powers beyond the hat. Each level offers one; the action button uses whichever
// she holds, and a new pickup replaces the old one (like a Mario power-up).
//   pen    writes a short platform (limited ink; the drawing lives in Level.usePen)
//   spark  throws a sparkle: knocks out pests, smashes cracked bricks
//   dash   a quick burst sideways, in the air too: smashes cracked bricks, bowls over pests
//   bs     the Bullshitometer: a needle that twitches near anything fake (crumbling
//          floors, mimic collectibles); action calls it out and exposes them for a while
//
// Also owns the tiles these interact with:
//   %  cracked brick: breaks when hit from below, by a spark, or by a dash
//   ~  fake brick, _ fake ground: look solid, crumble a moment after she stands on them
//   ?  mimic: looks like a collectible, bites

import { controls } from "./controls.js";
import { sfx } from "./audio.js";
import { ui } from "./ui.js";
import { squash } from "./enemies.js";
import { mk } from "./props.js";

const T = 16;
export const POWER_ITEMS = { p: "pen", "^": "spark", ">": "dash", "!": "bs" };
export const TILE_CRACK = 4, TILE_FAKE_BRICK = 5, TILE_FAKE_TOP = 6;

const SPARK_SPEED = 230, SPARK_LIFE = 0.75, SPARK_MAX = 2, SPARK_COOLDOWN = 0.28;
const DASH_COOLDOWN = 0.45;
const CRUMBLE_DELAY = 0.3;
const BS_RANGE = 9 * T, BS_REVEAL = 6, BS_COOLDOWN = 2;

const NAMES = { pen: "pen", spark: "magic spark", dash: "dash", bs: "Bullshitometer" };

function teach(kind) {
  const key = controls.actionName();
  return {
    pen: controls.hint("pen"),
    spark: `${key} to throw a spark. It knocks out pests and smashes cracked bricks.`,
    dash: `${key} to dash, in the air too. Smashes cracked bricks.`,
    bs: `The needle twitches when something is fake. ${key} to call it out.`,
  }[kind];
}

export class Powers {
  constructor(level) {
    this.L = level;
    this.kind = null;
    this.taught = {};
    this.cool = 0;
    this.needle = 0;
    this.revealT = 0;
    this.crumbling = new Map();   // "x,y" -> seconds left
    this.gone = [];               // crumbled fake tiles, restored on respawn
    this.marks = [];              // reveal overlays
    this.mimics = [];
    this.fakes = [];
    makePowerTextures(level);

    this.sparks = level.physics.add.group({ allowGravity: false });
    level.physics.add.collider(this.sparks, level.layer, (sp, tile) => this.sparkHit(sp, tile));
    level.physics.add.overlap(this.sparks, level.enemies, (sp, e) => {
      if (e.squashed) return;
      squash(level, e);
      sfx.stomp();
      this.fizzle(sp);
    });

    for (let y = 0; y < level.rowsN; y++)
      for (let x = 0; x < level.colsN; x++)
        if ("~_".includes(level.cell(x, y))) this.fakes.push({ x, y, index: level.cell(x, y) === "~" ? TILE_FAKE_BRICK : TILE_FAKE_TOP });
  }

  // Tileset slots for the new tiles, drawn from the theme's own brick and ground.
  static composeTiles(scene, ctx) {
    const brick = scene.textures.get("tile-brick").getSourceImage();
    const top = scene.textures.get("tile-ground-top").getSourceImage();
    // Cracked brick: the brick with a dark zigzag crack and a chipped corner.
    ctx.drawImage(brick, TILE_CRACK * T, 0);
    ctx.fillStyle = "rgba(20,10,20,0.75)";
    const ox = TILE_CRACK * T;
    [[7, 0], [7, 1], [6, 2], [6, 3], [7, 4], [8, 5], [8, 6], [7, 7], [6, 8], [6, 9], [5, 10], [9, 6], [10, 7], [11, 8], [5, 11], [4, 12], [10, 9]]
      .forEach(([x, y]) => ctx.fillRect(ox + x, y, 1, 1));
    ctx.clearRect(ox + 14, 0, 2, 1); ctx.clearRect(ox + 15, 1, 1, 1);
    // Fakes look exactly like the real thing.
    ctx.drawImage(brick, TILE_FAKE_BRICK * T, 0);
    ctx.drawImage(top, TILE_FAKE_TOP * T, 0);
  }

  set(kind) {
    this.kind = kind;
    controls.setActionIcon(kind);
    if (!this.taught[kind]) {
      this.taught[kind] = true;
      ui.caption(NAMES[kind], teach(kind), 3600);
    }
    this.L.refreshHud();
  }

  addMimic(x, y) {
    const s = this.L.add.image(x, y, "item-collectible").setOrigin(0.5, 1).setDepth(5);
    const m = { sprite: s, x, y, home: y, dead: false, shown: false };
    m.bob = this.L.tweens.add({ targets: s, y: y - 3, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.mimics.push(m);
  }

  // One line for the pause screen.
  describe() {
    if (!this.kind) return "";
    if (this.kind === "pen") return `Power: the pen, ${this.L.penUses} left (${controls.actionName()})`;
    return `Power: ${NAMES[this.kind]} (${controls.actionName()})`;
  }

  hudItems() {
    if (!this.kind) return [];
    if (this.kind === "pen") return this.L.penUses > 0 || this.L.penTaught ? [{ icon: "item-pen", text: String(this.L.penUses) }] : [];
    if (this.kind === "bs") return [{ icon: `hud-bs-${this.needle}` }];
    return [{ icon: `item-${this.kind}` }];
  }

  actionReady() {
    return this.kind === "pen" ? this.L.penUses > 0 : !!this.kind;
  }

  use() {
    const L = this.L, p = L.player;
    if (!this.kind || p.dead || p.locked || this.cool > 0) return;
    if (this.kind === "pen") return L.usePen();
    if (this.kind === "spark") return this.throwSpark();
    if (this.kind === "dash") {
      if (p.dash()) { this.cool = DASH_COOLDOWN; sfx.dash(); }
      return;
    }
    if (this.kind === "bs") return this.callOut();
  }

  throwSpark() {
    const p = this.L.player, b = p.sprite.body;
    if (this.sparks.countActive() >= SPARK_MAX) return;
    const sp = this.sparks.create(b.center.x + p.facing * 8, b.center.y - 2, "fx-spark-0");
    sp.setDepth(11).play("fx-spark");
    sp.body.setSize(6, 6).setVelocityX(p.facing * SPARK_SPEED);
    sp.life = SPARK_LIFE;
    sp.t0 = this.L.time.now;
    sp.y0 = sp.y;
    this.cool = SPARK_COOLDOWN;
    sfx.spark();
    if (!p.cloaked) {
      p.forcedAnim = "write";
      this.L.time.delayedCall(180, () => { if (p.forcedAnim === "write") p.forcedAnim = null; });
    }
  }

  // A spark opens the whole cracked column it hits (walls are often two tiles tall).
  sparkHit(sp, tile) {
    if (tile && tile.index === TILE_CRACK) {
      this.breakAt(tile.x, tile.y);
      for (const d of [-1, 1]) for (let y = tile.y + d; this.breakAt(tile.x, y); y += d);
    }
    this.fizzle(sp);
  }

  fizzle(sp) {
    if (!sp.active) return;
    this.L.puff(sp.x, sp.y + 3, 0xfff2a8, 4);
    sp.destroy();
  }

  callOut() {
    const L = this.L, s = L.player.sprite;
    this.cool = BS_COOLDOWN;
    this.revealT = BS_REVEAL;
    sfx.bs();
    L.say(L.player.sprite, "Nope.", 1200);
    for (const f of this.fakes) {
      if (f.mark || this.isGone(f)) continue;
      if (Math.abs(f.x * T + 8 - s.x) > 14 * T) continue;
      f.mark = L.add.image(f.x * T, f.y * T, "fx-fake").setOrigin(0).setDepth(3);
      L.tweens.add({ targets: f.mark, alpha: { from: 1, to: 0.55 }, duration: 300, yoyo: true, repeat: -1 });
    }
    for (const m of this.mimics) if (!m.dead && Math.abs(m.x - s.x) < 14 * T) this.showMimic(m);
  }

  showMimic(m) {
    if (m.shown) return;
    m.shown = true;
    m.sprite.setTexture("enemy-mimic-0");
    this.L.puff(m.x, m.y - 6, 0xff6a5a, 6);
  }

  clearMarks() {
    for (const f of this.fakes) if (f.mark) { f.mark.destroy(); f.mark = null; }
  }

  isGone(f) {
    return this.gone.includes(f);
  }

  // Cracked brick at tile (tx, ty): gone, with a shower of bits.
  breakAt(tx, ty) {
    const L = this.L;
    const tile = L.layer.getTileAt(tx, ty);
    if (!tile || tile.index !== TILE_CRACK) return false;
    L.layer.removeTileAt(tx, ty);
    L.cells[ty] = L.cells[ty].slice(0, tx) + "." + L.cells[ty].slice(tx + 1);
    this.debris(tx, ty, L.theme.brick);
    sfx.brick();
    L.cameras.main.shake(60, 0.002);
    return true;
  }

  debris(tx, ty, color) {
    const L = this.L;
    const tint = Phaser.Display.Color.HexStringToColor(color || "#d9884e").color;
    [[-1, -1], [1, -1], [-1, 0], [1, 0]].forEach(([dx, dy], i) => {
      const bit = L.add.image(tx * T + 8 + dx * 4, ty * T + 8 + dy * 4, "fx-bit").setTint(tint).setDepth(12);
      L.tweens.add({ targets: bit, x: bit.x + dx * (18 + i * 3), duration: 600 });
      L.tweens.add({ targets: bit, y: bit.y - 22 + i * 3, duration: 220, ease: "Quad.out",
        onComplete: () => L.tweens.add({ targets: bit, y: bit.y + 90, alpha: 0, angle: dx * 200, duration: 500, ease: "Quad.in", onComplete: () => bit.destroy() }) });
    });
  }

  crumble(f) {
    const L = this.L;
    L.layer.removeTileAt(f.x, f.y);
    if (f.mark) { f.mark.destroy(); f.mark = null; }
    this.gone.push(f);
    this.debris(f.x, f.y, f.index === TILE_FAKE_TOP ? L.theme.groundTop : L.theme.brick);
    sfx.crumble();
  }

  // Respawn: fake floors come back, sparks vanish.
  reset() {
    for (const f of this.gone) this.L.layer.putTileAt(f.index, f.x, f.y).setCollision(true, true, true, true);
    this.gone = [];
    this.crumbling.clear();
    this.sparks.clear(true, true);
    this.clearMarks();
    this.revealT = 0;
  }

  update(dt) {
    const L = this.L, p = L.player, b = p.sprite.body;
    this.cool = Math.max(0, this.cool - dt);
    if (L.mode !== "play" || p.dead) return;

    // Sparks wobble and expire.
    for (const sp of this.sparks.getChildren()) {
      sp.life -= dt;
      sp.y = sp.y0 + Math.sin((L.time.now - sp.t0) / 50) * 2;
      if (sp.life <= 0) this.fizzle(sp);
    }

    // Head-butting a cracked brick breaks it (the one nearest her center first).
    if (b.blocked.up) {
      const ty = Math.floor((b.top - 2) / T);
      const xs = [b.center.x, b.left + 1, b.right - 1].map((x) => Math.floor(x / T));
      for (const tx of xs) if (this.breakAt(tx, ty)) { b.setVelocityY(40); break; }
    }
    // Dashing into one breaks it too.
    if (p.dashT > 0 && (b.blocked.left || b.blocked.right)) {
      const tx = Math.floor((b.blocked.right ? b.right + 2 : b.left - 2) / T);
      for (const y of [b.top + 2, b.center.y, b.bottom - 2]) this.breakAt(tx, Math.floor(y / T));
    }

    // Fake floors crumble a moment after she stands on them.
    if (p.onGround) {
      const ty = Math.floor((b.bottom + 2) / T);
      for (const x of [b.left + 1, b.right - 1]) {
        const tx = Math.floor(x / T);
        const f = this.fakes.find((q) => q.x === tx && q.y === ty && !this.isGone(q));
        const k = `${tx},${ty}`;
        if (f && !this.crumbling.has(k)) {
          this.crumbling.set(k, CRUMBLE_DELAY);
          L.puff(tx * T + 8, ty * T + 2, 0xd8c8b0, 4);
        }
      }
    }
    for (const [k, left] of this.crumbling) {
      const n = left - dt;
      if (n > 0) { this.crumbling.set(k, n); continue; }
      this.crumbling.delete(k);
      const [tx, ty] = k.split(",").map(Number);
      const f = this.fakes.find((q) => q.x === tx && q.y === ty);
      if (f && !this.isGone(f)) this.crumble(f);
    }

    // Mimics bite from the side, can be stomped from above.
    for (const m of this.mimics) {
      if (m.dead) continue;
      const s = m.sprite;
      if (Math.abs(s.x - b.center.x) > 10 || s.y < b.top || s.y - 12 > b.bottom) continue;
      if (b.velocity.y > 0 && b.bottom - (s.y - 12) < 8) {
        m.dead = true;
        m.bob.stop();
        this.showMimic(m);
        L.tweens.add({ targets: s, scaleY: 0.2, alpha: 0, duration: 250, onComplete: () => s.destroy() });
        sfx.stomp();
        b.setVelocityY(-240);
      } else {
        this.showMimic(m);
        L.hurtPlayer(s.x);
      }
    }

    // Bullshitometer: the needle rises as anything fake gets close.
    if (this.revealT > 0) {
      this.revealT -= dt;
      if (this.revealT <= 0) this.clearMarks();
    }
    if (this.kind === "bs") {
      let best = Infinity;
      for (const f of this.fakes) if (!this.isGone(f)) best = Math.min(best, Math.hypot(f.x * T + 8 - b.center.x, f.y * T + 8 - b.center.y));
      for (const m of this.mimics) if (!m.dead && !m.shown) best = Math.min(best, Math.hypot(m.x - b.center.x, m.y - b.center.y));
      const n = best > BS_RANGE ? 0 : Math.min(4, 1 + Math.floor((1 - best / BS_RANGE) * 4));
      if (n !== this.needle) { this.needle = n; L.refreshHud(); }
    }

    if (controls.pressed("action")) this.use();
  }
}

// ---------- textures ----------
const INK = "#2a2038", WHITE = "#fffaf0", GOLD = "#e0a43a", GOLD_LIGHT = "#fff0a0";
const RED = "#ff5a4a", PINK = "#ff8fb0", TEAL = "#3fc1c9", TEAL_DARK = "#24828a";

export function makePowerTextures(scene) {
  const M = (key, w, h, fn) => mk(scene, key, w, h, fn);
  M("item-spark", 12, 12, ({ A }) => A([
    ".....o......",
    ".....Yo.....",
    "....oYYo....",
    "o..oYWWYo..o",
    ".ooYWWWWYoo.",
    "..oYWWWWYo..",
    "..oYYWWYYo..",
    ".oYYooooYYo.",
    ".oYo....oYo.",
    "oo........oo",
    "......w.....",
    ".....w.w....",
  ], { o: INK, Y: GOLD, W: GOLD_LIGHT, w: WHITE }));
  M("item-dash", 12, 12, ({ A }) => A([
    "............",
    "............",
    "......oooo..",
    ".....oTTTTo.",
    "ww..oTTWTTo.",
    "....oTTTTTo.",
    "www.oTTTTTTo",
    "...oTTTTTTTo",
    "ww.oDDDDDDDo",
    "...oWWWWWWWo",
    "....ooooooo.",
    "............",
  ], { o: INK, T: TEAL, D: TEAL_DARK, W: WHITE, w: WHITE }));
  M("item-bs", 12, 12, ({ A }) => A([
    "............",
    "...oooooo...",
    "..oWWWWWWo..",
    ".oWGWWWWRWo.",
    ".oWWWWWRWWo.",
    "oWGWWWRWWRWo",
    "oWWWWoWWWWWo",
    "oWWWWooWWWWo",
    "oooooooooooo",
    "............",
    "............",
    "............",
  ], { o: INK, W: WHITE, G: "#5fb04a", R: RED }));
  // HUD gauge: needle from calm (0) to "something is very off" (4).
  const angles = [-1.25, -0.5, 0.2, 0.8, 1.3];
  angles.forEach((a, i) => M(`hud-bs-${i}`, 16, 10, ({ R, P }) => {
    R(1, 1, 14, 9, INK); R(2, 2, 12, 7, WHITE);
    R(2, 2, 4, 1, "#5fb04a"); R(6, 2, 4, 1, GOLD); R(10, 2, 4, 1, RED);
    for (let k = 0; k <= 6; k++) P(Math.round(8 + Math.sin(a) * k), Math.round(9 - Math.cos(a) * k), i >= 3 ? RED : INK);
    P(8, 9, INK);
  }));
  M("enemy-mimic-0", 12, 12, ({ A }) => A([
    "..oo....oo..",
    ".oPPo..oPPo.",
    "oPRRPooPRRPo",
    "oPRwRPPRwRPo",
    "oPPRRRRRRPPo",
    "owwowwowwowo",
    "o..........o",
    "owwowwowwowo",
    ".oPPPPPPPPo.",
    "..oPPPPPPo..",
    "...oPPPPo...",
    "....oooo....",
  ], { o: INK, P: PINK, R: RED, w: WHITE }));
  ["fx-spark-0", "fx-spark-1"].forEach((k, i) => M(k, 6, 6, ({ A }) => A(i ? [
    "..W...", ".WYW..", "WYWYW.", ".WYW..", "..W...", "......",
  ] : [
    "......", "..Y...", ".YWY..", "YWWWY.", ".YWY..", "..Y...",
  ], { W: WHITE, Y: GOLD_LIGHT })));
  // Hidden secret: a wrapped sweet with a sparkle (3 per level, tucked behind bricks and high routes).
  M("item-secret", 12, 12, ({ A }) => A([
    "....w.......",
    "...wYw......",
    "....w.......",
    "............",
    "o..oooooo..o",
    "oooPPPPPPooo",
    "oPoPWPPPPoPo",
    "oooPPPPPPooo",
    "o..oooooo..o",
    "............",
    "........w...",
    ".......wYw..",
  ], { o: INK, P: "#b07ae0", W: WHITE, w: WHITE, Y: GOLD_LIGHT }));
  M("fx-bit", 4, 4, ({ R }) => { R(0, 0, 4, 4, "#ffffff"); R(0, 3, 4, 1, "#9a9a9a"); R(3, 0, 1, 4, "#bdbdbd"); });
  M("fx-fake", 16, 16, ({ R, P }) => {
    R(0, 0, 16, 1, RED); R(0, 15, 16, 1, RED); R(0, 0, 1, 16, RED); R(15, 0, 1, 16, RED);
    R(7, 3, 2, 7, RED); R(7, 11, 2, 2, RED);
    for (let i = 2; i < 14; i += 3) { P(i, 1, WHITE); P(i, 14, WHITE); }
  });
  if (!scene.anims.exists("fx-spark")) scene.anims.create({ key: "fx-spark", frames: [{ key: "fx-spark-0" }, { key: "fx-spark-1" }], frameRate: 14, repeat: -1 });
}
