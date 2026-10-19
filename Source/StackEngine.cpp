#include "StackEngine.h"

//==============================================================================
void SmoothRandom::prepare (double sampleRate, juce::int64 seed, float minHoldSec, float maxHoldSec, float smoothSec)
{
    sr = sampleRate;
    rng.setSeed (seed);
    minHold = minHoldSec;
    maxHold = maxHoldSec;
    coeff = (float) std::exp (-1.0 / (smoothSec * sampleRate));
    target = rng.nextFloat() * 2.0f - 1.0f;
    y1 = y2 = target;
    samplesLeft = 0;
}

float SmoothRandom::next()
{
    if (--samplesLeft <= 0)
    {
        target = rng.nextFloat() * 2.0f - 1.0f;
        samplesLeft = (int) ((minHold + rng.nextFloat() * (maxHold - minHold)) * sr);
    }
    y1 = target + coeff * (y1 - target);
    y2 = y1 + coeff * (y2 - y1);
    return y2;
}

//==============================================================================
static constexpr juce::int64 takeSeeds[StackEngine::maxTakes] = { 0x51A7C001, 0x51A7C002, 0x51A7C003, 0x51A7C004 };
static constexpr float takeBasePos[StackEngine::maxTakes]     = { 0.2f, 0.8f, 0.5f, 0.35f };
static constexpr float minDelayMs = 5.0f, delayRangeMs = 20.0f;
static constexpr float delaySlewMsPerSec = 3.0f;   // caps the Doppler pitch shift of drift at ~5 cents

StackEngine::StackEngine()
{
    // Periodic Hann: Hann^2 at 75% overlap sums to a constant 1.5
    for (int i = 0; i < fftSize; ++i)
        window[(size_t) i] = 0.5f - 0.5f * std::cos (juce::MathConstants<float>::twoPi * (float) i / (float) fftSize);

    // Randomised phase overlap-adds incoherently and comes out 6 dB down (Hann^2, 75% overlap).
    // rho = mean cos of the phase change at a given Variation: the coherent part (rho^2) passes at
    // unity, the rest at 1/4 power. Make up the difference so Variation does not change level.
    for (size_t k = 0; k < variationGain.size(); ++k)
    {
        const double v = (double) k / 100.0;
        double rho = 0.0;
        constexpr int steps = 4096;
        for (int j = 0; j < steps; ++j)
        {
            const double th = juce::MathConstants<double>::twoPi * (j + 0.5) / steps;
            const double re = (1.0 - v) + v * std::cos (th), im = v * std::sin (th);
            const double mag = std::sqrt (re * re + im * im);
            rho += mag > 1.0e-12 ? re / mag : 0.0;
        }
        rho /= steps;
        variationGain[k] = (float) (1.0 / std::sqrt (rho * rho + 0.25 * (1.0 - rho * rho)));
    }
}

void StackEngine::prepare (double sr, int maxBlockSize)
{
    sampleRate = sr;
    for (auto* s : { &tightness, &variation, &width, &mix, &stackNorm })
        s->reset (sr, 0.05);
    for (auto& t : takes)
    {
        t.active.reset (sr, 0.05);
        t.pan.reset (sr, 0.05);
    }

    auto coeff = [sr] (double ms) { return (float) std::exp (-1.0 / (ms * 0.001 * sr)); };
    fastAtt = coeff (0.5);  fastRel = coeff (15.0);
    slowAtt = coeff (40.0); slowRel = coeff (120.0);
    protectRel = coeff (15.0);
    protectHoldLen = (int) (0.030 * sr);
    maxDelaySlew = delaySlewMsPerSec * 0.001f;

    const juce::dsp::ProcessSpec spec { sr, (juce::uint32) juce::jmax (1, maxBlockSize), 1 };
    for (int k = 0; k < maxTakes; ++k)
    {
        auto& t = takes[(size_t) k];
        t.delay.setMaximumDelayInSamples ((int) std::ceil ((minDelayMs + delayRangeMs + 5.0f) * 0.001 * sr));
        t.delay.prepare (spec);
        t.basePos = takeBasePos[k];

        // Fixed per-take tone: low (300 Hz) or high (3 kHz) shelf, 1-2 dB up or down, plus its own drive
        juce::Random toneRng (takeSeeds[k] * 13 + 5);
        const bool high = toneRng.nextBool();
        const float db = (1.0f + toneRng.nextFloat()) * (toneRng.nextBool() ? 1.0f : -1.0f);
        const float gain = juce::Decibels::decibelsToGain (db);
        t.shelf.coefficients = high ? juce::dsp::IIR::Coefficients<float>::makeHighShelf (sr, 3000.0, 0.707, gain)
                                    : juce::dsp::IIR::Coefficients<float>::makeLowShelf (sr, 300.0, 0.707, gain);
        t.shelf.prepare (spec);
        t.drive = 1.2f + 0.6f * toneRng.nextFloat();
    }
    reset();
}

void StackEngine::reset()
{
    tightness.setCurrentAndTargetValue (target.tightness);
    variation.setCurrentAndTargetValue (target.variation);
    width.setCurrentAndTargetValue (target.width);
    mix.setCurrentAndTargetValue (target.mix);
    stackNorm.setCurrentAndTargetValue (1.0f / std::sqrt ((float) target.takes));
    frameVariation = target.variation;

    inFrame.fill (0.0f);
    dryDelay.fill (0.0f);
    dryPos = 0;
    hopCounter = 0;

    envFast = envSlow = protect = hopProtectMax = frameProtect = 0.0f;
    protectHold = 0;
    hopProtect.fill (0.0f);
    hopProtectPos = 0;

    for (int k = 0; k < maxTakes; ++k)
    {
        auto& t = takes[(size_t) k];
        t.phaseRng.setSeed (takeSeeds[k]);
        t.ola.fill (0.0f);
        t.ready.fill (0.0f);
        t.active.setCurrentAndTargetValue (k < target.takes ? 1.0f : 0.0f);
        t.pan.setCurrentAndTargetValue (panPosition (k, target.takes));

        t.delay.reset();
        t.shelf.reset();
        t.drift.prepare (sampleRate, takeSeeds[k] * 7 + 1, 2.0f, 5.0f, 0.8f);
        t.wobble.prepare (sampleRate, takeSeeds[k] * 11 + 3, 0.8f, 2.5f, 0.35f);
        t.delaySamples = targetDelaySamples (t, target.tightness);
    }
}

float StackEngine::targetDelaySamples (const Take& t, float tight) const
{
    // Each take sits at its own spot in the range and wanders around it. Tightness shrinks the range.
    const float pos = juce::jlimit (0.0f, 1.0f, t.basePos + 0.3f * t.drift.current());
    const float ms = minDelayMs + delayRangeMs * (1.0f - tight) * pos;
    return ms * 0.001f * (float) sampleRate;
}

void StackEngine::setParameters (const StackParams& p)
{
    target = p;
    target.takes = juce::jlimit (2, maxTakes, p.takes);
    tightness.setTargetValue (juce::jlimit (0.0f, 1.0f, p.tightness));
    variation.setTargetValue (juce::jlimit (0.0f, 1.0f, p.variation));
    width.setTargetValue (juce::jlimit (0.0f, 1.0f, p.width));
    mix.setTargetValue (juce::jlimit (0.0f, 1.0f, p.mix));
    stackNorm.setTargetValue (1.0f / std::sqrt ((float) target.takes));
    for (int k = 0; k < maxTakes; ++k)
    {
        takes[(size_t) k].active.setTargetValue (k < target.takes ? 1.0f : 0.0f);
        takes[(size_t) k].pan.setTargetValue (panPosition (k, target.takes));
    }
}

float StackEngine::panPosition (int take, int numTakes)
{
    // Takes 1/2 always hard left/right; take 3 fills the centre with 3 takes, 3/4 sit inside with 4
    static constexpr float with3[] = { -1.0f, 1.0f, 0.0f, 0.0f };
    static constexpr float with4[] = { -1.0f, 1.0f, -0.4f, 0.4f };
    return numTakes >= 4 ? with4[take] : with3[take];
}

float StackEngine::detectOnset (float x)
{
    const float r = std::abs (x);
    envFast = r + (r > envFast ? fastAtt : fastRel) * (envFast - r);
    envSlow = r + (r > envSlow ? slowAtt : slowRel) * (envSlow - r);

    // Onset: fast envelope jumps 6 dB over the slow one, above about -46 dBFS
    if (envFast > 2.0f * envSlow && envFast > 0.005f)
    {
        protect = 1.0f;
        protectHold = protectHoldLen;
    }
    else if (protectHold > 0)
        --protectHold;
    else
        protect *= protectRel;

    return protect;
}

void StackEngine::processFrame()
{
    // Analysis (shared by all takes)
    for (int i = 0; i < fftSize; ++i)
        spectrum[(size_t) i] = inFrame[(size_t) i] * window[(size_t) i];
    std::fill (spectrum.begin() + fftSize, spectrum.end(), 0.0f);
    fft.performRealOnlyForwardTransform (spectrum.data(), true);

    std::copy (inFrame.begin() + hopSize, inFrame.end(), inFrame.begin());

    const float v = frameVariation;
    const float olaGain = variationGain[(size_t) juce::roundToInt (v * 100.0f)] / 1.5f;

    for (auto& t : takes)
    {
        work = spectrum;

        // Keep magnitude, blend phase toward a fresh random phase. DC and Nyquist stay as-is.
        if (v > 0.0f)
        {
            for (int b = 1; b < numBins - 1; ++b)
            {
                float& re = work[(size_t) (2 * b)];
                float& im = work[(size_t) (2 * b + 1)];
                const float mag = std::sqrt (re * re + im * im);
                const float theta = t.phaseRng.nextFloat() * juce::MathConstants<float>::twoPi;
                if (mag < 1.0e-9f)
                    continue;

                const float cr = (1.0f - v) * re / mag + v * std::cos (theta);
                const float ci = (1.0f - v) * im / mag + v * std::sin (theta);
                const float cm = std::sqrt (cr * cr + ci * ci);
                if (cm < 1.0e-6f)
                {
                    re = mag * std::cos (theta);
                    im = mag * std::sin (theta);
                }
                else
                {
                    re = mag * cr / cm;
                    im = mag * ci / cm;
                }
            }
        }

        fft.performRealOnlyInverseTransform (work.data());

        for (int i = 0; i < fftSize; ++i)
            t.ola[(size_t) i] += work[(size_t) i] * window[(size_t) i] * olaGain;

        std::copy (t.ola.begin(), t.ola.begin() + hopSize, t.ready.begin());
        std::copy (t.ola.begin() + hopSize, t.ola.end(), t.ola.begin());
        std::fill (t.ola.end() - hopSize, t.ola.end(), 0.0f);
    }
}

void StackEngine::process (const float* const* in, int numIn, float* outL, float* outR, int n)
{
    for (int i = 0; i < n; ++i)
    {
        const float x = numIn > 1 ? 0.5f * (in[0][i] + in[1][i]) : in[0][i];

        const float dry = dryDelay[(size_t) dryPos];
        dryDelay[(size_t) dryPos] = x;
        dryPos = (dryPos + 1) % fftSize;

        inFrame[(size_t) (fftSize - hopSize + hopCounter)] = x;
        hopProtectMax = juce::jmax (hopProtectMax, detectOnset (x));

        const float tight = tightness.getNextValue();
        const float w = width.getNextValue();
        const float v = variation.getNextValue();
        const float m = mix.getNextValue();
        const float norm = stackNorm.getNextValue();

        float stackL = 0.0f, stackR = 0.0f;
        // Freeze drift through attacks. frameProtect lines up with the (latency-delayed) audio being output.
        const float slew = maxDelaySlew * (1.0f - frameProtect);
        for (auto& t : takes)
        {
            t.drift.next();
            const float want = targetDelaySamples (t, tight);
            t.delaySamples += juce::jlimit (-slew, slew, want - t.delaySamples);

            t.delay.pushSample (0, t.ready[(size_t) hopCounter]);
            float s = t.delay.popSample (0, t.delaySamples);
            s = t.shelf.processSample (s);
            s = std::tanh (t.drive * s) / t.drive;   // unity gain at low level, soft peaks
            s *= juce::Decibels::decibelsToGain (1.5f * t.wobble.next());

            s *= t.active.getNextValue();

            // Constant-power pan
            const float angle = (t.pan.getNextValue() * w + 1.0f) * juce::MathConstants<float>::pi * 0.25f;
            stackL += s * std::cos (angle);
            stackR += s * std::sin (angle);
        }
        stackL *= norm;
        stackR *= norm;

        // Mix: 0..50% fades the stack in under a full-level lead, 50..100% fades the lead out.
        const float dryGain   = juce::jmin (1.0f, 2.0f * (1.0f - m));
        const float stackGain = juce::jmin (1.0f, 2.0f * m);
        outL[i] = dry * dryGain + stackL * stackGain;
        outR[i] = dry * dryGain + stackR * stackGain;

        if (++hopCounter == hopSize)
        {
            // Any frame that overlaps an onset (or the 30 ms after it) gets far less phase randomisation
            hopProtect[(size_t) hopProtectPos] = hopProtectMax;
            hopProtectPos = (hopProtectPos + 1) % (int) hopProtect.size();
            hopProtectMax = 0.0f;
            frameProtect = *std::max_element (hopProtect.begin(), hopProtect.end());

            frameVariation = v * (1.0f - 0.85f * frameProtect);
            processFrame();
            hopCounter = 0;
        }
    }
}
