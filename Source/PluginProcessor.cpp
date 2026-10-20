#include "PluginProcessor.h"

namespace
{
    const char* const takeNames[] = { "A", "B", "C", "D" };
    constexpr float defaultPans[] = { -100.0f, 100.0f, -60.0f, 60.0f };

    juce::String takeId (int k, const char* what) { return juce::String ("take") + takeNames[k] + what; }

    // Factory presets: parameter id -> plain value. Anything not listed goes back to its default.
    struct Preset
    {
        const char* name;
        std::vector<std::pair<const char*, float>> values;
    };

    const std::vector<Preset>& presets()
    {
        static const std::vector<Preset> list {
            { "Default", {} },
            { "Tight Double", { { "tightness", 75 }, { "dynamics", 30 }, { "pitchdrift", 15 }, { "rasp", 30 } } },
            { "Wide Quad", { { "takes", 4 } } },
            { "Someone Else", { { "takeAcharacter", 100 }, { "takeBcharacter", 100 } } },
            { "You + Someone Else", { { "takes", 4 }, { "takeCcharacter", 100 }, { "takeDcharacter", 100 } } },
            { "Gang Vocal", { { "takes", 4 }, { "tightness", 15 }, { "dynamics", 70 },
                              { "takeAvoice", 5 }, { "takeAcharacter", 70 },     // Gravel
                              { "takeBvoice", 3 }, { "takeBcharacter", 100 },    // Deep Growler
                              { "takeCvoice", 4 }, { "takeCcharacter", 70 },     // High Shrieker
                              { "takeDvoice", 8 }, { "takeDcharacter", 80 },     // Chesty
                              { "space", 30 }, { "deess", 40 } } },
            { "Growl Section", { { "takes", 4 }, { "tightness", 30 },
                                 { "takeAvoice", 3 }, { "takeAcharacter", 100 }, { "takeBvoice", 3 }, { "takeBcharacter", 100 },
                                 { "takeCvoice", 8 }, { "takeCcharacter", 80 }, { "takeDvoice", 5 }, { "takeDcharacter", 80 } } },
            { "Shriek Section", { { "takes", 4 }, { "tightness", 35 },
                                  { "takeAvoice", 4 }, { "takeAcharacter", 100 }, { "takeBvoice", 4 }, { "takeBcharacter", 100 },
                                  { "takeCvoice", 9 }, { "takeCcharacter", 80 }, { "takeDvoice", 6 }, { "takeDcharacter", 70 },
                                  { "deess", 50 } } },
            { "Backing Layer Only", { { "leadmute", 1 } } },
        };
        return list;
    }
}

juce::AudioProcessorValueTreeState::ParameterLayout StackFXProcessor::createLayout()
{
    using namespace juce;
    auto pct = [] (const String& id, const String& name, float def)
    {
        return std::make_unique<AudioParameterFloat> (ParameterID { id, 1 }, name,
                                                      NormalisableRange<float> (0.0f, 100.0f, 0.1f), def,
                                                      AudioParameterFloatAttributes().withLabel ("%"));
    };
    auto db = [] (const String& id, const String& name, float lo, float hi, float def)
    {
        return std::make_unique<AudioParameterFloat> (ParameterID { id, 1 }, name,
                                                      NormalisableRange<float> (lo, hi, 0.1f), def,
                                                      AudioParameterFloatAttributes().withLabel ("dB"));
    };
    auto hz = [] (const String& id, const String& name, float lo, float hi, float def)
    {
        NormalisableRange<float> r (lo, hi, 1.0f);
        r.setSkewForCentre (std::sqrt (lo * hi));
        return std::make_unique<AudioParameterFloat> (ParameterID { id, 1 }, name, r, def,
                                                      AudioParameterFloatAttributes().withLabel ("Hz"));
    };
    auto toggle = [] (const String& id, const String& name)
    {
        return std::make_unique<AudioParameterBool> (ParameterID { id, 1 }, name, false);
    };

    AudioProcessorValueTreeState::ParameterLayout layout;
    layout.add (std::make_unique<AudioParameterInt> (ParameterID { "takes", 1 }, "Takes", 2, 4, 2));
    layout.add (pct ("tightness",  "Tightness",   40.0f));
    layout.add (pct ("texture",    "Texture",    100.0f));
    layout.add (pct ("rasp",       "Rasp",        50.0f));
    layout.add (pct ("dynamics",   "Dynamics",    50.0f));
    layout.add (pct ("pitchdrift", "Pitch Drift", 30.0f));
    layout.add (pct ("room",       "Room",        50.0f));
    layout.add (pct ("width",      "Width",      100.0f));
    layout.add (pct ("mix",        "Mix",         50.0f));
    layout.add (std::make_unique<AudioParameterInt> (ParameterID { "seed", 1 }, "Seed (all takes)", 1, 100, 1));

    for (int k = 0; k < 4; ++k)
    {
        const String n = String ("Take ") + takeNames[k] + " ";
        layout.add (db (takeId (k, "level"), n + "Level", -24.0f, 6.0f, 0.0f));
        layout.add (std::make_unique<AudioParameterFloat> (ParameterID { takeId (k, "pan"), 1 }, n + "Pan",
                                                           NormalisableRange<float> (-100.0f, 100.0f, 1.0f), defaultPans[k]));
        layout.add (pct (takeId (k, "character"), n + "Character", 0.0f));
        StringArray voiceNames;
        for (int v = 0; v < StackEngine::getNumVoices(); ++v)
            voiceNames.add (StackEngine::getVoiceName (v));
        layout.add (std::make_unique<AudioParameterChoice> (ParameterID { takeId (k, "voice"), 1 }, n + "Voice", voiceNames, 0));
        layout.add (std::make_unique<AudioParameterInt> (ParameterID { takeId (k, "seed"), 1 }, n + "Seed", 1, 999, 1 + k * 101));
        layout.add (toggle (takeId (k, "mute"), n + "Mute"));
        layout.add (toggle (takeId (k, "solo"), n + "Solo"));
    }
    layout.add (toggle ("link", "Link (B follows A, D follows C)"));
    layout.add (toggle ("leadmute", "Lead Mute"));
    layout.add (toggle ("leadsolo", "Lead Solo"));

    layout.add (pct ("deess", "Takes De-ess", 0.0f));
    layout.add (hz ("lowcut", "Takes Low Cut", 20.0f, 500.0f, 80.0f));
    layout.add (hz ("highcut", "Takes High Cut", 2000.0f, 20000.0f, 20000.0f));
    layout.add (pct ("space", "Takes Space", 0.0f));
    layout.add (db ("gate", "Takes Gate", -80.0f, 0.0f, -80.0f));
    layout.add (std::make_unique<AudioParameterChoice> (ParameterID { "quality", 1 }, "Quality",
                                                        StringArray { "Normal", "High", "Auto (High when bouncing)" }, 0));
    layout.add (db ("input", "Input", -24.0f, 12.0f, 0.0f));
    layout.add (db ("output", "Output", -24.0f, 12.0f, 0.0f));
    return layout;
}

StackFXProcessor::StackFXProcessor()
    : AudioProcessor (BusesProperties()
                          .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                          .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      apvts (*this, nullptr, "StackFX", createLayout())
{
}

bool StackFXProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    const auto in  = layouts.getMainInputChannelSet();
    const auto out = layouts.getMainOutputChannelSet();
    return out == juce::AudioChannelSet::stereo()
        && (in == juce::AudioChannelSet::mono() || in == juce::AudioChannelSet::stereo());
}

StackParams StackFXProcessor::readParameters() const
{
    StackParams p;
    p.takes      = juce::roundToInt (value ("takes"));
    p.tightness  = value ("tightness") * 0.01f;
    p.texture    = value ("texture") * 0.01f;
    p.rasp       = value ("rasp") * 0.01f;
    p.dynamics   = value ("dynamics") * 0.01f;
    p.pitchDrift = value ("pitchdrift") * 0.01f;
    p.room       = value ("room") * 0.01f;
    p.width      = value ("width") * 0.01f;
    p.mix        = value ("mix") * 0.01f;
    p.seed       = juce::roundToInt (value ("seed"));
    for (int k = 0; k < 4; ++k)
    {
        auto& t = p.take[(size_t) k];
        t.levelDb   = value (takeId (k, "level"));
        t.pan       = value (takeId (k, "pan")) * 0.01f;
        t.character = value (takeId (k, "character")) * 0.01f;
        t.voice     = juce::roundToInt (value (takeId (k, "voice")));
        t.seed      = juce::roundToInt (value (takeId (k, "seed")));
        t.mute      = value (takeId (k, "mute")) > 0.5f;
        t.solo      = value (takeId (k, "solo")) > 0.5f;
    }
    p.link     = value ("link") > 0.5f;
    p.leadMute = value ("leadmute") > 0.5f;
    p.leadSolo = value ("leadsolo") > 0.5f;
    p.deEss     = value ("deess") * 0.01f;
    p.lowCutHz  = value ("lowcut");
    p.highCutHz = value ("highcut");
    p.space     = value ("space") * 0.01f;
    p.gateDb    = value ("gate");
    p.inputDb   = value ("input");
    p.outputDb  = value ("output");
    p.applyLink();
    return p;
}

bool StackFXProcessor::wantHighQuality() const
{
    const int q = juce::roundToInt (value ("quality"));
    return q == 1 || (q == 2 && isNonRealtime());
}

void StackFXProcessor::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    engine.setParameters (readParameters());
    engine.setHighQuality (wantHighQuality());
    engine.prepare (sampleRate, samplesPerBlock);
    setLatencySamples (engine.getLatencySamples());
}

void StackFXProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer&)
{
    juce::ScopedNoDenormals noDenormals;
    const int numIn = getTotalNumInputChannels();
    const int n = buffer.getNumSamples();
    if (buffer.getNumChannels() < 2)
        return;
    if (numIn == 0)
    {
        buffer.clear();
        return;
    }

    engine.setParameters (readParameters());

    // Quality changed (by the user, or Auto seeing an offline bounce): restart the engine at the new
    // frame size. Latency is identical in both modes, so the host's compensation stays valid.
    if (wantHighQuality() != engine.isHighQuality())
    {
        engine.setHighQuality (wantHighQuality());
        engine.prepare (getSampleRate(), juce::jmax (n, getBlockSize()));
    }

    // The engine reads a whole chunk of input before writing that chunk's output, so in-place is safe.
    const float* in[2] = { buffer.getReadPointer (0), buffer.getReadPointer (numIn > 1 ? 1 : 0) };
    engine.process (in, numIn, buffer.getWritePointer (0), buffer.getWritePointer (1), n);
}

int StackFXProcessor::getNumPrograms() { return (int) presets().size(); }

const juce::String StackFXProcessor::getProgramName (int index)
{
    return juce::isPositiveAndBelow (index, getNumPrograms()) ? presets()[(size_t) index].name : "";
}

void StackFXProcessor::setCurrentProgram (int index)
{
    if (! juce::isPositiveAndBelow (index, getNumPrograms()))
        return;
    currentProgram = index;

    // Everything back to default, then apply the preset's values
    for (auto* param : getParameters())
        if (auto* p = dynamic_cast<juce::RangedAudioParameter*> (param))
            p->setValueNotifyingHost (p->getDefaultValue());
    for (const auto& [id, v] : presets()[(size_t) index].values)
        if (auto* p = apvts.getParameter (id))
            p->setValueNotifyingHost (p->convertTo0to1 (v));
}

void StackFXProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    if (auto xml = apvts.copyState().createXml())
        copyXmlToBinary (*xml, destData);
}

void StackFXProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    if (auto xml = getXmlFromBinary (data, sizeInBytes))
        if (xml->hasTagName (apvts.state.getType()))
            apvts.replaceState (juce::ValueTree::fromXml (*xml));
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() { return new StackFXProcessor(); }
