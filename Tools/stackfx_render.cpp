// stackfx_render: run the StackFX DSP offline on a WAV file.
//   stackfx_render input.wav output.wav [--takes 2-4] [--tightness 0-100]
//                  [--variation 0-100] [--width 0-100] [--mix 0-100]
// Output is stereo 32-bit float WAV (never clips), latency-compensated (aligned with the input).

#include <juce_audio_formats/juce_audio_formats.h>
#include "StackEngine.h"
#include <iostream>

static void usage()
{
    std::cerr << "usage: stackfx_render input.wav output.wav [--takes 2-4] [--tightness 0-100]\n"
                 "                      [--variation 0-100] [--width 0-100] [--mix 0-100]\n";
}

int main (int argc, char* argv[])
{
    if (argc < 3)
    {
        usage();
        return 1;
    }

    const juce::File inFile  = juce::File::getCurrentWorkingDirectory().getChildFile (argv[1]);
    const juce::File outFile = juce::File::getCurrentWorkingDirectory().getChildFile (argv[2]);

    StackParams p;
    for (int i = 3; i < argc; ++i)
    {
        const juce::String flag (argv[i]);
        if (i + 1 >= argc)
        {
            std::cerr << "missing value for " << flag << "\n";
            return 1;
        }
        const float v = juce::String (argv[++i]).getFloatValue();
        if      (flag == "--takes")     p.takes     = juce::jlimit (2, 4, juce::roundToInt (v));
        else if (flag == "--tightness") p.tightness = juce::jlimit (0.0f, 100.0f, v) * 0.01f;
        else if (flag == "--variation") p.variation = juce::jlimit (0.0f, 100.0f, v) * 0.01f;
        else if (flag == "--width")     p.width     = juce::jlimit (0.0f, 100.0f, v) * 0.01f;
        else if (flag == "--mix")       p.mix       = juce::jlimit (0.0f, 100.0f, v) * 0.01f;
        else
        {
            std::cerr << "unknown flag " << flag << "\n";
            usage();
            return 1;
        }
    }

    juce::AudioFormatManager formats;
    formats.registerBasicFormats();
    std::unique_ptr<juce::AudioFormatReader> reader (formats.createReaderFor (inFile));
    if (reader == nullptr)
    {
        std::cerr << "cannot read " << inFile.getFullPathName() << "\n";
        return 1;
    }

    const double sr = reader->sampleRate;
    const int numIn = juce::jlimit (1, 2, (int) reader->numChannels);
    const int len = (int) reader->lengthInSamples;
    const int latency = StackEngine::getLatencySamples();
    const int tail = (int) (0.05 * sr);   // room for the per-take delays
    const int total = len + latency + tail;

    juce::AudioBuffer<float> input (numIn, total);
    input.clear();
    reader->read (&input, 0, len, 0, true, numIn > 1);

    StackEngine engine;
    engine.setParameters (p);
    engine.prepare (sr, 512);

    juce::AudioBuffer<float> output (2, total);
    for (int pos = 0; pos < total; pos += 512)
    {
        const int n = juce::jmin (512, total - pos);
        const float* in[2] = { input.getReadPointer (0, pos), input.getReadPointer (numIn - 1, pos) };
        engine.process (in, numIn, output.getWritePointer (0, pos), output.getWritePointer (1, pos), n);
    }

    // The float WAV keeps peaks over 0 dBFS intact, but flag them: a fixed-point bounce would clip.
    const float peak = juce::jmax (output.getMagnitude (0, latency, len + tail), output.getMagnitude (1, latency, len + tail));
    if (peak > 1.0f)
        std::cerr << "warning: output peaks at +" << juce::Decibels::gainToDecibels (peak)
                  << " dBFS (kept intact in the float WAV; lower the input or Mix before a fixed-point bounce)\n";

    outFile.deleteFile();
    std::unique_ptr<juce::OutputStream> stream (outFile.createOutputStream());
    juce::WavAudioFormat wav;
    std::unique_ptr<juce::AudioFormatWriter> writer (stream == nullptr ? nullptr
        : wav.createWriterFor (stream.get(), sr, 2, 32, {}, 0));
    if (writer == nullptr)
    {
        std::cerr << "cannot write " << outFile.getFullPathName() << "\n";
        return 1;
    }
    stream.release();   // writer owns it now

    // Skip the engine latency so output lines up with the input.
    writer->writeFromAudioSampleBuffer (output, latency, len + tail);
    writer.reset();

    std::cout << "rendered " << outFile.getFileName() << "  takes=" << p.takes
              << " tightness=" << p.tightness * 100 << " variation=" << p.variation * 100
              << " width=" << p.width * 100 << " mix=" << p.mix * 100
              << "  (" << len << " samples @ " << sr << " Hz, "
              << engine.getPhraseChangeCount() << " phrase re-timings)\n";
    return 0;
}
