// stackfx_render: run the StackFX DSP offline on a WAV file.
//   stackfx_render input.wav output.wav [--takes 2-4] [--tightness 0-100] [--character 0-100]
//       [--texture 0-100] [--rasp 0-100] [--dynamics 0-100] [--pitchdrift 0-100] [--room 0-100]
//       [--width 0-100] [--mix 0-100] [--output dB] [--seed 1-100] [--sweep]
// --sweep is a stress test: every control moves during the render, like heavy automation.
// Output is stereo 32-bit float WAV (never clips), latency-compensated (aligned with the input).

#include <juce_audio_formats/juce_audio_formats.h>
#include "StackEngine.h"
#include <iostream>

static void usage()
{
    std::cerr << "usage: stackfx_render input.wav output.wav [--takes 2-4] [--tightness 0-100] [--character 0-100]\n"
                 "         [--texture 0-100] [--rasp 0-100] [--dynamics 0-100] [--pitchdrift 0-100] [--room 0-100]\n"
                 "         [--width 0-100] [--mix 0-100] [--output dB] [--seed 1-100] [--sweep]\n";
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
    bool sweep = false;
    for (int i = 3; i < argc; ++i)
    {
        const juce::String flag (argv[i]);
        if (flag == "--sweep")
        {
            sweep = true;
            continue;
        }
        if (i + 1 >= argc)
        {
            std::cerr << "missing value for " << flag << "\n";
            return 1;
        }
        const float v = juce::String (argv[++i]).getFloatValue();
        const float pct = juce::jlimit (0.0f, 100.0f, v) * 0.01f;
        if      (flag == "--takes")      p.takes      = juce::jlimit (2, 4, juce::roundToInt (v));
        else if (flag == "--tightness")  p.tightness  = pct;
        else if (flag == "--character")  p.character  = pct;
        else if (flag == "--texture")    p.texture    = pct;
        else if (flag == "--rasp")       p.rasp       = pct;
        else if (flag == "--dynamics")   p.dynamics   = pct;
        else if (flag == "--pitchdrift") p.pitchDrift = pct;
        else if (flag == "--room")       p.room       = pct;
        else if (flag == "--width")      p.width      = pct;
        else if (flag == "--mix")        p.mix        = pct;
        else if (flag == "--output")     p.outputDb   = juce::jlimit (-24.0f, 12.0f, v);
        else if (flag == "--seed")       p.seed       = juce::jlimit (1, 100, juce::roundToInt (v));
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
    StackEngine engine;
    engine.setParameters (p);
    engine.prepare (sr, 512);
    const int latency = engine.getLatencySamples();
    const int tail = (int) (0.1 * sr);   // room for late takes and reflections
    const int total = len + latency + tail;

    juce::AudioBuffer<float> input (numIn, total);
    input.clear();
    reader->read (&input, 0, len, 0, true, numIn > 1);

    juce::AudioBuffer<float> output (2, total);
    for (int pos = 0; pos < total; pos += 512)
    {
        const int n = juce::jmin (512, total - pos);
        if (sweep)
        {
            // Every control moves: slow sweeps, plus jumps for Takes and Seed
            const double t = pos / sr;
            auto tri = [t] (double period) { return (float) (1.0 - std::abs (std::fmod (t / period, 2.0) - 1.0)); };
            StackParams q = p;
            q.takes = 2 + (int) std::fmod (t / 2.5, 3.0);
            q.seed = 1 + (int) (t / 3.0);
            q.tightness = tri (7.0);  q.character = tri (5.0);  q.texture = tri (6.0);
            q.rasp = tri (4.0);       q.dynamics = tri (3.0);   q.pitchDrift = tri (8.0);
            q.room = tri (4.5);       q.width = tri (3.5);      q.mix = tri (6.5);
            engine.setParameters (q);
        }
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
              << " tightness=" << p.tightness * 100 << " character=" << p.character * 100
              << " texture=" << p.texture * 100 << " rasp=" << p.rasp * 100 << " dynamics=" << p.dynamics * 100
              << " pitchdrift=" << p.pitchDrift * 100 << " room=" << p.room * 100
              << " width=" << p.width * 100 << " mix=" << p.mix * 100 << " output=" << p.outputDb
              << " seed=" << p.seed << "  (" << len << " samples @ " << sr << " Hz, latency "
              << latency << " samples)\n";
    return 0;
}
