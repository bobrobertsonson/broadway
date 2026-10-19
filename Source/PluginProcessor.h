#pragma once
#include <juce_audio_processors/juce_audio_processors.h>
#include "StackEngine.h"

class StackFXProcessor : public juce::AudioProcessor
{
public:
    StackFXProcessor();

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override {}
    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;
    using AudioProcessor::processBlock;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override { return new juce::GenericAudioProcessorEditor (*this); }
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "StackFX"; }
    bool acceptsMidi() const override { return false; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.1; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock&) override;
    void setStateInformation (const void*, int) override;

    juce::AudioProcessorValueTreeState apvts;

private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createLayout();
    void pushParameters();

    StackEngine engine;
    std::atomic<float>* takesParam = nullptr;
    std::atomic<float>* tightnessParam = nullptr;
    std::atomic<float>* characterParam = nullptr;
    std::atomic<float>* textureParam = nullptr;
    std::atomic<float>* raspParam = nullptr;
    std::atomic<float>* dynamicsParam = nullptr;
    std::atomic<float>* pitchDriftParam = nullptr;
    std::atomic<float>* roomParam = nullptr;
    std::atomic<float>* widthParam = nullptr;
    std::atomic<float>* mixParam = nullptr;
    std::atomic<float>* outputParam = nullptr;
    std::atomic<float>* seedParam = nullptr;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (StackFXProcessor)
};
