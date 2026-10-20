#pragma once
#include <juce_dsp/juce_dsp.h>
#include <array>
#include <vector>

// All amounts normalised 0..1 unless noted.
struct TakeParams
{
    float levelDb   = 0.0f;
    float pan       = 0.0f;   // -1..1, before Width
    float character = 0.0f;   // 0 = you, 1 = someone else (vocal-tract size + register)
    int   seed      = 1;      // re-roll just this take
    bool  mute = false, solo = false;
};

struct StackParams
{
    int   takes      = 2;     // 2..4
    float tightness  = 0.4f;  // timing warp: 1 = locked to the lead, 0 = +-40 ms
    float texture    = 1.0f;  // fresh noise grain per take
    float rasp       = 0.5f;  // how differently raspy/clean the takes are
    float dynamics   = 0.5f;  // how differently each take leans into syllables
    float pitchDrift = 0.3f;  // how much each take's pitch wanders
    float room       = 0.5f;  // each take's own early reflections
    float width      = 1.0f;
    float mix        = 0.5f;  // 0..0.5 fades the stack in under the lead, 0.5..1 fades the lead out
    float inputDb    = 0.0f;
    float outputDb   = 0.0f;
    int   seed       = 1;     // re-roll every take

    // Defaults match the plugin's parameter defaults, so renders and the plugin sound the same
    std::array<TakeParams, 4> take {{ { 0.0f, -1.0f, 0.0f, 1 }, { 0.0f, 1.0f, 0.0f, 102 },
                                      { 0.0f, -0.6f, 0.0f, 203 }, { 0.0f, 0.6f, 0.0f, 304 } }};
    bool  link = false;       // B mirrors A (level, opposite pan), D mirrors C
    bool  leadMute = false, leadSolo = false;

    float deEss     = 0.0f;      // sibilance reduction on the takes
    float lowCutHz  = 80.0f;     // stack low cut (<= 20 = off)
    float highCutHz = 20000.0f;  // stack high cut (>= 20000 = off)
    float space     = 0.0f;      // ambience on the stack
    float gateDb    = -80.0f;    // takes play only while the lead is above this (<= -80 = off)

    void setAllCharacters (float c) { for (auto& t : take) t.character = c; }
    // Link: B follows A and D follows C (same level, mirrored pan). Applied by the host side.
    void applyLink()
    {
        if (! link)
            return;
        take[1].levelDb = take[0].levelDb;  take[1].pan = -take[0].pan;
        take[3].levelDb = take[2].levelDb;  take[3].pan = -take[2].pan;
    }
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
    static constexpr int normalHop = fftSize / 4;    // 256 (Normal); High uses 128
    static constexpr int numBins  = fftSize / 2 + 1;
    static constexpr float maxWarpMs = 40.0f;

    StackEngine();

    // High quality: hop 128 instead of 256 (8x overlap). Takes effect at the next prepare().
    // Latency and the random performance (timing, dynamics, pitch, formant) are the same in both.
    void setHighQuality (bool high) { highQuality = high; }
    bool isHighQuality() const { return hop < normalHop; }

    void prepare (double sampleRate, int maxBlockSize);
    void reset();
    void setParameters (const StackParams& p);

    // in: 1 or 2 channels (summed to mono). outL/outR may alias in[0]/in[1].
    void process (const float* const* in, int numIn, float* outL, float* outR, int numSamples);

    // Valid after prepare(): STFT + lookahead so takes can land ahead of the lead.
    int getLatencySamples() const { return fftSize + lookaheadFrames * hop; }

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
        float sChar = 0.0f;                   // smoothed Character
        int seedUsed = 0;                     // (global seed, take seed) combination in use
        float sibMean = 0.0f, dsDb = 0.0f;    // de-esser state
        float cWarp = 0.0f, cGain = 0.0f, cDyn = 0.0f, cFormant = 0.0f, cPitch = 0.0f;   // control-rate values

        std::array<float, fftSize> ola {};
        std::array<float, normalHop> ready {};

        float powFollow = 0.0f;               // slow power of this take, for level matching to the lead

        std::vector<float> roomBuf;           // early reflections
        int roomPos = 0;
        std::array<int, 4> tapDelay {};
        std::array<float, 4> tapGain {};

        juce::SmoothedValue<float> level, pan; // level = active x take level x mute/solo
    };

    void analyseFrame();
    void updateCuts();
    void synthesiseFrame (Take& t, int takeIndex, int frameIndex, bool controlTick);
    void seedTake (int takeIndex, bool resetState);
    void updateTakeTargets();
    bool detectOnset (const Spectrum& logMag);
    void processChunk (const float* const* in, int numIn, float* outL, float* outR, int n);
    Frame& frameAt (int index) { return ring[(size_t) (((index % ringSize) + ringSize) % ringSize)]; }
    int combinedSeed (int k) const { return target.seed * 1009 + target.take[(size_t) k].seed; }

    double sampleRate = 44100.0;
    int maxBlock = 512;
    bool highQuality = false;
    int hop = normalHop, framesPerControl = 1, frameCounter = 0;
    float redrawProb = 0.09f, glide = 0.15f, dsRelease = 0.85f, freshComp = 1.41421356f, olaGain = 1.0f / 1.5f;
    StackParams target;

    // Frame-rate parameter smoothing (one-pole, ~50 ms)
    float frameSmooth = 0.0f;
    float sTight = 0.4f, sTexture = 1.0f, sRasp = 0.5f, sDyn = 0.5f, sPitch = 0.3f, sRoom = 0.5f, sDeEss = 0.0f;
    float sLowCut = 80.0f, sHighCut = 20000.0f;
    juce::SmoothedValue<float> width, mix, inGain, outGain, stackNorm, leadGain;

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

    // Gate: follows the lead slightly ahead (earliest take) and holds past it (latest take)
    float gateEnv = 0.0f, gateGain = 1.0f, gateEnvRel = 0.0f, gateAtt = 0.0f, gateRel = 0.0f;
    int gateHold = 0, gateHoldLen = 0, gateAheadSamples = 0;
    bool gateOpen = true;

    // Stack low/high cut: 2nd-order Butterworth biquads on the stack bus, per channel
    struct Biquad
    {
        float b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0;
        float z1[2] {}, z2[2] {};
        float process (float x, int ch)
        {
            const float y = b0 * x + z1[ch];
            z1[ch] = b1 * x - a1 * y + z2[ch];
            z2[ch] = b2 * x - a2 * y;
            return y;
        }
    };
    Biquad lowCut, highCut;
    bool lowCutOn = true, highCutOn = false;

    // Space: ambience on the stack bus
    juce::Reverb reverb;
    std::vector<float> stackBufL, stackBufR, dryBuf;

    // Dry lead delayed by the full latency
    std::vector<float> dryDelay;
    int dryPos = 0;
};
