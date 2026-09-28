#!/bin/bash
# Triggers macOS permission prompts and reports what still needs granting.
# Run it from the same terminal app you will run start.sh from.
cd "$(dirname "$0")"
ok=1

echo "1/4 Automation (control System Events)…"
if osascript -e 'tell application "System Events" to get name of first process' >/dev/null 2>&1; then
  echo "    OK"
else
  echo "    MISSING: allow it in the prompt, or System Settings > Privacy & Security > Automation"; ok=0
fi

echo "2/4 Accessibility (menus, keys, faders)…"
if osascript -e 'tell application "System Events" to get name of menu bar items of menu bar 1 of process "Finder"' >/dev/null 2>&1; then
  echo "    OK"
else
  echo "    MISSING: System Settings > Privacy & Security > Accessibility > turn on your terminal app"; ok=0
fi

echo "3/4 Screen Recording (screenshots)…"
shot="$HOME/LogicBridge/check.png"; mkdir -p "$HOME/LogicBridge"; rm -f "$shot"
if screencapture -x "$shot" 2>/dev/null && [ -s "$shot" ]; then
  echo "    Captured $shot. Open it: if it shows your windows, OK. If only the wallpaper,"
  echo "    turn on your terminal app in Privacy & Security > Screen & System Audio Recording, then quit and reopen the terminal."
else
  echo "    MISSING: Privacy & Security > Screen & System Audio Recording > turn on your terminal app, then restart it"; ok=0
fi

echo "4/4 Automation (control Logic Pro)…"
logic=""
for n in "Logic Pro" "Logic Pro X"; do
  if osascript -e "id of application \"$n\"" >/dev/null 2>&1; then logic="$n"; break; fi
done
if [ -z "$logic" ]; then
  echo "    Logic Pro not found in /Applications"; ok=0
elif osascript -e "tell application \"$logic\" to activate" >/dev/null 2>&1; then
  echo "    OK ($logic)"
else
  echo "    MISSING: allow control of $logic in the prompt, or Privacy & Security > Automation"; ok=0
fi

echo
[ $ok = 1 ] && echo "All set (check the screenshot). Next: Logic key commands, then ./start.sh" || echo "Fix the items above and run ./check.sh again."
