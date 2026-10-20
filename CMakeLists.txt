cmake_minimum_required(VERSION 3.22)

# Must come before project(). Universal binary (Apple Silicon + Intel) on macOS.
set(CMAKE_OSX_ARCHITECTURES "arm64;x86_64" CACHE STRING "")
set(CMAKE_OSX_DEPLOYMENT_TARGET "11.0" CACHE STRING "")

project(StackFX VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG        8.0.9
    GIT_SHALLOW    ON)
FetchContent_MakeAvailable(JUCE)

# AU only exists on macOS
set(STACKFX_FORMATS VST3 Standalone)
if(APPLE)
    list(APPEND STACKFX_FORMATS AU)
endif()

juce_add_plugin(StackFX
    COMPANY_NAME "StackFX"
    PLUGIN_MANUFACTURER_CODE Stfx
    PLUGIN_CODE Stk1
    FORMATS ${STACKFX_FORMATS}
    PRODUCT_NAME "StackFX"
    IS_SYNTH FALSE
    NEEDS_MIDI_INPUT FALSE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    AU_MAIN_TYPE kAudioUnitType_Effect
    VST3_CATEGORIES Fx
    COPY_PLUGIN_AFTER_BUILD FALSE)

target_sources(StackFX PRIVATE
    Source/PluginProcessor.cpp
    Source/StackEngine.cpp)

target_compile_definitions(StackFX PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
    JUCE_DISPLAY_SPLASH_SCREEN=0)

target_link_libraries(StackFX
    PRIVATE juce::juce_audio_utils juce::juce_dsp
    PUBLIC  juce::juce_recommended_config_flags juce::juce_recommended_warning_flags)

# Offline renderer: same StackEngine, no plugin wrapper
juce_add_console_app(stackfx_render PRODUCT_NAME "stackfx_render")
target_sources(stackfx_render PRIVATE
    Tools/stackfx_render.cpp
    Source/StackEngine.cpp)
target_include_directories(stackfx_render PRIVATE Source)
target_compile_definitions(stackfx_render PRIVATE
    JUCE_WEB_BROWSER=0 JUCE_USE_CURL=0 JUCE_DISPLAY_SPLASH_SCREEN=0)
target_link_libraries(stackfx_render
    PRIVATE juce::juce_audio_formats juce::juce_dsp
    PUBLIC  juce::juce_recommended_config_flags juce::juce_recommended_warning_flags)

# Host-style self test of the real plugin processor (presets, state, mono, odd block sizes)
juce_add_console_app(stackfx_selftest PRODUCT_NAME "stackfx_selftest")
target_sources(stackfx_selftest PRIVATE
    Tests/selftest.cpp
    Source/PluginProcessor.cpp
    Source/StackEngine.cpp)
target_include_directories(stackfx_selftest PRIVATE Source)
target_compile_definitions(stackfx_selftest PRIVATE
    JUCE_WEB_BROWSER=0 JUCE_USE_CURL=0 JUCE_DISPLAY_SPLASH_SCREEN=0)
target_link_libraries(stackfx_selftest
    PRIVATE juce::juce_audio_utils juce::juce_dsp
    PUBLIC  juce::juce_recommended_config_flags juce::juce_recommended_warning_flags)
