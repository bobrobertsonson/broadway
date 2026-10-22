import { controls } from "../controls.js";
import { startMusic } from "../audio.js";
import { ui, clean } from "../ui.js";
import { game, t } from "../state.js";
import { charKey, animKey } from "../art.js";
import { makeEnvironmentTextures } from "../tiles.js";

// End credits: the rabbit, happy in his new yard, while the lines roll by.
export class Credits extends Phaser.Scene {
  constructor() { super("Credits"); }

  create() {
    ui.clearAll();
    controls.showPad(false);
    ui.showHome(false);
    controls.setActionVisible(false);
    makeEnvironmentTextures(this, "garden");
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#8fd8f5");
    this.add.tileSprite(0, 6, width, 32, "bg-clouds").setOrigin(0, 0);
    this.add.tileSprite(0, height - 16, width, 64, "bg-hills").setOrigin(0, 1);
    this.add.tileSprite(0, height - 16, width, 16, "tile-ground-top").setOrigin(0, 0);

    const key = charKey("rupert");
    const floor = height - 16;
    this.rabbit = this.add.sprite(width * 0.35, floor, key).setOrigin(0.5, 1);
    this.friend = this.add.sprite(width * 0.62, floor, key).setOrigin(0.5, 1).setFlipX(true);
    this.friend.play(animKey(key, "idle"));
    this.hop(key, floor);

    const gk = "prop-gate-closed";
    this.add.image(width * 0.85, floor, gk).setOrigin(0.5, 1);

    const lines = (game.content.credits || []).map((c) => t(c));
    this.lines = lines;
    this.i = 0;
    this.showNext();
    startMusic("credits");
    this.input.on("pointerdown", (ptr) => { if (!ui.hitsButton(ptr)) this.tapped = true; });
  }

  hop(key, floor) {
    const r = this.rabbit;
    const { width } = this.scale;
    const go = () => {
      const to = Phaser.Math.Between(Math.round(width * 0.15), Math.round(width * 0.55));
      r.setFlipX(to < r.x);
      r.play(animKey(key, "hop"));
      this.tweens.add({
        targets: r, x: to, duration: Math.abs(to - r.x) * 14 + 200,
        onComplete: () => { r.play(animKey(key, "idle")); this.time.delayedCall(Phaser.Math.Between(700, 1600), go); },
      });
      this.tweens.add({ targets: r, y: floor - 6, duration: 120, yoyo: true, repeat: 2 });
    };
    go();
  }

  showNext() {
    if (this.i >= this.lines.length) {
      this.finished = true;
      ui.banner("The end", "", `${controls.hint("confirm")} to return to the map`);
      return;
    }
    const line = this.lines[this.i++];
    ui.banner(clean(line), "");
    this.time.delayedCall(line ? 3200 : 800, () => this.showNext());
  }

  update() {
    controls.update();
    if ((controls.confirmed() || this.tapped) && this.finished && !this.leaving) {
      this.leaving = true;
      ui.fade(true, 400).then(() => { ui.clearAll(); this.scene.start("WorldMap", {}); ui.fade(false, 400); });
    }
    this.tapped = false;
  }
}
