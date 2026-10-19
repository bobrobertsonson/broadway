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
static constexpr float takeBasePos[StackEngine::maxTakes]     = { 0.2f, 0.8f, 0.5f, 0.35f };   // first phrase
static constexpr float phraseGainDb = 2.0f;        // per-phrase level offset range (+-)
static constexpr float minDelayMs = 5.0f, delayRangeMs = 20.0f;
static constexpr float delaySlewMsPerSec = 3.0f;   // caps the Doppler pitch shift of drift at ~5 cents

// Phase offsets: each bin re-draws its target about every 1/phaseRedrawProb frames (~60 ms) and
// glides toward it by phaseGlide per frame.
static constexpr float phaseRedrawProb = 0.09f, phaseGlide = 0.15f;
// Power that a fully randomised take keeps after overlap-add, measured on white noise (1 = no loss).
static constexpr double incoherentPower = 0.49;

StackEngine::StackEngine()
{
    // Periodic Hann: Hann^2 at 75% overlap sums to a constant 1.5
    for (int i = 0; i < fftSize; ++i)
        window[(size_t) i] = 0.5f - 0.5f * std::cos (juce::MathConstants<float>::twoPi * (float) i / (float) fftSize);

    // Randomised phase overlap-adds partly incoherently, so it loses level.
    // rho = mean cos of the phase change at a given Variation: the coherent part (rho^2) passes at
    // unity, the rest at incoherentPower. Make up the difference so Variation does not change level.
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
        variationGain[k] = (float) (1.0 / std::sqrt (rho * rho + incoherentPower * (1.0 - rho * rho)));
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
        t.phraseGain.reset (sr, 0.02);
    }


    auto coeff = [sr] (double ms) { return (float) std::exp (-1.0 / (ms * 0.001 * sr)); };
    fastAtt = coeff (0.5);  fastRel = coeff (15.0);
    slowAtt = coeff (40.0); slowRel = coeff (120.0);
    protectRel = coeff (15.0);
    protectHoldLen = (int) (0.030 * sr);
    maxDelaySlew = delaySlewMsPerSec * 0.001f;

    gapEnvCoef = coeff (5.0);
    gapPeakRel = (float) std::pow (10.0, -6.0 / 20.0 / (0.3 * sr));   // peak falls 6 dB per 300 ms
    // Quiet for: STFT latency + longest take delay + 15 ms margin, so old and new taps both read the gap
    quietNeeded = fftSize + (int) ((minDelayMs + delayRangeMs + 15.0f) * 0.001 * sr);
    xfadeStep = (float) (1.0 / (0.010 * sr));

    const juce::dsp::ProcessSpec spec { sr, (juce::uint32) juce::jmax (1, maxBlockSize), 1 };
    for (int k = 0; k < maxTakes; ++k)
    {
        auto& t = takes[(size_t) k];
        t.delay.setMaximumDelayInSamples ((int) std::ceil ((minDelayMs + delayRangeMs + 5.0f) * 0.001 * sr));
        t.delay.prepare (spec);

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

    phraseRng.setSeed (0x51A7C0DE);
    gapEnv = gapPeak = 0.0f;
    quietCount = 0;
    phraseChanges = 0;

    for (int k = 0; k < maxTakes; ++k)
    {
        auto& t = takes[(size_t) k];
        t.phaseRng.setSeed (takeSeeds[k]);
        for (int b = 0; b < numBins; ++b)
        {
            const float th = t.phaseRng.nextFloat() * juce::MathConstants<float>::twoPi;
            t.offRe[(size_t) b] = t.tgtRe[(size_t) b] = std::cos (th);
            t.offIm[(size_t) b] = t.tgtIm[(size_t) b] = std::sin (th);
        }
        t.ola.fill (0.0f);
        t.ready.fill (0.0f);
        t.active.setCurrentAndTargetValue (k < target.takes ? 1.0f : 0.0f);
        t.pan.setCurrentAndTargetValue (panPosition (k, target.takes));

        t.delay.reset();
        t.shelf.reset();
        t.drift.prepare (sampleRate, takeSeeds[k] * 7 + 1, 2.0f, 5.0f, 0.8f);
        t.wobble.prepare (sampleRate, takeSeeds[k] * 11 + 3, 0.8f, 2.5f, 0.35f);
        t.phrasePos = takeBasePos[k];
        t.delaySamples = t.oldDelay = targetDelaySamples (t, target.tightness);
        t.xfade = 1.0f;
        t.phraseGain.setCurrentAndTargetValue (1.0f);
    }
}

float StackEngine::targetDelaySamples (const Take& t, float tight) const
{
    // Each take sits at its own spot in the range and wanders around it. Tightness shrinks the range.
    const float pos = juce::jlimit (0.0f, 1.0f, t.phrasePos + 0.3f * t.drift.current());
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

void StackEngine::detectGap (float x)
{
    const float r = std::abs (x);
    gapEnv = r + gapEnvCoef * (gapEnv - r);
    gapPeak = juce::jmax (gapEnv, gapPeak * gapPeakRel);

    // Quiet: below about -45 dBFS, or 20 dB under the recent peak
    if (gapEnv < 0.0056f || gapEnv < 0.1f * gapPeak)
    {
        if (++quietCount == quietNeeded)
            startNewPhrase();
    }
    else
        quietCount = 0;
}

void StackEngine::startNewPhrase()
{
    const float tight = tightness.getCurrentValue();
    for (auto& t : takes)
    {
        t.oldDelay = t.delaySamples;
        t.phrasePos = phraseRng.nextFloat();
        t.delaySamples = targetDelaySamples (t, tight);
        t.xfade = 0.0f;
        t.phraseGain.setTargetValue (juce::Decibels::decibelsToGain (phraseGainDb * (2.0f * phraseRng.nextFloat() - 1.0f)));
    }
    ++phraseChanges;
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

        // Move every bin's phase offset a step toward its target (always, so takes keep evolving
        // even while Variation is low), then rotate the bin by the offset blended in by Variation.
        // Magnitude is untouched. DC and Nyquist stay as-is.
        for (int b = 1; b < numBins - 1; ++b)
        {
            const auto bi = (size_t) b;
            if (t.phaseRng.nextFloat() < phaseRedrawProb)
            {
                const float th = t.phaseRng.nextFloat() * juce::MathConstants<float>::twoPi;
                t.tgtRe[bi] = std::cos (th);
                t.tgtIm[bi] = std::sin (th);
            }
            float oRe = t.offRe[bi] + phaseGlide * (t.tgtRe[bi] - t.offRe[bi]);
            float oIm = t.offIm[bi] + phaseGlide * (t.tgtIm[bi] - t.offIm[bi]);
            float om = std::sqrt (oRe * oRe + oIm * oIm);
            if (om < 1.0e-6f)   // passing through the origin: jump to the target
            {
                oRe = t.tgtRe[bi]; oIm = t.tgtIm[bi]; om = 1.0f;
            }
            t.offRe[bi] = oRe / om;
            t.offIm[bi] = oIm / om;

            if (v <= 0.0f)
                continue;

            float uRe = (1.0f - v) + v * t.offRe[bi];
            float uIm = v * t.offIm[bi];
            const float um = std::sqrt (uRe * uRe + uIm * uIm);
            if (um < 1.0e-6f)
            {
                uRe = t.offRe[bi]; uIm = t.offIm[bi];
            }
            else
            {
                uRe /= um; uIm /= um;
            }

            float& re = work[2 * bi];
            float& im = work[2 * bi + 1];
            const float r = re * uRe - im * uIm;
            im = re * uIm + im * uRe;
            re = r;
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
        detectGap (x);

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
            float s;
            if (t.xfade < 1.0f)
            {
                // New phrase: crossfade from the old delay tap to the new one (both read silence)
                const float a = t.delay.popSample (0, t.oldDelay, false);
                const float b = t.delay.popSample (0, t.delaySamples, true);
                s = a + (b - a) * t.xfade;
                t.xfade = juce::jmin (1.0f, t.xfade + xfadeStep);
            }
            else
                s = t.delay.popSample (0, t.delaySamples);
            s = t.shelf.processSample (s);
            s = std::tanh (t.drive * s) / t.drive;   // unity gain at low level, soft peaks
            s *= juce::Decibels::decibelsToGain (1.5f * t.wobble.next()) * t.phraseGain.getNextValue();

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
