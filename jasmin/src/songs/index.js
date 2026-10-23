// Real songs arranged as chiptunes, made from MIDI files with tools/midi2song.mjs.
// Each module default-exports { title, bpm, loopBeats, voices }, where a voice is
//   { role, wave, vol, notes: [[beat, beats, midi], ...] }  (wave: pulse12 pulse25 square triangle sawtooth)
//   or { role: "drums", vol, hits: [[beat, "k"|"s"|"h"|"m"], ...] }
// Register a song here, then use its key as a map's `music` (src/maps.js) or any startMusic() call.

import newSong from "./new-song.js";
import bzrp53 from "./bzrp53.js";
import bzrp53Hiphop from "./bzrp53-hiphop.js";

export const SONGS = {
  // Chicago. Warpaint, from a MIDI Andrew found; vocal line as the lead, clean guitar as harmony.
  "new-song": newSong,
  // Shakira and Bizarrap. Melody and bass from Andrew's MIDI, plus a generated house beat
  // (the MIDI has no drums). Not assigned to a level yet.
  bzrp53,
  // The same song over a half-time hip hop beat.
  "bzrp53-hiphop": bzrp53Hiphop,
};
