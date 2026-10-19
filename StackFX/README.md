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
$R test_scream.wav out_default.wav
$R test_scream.wav out_var0.wav   --variation 0
$R test_scream.wav out_var100.wav --variation 100
# all flags: --takes 2-4 --tightness 0-100 --variation 0-100 --width 0-100 --mix 0-100
```

Output is stereo 24-bit WAV, latency-compensated so it lines up with the input. Renders are
deterministic: each take has a fixed seed.

## Parameters

| Param     | Range   | Default | What it does |
|-----------|---------|---------|--------------|
| Takes     | 2-4     | 2       | Number of doubled takes |
| Tightness | 0-100 % | 70      | Shrinks the 5-25 ms timing range (100 % = all takes at 5 ms) |
| Variation | 0-100 % | 50      | Blends each bin's phase toward random (noise-texture difference) |
| Width     | 0-100 % | 80      | Stereo spread of the takes. The dry lead stays centered |
| Mix       | 0-100 % | 50      | 0-50 %: stack fades in under a full-level lead. 50-100 %: lead fades out |

## Signal flow (per take)

STFT phase decorrelation (1024 / hop 256, Hann analysis + synthesis, level-compensated)
-> drifting interpolated delay -> fixed shelf tilt -> tanh saturation -> gain wobble -> pan.
An onset detector on the input cuts phase randomization by 85 % and freezes timing drift
around attacks. Latency: 1024 samples, reported to the host.
