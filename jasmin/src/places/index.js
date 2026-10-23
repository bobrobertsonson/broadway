// Place modules: each city's own scenery, set pieces and mechanics, kept out of Level.js.
// A map opts in with `place: "<name>"` in src/maps.js. A place is a class:
//
//   constructor(level)   make textures (skip keys that exist), set up state
//   markers              { char: (wx, wy, col, row) => {} } for map characters only this
//                        place understands (wx, wy = bottom-center of the tile, in pixels)
//   create()             optional, after every marker is placed
//   update(dt)           optional, every frame while the level runs (check level.mode)
//
// Markers are looked up only after the shared legend in maps.js, so a place can't
// override a shared character, and two places may reuse the same character.

import { London } from "./london.js";
import { Minneapolis } from "./minneapolis.js";
import { Chicago } from "./chicago.js";
import { Chinatown } from "./chinatown.js";
import { Southamerica } from "./southamerica.js";
import { Brooklyn } from "./brooklyn.js";
import { Building } from "./building.js";

export const PLACES = { london: London, minneapolis: Minneapolis, chicago: Chicago, chinatown: Chinatown, southamerica: Southamerica, brooklyn: Brooklyn, building: Building };
