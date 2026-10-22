import { controls } from "../controls.js";
import { startMusic } from "../audio.js";
import { ui } from "../ui.js";
import { game, isUnlocked } from "../state.js";
import { charKey, animKey } from "../art.js";
import { makeEnvironmentTextures } from "../tiles.js";
import { makeLogoTexture, makeSparkleTextures } from "../logo.js";

// Logo over a sky, Jasmin standing below it, "Tap to start" blinking.
export class Title extends Phaser.Scene {
  constructor() { super("Title"); }

  create() {
    ui.clearAll();
    ui.showHome(false);
    controls.setActionVisible(false);
    makeEnvironmentTextures(this, "london");
    const { width, height } = this.scale;
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x7cc8f0, 0x7cc8f0, 0xd6f0fb, 0xd6f0fb, 1).fillRect(0, 0, width, height);
    this.add.tileSprite(0, 10, width, 32, "bg-clouds").setOrigin(0, 0);
    this.add.tileSprite(0, height - 16, width, 64, "bg-hills").setOrigin(0, 1);
    this.add.tileSprite(0, height - 16, width, 16, "tile-ground-top").setOrigin(0, 0);

    const logo = makeLogoTexture(this);
    makeSparkleTextures(this);
    const scale = logo.width * 1 > width - 16 || logo.height > height - 70 ? 0.5 : 1;
    const lx = Math.round(width / 2), ly = Math.max(4, Math.round((height - 16 - 34) / 2 - (logo.height * scale) / 2));
    const img = this.add.image(lx, ly, "logo").setOrigin(0.5, 0).setScale(scale);
    this.tweens.add({ targets: img, y: ly + 3, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    // Sparkles twinkling around "A New Magic".
    const st = logo.subtitle;
    for (let i = 0; i < 5; i++) {
      const sx = lx - (logo.width * scale) / 2 + (st.x + Phaser.Math.Between(-6, st.w + 6)) * scale;
      const sy = ly + (st.y + Phaser.Math.Between(-4, st.h + 2)) * scale;
      const sp = this.add.image(sx, sy, `logo-sparkle-${i % 2}`).setAlpha(0);
      this.tweens.add({ targets: sp, alpha: 1, duration: 500, yoyo: true, repeat: -1, delay: i * 330, repeatDelay: 700 + i * 120,
        onRepeat: () => sp.setPosition(sx + Phaser.Math.Between(-3, 3), sy + Phaser.Math.Between(-2, 2)) });
    }

    const key = charKey("jasmin", { outfit: game.save.outfit });
    this.add.sprite(width / 2, height - 16, key).setOrigin(0.5, 1).play(animKey(key, "idle"));

    ui.banner("", "", controls.isTouch ? "Tap to start" : "Press jump to start", "bottom");
    this.input.once("pointerdown", () => this.start());
    const restart = () => this.scene.restart();
    this.scale.once("resize", restart);
    this.events.once("shutdown", () => this.scale.off("resize", restart));
    startMusic("map");
  }

  update() {
    controls.update();
    if (controls.confirmed()) this.start();
  }

  async start() {
    if (this.starting) return;
    this.starting = true;
    await ui.fade(true, 300);
    ui.hideBanner();
    // First time: the Nairobi intro. After that: the map.
    const introDone = game.save.done.includes("0-1");
    this.scene.start(introDone && isUnlocked("1-1") ? "WorldMap" : "Intro", {});
    ui.fade(false, 300);
  }
}
