#include "StackEngine.h"

//==============================================================================
void SmoothRandom::prepare (double rate, juce::int64 seed, float minHoldSec, float maxHoldSec, float smoothSec)
{
    sr = rate;
    rng.setSeed (seed);
    minHold = minHoldSec;
    maxHold = maxHoldSec;
    coeff = (float) std::exp (-1.0 / (smoothSec * rate));
    target = rng.nextFloat() * 2.0f - 1.0f;
    y1 = y2 = target;
    samplesLeft = 0;
}

float SmoothRandom::next()
{
    if (--samplesLeft <= 0)
    {
        target = rng.nextFloat() * 2.0f - 1.0f;
        samplesLeft = juce::jmax (1, (int) ((minHold + rng.nextFloat() * (maxHold - minHold)) * sr));
    }
    y1 = target + coeff * (y1 - target);
    y2 = y1 + coeff * (y2 - y1);
    return y2;
}

//==============================================================================
namespace
{
    constexpr float pi = juce::MathConstants<float>::pi;
    constexpr float twoPi = juce::MathConstants<float>::twoPi;

    // Character: 0 = "you" (a few cents apart, same vocal tract), 1 = "someone else"
    // (each take its own vocal-tract size and register; lower register goes with a bigger tract).
    constexpr float youCents[StackEngine::maxTakes]   = { -12.0f, 10.0f, 4.0f, -7.0f };
    constexpr float otherCents[StackEngine::maxTakes] = { -150.0f, 120.0f, -60.0f, 70.0f };
    constexpr float otherScale[StackEngine::maxTakes] = { 0.88f, 1.12f, 0.94f, 1.06f };   // formant scale

    constexpr float phaseVariation = 0.3f;          // weight of the gliding random phase offsets
    constexpr float phaseRedrawProb = 0.09f, phaseGlide = 0.15f;   // per 256-sample hop
    constexpr float tonalThreshold = 4.0f / 8.6859f;   // fine structure 4 dB above the envelope = tonal peak
    constexpr float vowelDrift = 0.04f;             // +-4 % formant drift per take
    constexpr float maxRaspDb = 6.0f, maxDynDb = 12.0f, maxPitchDriftCents = 20.0f;   // dyn 50 measures like the approved prototype clips
    constexpr float takeLevel = 0.944f;             // measured: a hard-panned take sits ~1 dB under the lead at Mix 50
    constexpr float satCeiling = 3.2f;              // soft ceiling, x the lead's local rms (the lead's own crest is ~3x)
    constexpr float maxMatchGain = 2.0f;            // level matching stays within +-6 dB

    inline float princ (float a) { return a - twoPi * std::floor ((a + pi) / twoPi); }

    inline float sampleAt (const std::array<float, StackEngine::numBins>& s, float pos)
    {
        pos = juce::jlimit (0.0f, (float) (StackEngine::numBins - 1), pos);
        const int i = juce::jmin ((int) pos, StackEngine::numBins - 2);
        const float f = pos - (float) i;
        return s[(size_t) i] + f * (s[(size_t) i + 1] - s[(size_t) i]);
    }

    juce::int64 takeSeed (int seed, int take, int stream)
    {
        return (juce::int64) seed * 1000003 + take * 7919 + stream * 104729 + 0x51A7C0;
    }

    // De-esser: frames whose 5 kHz+ share jumps well above this take's own running average
    constexpr float deEssMaxDb = 12.0f, deEssFromHz = 3500.0f, deEssFullHz = 5000.0f, deEssSplitHz = 4500.0f;
}

StackEngine::StackEngine()
{
    for (int i = 0; i < fftSize; ++i)
        window[(size_t) i] = 0.5f - 0.5f * std::cos (twoPi * (float) i / (float) fftSize);
}

void StackEngine::prepare (double sr, int maxBlockSize)
{
    sampleRate = sr;
    maxBlock = juce::jmax (1, maxBlockSize);

    // Frame size. Per-frame rates are rescaled so they mean the same in time at either hop.
    hop = highQuality ? normalHop / 2 : normalHop;
    framesPerControl = normalHop / hop;
    const float hs = (float) hop / (float) normalHop;
    redrawProb = hop == normalHop ? phaseRedrawProb : 1.0f - std::pow (1.0f - phaseRedrawProb, hs);
    glide      = hop == normalHop ? phaseGlide      : 1.0f - std::pow (1.0f - phaseGlide, hs);
    dsRelease  = hop == normalHop ? 0.85f           : std::pow (0.85f, hs);
    // Overlap-add: Hann^2 sums to 0.375 N / hop. Independent-per-frame noise loses power in proportion
    // to the overlap, so it needs more make-up at the smaller hop.
    olaGain = (float) hop / (0.375f * (float) fftSize);
    freshComp = juce::MathConstants<float>::sqrt2 * std::sqrt ((float) normalHop / (float) hop);
    for (int k = 0; k < numBins; ++k)
        omega[(size_t) k] = twoPi * (float) k * (float) hop / (float) fftSize;

    const double frameRate = sr / hop;
    frameSmooth = 1.0f - (float) std::exp (-1.0 / (0.05 * frameRate));

    for (auto* s : { &width, &mix, &inGain, &outGain, &stackNorm, &leadGain })
        s->reset (sr, 0.05);
    for (auto& t : takes)
    {
        t.level.reset (sr, 0.05);
        t.pan.reset (sr, 0.05);
        t.roomBuf.assign ((size_t) std::ceil (0.02 * sr) + 1, 0.0f);
    }

    maxWarpFrames = (float) (maxWarpMs * 0.001 * sr / hop);
    // Lookahead sized for the normal hop and kept in time at either hop, so latency never changes
    lookaheadFrames = ((int) std::ceil (maxWarpMs * 0.001 * sr / normalHop) + 2) * framesPerControl;
    ringSize = 2 * lookaheadFrames + 4;
    ring.assign ((size_t) ringSize, Frame {});
    lifterLen = juce::jlimit (8, fftSize / 2 - 1, (int) std::lround (0.00125 * sr));
    fluxCoef = (float) std::exp (-1.0 / frameRate);   // ~1 s statistics for the onset detector
    dryDelay.assign ((size_t) getLatencySamples(), 0.0f);
    slowCoef = (float) std::exp (-1.0 / (3.0 * sr));
    fastCoef = (float) std::exp (-1.0 / (0.03 * sr));

    gateEnvRel = (float) std::exp (-1.0 / (0.05 * sr));
    gateAtt = (float) std::exp (-1.0 / (0.005 * sr));
    gateRel = (float) std::exp (-1.0 / (0.12 * sr));
    gateAheadSamples = juce::jmin ((int) dryDelay.size() - 1, (int) std::ceil (maxWarpMs * 0.001 * sr));
    gateHoldLen = 2 * gateAheadSamples;   // covers the latest a take can land

    reverb.setSampleRate (sr);
    stackBufL.assign ((size_t) maxBlock, 0.0f);
    stackBufR.assign ((size_t) maxBlock, 0.0f);
    dryBuf.assign ((size_t) maxBlock, 0.0f);

    reset();
}

void StackEngine::reset()
{
    sTight = target.tightness; sTexture = target.texture; sRasp = target.rasp; sDyn = target.dynamics;
    sPitch = target.pitchDrift; sRoom = target.room; sDeEss = target.deEss;
    sLowCut = target.lowCutHz; sHighCut = target.highCutHz;
    width.setCurrentAndTargetValue (target.width);
    mix.setCurrentAndTargetValue (target.mix);
    inGain.setCurrentAndTargetValue (juce::Decibels::decibelsToGain (target.inputDb));
    outGain.setCurrentAndTargetValue (juce::Decibels::decibelsToGain (target.outputDb));
    updateCuts();
    for (auto* f : { &lowCut, &highCut })
        for (int ch = 0; ch < 2; ++ch)
            f->z1[ch] = f->z2[ch] = 0.0f;

    inFrame.fill (0.0f);
    hopCounter = 0;
    frameCounter = 0;
    newestFrame = -1;
    for (auto& f : ring)
    {
        f.env.fill (-30.0f);   // silence, not log(1) = 0
        f.fine.fill (0.0f);
        f.phase.fill (0.0f);
        f.onset = false;
    }
    prevLogMag.fill (-30.0f);
    fluxMean = fluxVar = 0.0f;
    std::fill (dryDelay.begin(), dryDelay.end(), 0.0f);
    dryPos = 0;
    dryPowSlow = dryPowFast = 0.0f;
    gateEnv = 0.0f;
    gateHold = 0;
    gateOpen = target.gateDb <= -80.0f;
    gateGain = gateOpen ? 1.0f : 0.0f;
    reverb.reset();

    for (int k = 0; k < maxTakes; ++k)
        seedTake (k, true);
    updateTakeTargets();
    for (auto& t : takes)
    {
        t.level.setCurrentAndTargetValue (t.level.getTargetValue());
        t.pan.setCurrentAndTargetValue (t.pan.getTargetValue());
    }
    stackNorm.setCurrentAndTargetValue (stackNorm.getTargetValue());
    leadGain.setCurrentAndTargetValue (leadGain.getTargetValue());
}

void StackEngine::seedTake (int k, bool resetState)
{
    const double frameRate = sampleRate / normalHop;   // random contours run on a fixed control clock
    auto& t = takes[(size_t) k];
    const int seed = combinedSeed (k);
    t.seedUsed = seed;
    t.rng.setSeed (takeSeed (seed, k, 0));

    // Timescales (seconds): new target every hold, glide time. Warp ~ syllables, dyn ~ syllables,
    // gain ~ half-phrases, formant and pitch drift ~ phrases.
    struct { SmoothRandom* r; float lo, hi, glide; } streams[] = {
        { &t.warp,    0.15f, 0.40f, 0.045f }, { &t.gain,  0.21f, 0.64f, 0.12f },
        { &t.dyn,     0.10f, 0.30f, 0.022f }, { &t.formant, 0.8f, 2.7f, 0.22f },
        { &t.pitch,   0.53f, 1.60f, 0.22f } };
    int s = 1;
    for (auto& st : streams)
    {
        if (resetState)
            st.r->prepare (frameRate, takeSeed (seed, k, s), st.lo, st.hi, st.glide);
        else
            st.r->reseed (takeSeed (seed, k, s));
        ++s;
    }

    // Fixed per-take tone: a 1-2 dB tilt up or down across the spectrum
    const bool high = t.rng.nextBool();
    const float tiltDb = (1.0f + t.rng.nextFloat()) * (t.rng.nextBool() ? 1.0f : -1.0f);
    for (int b = 0; b < numBins; ++b)
    {
        const float pos = (float) b / (float) numBins;
        t.tilt[(size_t) b] = juce::Decibels::decibelsToGain (tiltDb * (high ? pos : 1.0f - pos));
    }
    t.raspUnit = t.rng.nextFloat() * 2.0f - 1.0f;

    // Room: four sparse early reflections, 2-18 ms, -22..-14 dB, random polarity
    for (size_t i = 0; i < t.tapDelay.size(); ++i)
    {
        t.tapDelay[i] = (int) ((0.002 + 0.016 * t.rng.nextFloat()) * sampleRate);
        t.tapGain[i] = (t.rng.nextBool() ? 1.0f : -1.0f)
                     * juce::Decibels::decibelsToGain (-22.0f + 8.0f * t.rng.nextFloat());
    }

    if (resetState)
    {
        for (int b = 0; b < numBins; ++b)
            t.phaseOff[(size_t) b] = t.phaseTgt[(size_t) b] = (t.rng.nextFloat() * 2.0f - 1.0f) * pi;
        t.phi.fill (0.0f);
        t.phaseValid = false;
        t.warpFrames = 0.0f;
        t.ola.fill (0.0f);
        t.ready.fill (0.0f);
        t.powFollow = 0.0f;
        t.sibMean = 0.0f;
        t.dsDb = 0.0f;
        t.sChar = target.take[(size_t) k].character;
        std::fill (t.roomBuf.begin(), t.roomBuf.end(), 0.0f);
        t.roomPos = 0;
    }
}

void StackEngine::setParameters (const StackParams& p)
{
    target = p;
    target.takes = juce::jlimit (2, maxTakes, p.takes);
    width.setTargetValue (juce::jlimit (0.0f, 1.0f, p.width));
    mix.setTargetValue (juce::jlimit (0.0f, 1.0f, p.mix));
    inGain.setTargetValue (juce::Decibels::decibelsToGain (p.inputDb));
    outGain.setTargetValue (juce::Decibels::decibelsToGain (p.outputDb));
    updateTakeTargets();
}

void StackEngine::updateTakeTargets()
{
    // Solo wins: if anything is soloed, only soloed sources play
    bool anySolo = target.leadSolo;
    for (int k = 0; k < target.takes; ++k)
        anySolo = anySolo || target.take[(size_t) k].solo;

    for (int k = 0; k < maxTakes; ++k)
    {
        const auto& tp = target.take[(size_t) k];
        const bool audible = k < target.takes && ! tp.mute && (! anySolo || tp.solo);
        takes[(size_t) k].level.setTargetValue (audible ? juce::Decibels::decibelsToGain (tp.levelDb) : 0.0f);
        takes[(size_t) k].pan.setTargetValue (juce::jlimit (-1.0f, 1.0f, tp.pan));
    }
    leadGain.setTargetValue (! target.leadMute && (! anySolo || target.leadSolo) ? 1.0f : 0.0f);
    stackNorm.setTargetValue (std::sqrt (2.0f / (float) target.takes));
}

void StackEngine::updateCuts()
{
    // RBJ biquads, Q = 0.7071 (Butterworth, 12 dB/octave)
    auto design = [this] (Biquad& f, float hz, bool high)
    {
        const float w = twoPi * juce::jlimit (10.0f, 0.45f * (float) sampleRate, hz) / (float) sampleRate;
        const float cw = std::cos (w), alpha = std::sin (w) / (2.0f * 0.70710678f);
        const float a0 = 1.0f + alpha;
        const float b = high ? (1.0f + cw) * 0.5f : (1.0f - cw) * 0.5f;   // high = high-pass (the low cut)
        f.b0 = b / a0;
        f.b1 = (high ? -(1.0f + cw) : (1.0f - cw)) / a0;
        f.b2 = b / a0;
        f.a1 = -2.0f * cw / a0;
        f.a2 = (1.0f - alpha) / a0;
    };
    lowCutOn = sLowCut > 20.5f;
    highCutOn = sHighCut < 19999.0f;
    design (lowCut, sLowCut, true);
    design (highCut, sHighCut, false);
}

bool StackEngine::detectOnset (const Spectrum& logMag)
{
    // Spectral flux (mean log-magnitude rise) against its own running mean + 3 std
    float flux = 0.0f;
    for (int b = 0; b < numBins; ++b)
        flux += juce::jmax (0.0f, logMag[(size_t) b] - prevLogMag[(size_t) b]);
    flux /= (float) numBins;
    prevLogMag = logMag;

    const bool onset = flux > fluxMean + 3.0f * std::sqrt (fluxVar);
    const float d = flux - fluxMean;
    fluxMean += (1.0f - fluxCoef) * d;
    fluxVar = fluxCoef * (fluxVar + (1.0f - fluxCoef) * d * d);
    return onset;
}

void StackEngine::analyseFrame()
{
    for (int i = 0; i < fftSize; ++i)
        work[(size_t) i] = inFrame[(size_t) i] * window[(size_t) i];
    std::fill (work.begin() + fftSize, work.end(), 0.0f);
    fft.performRealOnlyForwardTransform (work.data(), true);
    std::copy (inFrame.begin() + hop, inFrame.end(), inFrame.begin());

    Frame& f = frameAt (++newestFrame);
    Spectrum logMag;
    for (int b = 0; b < numBins; ++b)
    {
        const float re = work[(size_t) (2 * b)], im = work[(size_t) (2 * b + 1)];
        logMag[(size_t) b] = std::log (std::sqrt (re * re + im * im) + 1.0e-7f);
        f.phase[(size_t) b] = std::atan2 (im, re);
    }
    f.onset = detectOnset (logMag);

    // Spectral envelope by cepstral liftering: keep quefrencies under ~1.25 ms (formants);
    // what is left over (harmonics, noise grain) is the fine structure.
    for (int b = 0; b < numBins; ++b)
    {
        work[(size_t) (2 * b)] = logMag[(size_t) b];
        work[(size_t) (2 * b + 1)] = 0.0f;
    }
    fft.performRealOnlyInverseTransform (work.data());
    for (int n = lifterLen; n <= fftSize - lifterLen; ++n)
        work[(size_t) n] = 0.0f;
    std::fill (work.begin() + fftSize, work.end(), 0.0f);
    fft.performRealOnlyForwardTransform (work.data(), true);
    for (int b = 0; b < numBins; ++b)
    {
        f.env[(size_t) b] = work[(size_t) (2 * b)];
        f.fine[(size_t) b] = logMag[(size_t) b] - f.env[(size_t) b];
    }
}

void StackEngine::synthesiseFrame (Take& t, int k, int m, bool controlTick)
{
    if (controlTick)
    {
        t.cWarp = t.warp.next();
        t.cFormant = t.formant.next();
        t.cPitch = t.pitch.next();
        t.cGain = t.gain.next();
        t.cDyn = t.dyn.next();
    }

    // Timing: read the lead at this take's own warped time, speed-limited to +-15 %
    const float want = maxWarpFrames * (1.0f - sTight) * t.cWarp;
    t.warpFrames += juce::jlimit (-warpSpeedLimit, warpSpeedLimit, want - t.warpFrames);
    const float r = juce::jlimit ((float) (newestFrame - ringSize + 2), (float) (newestFrame - 1), (float) m - t.warpFrames);
    const int i = (int) std::floor (r);
    const float a = r - (float) i;
    const Frame& A = frameAt (i);
    const Frame& B = frameAt (i + 1);

    // Identity: vocal-tract size (formant scale) and register (cents), blended by Character
    const float ch = t.sChar;
    const float fScale = (1.0f + vowelDrift * t.cFormant) * (1.0f + ch * (otherScale[k] - 1.0f));
    const float cents = youCents[k] + ch * (otherCents[k] - youCents[k]) + maxPitchDriftCents * sPitch * t.cPitch;
    const float beta = std::pow (2.0f, cents / 1200.0f);
    const float gainLin = juce::Decibels::decibelsToGain (1.5f * t.cGain);
    const float dynDb = maxDynDb * sDyn * t.cDyn;
    const float raspDb = maxRaspDb * sRasp * t.raspUnit;

    Spectrum envI, fineI, advI, phI;
    for (int b = 0; b < numBins; ++b)
    {
        const auto bi = (size_t) b;
        envI[bi] = A.env[bi] + a * (B.env[bi] - A.env[bi]);
        fineI[bi] = A.fine[bi] + a * (B.fine[bi] - A.fine[bi]);
        const float dph = princ (B.phase[bi] - A.phase[bi]);
        phI[bi] = A.phase[bi] + a * dph;
        advI[bi] = omega[bi] + princ (dph - omega[bi]);
    }

    // Move formants by fScale and harmonics by beta (separately), then measure the noise floor
    Spectrum e, f;
    float noisePow = 0.0f, noiseBandPow = 0.0f, toneBandPow = 0.0f;
    int noisyCount = 0;
    for (int b = 0; b < numBins; ++b)
    {
        e[(size_t) b] = sampleAt (envI, (float) b / fScale);
        f[(size_t) b] = sampleAt (fineI, (float) b / beta);
        const float binPow = std::exp (2.0f * (e[(size_t) b] + f[(size_t) b]));
        if (f[(size_t) b] < tonalThreshold)
        {
            noisePow += std::exp (2.0f * f[(size_t) b]);
            noiseBandPow += binPow;
            ++noisyCount;
        }
        else
            toneBandPow += binPow;
    }
    const float fineRms = noisyCount > 0 ? std::sqrt (noisePow / (float) noisyCount) : 1.0f;

    // Rasp tilts the noise/tone balance but keeps the frame's power, so it changes timbre, not level
    float noiseG = juce::Decibels::decibelsToGain (raspDb), toneG = juce::Decibels::decibelsToGain (-0.5f * raspDb);
    const float total = noiseBandPow + toneBandPow;
    if (total > 1.0e-20f)
    {
        const float keepLevel = std::sqrt (total / (noiseBandPow * noiseG * noiseG + toneBandPow * toneG * toneG));
        noiseG *= keepLevel;
        toneG *= keepLevel;
    }

    const bool resetPhase = ! t.phaseValid || A.onset || B.onset;   // attacks stay sharp
    t.phaseValid = true;
    const float tex = sTexture;
    const float keepOrig = std::sqrt (1.0f - tex), useFresh = std::sqrt (tex) * freshComp;

    for (int b = 0; b < numBins; ++b)
    {
        const auto bi = (size_t) b;
        const float src = (float) b / beta;
        // Phase vocoder: advance by the input's own (beta-scaled) phase increment, so pitch moves
        // by beta and nothing else does
        t.phi[bi] = resetPhase ? sampleAt (phI, src) : princ (t.phi[bi] + beta * sampleAt (advI, src));

        if (t.rng.nextFloat() < redrawProb)
            t.phaseTgt[bi] = (t.rng.nextFloat() * 2.0f - 1.0f) * pi;
        t.phaseOff[bi] = princ (t.phaseOff[bi] + glide * princ (t.phaseTgt[bi] - t.phaseOff[bi]));
        const float P = t.phi[bi] + phaseVariation * t.phaseOff[bi];

        float re = std::exp (e[bi] + f[bi]) * std::cos (P);
        float im = std::exp (e[bi] + f[bi]) * std::sin (P);
        if (f[bi] < tonalThreshold)
        {
            // Between the tonal peaks: a fresh noise realisation (complex Gaussian), x2 amplitude for the
            // power an independent-per-frame signal loses in overlap-add
            const float u1 = juce::jmax (1.0e-7f, t.rng.nextFloat()), u2 = t.rng.nextFloat();
            const float rad = std::sqrt (-2.0f * std::log (u1)) * std::exp (e[bi]) * fineRms * useFresh;
            re = (keepOrig * re + rad * std::cos (twoPi * u2)) * noiseG;
            im = (keepOrig * im + rad * std::sin (twoPi * u2)) * noiseG;
        }
        else
        {
            re *= toneG;
            im *= toneG;
        }

        // Tone tilt, slow level ride, and syllable dynamics with effort brightness (highs move 60 % more)
        const float pos = (float) b / (float) numBins;
        const float g = t.tilt[bi] * gainLin
                      * juce::Decibels::decibelsToGain (dynDb * (1.0f + 0.6f * (pos - 0.5f)));
        work[2 * bi] = re * g;
        work[2 * bi + 1] = im * g;
    }
    work[1] = 0.0f;                       // DC and Nyquist are real
    work[(size_t) (2 * (numBins - 1) + 1)] = 0.0f;

    // De-esser: when this frame's share above 4.5 kHz jumps well past the take's running average,
    // pull everything above 3.5 kHz down (fully from 5 kHz); fast attack, ~30 ms release
    if (sDeEss > 0.001f)
    {
        const float binHz = (float) sampleRate / (float) fftSize;
        float hf = 0.0f, all = 1.0e-20f;
        for (int b = 1; b < numBins; ++b)
        {
            const float pw = work[(size_t) (2 * b)] * work[(size_t) (2 * b)] + work[(size_t) (2 * b + 1)] * work[(size_t) (2 * b + 1)];
            all += pw;
            if ((float) b * binHz > deEssSplitHz)
                hf += pw;
        }
        const float sib = hf / all;
        t.sibMean += (1.0f - fluxCoef) * (sib - t.sibMean);
        const float excess = t.sibMean > 1.0e-6f ? sib / t.sibMean : 1.0f;
        const float wantDb = deEssMaxDb * sDeEss * juce::jlimit (0.0f, 1.0f, (excess - 1.3f) / 1.2f);
        t.dsDb = juce::jmax (wantDb, t.dsDb * dsRelease);   // ~30 ms release
        if (t.dsDb > 0.01f)
            for (int b = 1; b < numBins; ++b)
            {
                const float ramp = juce::jlimit (0.0f, 1.0f, ((float) b * binHz - deEssFromHz) / (deEssFullHz - deEssFromHz));
                if (ramp > 0.0f)
                {
                    const float g = juce::Decibels::decibelsToGain (-t.dsDb * ramp);
                    work[(size_t) (2 * b)] *= g;
                    work[(size_t) (2 * b + 1)] *= g;
                }
            }
    }

    fft.performRealOnlyInverseTransform (work.data());
    for (int n = 0; n < fftSize; ++n)
        t.ola[(size_t) n] += work[(size_t) n] * window[(size_t) n] * olaGain;
    std::copy (t.ola.begin(), t.ola.begin() + hop, t.ready.begin());
    std::copy (t.ola.begin() + hop, t.ola.end(), t.ola.begin());
    std::fill (t.ola.end() - hop, t.ola.end(), 0.0f);
}


void StackEngine::process (const float* const* in, int numIn, float* outL, float* outR, int n)
{
    // Work in chunks no longer than the prepared block size (the reverb runs per chunk)
    for (int pos = 0; pos < n; )
    {
        const int len = juce::jmin (maxBlock, n - pos);
        const float* chunkIn[2] = { in[0] + pos, in[numIn > 1 ? 1 : 0] + pos };
        processChunk (chunkIn, numIn, outL + pos, outR + pos, len);
        pos += len;
    }
}

void StackEngine::processChunk (const float* const* in, int numIn, float* outL, float* outR, int n)
{
    const int roomLen = takes[0].roomBuf.empty() ? 0 : (int) takes[0].roomBuf.size();
    const int delayLen = (int) dryDelay.size();
    const bool gateOn = target.gateDb > -80.0f;
    const float gateThresh = juce::Decibels::decibelsToGain (target.gateDb);

    for (int s = 0; s < n; ++s)
    {
        const float x = (numIn > 1 ? 0.5f * (in[0][s] + in[1][s]) : in[0][s]) * inGain.getNextValue();

        const float dry = dryDelay[(size_t) dryPos];
        dryDelay[(size_t) dryPos] = x;
        // The lead as it will sound maxWarp from now: the earliest a take can land
        int aheadPos = dryPos + gateAheadSamples;
        if (aheadPos >= delayLen)
            aheadPos -= delayLen;
        const float ahead = dryDelay[(size_t) aheadPos];
        if (++dryPos == delayLen)
            dryPos = 0;

        inFrame[(size_t) (fftSize - hop + hopCounter)] = x;

        const float w = width.getNextValue();
        const float roomAmt = 2.0f * sRoom;   // 0.5 = the reflections as designed

        // Track the (latency-aligned) lead's level. Only learn while the lead is audible (> -60 dBFS).
        dryPowFast = dry * dry + fastCoef * (dryPowFast - dry * dry);
        const bool learn = dryPowSlow > 1.0e-6f || dry * dry > 1.0e-6f;
        if (learn)
            dryPowSlow = dry * dry + slowCoef * (dryPowSlow - dry * dry);
        const float ceiling = satCeiling * takeLevel * std::sqrt (dryPowFast) + 1.0e-4f;

        // Gate: open as soon as the lead (seen maxWarp ahead) crosses the threshold, hold long enough
        // for the latest take, then release. 3 dB hysteresis.
        float gate = 1.0f;
        if (gateOn)
        {
            gateEnv = juce::jmax (std::abs (ahead), gateEnv * gateEnvRel);
            if (gateEnv > gateThresh)
            {
                gateOpen = true;
                gateHold = gateHoldLen;
            }
            else if (gateEnv < gateThresh * 0.708f && --gateHold <= 0)
                gateOpen = false;
            const float tgt = gateOpen ? 1.0f : 0.0f;
            gateGain = tgt + (tgt > gateGain ? gateAtt : gateRel) * (gateGain - tgt);
            gate = gateGain;
        }

        float stackL = 0.0f, stackR = 0.0f;
        for (auto& t : takes)
        {
            float y = t.ready[(size_t) hopCounter];

            // Slow level match to the lead (~3 s), so random contours can't leave one take louder for
            // long stretches; syllable-rate dynamics are much faster and pass through
            if (learn)
                t.powFollow = y * y + slowCoef * (t.powFollow - y * y);
            const float match = t.powFollow > 1.0e-12f
                ? juce::jlimit (1.0f / maxMatchGain, maxMatchGain, std::sqrt (dryPowSlow / t.powFollow)) : 1.0f;
            y *= match * takeLevel;

            // Gentle saturation: a soft ceiling near the lead's own peak level
            y = ceiling * std::tanh (y / ceiling);

            t.roomBuf[(size_t) t.roomPos] = y;
            for (size_t i = 0; i < t.tapDelay.size(); ++i)
            {
                int p = t.roomPos - t.tapDelay[i];
                if (p < 0)
                    p += roomLen;
                y += roomAmt * t.tapGain[i] * t.roomBuf[(size_t) p];
            }
            if (++t.roomPos == roomLen)
                t.roomPos = 0;

            y *= t.level.getNextValue();
            const float angle = (t.pan.getNextValue() * w + 1.0f) * pi * 0.25f;   // constant-power pan
            stackL += y * std::cos (angle);
            stackR += y * std::sin (angle);
        }

        const float norm = stackNorm.getNextValue() * gate;
        stackBufL[(size_t) s] = stackL * norm;
        stackBufR[(size_t) s] = stackR * norm;
        dryBuf[(size_t) s] = dry * leadGain.getNextValue();

        if (++hopCounter == hop)
        {
            hopCounter = 0;

            sTight   += frameSmooth * (target.tightness  - sTight);
            sTexture += frameSmooth * (target.texture    - sTexture);
            sRasp    += frameSmooth * (target.rasp       - sRasp);
            sDyn     += frameSmooth * (target.dynamics   - sDyn);
            sPitch   += frameSmooth * (target.pitchDrift - sPitch);
            sRoom    += frameSmooth * (target.room       - sRoom);
            sDeEss   += frameSmooth * (target.deEss      - sDeEss);
            for (int k = 0; k < maxTakes; ++k)
            {
                auto& t = takes[(size_t) k];
                t.sChar += frameSmooth * (target.take[(size_t) k].character - t.sChar);
                if (combinedSeed (k) != t.seedUsed)
                    seedTake (k, false);
            }
            // Cutoffs glide in the log domain; only recompute the curve while they move
            const float lc = sLowCut, hc = sHighCut;
            sLowCut  = std::exp (std::log (sLowCut)  + frameSmooth * (std::log (juce::jmax (1.0f, target.lowCutHz))  - std::log (sLowCut)));
            sHighCut = std::exp (std::log (sHighCut) + frameSmooth * (std::log (juce::jmax (1.0f, target.highCutHz)) - std::log (sHighCut)));
            if (std::abs (sLowCut - lc) > 0.01f || std::abs (sHighCut - hc) > 0.1f)
                updateCuts();

            analyseFrame();
            const int outFrame = newestFrame - lookaheadFrames;
            const bool controlTick = (frameCounter++ % framesPerControl) == 0;
            for (int k = 0; k < maxTakes; ++k)
                synthesiseFrame (takes[(size_t) k], k, outFrame, controlTick);
        }
    }

    // Stack low/high cut (after resynthesis, so frame-to-frame changes can't refill the cut region)
    if (lowCutOn || highCutOn)
        for (int s = 0; s < n; ++s)
        {
            float l = stackBufL[(size_t) s], r = stackBufR[(size_t) s];
            if (lowCutOn)  { l = lowCut.process (l, 0);  r = lowCut.process (r, 1); }
            if (highCutOn) { l = highCut.process (l, 0); r = highCut.process (r, 1); }
            stackBufL[(size_t) s] = l;
            stackBufR[(size_t) s] = r;
        }

    // Space: ambience on the stack bus only (the lead stays dry)
    juce::Reverb::Parameters rp;
    rp.roomSize = 0.45f;
    rp.damping = 0.6f;
    rp.width = 1.0f;
    rp.dryLevel = 0.5f;                  // juce::Reverb scales dry by 2: 0.5 = unity
    rp.wetLevel = 0.39f * target.space;  // measured: 100 % adds ~1.5 dB of ambience, not loudness
    reverb.setParameters (rp);
    reverb.processStereo (stackBufL.data(), stackBufR.data(), n);   // always, so tails ring out at 0 %

    for (int s = 0; s < n; ++s)
    {
        const float m = mix.getNextValue();
        const float og = outGain.getNextValue();
        const float dryGain   = juce::jmin (1.0f, 2.0f * (1.0f - m));
        const float stackGain = juce::jmin (1.0f, 2.0f * m);
        outL[s] = (dryBuf[(size_t) s] * dryGain + stackBufL[(size_t) s] * stackGain) * og;
        outR[s] = (dryBuf[(size_t) s] * dryGain + stackBufR[(size_t) s] * stackGain) * og;
    }
}
