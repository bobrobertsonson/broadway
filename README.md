# StackFX

Vocal doubler for screamed and harsh vocals. It turns one performance into 2 to 4 extra takes
that differ in noise texture and micro-timing, not pitch.

## Build (macOS)

Needs the Xcode command line tools and CMake 3.22+. JUCE 8.0.9 is fetched automatically.

```sh
cd StackFX   # this repo
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

## Self test

```sh
./build/stackfx_selftest_artefacts/Release/stackfx_selftest
```

Loads the real plugin processor like a host and checks presets, Link, state save/restore, mono input
and irregular block sizes. Run it after every change.

## Offline render

```sh
R=build/stackfx_render_artefacts/Release/stackfx_render
$R vocal.wav out.wav                                   # defaults
$R vocal.wav out.wav --character 100                   # every take "someone else"
$R vocal.wav out.wav --takes 4 --take3-char 100 --take4-char 100   # two of you, two others
$R vocal.wav out.wav --voice "deep growler" --character 100
$R vocal.wav out.wav --take2-voice gravel --take2-char 80
$R vocal.wav out.wav --lead-mute 1                     # backing layer only
$R vocal.wav out.wav --stems                           # also out_lead.wav, out_takeA.wav ...
$R vocal.wav out.wav --sweep                           # stress test: every control moves
```

Run it with no arguments for the full flag list. Output is stereo 32-bit float WAV, latency-compensated
so it lines up with the input. Renders are deterministic for given seeds, and stems sum exactly to the
mix. The renderer warns when peaks exceed 0 dBFS.

## Controls

| Control     | Default | What it does |
|-------------|---------|--------------|
| Takes       | 2       | Number of takes (A-D) |
| Tightness   | 40 %    | Timing warp: 100 % = locked to the lead, 0 % = up to +-40 ms early or late, changing at syllable rate |
| Texture     | 100 %   | Fresh noise grain per take between the tonal peaks |
| Rasp        | 50 %    | How differently raspy/clean the takes are (level-neutral). A raspier take carries less pitch |
| Dynamics    | 50 %    | How differently each take leans into syllables, with effort brightness |
| Pitch Drift | 30 %    | Slow pitch wander per take (up to +-20 cents) |
| Room        | 50 %    | Each take's own early reflections, like a different mic position |
| Image Lock  | 75 %    | How much paired takes (A/B, C/D) share their level movement. Higher = steadier stereo image; 0 = fully independent sides (wobbles left-right) |
| Width       | 100 %   | Scales every take's pan. The lead stays centred |
| Mix         | 50 %    | 0-50 %: stack fades in under a full-level lead. 50-100 %: lead fades out |
| Seed (all)  | 1       | Re-roll every take |
| Take A-D: Level, Pan, Voice, Character, Seed, Mute, Solo | 0 dB; A -100, B 100, C -60, D 60; Auto; 0 %; 1/102/203/304 | Per take. Voice picks who "someone else" is; Character blends from you (0) to that voice (100). Seed re-rolls just that take |
| Link        | off     | B follows A and D follows C (same level, mirrored pan) |
| Lead Mute / Solo | off | Lead mute gives a backing-only layer. Any solo plays only the soloed sources |
| Takes De-ess | 0 %    | Pulls down 3.5 kHz+ on takes when they turn sibilant (adaptive, fast attack, ~30 ms release) |
| Takes Low / High Cut | 80 Hz / off | 12 dB/octave filters on the stack |
| Takes Space | 0 %     | Ambience on the stack only. Subtle: 100 % adds about 1.5 dB |
| Takes Gate  | off     | Takes play only while the lead's peaks are above this. Set it above breath peaks |
| Quality     | Normal  | Normal (hop 256), High (hop 128, ~1.7x CPU), Auto (High when bouncing). Same latency and same performance in all three; switching restarts the engine (a short dropout) |
| Input / Output | 0 dB | Trims. The full stack at Mix 50 can peak a few dB above the lead |

### Voices

| Voice | Vocal tract | Register | Colour |
|-------|-------------|----------|--------|
| Auto | per take: A bigger, B smaller, C slightly bigger, D slightly smaller | -1.5 / +1.2 / -0.6 / +0.7 st | - |
| Bigger | -12 % | -1.5 st | - |
| Smaller | +12 % | +1.2 st | - |
| Deep Growler | -20 % | -4 st | darker, more body, raspier |
| High Shrieker | +18 % | +5 st | brighter, thinner, raspier |
| Gravel | -3 % | -0.6 st | much raspier |
| Airy | +6 % | +0.9 st | breathier, brighter, less body |
| Nasal | +6 % | +0.4 st | nasal resonance around 1.1 kHz |
| Chesty | -8 % | -0.9 st | more low-mid body, darker |
| Thin | +10 % | +0.6 st | lean, brighter |
| Monster | -30 % | -7 st | sub-octave, ~40 Hz growl flutter, drive, dark |
| Robot | - | monotone ~140 Hz | metallic comb, 30 Hz ring mod, cleaner |
| Alien | +30 % | +3 st | +80 Hz inharmonic shift, 6 Hz pitch wobble, nasal |
| Child | +25 % | +12 st | lighter, brighter |

Switching voices glides (~50 ms) instead of jumping.

Factory presets: Default, Tight Double, Wide Quad, Someone Else, You + Someone Else, Gang Vocal,
Growl Section, Shriek Section, Backing Layer Only.

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
- De-esser: per take, in the spectral domain.
- Output stage per take: slow (~3 s) level match to the lead, soft tanh ceiling near the lead's
  peak level, four sparse early reflections, level, constant-power pan.
- Stack bus: gate (looks ahead and holds for the earliest and latest take), low/high cut biquads,
  ambience (juce::Reverb).

Latency: 1024 + lookahead (about 75 ms at 48 kHz), reported to the host.
CPU (4 takes, one core, Linux container): Normal about 15x real time, High about 9x.

Known: Texture fills the gaps between harmonics with noise at the frame's average noise level, so on
clearly pitched material the takes are noisier than the lead (a 23 dB tone-to-noise test signal comes
out around 5 dB). On noisy screams this matters little.
