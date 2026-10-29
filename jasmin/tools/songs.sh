#!/bin/sh
# Rebuilds every real song in src/songs/ from Andrew's MIDI files, with the exact
# part choices and cuts used in the game. The MIDIs are not in the repo.
# usage: sh tools/songs.sh <folder with the .mid files>
# (file names: battlefield boom bzrp53 cestlavie daddycool helicopter lefreak new-song rasputin ride scatman thunderstruck wannabe whatelse whatislove)
set -e
# Le Freak and C'est La Vie get --gain: their parts are sparser, so they played quieter than the rest.
M="${1:?folder with the MIDI files}"
cd "$(dirname "$0")/.."
c() { node tools/midi2song.mjs "$M/$1.mid" "$@" | head -1; }

# The guitar fills the vocal gaps (two 8-bar guitar breaks), and doubles an octave down as harmony.
c helicopter --title "Helicopter" --lead 2,1 --harm 1 --harm-shift -12 --bass 4
c boom --title "Boom, Boom, Boom, Boom!!" --lead 3,12 --harm 8,4 --harm-shift -12 --bass 1 --harm-vol 0.3
# Vocal line with the clean guitar filling its gaps (the guitar used to double it as harmony).
c new-song --title "New Song" --lead 5,3 --harm 4 --bass 1
# Starts where the groove kicks in; no bass-only intro, no drums-only outro. Stabs an octave under the tune.
c ride --title "Ride On Time" --lead 11,6 --harm 3,4 --harm-shift -12 --bass 1 --harm-vol 0.22 --bars 24-158 --cut 1-5,116-135
c bzrp53 --title "Shakira: Bzrp Music Sessions, Vol. 53" --lead 1 --bass 2 --no-harm --beat house
c daddycool --title "Daddy Cool" --lead 1,3 --lead-shift 12 --harm 5 --harm-shift -12 --bass 7 --bars 8-108
c rasputin --title "Rasputin" --lead 1,3 --harm 4 --bass 7
# The MIDI has no melody for the scat verse (bass and drums only): cut from the loop. 56-60 and 70-84: Andrew's cuts (song cutter page).
c scatman --title "Scatman (Ski-Ba-Bop-Ba-Dop-Bop)" --lead 4,3 --harm 2 --bass 6 --cut 19-42,56-60,70-84
c lefreak --title "Le Freak" --lead 4,6,5,7 --harm 3 --bass 2 --harm-vol 0.42 --harm-wave pulse25 --gain 1.4
c cestlavie --title "C'est La Vie" --lead 13,12,15 --harm 2 --harm-shift -12 --bass 1 --gain 1.18
# Minneapolis. Two parts only (melody, pulsing chords): the chords give harmony (top) and bass (bottom).
c whatelse --title "What Else Is There?" --lead 2 --lead-shift 12 --harm 1 --bass 1 --bass-shift -12 --beat house
# Thunderstruck: the vocal leads, the famous guitar riff fills its gaps and runs an octave under it as harmony.
c thunderstruck --title "Thunderstruck" --lead 4,11 --harm 11 --harm-shift -12 --bass 1 --gain 1.15
c wannabe --title "Wannabe" --lead 1,8,7,3 --harm 4 --bass 6 --gain 1.35
# A held note in the MIDI never ends (it made the song 1,500 bars): stop at bar 246. Cut the drum-only breaks.
c battlefield --title "Love Is a Battlefield" --lead 4,6,1,5,3 --harm 11 --bass 2 --bars 1-246 --cut 48-54,116-122,184-198
# The vocal leads with the synth hooks filling in; the iconic bass-synth riff as harmony.
c whatislove --title "What Is Love" --lead 1,7,5,9 --harm 3 --bass 4
