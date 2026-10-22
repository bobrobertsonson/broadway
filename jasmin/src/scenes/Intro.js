import { controls } from "../controls.js";
import { startMusic, sfx } from "../audio.js";
import { ui } from "../ui.js";
import { game, findLevel, writeSave, worldTitle, t } from "../state.js";
import { THEMES, makeEnvironmentTextures } from "../tiles.js";
import { makePropTextures } from "../props.js";

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
    this.add.tileSprite(0, H - 16, width, 64, "bg-hills").setOrigin(0, 1);
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
      ui.banner("North", london ? `to ${worldTitle(london.world)}` : "");
    });
    this.time.delayedCall(19500, () => this.finish());

    ui.banner(worldTitle(entry.world), "");
    this.time.delayedCall(2600, () => ui.hideBanner());
    ui.label("skip", controls.hint("skip"), window.innerWidth - 70, window.innerHeight - 8, "plain");
    this.input.on("pointerdown", () => (this.tapped = true));
    startMusic("credits");
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
