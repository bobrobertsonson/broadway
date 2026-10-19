#pragma once
#include <juce_dsp/juce_dsp.h>
#include <array>
#include <vector>

// All amounts normalised 0..1 unless noted.
struct StackParams
{
    int   takes      = 2;     // 2..4
    float tightness  = 0.4f;  // timing warp: 1 = locked to the lead, 0 = +-40 ms
    float character  = 0.0f;  // 0 = you, 1 = someone else (vocal-tract size + register)
    float texture    = 1.0f;  // fresh noise grain per take
    float rasp       = 0.5f;  // how differently raspy/clean the takes are
    float dynamics   = 0.5f;  // how differently each take leans into syllables
    float pitchDrift = 0.3f;  // how much each take's pitch wanders
    float room       = 0.5f;  // each take's own early reflections
    float width      = 1.0f;
    float mix        = 0.5f;  // 0..0.5 fades the stack in under the lead, 0.5..1 fades the lead out
    float outputDb   = 0.0f;  // dB
    int   seed       = 1;     // re-roll the random performance
};

// Slow smoothed random signal in [-1, 1]: picks a new random target every few
// hold-times and glides to it through two one-pole lowpasses. Clocked at whatever
// rate prepare() is given (per sample or per STFT frame).
class SmoothRandom
{
public:
    void prepare (double rate, juce::int64 seed, float minHoldSec, float maxHoldSec, float smoothSec);
    void reseed (juce::int64 seed) { rng.setSeed (seed); samplesLeft = 0; }   // keeps gliding, no jump
    float next();

private:
    juce::Random rng;
    double sr = 44100.0;
    float minHold = 1.0f, maxHold = 3.0f;
    float coeff = 0.0f, target = 0.0f, y1 = 0.0f, y2 = 0.0f;
    int samplesLeft = 0;
};

// The full engine, shared by the plugin and stackfx_render.
//
// Each take is resynthesised from the lead's STFT: it reads the spectrum at its own warped time
// (syllable-rate timing, pitch kept by a phase vocoder), with its own vocal-tract size and register,
// fresh noise grain between the tonal peaks, its own rasp balance, dynamics and room.
class StackEngine
{
public:
    static constexpr int maxTakes = 4;
    static constexpr int fftOrder = 10;
    static constexpr int fftSize  = 1 << fftOrder;   // 1024
    static constexpr int hopSize  = fftSize / 4;     // 256
    static constexpr int numBins  = fftSize / 2 + 1;
    static constexpr float maxWarpMs = 40.0f;

    StackEngine();

    void prepare (double sampleRate, int maxBlockSize);
    void reset();
    void setParameters (const StackParams& p);

    // in: 1 or 2 channels (summed to mono). outL/outR may alias in[0]/in[1].
    void process (const float* const* in, int numIn, float* outL, float* outR, int numSamples);

    // Valid after prepare(): STFT + lookahead so takes can land ahead of the lead.
    int getLatencySamples() const { return fftSize + lookaheadFrames * hopSize; }

private:
    using Spectrum = std::array<float, numBins>;

    struct Frame                      // one analysed input frame, kept in a ring
    {
        Spectrum env {}, fine {}, phase {};   // log envelope, log fine structure, phase
        bool onset = false;
    };

    struct Take
    {
        juce::Random rng;
        SmoothRandom warp, gain, dyn, formant, pitch;
        float warpFrames = 0.0f;              // current (speed-limited) warp; + = late
        Spectrum phi {}, phaseOff {}, phaseTgt {}, tilt {};
        bool phaseValid = false;
        float raspUnit = 0.0f;                // -1..1, scaled by Rasp

        std::array<float, fftSize> ola {};
        std::array<float, hopSize> ready {};

        float powFollow = 0.0f;               // slow power of this take, for level matching to the lead

        std::vector<float> roomBuf;           // early reflections
        int roomPos = 0;
        std::array<int, 4> tapDelay {};
        std::array<float, 4> tapGain {};

        juce::SmoothedValue<float> active, pan;
    };

    void analyseFrame();
    void synthesiseFrame (Take& t, int takeIndex, int frameIndex);
    void seedTakes (bool resetState);
    bool detectOnset (const Spectrum& logMag);
    static float panPosition (int take, int numTakes);
    Frame& frameAt (int index) { return ring[(size_t) (((index % ringSize) + ringSize) % ringSize)]; }

    double sampleRate = 44100.0;
    StackParams target;
    int currentSeed = 1;

    // Frame-rate parameter smoothing (one-pole, ~50 ms)
    float frameSmooth = 0.0f;
    float sTight = 0.4f, sChar = 0.0f, sTexture = 1.0f, sRasp = 0.5f, sDyn = 0.5f, sPitch = 0.3f, sRoom = 0.5f;
    juce::SmoothedValue<float> width, mix, outGain, stackNorm;

    // Analysis
    juce::dsp::FFT fft { fftOrder };
    std::array<float, fftSize> window {};
    std::array<float, fftSize> inFrame {};
    std::array<float, 2 * fftSize> work {};
    Spectrum omega {};                        // expected phase advance per hop, per bin
    int lifterLen = 60;
    std::vector<Frame> ring;
    int ringSize = 0, lookaheadFrames = 0, newestFrame = -1;
    float maxWarpFrames = 0.0f, warpSpeedLimit = 0.15f;
    float fluxMean = 0.0f, fluxVar = 0.0f, fluxCoef = 0.0f;
    Spectrum prevLogMag {};
    int hopCounter = 0;

    std::array<Take, maxTakes> takes;

    // Lead level followers: slow (level matching) and fast (saturation ceiling)
    float dryPowSlow = 0.0f, dryPowFast = 0.0f, slowCoef = 0.0f, fastCoef = 0.0f;

    // Dry lead delayed by the full latency
    std::vector<float> dryDelay;
    int dryPos = 0;
};
