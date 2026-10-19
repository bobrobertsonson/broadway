# StackFX

Vocal doubler for screamed and harsh vocals. It turns one performance into 2 to 4 extra takes
that differ in noise texture and micro-timing, not pitch.

## Build (macOS)

Needs the Xcode command line tools and CMake 3.22+. JUCE 8.0.9 is fetched automatically.

```sh
cd StackFX
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release -j8
```

Outputs (universal arm64 + x86_64):

- `build/StackFX_artefacts/Release/AU/StackFX.component`
- `build/StackFX_artefacts/Release/VST3/StackFX.vst3`
- `build/StackFX_artefacts/Release/Standalone/StackFX.app`
- `build/stackfx_render_artefacts/Release/stackfx_render`

## Install and validate

```sh
mkdir -p ~/Library/Audio/Plug-Ins/Components ~/Library/Audio/Plug-Ins/VST3
cp -R build/StackFX_artefacts/Release/AU/StackFX.component ~/Library/Audio/Plug-Ins/Components/
cp -R build/StackFX_artefacts/Release/VST3/StackFX.vst3   ~/Library/Audio/Plug-Ins/VST3/
killall -9 AudioComponentRegistrar 2>/dev/null   # make macOS rescan AUs
auval -v aufx Stk1 Stfx
```

## Offline render

```sh
R=build/stackfx_render_artefacts/Release/stackfx_render
$R vocal.wav out_you.wav
$R vocal.wav out_someone_else.wav --character 100
$R vocal.wav out_quad.wav --takes 4
$R vocal.wav out_reroll.wav --seed 7
$R vocal.wav sweep_test.wav --sweep        # stress test: every control moves during the render
# flags: --takes 2-4 --tightness --character --texture --rasp --dynamics --pitchdrift --room
#        --width --mix (all 0-100), --output dB (-24..12), --seed 1-100
```

Output is stereo 32-bit float WAV, latency-compensated so it lines up with the input. Renders are
deterministic for a given Seed. The renderer warns when peaks exceed 0 dBFS.

## Controls

| Control     | Default | What it does |
|-------------|---------|--------------|
| Takes       | 2       | 2 = wide pair, 3 = pair + centre, 4 = quad (two per side) |
| Tightness   | 40 %    | Timing warp: 100 % = locked to the lead, 0 % = up to +-40 ms early or late, changing at syllable rate |
| Character   | 0 %     | 0 = you (takes a few cents apart), 100 = someone else (own vocal-tract size and register, up to -1.5/+1.2 semitones) |
| Texture     | 100 %   | Fresh noise grain per take between the tonal peaks |
| Rasp        | 50 %    | How differently raspy/clean the takes are (level-neutral). A raspier take carries less pitch |
| Dynamics    | 50 %    | How differently each take leans into syllables, with effort brightness |
| Pitch Drift | 30 %    | Slow pitch wander per take (up to +-20 cents) |
| Room        | 50 %    | Each take's own early reflections, like a different mic position |
| Width       | 100 %   | Stereo spread of the takes. The lead stays centred |
| Mix         | 50 %    | 0-50 %: stack fades in under a full-level lead. 50-100 %: lead fades out |
| Output      | 0 dB    | Output trim. The full stack at Mix 50 can peak a few dB above the lead |
| Seed        | 1       | Re-roll: a different random performance with the same settings |

## How it works

Each take is resynthesised from the lead's STFT (1024, hop 256, Hann):

- Timing: it reads the lead at its own warped time (+-40 ms max, speed limited to +-15 %), pitch kept
  by a phase vocoder. Takes can land ahead of the lead, which is why there is lookahead latency.
- Identity: the spectral envelope (cepstrum, ~1.25 ms lifter) and the harmonics are moved separately,
  so vocal-tract size and register are independent.
- Texture: bins that are not tonal peaks get a fresh noise realisation each frame.
- Performance: per-take rasp balance, syllable-rate dynamics with effort brightness, slow level ride,
  fixed tone tilt, gliding phase offsets.
- Attacks: spectral-flux onsets reset each take's phase to the lead's, so attacks stay sharp.
- Output stage per take: slow (~3 s) level match to the lead, soft tanh ceiling near the lead's
  peak level, four sparse early reflections, constant-power pan.

Latency: 1024 + lookahead (about 75 ms at 48 kHz), reported to the host.
CPU: about 13x real time on one core for 4 takes (measured in a Linux container).
