// Content (levels.json) and saved progress.
import { t, worldOutfit } from "./content.js";

const SAVE_KEY = "jg-save-v2";

export const game = {
  content: null,   // levels.json
  outfits: {},     // name -> palette override
  save: null,
};

const DEFAULT_SAVE = { done: [], outfit: "black", outfitsUnlocked: ["black"], lastLevel: null, world9: "", beaten: false };

export function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    game.save = { ...DEFAULT_SAVE, ...(s || {}) };
  } catch {
    game.save = { ...DEFAULT_SAVE };
  }
  try { game.save.world9 = localStorage.getItem("jg-world9") || game.save.world9; } catch {}
  return game.save;
}

export function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game.save)); } catch {}
}

// Flat list of levels in play order, each with its world.
export function allLevels() {
  const out = [];
  for (const w of game.content.worlds) for (const l of w.levels) out.push({ world: w, level: l });
  return out;
}

export function findLevel(id) {
  return allLevels().find((e) => e.level.id === id);
}

export function nextLevelId(id) {
  const list = allLevels();
  const i = list.findIndex((e) => e.level.id === id);
  return list[i + 1]?.level.id ?? null;
}

export function isUnlocked(id) {
  const list = allLevels();
  const i = list.findIndex((e) => e.level.id === id);
  if (i <= 0) return true;
  return game.save.done.includes(list[i - 1].level.id);
}

const ORDER = ["andrew", "rupert", "isaac", "aya", "nube"];

// Companions already with Jasmin when a level in this world starts: everyone who
// joined in an earlier world, minus anyone who left in an earlier world.
// (Companions joining in this world arrive mid-level at their map marker.)
export function companionsAtStart(world) {
  const set = new Set();
  for (const w of game.content.worlds) {
    if (w.id >= world.id) break;
    for (const c of w.companionsJoin || []) set.add(c);
    for (const c of w.companionsLeave || []) set.delete(c);
  }
  return ORDER.filter((c) => set.has(c));
}

export function sortCompanions(names) {
  return ORDER.filter((c) => names.includes(c));
}

// Rupert's keepsake charm: once he has left in an earlier world.
export function hasCharm(world) {
  return game.content.worlds.some((w) => w.id < world.id && (w.companionsLeave || []).includes("rupert"));
}

// Outfit unlocked on arrival in a city. Returns its name if newly unlocked.
export function arriveOutfit(world) {
  const o = worldOutfit(world);
  if (!o) return null;
  const isNew = !game.save.outfitsUnlocked.includes(o.name);
  if (isNew) game.save.outfitsUnlocked.push(o.name);
  game.save.outfit = o.name;
  writeSave();
  return isNew ? o.name : null;
}

export function worldTitle(world) {
  return t(world.title, `World ${world.id}`);
}

export { t };
