// Real songs arranged as chiptunes, made from MIDI files with tools/midi2song.mjs.
// Each module default-exports { title, bpm, loopBeats, voices }, where a voice is
//   { role, wave, vol, notes: [[beat, beats, midi], ...] }  (wave: pulse12 pulse25 square triangle sawtooth)
//   or { role: "drums", vol, hits: [[beat, "k"|"s"|"h"|"m"], ...] }
// Register a song here, then use its key as a map's `music` (src/maps.js) or any startMusic() call.

export const SONGS = {};
