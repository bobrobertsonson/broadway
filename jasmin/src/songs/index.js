// Real songs arranged as chiptunes, made from MIDI files with tools/midi2song.mjs.
// Each module default-exports { title, bpm, loopBeats, voices }, where a voice is
//   { role, wave, vol, notes: [[beat, beats, midi], ...] }  (wave: pulse12 pulse25 square triangle sawtooth)
//   or { role: "drums", vol, hits: [[beat, "k"|"s"|"h"|"m"], ...] }
// Register a song here, then use its key as a map's `music` (src/maps.js) or any startMusic() call.

import newSong from "./new-song.js";
import bzrp53 from "./bzrp53.js";
import helicopter from "./helicopter.js";
import boom from "./boom.js";
import ride from "./ride.js";
import rasputin from "./rasputin.js";
import daddycool from "./daddycool.js";
import scatman from "./scatman.js";
import lefreak from "./lefreak.js";
import cestlavie from "./cestlavie.js"; import whatelse from "./whatelse.js";

export const SONGS = {
  // Chicago. Warpaint, from a MIDI Andrew found; vocal line as the lead, clean guitar as harmony.
  "new-song": newSong,
  // Shakira and Bizarrap. Melody and bass from Andrew's MIDI, plus a generated house beat
  // (the MIDI has no drums; Andrew picked it over a hip hop beat). South America.
  bzrp53,
  // London. Bloc Party, from Andrew's MIDI (no vocal part): guitar 2's riff leads, guitar 1 harmony.
  helicopter,
  // Meeting at the lake and Minneapolis at night. Vengaboys, from Andrew's MIDI: the vocal line
  // leads, the chorus synth hook fills its gaps, synth-brass riff as harmony.
  boom,
  // NYC Chinatown, arriving in New York. Black Box, from Andrew's MIDI: the vocal line leads,
  // the house piano riff as harmony.
  ride,
  // The rest from Andrew's MIDIs, in the slots Claude suggested (swap freely):
  rasputin,   // fire boss (Boney M.)
  daddycool,  // Brooklyn, Chocolate Factory (Boney M.)
  scatman,    // title screen and world map (Scatman John)
  lefreak,    // credits (CHIC)
  cestlavie,  // ending: inventory, fog, naming World 9 (B*Witched)
  // Minneapolis before the lake (Andrew's pick). Röyksopp; vocal line leads, the pulsing
  // chord part splits into harmony (top) and bass (bottom), plus a generated house beat.
  whatelse,
};

// The post-game jukebox, in story order. Real songs first, then the game's own
// tracks that still play somewhere. `where` is shown on screen after "Plays in the game:".
export const JUKEBOX = [
  { key: "scatman", artist: "Scatman John", where: "the title screen and the map" },
  { key: "credits", title: "Nairobi", artist: "Original", where: "the very beginning" },
  { key: "helicopter", artist: "Bloc Party", where: "London" },
  { key: "whatelse", artist: "Röyksopp", where: "Minneapolis, before the lake" },
  { key: "boom", artist: "Vengaboys", where: "meeting at the lake" },
  { key: "new-song", artist: "Warpaint", where: "Chicago" },
  { key: "ride", artist: "Black Box", where: "New York, Chinatown" },
  { key: "sendoff", title: "Send-off", artist: "Original", where: "saying goodbye to Rupert" },
  { key: "bzrp53", title: "Bzrp Music Sessions, Vol. 53", artist: "Bizarrap and Shakira", where: "South America" },
  { key: "proposal", title: "Candlelight", artist: "Original", where: "Argentina" },
  { key: "daddycool", artist: "Boney M.", where: "Brooklyn" },
  { key: "building", title: "The New Building", artist: "Original", where: "the new building" },
  { key: "rasputin", artist: "Boney M.", where: "the fire boss" },
  { key: "cestlavie", artist: "B*Witched", where: "the ending" },
  { key: "lefreak", artist: "CHIC", where: "the credits" },
];
