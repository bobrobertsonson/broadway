import { game, loadSave } from "../state.js";
import { buildCharacterArt, collectOutfits, preloadArtOverrides } from "../art.js";
import { makeEnvironmentTextures } from "../tiles.js";
import { makePropTextures } from "../props.js";

export class Boot extends Phaser.Scene {
  constructor() { super("Boot"); }

  preload() {
    // The single-file build ("Super Jasmin World 3.html") embeds levels.json, since a page
    // opened from Finder (file://) can't fetch it.
    if (window.__LEVELS) this.cache.json.add("content", window.__LEVELS);
    else this.load.json("content", "levels.json");
    preloadArtOverrides(this);
  }

  create() {
    game.content = this.cache.json.get("content");
    game.outfits = collectOutfits(game.content);
    loadSave();
    // Outfits renamed after saves already existed.
    const RENAMED = { "London look": "Double Jeans" };
    game.save.outfitsUnlocked = game.save.outfitsUnlocked.map((n) => RENAMED[n] || n);
    game.save.outfit = RENAMED[game.save.outfit] || game.save.outfit;
    if (!game.outfits[game.save.outfit]) game.save.outfit = "black";
    buildCharacterArt(this, game.outfits);
    makeEnvironmentTextures(this, "day");
    makePropTextures(this);

    this.scene.launch("UI");

    // ?level=2-1 jumps straight into a level (for testing).
    const q = new URLSearchParams(location.search);
    if (q.get("level")) this.scene.start("Level", { id: q.get("level"), map: q.get("map") || undefined });
    else if (q.get("scene")) this.scene.start(q.get("scene"), {});
    else this.scene.start("Title");
  }
}
