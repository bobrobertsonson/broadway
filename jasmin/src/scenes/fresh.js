// Phaser reuses one scene object for every visit, so per-visit state (flags like
// `starting` or `leaving`, counters, references to destroyed objects) would carry
// over into the next visit. Call fresh(this) at the top of init(): the first call
// records the scene's own keys (Phaser's systems and plugins), later calls delete
// everything else, so each visit starts clean.
export function fresh(scene) {
  if (!scene.__baseKeys) {
    scene.__baseKeys = new Set([...Object.keys(scene), "__baseKeys"]);
    return;
  }
  for (const k of Object.keys(scene)) if (!scene.__baseKeys.has(k)) delete scene[k];
}
