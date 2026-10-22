// Reads levels.json. Captions may be plain strings or { text, draft }.
// Missing text shows as a visible TODO so nothing personal is ever invented.

export function t(v, fallback = "TODO") {
  if (v == null) return fallback;
  if (typeof v === "string") return v.trim() ? v : fallback;
  if (typeof v === "object" && "text" in v) return t(v.text, fallback);
  return fallback;
}

export function has(v) {
  return v != null && t(v, "") !== "";
}

// Display names come from the spec (CLAUDE.md), not personal content.
export const NAMES = { jasmin: "Jasmin", andrew: "Andrew", rupert: "Rupert", isaac: "Isaac", aya: "Aya", nube: "Nube" };

// Outfit palettes picked by Claude Code (levels.json says "Claude Code picks a palette
// that fits the city; Andrew can change it"). A palette object in levels.json wins.
export const DEFAULT_OUTFIT_PALETTES = {
  1: { C: "#7a2430", c: "#4f1620", P: "#d9b45a", K: "#3b2a5c" }, // London: oxblood with mustard belt
  2: { C: "#e2453a", c: "#b02e27", P: "#f5d342", K: "#3b2a5c" }, // Minneapolis: bright red puffy coat
  3: { C: "#1f8a8a", c: "#146363", P: "#f2b43a", K: "#3b2a5c" }, // Chicago: warm teal
  4: { C: "#a33b5e", c: "#76283f", P: "#e8c26a", K: "#2a1f3d" }, // New York: berry
  5: { C: "#d07a3a", c: "#9a552a", P: "#f5e0a0", K: "#3b2a5c" }, // Travel: terracotta
  6: { C: "#4a2e22", c: "#33201a", P: "#e0a43a", K: "#3b2a5c" }, // Brooklyn: chocolate
};

// { name -> palette } for every outfit a world unlocks.
export function worldOutfit(world) {
  const o = world.outfit;
  if (!o) return null;
  const name = t(o.name, `World ${world.id} look`);
  const palette = o.palette && typeof o.palette === "object" ? o.palette : DEFAULT_OUTFIT_PALETTES[world.id] || {};
  return { name, palette };
}

// Captions for a companion joining mid-level, by marker.
export function joinCaption(level, who) {
  if (who === "andrew") return level.andrewJoinScene?.caption;
  if (who === "rupert") return level.rabbitJoinCaption;
  return level[`${who}JoinCaption`];
}
