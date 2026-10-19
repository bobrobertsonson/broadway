#include "PluginProcessor.h"

juce::AudioProcessorValueTreeState::ParameterLayout StackFXProcessor::createLayout()
{
    using namespace juce;
    auto pct = [] (const char* id, const char* name, float def)
    {
        return std::make_unique<AudioParameterFloat> (ParameterID { id, 1 }, name,
                                                      NormalisableRange<float> (0.0f, 100.0f, 0.1f), def,
                                                      AudioParameterFloatAttributes().withLabel ("%"));
    };

    AudioProcessorValueTreeState::ParameterLayout layout;
    layout.add (std::make_unique<AudioParameterInt> (ParameterID { "takes", 1 }, "Takes", 2, 4, 2));
    layout.add (pct ("tightness", "Tightness", 70.0f));
    layout.add (pct ("variation", "Variation", 50.0f));
    layout.add (pct ("width",     "Width",     80.0f));
    layout.add (pct ("mix",       "Mix",       50.0f));
    return layout;
}

StackFXProcessor::StackFXProcessor()
    : AudioProcessor (BusesProperties()
                          .withInput  ("Input",  juce::AudioChannelSet::stereo(), true)
                          .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      apvts (*this, nullptr, "StackFX", createLayout())
{
    takesParam     = apvts.getRawParameterValue ("takes");
    tightnessParam = apvts.getRawParameterValue ("tightness");
    variationParam = apvts.getRawParameterValue ("variation");
    widthParam     = apvts.getRawParameterValue ("width");
    mixParam       = apvts.getRawParameterValue ("mix");
}

bool StackFXProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    const auto in  = layouts.getMainInputChannelSet();
    const auto out = layouts.getMainOutputChannelSet();
    return out == juce::AudioChannelSet::stereo()
        && (in == juce::AudioChannelSet::mono() || in == juce::AudioChannelSet::stereo());
}

void StackFXProcessor::pushParameters()
{
    StackParams p;
    p.takes     = juce::roundToInt (takesParam->load());
    p.tightness = tightnessParam->load() * 0.01f;
    p.variation = variationParam->load() * 0.01f;
    p.width     = widthParam->load() * 0.01f;
    p.mix       = mixParam->load() * 0.01f;
    engine.setParameters (p);
}

void StackFXProcessor::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    pushParameters();
    engine.prepare (sampleRate, samplesPerBlock);
    setLatencySamples (StackEngine::getLatencySamples());
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

    pushParameters();

    // The engine reads each input sample before writing that output sample, so in-place is safe.
    const float* in[2] = { buffer.getReadPointer (0), buffer.getReadPointer (numIn > 1 ? 1 : 0) };
    engine.process (in, numIn, buffer.getWritePointer (0), buffer.getWritePointer (1), n);
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
