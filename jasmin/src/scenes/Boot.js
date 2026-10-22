import { game, loadSave } from "../state.js";
import { buildCharacterArt, collectOutfits, preloadArtOverrides } from "../art.js";
import { makeEnvironmentTextures } from "../tiles.js";

export class Boot extends Phaser.Scene {
  constructor() { super("Boot"); }

  preload() {
    this.load.json("content", "levels.json");
    preloadArtOverrides(this);
  }

  create() {
    game.content = this.cache.json.get("content");
    game.outfits = collectOutfits(game.content);
    loadSave();
    if (!game.outfits[game.save.outfit]) game.save.outfit = "black";
    buildCharacterArt(this, game.outfits);
    makeEnvironmentTextures(this, "day");

    // ?level=2-1 jumps straight into a level (for testing).
    const q = new URLSearchParams(location.search);
    if (q.get("level")) this.scene.start("Level", { id: q.get("level") });
    else this.scene.start("Title");
  }
}
