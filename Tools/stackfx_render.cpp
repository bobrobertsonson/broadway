// stackfx_render: run the StackFX DSP offline on a WAV file.
//   stackfx_render input.wav output.wav [flags]   (run with no arguments for the flag list)
// Output is stereo 32-bit float WAV (never clips), latency-compensated (aligned with the input).
// --stems also writes the lead and each take to their own files (output_lead.wav, output_takeA.wav ...).
// --sweep is a stress test: every control moves during the render, like heavy automation.

#include <juce_audio_formats/juce_audio_formats.h>
#include "StackEngine.h"
#include <iostream>

static juce::String voiceList()
{
    juce::StringArray names;
    for (int v = 0; v < StackEngine::getNumVoices(); ++v)
        names.add (juce::String (v) + "=" + StackEngine::getVoiceName (v));
    return names.joinIntoString (", ");
}

// Voice by number or by name (case and spaces ignored), -1 if unknown
static int parseVoice (const juce::String& s)
{
    if (s.containsOnly ("0123456789"))
        return juce::isPositiveAndBelow (s.getIntValue(), StackEngine::getNumVoices()) ? s.getIntValue() : -1;
    for (int v = 0; v < StackEngine::getNumVoices(); ++v)
        if (juce::String (StackEngine::getVoiceName (v)).removeCharacters (" ").equalsIgnoreCase (s.removeCharacters (" -_")))
            return v;
    return -1;
}

static void usage()
{
    std::cerr <<
        "usage: stackfx_render input.wav output.wav [flags]\n"
        "  global (0-100): --tightness --texture --rasp --dynamics --pitchdrift --room --imagelock --width --mix\n"
        "                  --deess --space --character (sets every take)\n"
        "  --takes 2-4  --seed 1-100  --lowcut Hz  --highcut Hz  --gate dB  --input dB  --output dB\n"
        "  per take (N = 1-4 for A-D): --takeN-level dB --takeN-pan -100..100 --takeN-char 0-100\n"
        "                              --takeN-voice name|number (see --voice)\n"
        "                              --takeN-seed 1-999 --takeN-mute 0/1 --takeN-solo 0/1\n"
        "  --lead-mute 0/1  --lead-solo 0/1  --link 0/1  --quality 0/1 (Normal/High)\n"
        "  --voice name|number   every take's voice: " << voiceList() << "\n"
        "  --stems   also write the lead and each take to separate files\n"
        "  --sweep   stress test: every control moves during the render\n";
}

static bool highQuality = false;

static bool render (const juce::AudioBuffer<float>& input, int numIn, int len, double sr, const StackParams& p,
                    bool sweep, const juce::File& outFile, int& latencyOut)
{
    StackEngine engine;
    engine.setHighQuality (highQuality);
    engine.setParameters (p);
    engine.prepare (sr, 512);
    const int latency = engine.getLatencySamples();
    latencyOut = latency;
    const int tail = (int) (0.5 * sr);   // late takes, reflections and some Space tail
    const int total = len + latency + tail;

    juce::AudioBuffer<float> output (2, total);
    for (int pos = 0; pos < total; pos += 512)
    {
        const int n = juce::jmin (512, total - pos);
        if (sweep)
        {
            // Every control moves: slow sweeps, plus jumps for Takes, seeds, mutes and solos
            const double t = pos / sr;
            auto tri = [t] (double period) { return (float) (1.0 - std::abs (std::fmod (t / period, 2.0) - 1.0)); };
            StackParams q = p;
            q.takes = 2 + (int) std::fmod (t / 2.5, 3.0);
            q.seed = 1 + (int) (t / 3.0);
            q.tightness = tri (7.0);  q.texture = tri (6.0);  q.rasp = tri (4.0);
            q.dynamics = tri (3.0);   q.pitchDrift = tri (8.0); q.room = tri (4.5);
            q.width = tri (3.5);      q.mix = tri (6.5);      q.deEss = tri (5.5);
            q.space = tri (9.0);      q.lowCutHz = 20.0f + 400.0f * tri (7.5);
            q.highCutHz = 2000.0f + 18000.0f * tri (6.2);
            q.gateDb = -80.0f + 50.0f * tri (11.0);
            for (int k = 0; k < 4; ++k)
            {
                auto& tk = q.take[(size_t) k];
                tk.character = tri (5.0 + k);
                tk.levelDb = -12.0f + 12.0f * tri (4.0 + k);
                tk.pan = 2.0f * tri (3.0 + k) - 1.0f;
                tk.seed = 1 + (int) (t / (2.0 + k));
                tk.mute = std::fmod (t + k, 7.0) < 0.5;
            }
            q.take[1].solo = std::fmod (t, 10.0) > 9.0;
            q.leadMute = std::fmod (t, 8.0) > 7.0;
            q.link = std::fmod (t, 12.0) > 6.0;
            q.applyLink();
            engine.setParameters (q);
        }
        const float* in[2] = { input.getReadPointer (0, pos), input.getReadPointer (numIn - 1, pos) };
        engine.process (in, numIn, output.getWritePointer (0, pos), output.getWritePointer (1, pos), n);
    }

    // The float WAV keeps peaks over 0 dBFS intact, but flag them: a fixed-point bounce would clip.
    const float peak = juce::jmax (output.getMagnitude (0, latency, len + tail), output.getMagnitude (1, latency, len + tail));
    if (peak > 1.0f)
        std::cerr << "warning: " << outFile.getFileName() << " peaks at +" << juce::Decibels::gainToDecibels (peak)
                  << " dBFS (kept intact in the float WAV; lower the input or Output before a fixed-point bounce)\n";

    outFile.deleteFile();
    std::unique_ptr<juce::OutputStream> stream (outFile.createOutputStream());
    juce::WavAudioFormat wav;
    std::unique_ptr<juce::AudioFormatWriter> writer (stream == nullptr ? nullptr
        : wav.createWriterFor (stream.get(), sr, 2, 32, {}, 0));
    if (writer == nullptr)
    {
        std::cerr << "cannot write " << outFile.getFullPathName() << "\n";
        return false;
    }
    stream.release();   // writer owns it now

    // Skip the engine latency so output lines up with the input.
    writer->writeFromAudioSampleBuffer (output, latency, len + tail);
    return true;
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
    bool sweep = false, stems = false;
    for (int i = 3; i < argc; ++i)
    {
        const juce::String flag (argv[i]);
        if (flag == "--sweep") { sweep = true; continue; }
        if (flag == "--stems") { stems = true; continue; }
        if (i + 1 >= argc)
        {
            std::cerr << "missing value for " << flag << "\n";
            return 1;
        }
        const juce::String arg (argv[++i]);
        const float v = arg.getFloatValue();
        const float pct = juce::jlimit (0.0f, 100.0f, v) * 0.01f;

        if (flag.startsWith ("--take") && flag.length() > 7 && flag[7] == '-')
        {
            const int k = flag[6] - '1';
            if (k < 0 || k > 3)
            {
                std::cerr << "take number must be 1-4: " << flag << "\n";
                return 1;
            }
            auto& t = p.take[(size_t) k];
            const auto what = flag.substring (8);
            if      (what == "level") t.levelDb   = juce::jlimit (-24.0f, 6.0f, v);
            else if (what == "pan")   t.pan       = juce::jlimit (-100.0f, 100.0f, v) * 0.01f;
            else if (what == "char")  t.character = pct;
            else if (what == "voice")
            {
                t.voice = parseVoice (arg);
                if (t.voice < 0) { std::cerr << "unknown voice " << arg << ": " << voiceList() << "\n"; return 1; }
            }
            else if (what == "seed")  t.seed      = juce::jlimit (1, 999, juce::roundToInt (v));
            else if (what == "mute")  t.mute      = v > 0.5f;
            else if (what == "solo")  t.solo      = v > 0.5f;
            else { std::cerr << "unknown flag " << flag << "\n"; usage(); return 1; }
            continue;
        }

        if      (flag == "--takes")      p.takes      = juce::jlimit (2, 4, juce::roundToInt (v));
        else if (flag == "--tightness")  p.tightness  = pct;
        else if (flag == "--texture")    p.texture    = pct;
        else if (flag == "--rasp")       p.rasp       = pct;
        else if (flag == "--dynamics")   p.dynamics   = pct;
        else if (flag == "--pitchdrift") p.pitchDrift = pct;
        else if (flag == "--room")       p.room       = pct;
        else if (flag == "--imagelock")  p.imageLock  = pct;
        else if (flag == "--width")      p.width      = pct;
        else if (flag == "--mix")        p.mix        = pct;
        else if (flag == "--deess")      p.deEss      = pct;
        else if (flag == "--space")      p.space      = pct;
        else if (flag == "--character")  p.setAllCharacters (pct);
        else if (flag == "--voice")
        {
            const int vv = parseVoice (arg);
            if (vv < 0) { std::cerr << "unknown voice " << arg << ": " << voiceList() << "\n"; return 1; }
            p.setAllVoices (vv);
        }
        else if (flag == "--seed")       p.seed       = juce::jlimit (1, 100, juce::roundToInt (v));
        else if (flag == "--lowcut")     p.lowCutHz   = juce::jlimit (20.0f, 500.0f, v);
        else if (flag == "--highcut")    p.highCutHz  = juce::jlimit (2000.0f, 20000.0f, v);
        else if (flag == "--gate")       p.gateDb     = juce::jlimit (-80.0f, 0.0f, v);
        else if (flag == "--input")      p.inputDb    = juce::jlimit (-24.0f, 12.0f, v);
        else if (flag == "--output")     p.outputDb   = juce::jlimit (-24.0f, 12.0f, v);
        else if (flag == "--lead-mute")  p.leadMute   = v > 0.5f;
        else if (flag == "--lead-solo")  p.leadSolo   = v > 0.5f;
        else if (flag == "--link")       p.link       = v > 0.5f;
        else if (flag == "--quality")    highQuality  = v > 0.5f;
        else { std::cerr << "unknown flag " << flag << "\n"; usage(); return 1; }
    }
    p.applyLink();

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
    const int padding = (int) (0.6 * sr) + 8192;   // room for latency and tails
    juce::AudioBuffer<float> input (numIn, len + padding);
    input.clear();
    reader->read (&input, 0, len, 0, true, numIn > 1);

    int latency = 0;
    if (! render (input, numIn, len, sr, p, sweep, outFile, latency))
        return 1;

    if (stems)
    {
        // Same settings, one source soloed at a time: the takes are identical to the ones in the mix
        auto stemFile = [&outFile] (const juce::String& suffix)
        {
            return outFile.getSiblingFile (outFile.getFileNameWithoutExtension() + "_" + suffix + ".wav");
        };
        StackParams q = p;
        q.leadMute = false;
        for (auto& t : q.take) { t.solo = false; t.mute = false; }
        q.mix = 0.5f;   // full lead and full stack, so each stem is at its in-mix level before Mix

        StackParams lead = q;
        lead.leadSolo = true;
        if (! render (input, numIn, len, sr, lead, false, stemFile ("lead"), latency))
            return 1;
        for (int k = 0; k < p.takes; ++k)
        {
            StackParams one = q;
            one.take[(size_t) k].solo = true;
            if (! render (input, numIn, len, sr, one, false, stemFile (juce::String ("take") + "ABCD"[k]), latency))
                return 1;
        }
    }

    std::cout << "rendered " << outFile.getFileName() << (stems ? " (+ stems)" : "") << "  takes=" << p.takes
              << " tightness=" << p.tightness * 100 << " texture=" << p.texture * 100 << " rasp=" << p.rasp * 100
              << " dynamics=" << p.dynamics * 100 << " pitchdrift=" << p.pitchDrift * 100 << " room=" << p.room * 100
              << " width=" << p.width * 100 << " mix=" << p.mix * 100 << " deess=" << p.deEss * 100
              << " space=" << p.space * 100 << " seed=" << p.seed << "  (" << len << " samples @ " << sr
              << " Hz, latency " << latency << " samples)\n";
    return 0;
}
