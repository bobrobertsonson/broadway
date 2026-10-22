import { controls } from "../controls.js";
import { startMusic } from "../audio.js";
import { ui } from "../ui.js";
import { game } from "../state.js";
import { charKey, animKey } from "../art.js";
import { makeEnvironmentTextures } from "../tiles.js";

export class Title extends Phaser.Scene {
  constructor() { super("Title"); }

  create() {
    ui.clearAll();
    ui.showHome(false);
    controls.setActionVisible(false);
    makeEnvironmentTextures(this, "dusk");
    const { width, height } = this.scale;
    this.add.tileSprite(0, height, width, 64, "bg-hills").setOrigin(0, 1);
    this.ground = this.add.tileSprite(0, height - 16, width, 16, "tile-ground-top").setOrigin(0, 0);
    const key = charKey("jasmin", { outfit: game.save.outfit });
    this.jasmin = this.add.sprite(width / 2, height - 16, key).setOrigin(0.5, 1);
    this.jasmin.play(animKey(key, "run"));
    this.cameras.main.setBackgroundColor("#4c3a8a");

    ui.banner(game.content.gameTitle || "Jasmin's Game", "", controls.isTouch ? "tap to start" : "press jump to start");
    this.input.once("pointerdown", () => this.start());
    const restart = () => this.scene.restart();
    this.scale.once("resize", restart);
    this.events.once("shutdown", () => this.scale.off("resize", restart));
    startMusic("map");
  }

  update() {
    controls.update();
    this.ground.tilePositionX += 1.2;
    if (controls.confirmed()) this.start();
  }

  async start() {
    if (this.starting) return;
    this.starting = true;
    await ui.fade(true, 300);
    ui.hideBanner();
    this.scene.start("WorldMap", {});
    ui.fade(false, 300);
  }
}
