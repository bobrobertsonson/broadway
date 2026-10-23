// Character gallery (gallery.html): every character, outfit, enemy and NPC playing
// its animations, drawn exactly as the game draws them. Handy for checking art
// after editing sprites.js or swapping in Aseprite sheets.

import { buildCharacterArt, charKey, animKey, collectOutfits } from "./art.js";
import { buildFrames, CHARACTERS } from "./frames.js";
import { makePropTextures } from "./props.js";
import { makeEnvironmentTextures } from "./tiles.js";
import { makeEnemyAnims } from "./enemies.js";
import { makeFonts, FONTS, fontSafe } from "./font.js";
import { makePowerTextures } from "./powers.js";

const W = 400, H = 630;
const CELL = 30;
const LABEL_W = 62;

class Gallery extends Phaser.Scene {
  preload() {
    this.load.json("content", "levels.json");
  }

  create() {
    const content = this.cache.json.get("content");
    const outfits = collectOutfits(content);
    buildCharacterArt(this, outfits);
    makeEnvironmentTextures(this, "day");
    makePropTextures(this);
    makeEnemyAnims(this);
    makeFonts(this);
    makePowerTextures(this);
    this.cameras.main.setBackgroundColor("#7cc8f0");

    let y = 6;
    this.text("CHARACTERS", 6, y, "big");
    y += 18;

    // One row per character: each of its animations side by side.
    for (const name of CHARACTERS) {
      const { h, anims } = buildFrames(name);
      const rowH = Math.max(h, 16) + 12;
      this.text(name, 6, y + rowH - 20);
      let x = LABEL_W;
      for (const anim of Object.keys(anims)) {
        const key = charKey(name);
        this.add.sprite(x + CELL / 2, y + rowH - 8, key).setOrigin(0.5, 1).play(animKey(key, anim));
        this.text(anim, x + CELL / 2, y + rowH - 7, "small", true);
        x += CELL + 8;
      }
      this.ground(LABEL_W - 4, y + rowH - 8, x - LABEL_W);
      y += rowH + 4;
    }

    // Outfits: Jasmin running in each one.
    y += 2;
    this.text("OUTFITS", 6, y, "big");
    y += 18;
    let x = 10;
    for (const outfit of Object.keys(outfits)) {
      const key = charKey("jasmin", { outfit });
      this.add.sprite(x + 12, y + 34, key).setOrigin(0.5, 1).play(animKey(key, "run"));
      this.text(outfit.replace(/ look$/i, ""), x + 12, y + 35, "small", true);
      x += 48;
    }
    this.ground(6, y + 34, x - 6);
    y += 50;

    // Enemies, NPCs and the boss.
    this.text("ENEMIES AND FRIENDS", 6, y, "big");
    y += 18;
    const two = (key, rate = 4) => {
      if (!this.anims.exists(key)) this.anims.create({ key, frames: [{ key: `${key}-0` }, { key: `${key}-1` }], frameRate: rate, repeat: -1 });
      return key;
    };
    const row = [
      ["enemy-ghost", "ghost"], ["enemy-inbox", "inbox"], ["enemy-subway", "subway"], ["enemy-laundry", "laundry"],
      ["enemy-alarm", "alarm"], ["enemy-germ", "germ"], ["enemy-food", "bad food"], ["enemy-cold", "cold"],
      ["npc-cop", "cop", 1], ["plat-tortoise", "tortoise", 2], ["deco-sealion", "sea lion", 2], ["deco-iguana", "iguana", 2],
    ];
    x = 10;
    let ry = y;
    row.forEach(([key, label, rate], i) => {
      if (i === 6) { x = 10; ry += 40; }
      this.add.sprite(x + 14, ry + 26, `${key}-0`).setOrigin(0.5, 1).play(two(key, rate));
      this.text(label, x + 14, ry + 27, "small", true);
      x += 56;
    });
    if (!this.anims.exists("boss-fire")) {
      this.anims.create({ key: "boss-fire", frames: [0, 1, 2].map((i) => ({ key: `boss-fire-${i}` })), frameRate: 6, repeat: -1 });
    }
    this.add.sprite(W - 44, y + 72, "boss-fire-0").setOrigin(0.5, 1).play("boss-fire");
    this.text("the fire", W - 44, y + 73, "small", true);

    // Powers, the Bullshitometer's needle, and the tricks it exposes.
    y += 96;
    this.text("POWERS", 6, y, "big");
    y += 20;
    const powers = [["item-pen", "pen"], ["item-spark", "spark"], ["item-dash", "dash"], ["item-bs", "BS-o-meter"], ["item-collectible", "mimic", "enemy-mimic-0"]];
    x = 10;
    powers.forEach(([key, label, alt]) => {
      const img = this.add.image(x + 14, y + 14, key).setOrigin(0.5, 1);
      if (alt) this.time.addEvent({ delay: 900, loop: true, callback: () => img.setTexture(img.texture.key === key ? alt : key) });
      this.text(label, x + 14, y + 15, "small", true);
      x += 56;
    });
    const needle = this.add.image(x + 14, y + 12, "hud-bs-0").setOrigin(0.5, 1);
    let n = 0;
    this.time.addEvent({ delay: 400, loop: true, callback: () => needle.setTexture(`hud-bs-${(n = (n + 1) % 5)}`) });
    this.text("needle", x + 14, y + 15, "small", true);
    this.add.sprite(x + 66, y + 10, "fx-spark-0").play("fx-spark");
  }

  text(str, x, y, which = "small", center = false) {
    const t = this.add.bitmapText(x, y, FONTS[which], fontSafe(str, which));
    if (center) t.setPosition(Math.round(x - t.width / 2), y);
    return t;
  }

  ground(x, y, w) {
    this.add.tileSprite(x, y, w, 2, "tile-ground-top").setOrigin(0, 0).setAlpha(0.6);
  }
}

window.__game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: W,
  height: H,
  zoom: Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H) * (window.devicePixelRatio || 1)) / (window.devicePixelRatio || 1)),
  pixelArt: true,
  roundPixels: true,
  backgroundColor: "#141012",
  scene: [Gallery],
});
