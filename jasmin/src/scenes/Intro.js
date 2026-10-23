import { controls } from "../controls.js";
import { startMusic, sfx } from "../audio.js";
import { ui } from "../ui.js";
import { game, findLevel, writeSave, worldTitle, t } from "../state.js";
import { THEMES, makeEnvironmentTextures } from "../tiles.js";
import { makePropTextures, mk } from "../props.js";

// World 0, Nairobi: a short intro (about 20 seconds, skippable). A star settles
// over the savanna at sunset, the caption appears, then the camera pans north.
export class Intro extends Phaser.Scene {
  constructor() { super("Intro"); }

  create() {
    ui.clearAll();
    controls.showPad(false);
    ui.showHome(false);
    controls.release();
    controls.setActionVisible(false);
    makePropTextures(this);
    this.makeSpark();
    this.age = 0;
    const theme = THEMES.nairobi || THEMES.dusk;
    makeEnvironmentTextures(this, theme);
    const { width, height } = this.scale;
    const entry = findLevel("0-1");
    this.entry = entry;

    // A tall scene: savanna at the bottom, open sky above for the pan north.
    const H = height * 3;
    const top = Phaser.Display.Color.HexStringToColor("#2b2d63").color;
    const mid = Phaser.Display.Color.HexStringToColor(theme.sky[0]).color;
    const bot = Phaser.Display.Color.HexStringToColor(theme.sky[1]).color;
    const g = this.add.graphics();
    g.fillGradientStyle(top, top, mid, mid, 1).fillRect(0, 0, width, H - height);
    g.fillGradientStyle(mid, mid, bot, bot, 1).fillRect(0, H - height, width, height);
    for (let i = 0; i < 60; i++) {
      this.add.image(Math.random() * width, Math.random() * (H - height * 1.2), "spark").setAlpha(0.3 + Math.random() * 0.6);
    }
    this.add.tileSprite(0, H - 16, width, 96, "bg-far").setOrigin(0, 1);
    this.makeSavanna();
    // Nairobi's skyline beyond the national park: city towers behind open grassland.
    this.add.tileSprite(0, H - 40, width, 40, "nbo-skyline").setOrigin(0, 1).setAlpha(0.55);
    this.add.tileSprite(0, H - 16, width, 64, "bg-hills").setOrigin(0, 1);
    // Acacias, giraffes ambling past, birds crossing the sunset.
    [[0.12, 1], [0.78, 0.8], [0.46, 0.6]].forEach(([fx, sc]) => this.add.image(width * fx, H - 14, "nbo-acacia").setOrigin(0.5, 1).setScale(sc));
    if (!this.anims.exists("nbo-giraffe")) this.anims.create({ key: "nbo-giraffe", frames: [{ key: "nbo-giraffe-0" }, { key: "nbo-giraffe-1" }], frameRate: 3, repeat: -1 });
    [[-30, 1, 26000], [width + 40, -1, 32000]].forEach(([x0, dir, ms], i) => {
      const gi = this.add.sprite(x0, H - 14, "nbo-giraffe-0").setOrigin(0.5, 1).setFlipX(dir < 0).play("nbo-giraffe").setScale(i ? 0.8 : 1);
      this.tweens.add({ targets: gi, x: dir > 0 ? width + 40 : -40, duration: ms });
    });
    for (let i = 0; i < 5; i++) {
      const bird = this.add.image(-10 - i * 9, H - height * 0.55 + (i % 2) * 6 - i * 2, "nbo-bird").setAlpha(0.8);
      this.tweens.add({ targets: bird, x: width + 20, duration: 14000, delay: 2500 + i * 180 });
      this.tweens.add({ targets: bird, y: bird.y - 4, duration: 400, yoyo: true, repeat: -1 });
    }
    this.add.tileSprite(0, H - 16, width, 16, "tile-ground-top").setOrigin(0, 0);
    for (let y = 1; y < 2; y++) this.add.tileSprite(0, H - 16 + y * 16, width, 16, "tile-ground").setOrigin(0, 0);
    for (let i = 0; i < 4; i++) this.add.tileSprite(0, H * (0.15 + i * 0.2), width, 32, "bg-clouds").setOrigin(0, 0).setAlpha(0.7).setTilePosition(i * 40, 0);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, width, H);
    cam.scrollY = H - height;

    // The star: settles gently over the savanna, glows, a little burst.
    const star = this.add.image(width / 2, H - height - 20, "fx-sparkle-0").setScale(2).setDepth(5);
    const glow = this.add.image(width / 2, H - 70, "fx-glow").setScale(3).setAlpha(0).setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: star, y: H - 70, duration: 3500, ease: "Sine.out" });
    this.tweens.add({ targets: star, angle: 360, duration: 2000, repeat: -1 });
    this.time.delayedCall(3500, () => {
      sfx.hatch();
      this.tweens.add({ targets: glow, alpha: 0.9, scale: 4, duration: 800, yoyo: true, hold: 1800 });
      ui.caption("", t(entry.level.endCaption), 0);
    });
    this.time.delayedCall(9000, () => {
      ui.hideCaption();
      // Pan north toward London.
      this.tweens.add({ targets: star, y: H - height * 2.6, duration: 9000, ease: "Sine.inOut" });
      this.tweens.add({ targets: cam, scrollY: 0, duration: 9000, ease: "Sine.inOut" });
    });
    this.time.delayedCall(15500, () => {
      const london = findLevel("1-1");
      ui.banner("North", london ? `to ${worldTitle(london.world)}` : "", "", "top");
    });
    this.time.delayedCall(19500, () => this.finish());

    ui.banner(worldTitle(entry.world), "", "", "top");
    this.time.delayedCall(2600, () => ui.hideBanner());
    ui.label("skip", controls.hint("skip"), width - 40, height - 4, "plain");
    this.input.on("pointerdown", (ptr) => { if (!ui.hitsButton(ptr)) this.tapped = true; });
    startMusic("credits");
  }

  makeSavanna() {
    const DK = "#2a1c26", DK2 = "#3a2632";
    mk(this, "nbo-acacia", 40, 30, ({ R }) => {
      // flat-topped canopy on a forked trunk, in sunset silhouette
      R(4, 4, 32, 3, DK2); R(1, 6, 38, 4, DK); R(6, 2, 22, 2, DK2); R(10, 10, 20, 2, DK);
      R(19, 12, 2, 18, DK); R(15, 12, 2, 6, DK); R(16, 17, 3, 2, DK); R(23, 12, 2, 5, DK); R(21, 16, 2, 2, DK);
    });
    [0, 1].forEach((f) => mk(this, `nbo-giraffe-${f}`, 22, 30, ({ R, P }) => {
      R(14, 0, 5, 3, DK); P(15, 0, DK2); R(13, 2, 3, 13, DK);       // head and long neck
      R(3, 13, 14, 6, DK); R(1, 13, 2, 3, DK);                       // body and tail
      const legs = f ? [[4, 1], [7, -1], [12, 1], [15, -1]] : [[4, -1], [7, 1], [12, -1], [15, 1]];
      legs.forEach(([x, d]) => { R(x, 19, 2, 9, DK); R(x + (d > 0 ? 1 : 0), 28, 2, 2, DK); });
      [[6, 15], [10, 14], [9, 17], [14, 16], [14, 7], [14, 11]].forEach(([x, y]) => P(x, y, DK2));
    }));
    mk(this, "nbo-bird", 7, 3, ({ P }) => { [[0, 0], [1, 1], [2, 1], [3, 2], [4, 1], [5, 1], [6, 0]].forEach(([x, y]) => P(x, y, DK)); });
    mk(this, "nbo-skyline", 160, 40, ({ R, P }) => {
      const c = "#4a3048", w = "#ffd27a";
      [[4, 26, 10], [16, 18, 8], [26, 30, 12], [40, 10, 9], [51, 22, 7], [60, 6, 6], [68, 24, 11], [82, 16, 8], [92, 28, 10], [104, 12, 7], [114, 20, 12], [128, 26, 9], [140, 14, 8], [150, 30, 8]]
        .forEach(([x, top, wd]) => { R(x, top, wd, 40 - top, c); for (let y = top + 3; y < 38; y += 4) for (let xx = x + 2; xx < x + wd - 1; xx += 3) if ((xx * 7 + y * 3) % 5 < 2) P(xx, y, w); });
      R(62, 0, 2, 6, c); // a mast on the tallest tower
    });
  }

  makeSpark() {
    if (this.textures.exists("spark")) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff).fillRect(0, 0, 2, 2);
    g.generateTexture("spark", 2, 2);
    g.destroy();
  }

  update(_t, dms) {
    controls.update();
    this.age += dms / 1000;
    if ((this.tapped || controls.confirmed()) && this.age > 0.6) this.finish();
    this.tapped = false;
  }

  async finish() {
    if (this.leaving) return;
    this.leaving = true;
    const save = game.save;
    if (!save.done.includes("0-1")) save.done.push("0-1");
    writeSave();
    await ui.fade(true, 400);
    ui.clearAll();
    this.scene.start("WorldMap", { select: "1-1" });
    ui.fade(false, 400);
  }
}
