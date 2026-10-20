// stackfx_selftest: drives the real plugin processor the way a host would and checks the
// things the offline renderer can't: presets, Link, state save/restore, mono input, odd block sizes.
#include <juce_audio_processors/juce_audio_processors.h>
#include <iostream>

static int failures = 0;
static bool near (float a, float b) { return std::abs (a - b) < 0.05f; }
static void check (bool ok, const juce::String& what)
{
    std::cout << (ok ? "  ok    " : "  FAIL  ") << what << "\n";
    if (! ok)
        ++failures;
}

static float plainValue (juce::AudioProcessor& p, const juce::String& id)
{
    for (auto* param : p.getParameters())
        if (auto* r = dynamic_cast<juce::RangedAudioParameter*> (param))
            if (r->getParameterID() == id)
                return r->convertFrom0to1 (r->getValue());
    return std::numeric_limits<float>::quiet_NaN();
}

static void setPlain (juce::AudioProcessor& p, const juce::String& id, float v)
{
    for (auto* param : p.getParameters())
        if (auto* r = dynamic_cast<juce::RangedAudioParameter*> (param))
            if (r->getParameterID() == id)
                r->setValueNotifyingHost (r->convertTo0to1 (v));
}

// Runs a few seconds of a noisy, gated test signal through in irregular block sizes
static bool runAudio (juce::AudioProcessor& p, int inChannels, float& peakOut)
{
    const double sr = 48000.0;
    p.setPlayConfigDetails (inChannels, 2, sr, 512);
    p.prepareToPlay (sr, 512);
    juce::Random rng (7);
    juce::MidiBuffer midi;
    const int sizes[] = { 512, 1, 37, 256, 1024, 480, 2048, 64 };   // includes blocks larger than prepared
    peakOut = 0.0f;
    int done = 0, i = 0;
    while (done < (int) (3 * sr))
    {
        const int n = sizes[i++ % 8];
        juce::AudioBuffer<float> buf (2, n);
        for (int s = 0; s < n; ++s)
        {
            const double t = (done + s) / sr;
            const float env = std::fmod (t, 0.5) < 0.35 ? 0.3f : 0.0f;   // phrases with gaps
            const float x = env * (rng.nextFloat() * 2.0f - 1.0f) + env * 0.5f * (float) std::sin (6.283 * 220.0 * t);
            buf.setSample (0, s, x);
            buf.setSample (1, s, inChannels > 1 ? x : 0.0f);
        }
        p.processBlock (buf, midi);
        for (int ch = 0; ch < 2; ++ch)
            for (int s = 0; s < n; ++s)
            {
                const float v = buf.getSample (ch, s);
                if (! std::isfinite (v))
                    return false;
                peakOut = juce::jmax (peakOut, std::abs (v));
            }
        done += n;
    }
    p.releaseResources();
    return true;
}

static int presetIndex (juce::AudioProcessor& p, const juce::String& name)
{
    for (int i = 0; i < p.getNumPrograms(); ++i)
        if (p.getProgramName (i) == name)
            return i;
    return -1;
}

int main()
{
    juce::ScopedJuceInitialiser_GUI juce;
    std::unique_ptr<juce::AudioProcessor> p (createPluginFilter());

    std::cout << "presets\n";
    check (p->getNumPrograms() >= 5, "factory presets exist (" + juce::String (p->getNumPrograms()) + ")");
    for (int i = 0; i < p->getNumPrograms(); ++i)
    {
        p->setCurrentProgram (i);
        check (p->getCurrentProgram() == i && p->getProgramName (i).isNotEmpty(), "select preset " + p->getProgramName (i));
    }
    p->setCurrentProgram (presetIndex (*p, "Wide Quad"));
    check (near (plainValue (*p, "takes"), 4.0f), "Wide Quad sets Takes = 4");
    p->setCurrentProgram (presetIndex (*p, "Backing Layer Only"));
    check (plainValue (*p, "leadmute") > 0.5f && near (plainValue (*p, "takes"), 2.0f),
           "Backing Layer Only mutes the lead and resets the rest to defaults");
    p->setCurrentProgram (0);
    check (plainValue (*p, "leadmute") < 0.5f && near (plainValue (*p, "tightness"), 40.0f), "Default restores defaults");

    p->setCurrentProgram (presetIndex (*p, "Gang Vocal"));
    check (near (plainValue (*p, "takeBvoice"), 3.0f) && near (plainValue (*p, "takeBcharacter"), 100.0f),
           "Gang Vocal sets Take B to Deep Growler at 100 %");

    std::cout << "state save / restore\n";
    setPlain (*p, "tightness", 12.5f);
    setPlain (*p, "takeBcharacter", 77.0f);
    setPlain (*p, "takeCseed", 555.0f);
    setPlain (*p, "link", 1.0f);
    setPlain (*p, "takeDvoice", 7.0f);
    juce::MemoryBlock state;
    p->getStateInformation (state);
    p->setCurrentProgram (0);
    check (near (plainValue (*p, "tightness"), 40.0f), "defaults loaded before restore");
    p->setStateInformation (state.getData(), (int) state.getSize());
    check (std::abs (plainValue (*p, "tightness") - 12.5f) < 0.05f, "Tightness restored");
    check (std::abs (plainValue (*p, "takeBcharacter") - 77.0f) < 0.05f, "Take B Character restored");
    check (near (plainValue (*p, "takeCseed"), 555.0f), "Take C Seed restored");
    check (plainValue (*p, "link") > 0.5f, "Link restored");
    check (near (plainValue (*p, "takeDvoice"), 7.0f), "Take D Voice restored");

    std::cout << "audio\n";
    float peak = 0.0f;
    p->setCurrentProgram (0);
    check (runAudio (*p, 2, peak), "stereo in, irregular blocks up to 2048: finite output");
    check (peak > 0.05f && peak < 4.0f, "stereo output level sane (peak " + juce::String (peak, 3) + ")");
    check (p->getLatencySamples() > 1024, "latency reported to host (" + juce::String (p->getLatencySamples()) + " samples)");
    check (runAudio (*p, 1, peak), "mono in: finite output");
    check (peak > 0.05f, "mono in produces output (peak " + juce::String (peak, 3) + ")");
    for (int i = 0; i < p->getNumPrograms(); ++i)
    {
        p->setCurrentProgram (i);
        check (runAudio (*p, 2, peak) && peak > 0.01f && peak < 4.0f,
               "preset " + p->getProgramName (i) + " runs (peak " + juce::String (peak, 3) + ")");
    }

    std::cout << "voices\n";
    for (int v = 0; v < 14; ++v)
    {
        p->setCurrentProgram (0);
        setPlain (*p, "takes", 4.0f);
        for (const char* k : { "A", "B", "C", "D" })
        {
            setPlain (*p, juce::String ("take") + k + "voice", (float) v);
            setPlain (*p, juce::String ("take") + k + "character", 100.0f);
        }
        check (runAudio (*p, 2, peak) && peak > 0.01f && peak < 4.0f,
               "voice " + juce::String (v) + " at Character 100 on all 4 takes (peak " + juce::String (peak, 3) + ")");
    }

    std::cout << "quality\n";
    p->setCurrentProgram (0);
    const int normalLatency = p->getLatencySamples();
    setPlain (*p, "quality", 1.0f);   // High
    check (runAudio (*p, 2, peak) && peak > 0.05f && peak < 4.0f, "High quality runs (peak " + juce::String (peak, 3) + ")");
    check (p->getLatencySamples() == normalLatency, "High reports the same latency as Normal");
    {
        // Switch Normal -> High -> Normal while audio is running
        setPlain (*p, "quality", 0.0f);
        p->setPlayConfigDetails (2, 2, 48000.0, 512);
        p->prepareToPlay (48000.0, 512);
        juce::MidiBuffer midi;
        bool finite = true;
        for (int b = 0; b < 300; ++b)
        {
            if (b == 100) setPlain (*p, "quality", 1.0f);
            if (b == 200) setPlain (*p, "quality", 0.0f);
            juce::AudioBuffer<float> buf (2, 512);
            for (int ch = 0; ch < 2; ++ch)
                for (int s = 0; s < 512; ++s)
                    buf.setSample (ch, s, 0.2f * (float) std::sin (0.05 * (b * 512 + s)));
            p->processBlock (buf, midi);
            for (int ch = 0; ch < 2; ++ch)
                for (int s = 0; s < 512; ++s)
                    finite = finite && std::isfinite (buf.getSample (ch, s));
        }
        check (finite, "switching Quality during playback stays finite");
        check (p->getLatencySamples() == normalLatency, "latency unchanged after switching");
    }
    setPlain (*p, "quality", 0.0f);

    std::cout << (failures == 0 ? "ALL PASSED\n" : juce::String (failures) + " FAILED\n");
    return failures == 0 ? 0 : 1;
}
