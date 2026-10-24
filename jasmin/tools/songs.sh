#!/bin/sh
# Rebuilds every real song in src/songs/ from Andrew's MIDI files, with the exact
# part choices and cuts used in the game. The MIDIs are not in the repo.
# usage: sh tools/songs.sh <folder with the .mid files>
# (file names: boom bzrp53 cestlavie daddycool helicopter lefreak new-song rasputin ride scatman)
set -e
# Le Freak and C'est La Vie get --gain: their parts are sparser, so they played quieter than the rest.
M="${1:?folder with the MIDI files}"
cd "$(dirname "$0")/.."
c() { node tools/midi2song.mjs "$M/$1.mid" "$@" | head -1; }

c helicopter --title "Helicopter" --lead 2 --harm 1 --harm-shift -12 --bass 4
c boom --title "Boom, Boom, Boom, Boom!!" --lead 3,12 --harm 8,4 --harm-shift -12 --bass 1 --harm-vol 0.3
# Vocal line with the clean guitar filling its gaps (the guitar used to double it as harmony).
c new-song --title "New Song" --lead 5,3 --harm 4 --bass 1
# Starts where the groove kicks in; no bass-only intro, no drums-only outro. Stabs an octave under the tune.
c ride --title "Ride On Time" --lead 11,6 --harm 3,4 --harm-shift -12 --bass 1 --harm-vol 0.22 --bars 24-158 --cut 1-5,116-135
c bzrp53 --title "Shakira: Bzrp Music Sessions, Vol. 53" --lead 1 --bass 2 --no-harm --beat house
c daddycool --title "Daddy Cool" --lead 1,3 --lead-shift 12 --harm 5 --harm-shift -12 --bass 7 --bars 8-108
c rasputin --title "Rasputin" --lead 1,3 --harm 4 --bass 7
# The MIDI has no melody for the scat verse (bass and drums only): cut from the loop.
c scatman --title "Scatman (Ski-Ba-Bop-Ba-Dop-Bop)" --lead 4,3 --harm 2 --bass 6 --cut 19-42
c lefreak --title "Le Freak" --lead 4,6,5,7 --harm 3 --bass 2 --harm-vol 0.42 --harm-wave pulse25 --gain 1.4
c cestlavie --title "C'est La Vie" --lead 13,12 --harm 2 --bass 1 --gain 1.18
