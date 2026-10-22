// Content (levels.json) and saved progress.

const SAVE_KEY = "jg-save-v1";

export const game = {
  content: null,   // levels.json
  outfits: {},     // name -> palette override
  save: null,
};

const DEFAULT_SAVE = { done: [], outfit: "black", outfitsUnlocked: ["black"], lastLevel: null };

export function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    game.save = { ...DEFAULT_SAVE, ...(s || {}) };
  } catch {
    game.save = { ...DEFAULT_SAVE };
  }
  return game.save;
}

export function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game.save)); } catch {}
}

export function resetSave() {
  game.save = { ...DEFAULT_SAVE, done: [], outfitsUnlocked: ["black"] };
  writeSave();
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

// Companions present in a world: everyone who joined up to and including it,
// minus anyone who left in an earlier world.
export function companionsFor(world) {
  const worlds = game.content.worlds;
  const set = [];
  for (const w of worlds) {
    if (w.id > world.id) break;
    for (const c of w.companionsJoin || []) if (!set.includes(c)) set.push(c);
    if (w.id < world.id) for (const c of w.companionsLeave || []) set.splice(set.indexOf(c) >>> 0, set.includes(c) ? 1 : 0);
  }
  const order = ["andrew", "rabbit", "son", "daughter"];
  return set.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

// The rabbit's keepsake charm: once he has left in an earlier world.
export function hasCharm(world) {
  return game.content.worlds.some((w) => w.id < world.id && (w.companionsLeave || []).includes("rabbit"));
}

export function displayName(who) {
  const n = game.content.names?.[who];
  return n || who;
}

export function text(s) {
  return s && String(s).trim() ? s : "TODO: caption";
}
