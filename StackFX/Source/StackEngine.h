#pragma once
#include <juce_dsp/juce_dsp.h>
#include <array>
#include <vector>

// All values normalised: percentages are 0..1.
struct StackParams
{
    int   takes     = 2;     // 2..4
    float tightness = 0.7f;
    float variation = 0.5f;
    float width     = 0.8f;
    float mix       = 0.5f;
};

// Slow smoothed random signal in [-1, 1]: picks a new random target every
// few seconds and glides to it through two one-pole lowpasses (well under 1 Hz).
class SmoothRandom
{
public:
    void prepare (double sampleRate, juce::int64 seed, float minHoldSec, float maxHoldSec, float smoothSec);
    float next();
    float current() const { return y2; }

private:
    juce::Random rng;
    double sr = 44100.0;
    float minHold = 1.0f, maxHold = 3.0f;
    float coeff = 0.0f, target = 0.0f, y1 = 0.0f, y2 = 0.0f;
    int samplesLeft = 0;
};

// The full doubler. Used by both the plugin and stackfx_render so they sound identical.
class StackEngine
{
public:
    static constexpr int maxTakes = 4;
    static constexpr int fftOrder = 10;
    static constexpr int fftSize  = 1 << fftOrder;   // 1024
    static constexpr int hopSize  = fftSize / 4;     // 256
    static constexpr int numBins  = fftSize / 2 + 1;

    StackEngine();

    void prepare (double sampleRate, int maxBlockSize);
    void reset();
    void setParameters (const StackParams& p);

    // in: 1 or 2 channels (summed to mono). outL/outR may alias in[0]/in[1].
    void process (const float* const* in, int numIn, float* outL, float* outR, int numSamples);

    static constexpr int getLatencySamples() { return fftSize; }

private:
    void processFrame();
    float detectOnset (float x);

    struct Take
    {
        juce::Random phaseRng;
        std::array<float, fftSize> ola {};      // overlap-add accumulator
        std::array<float, hopSize> ready {};    // finished output for the current hop
        juce::SmoothedValue<float> active;      // 0/1 fade when Takes changes

        juce::dsp::DelayLine<float, juce::dsp::DelayLineInterpolationTypes::Lagrange3rd> delay { 4096 };
        SmoothRandom drift;
        float basePos = 0.5f;                   // where in the timing range this take sits
        float delaySamples = 0.0f;              // current (slew-limited) delay

        juce::dsp::IIR::Filter<float> shelf;    // fixed random tilt
        float drive = 1.5f;                     // tanh saturation drive

        SmoothRandom wobble;                    // slow +-1.5 dB level ride
        juce::SmoothedValue<float> pan;         // -1..1 before Width, glides when Takes changes
    };

    float targetDelaySamples (const Take& t, float tight) const;
    static float panPosition (int take, int numTakes);

    double sampleRate = 44100.0;
    StackParams target;

    juce::SmoothedValue<float> tightness, variation, width, mix, stackNorm;

    // STFT
    juce::dsp::FFT fft { fftOrder };
    std::array<float, fftSize> window {};
    std::array<float, 101> variationGain {};        // level make-up for incoherent overlap-add
    std::array<float, fftSize> inFrame {};          // last fftSize input samples
    std::array<float, 2 * fftSize> spectrum {};
    std::array<float, 2 * fftSize> work {};
    int hopCounter = 0;
    float frameVariation = 0.0f;                    // Variation sampled at the hop

    std::array<Take, maxTakes> takes;

    // Transient protection: onset detector on the input
    float envFast = 0.0f, envSlow = 0.0f;
    float fastAtt = 0.0f, fastRel = 0.0f, slowAtt = 0.0f, slowRel = 0.0f, protectRel = 0.0f;
    float protect = 0.0f;                           // 1 right after an onset, decays to 0
    int protectHold = 0, protectHoldLen = 0;
    float hopProtectMax = 0.0f;
    std::array<float, fftSize / hopSize> hopProtect {};   // per-hop max over the frame span
    int hopProtectPos = 0;
    float frameProtect = 0.0f;                      // protection for the frame now being output

    float maxDelaySlew = 0.0f;                      // samples of delay change per sample

    // Dry lead delayed by the STFT latency so it stays aligned with the stack
    std::array<float, fftSize> dryDelay {};
    int dryPos = 0;
};
