#!/bin/bash
# Super Jasmin World 3: A New Magic, Mac launcher.
# Double-click this file in Finder. It opens Super Jasmin World 3.html (the whole game in one
# file, next to this one) in Google Chrome full screen (kiosk mode) with sound allowed, so no
# key press or click is needed before the controller works. Nothing to install. Quit with Cmd+Q.
#
# Chrome opens on the Mac's *main* display. To play on the TV, make the TV the main
# display first: System Settings > Displays > Arrange, drag the menu bar onto the TV.

cd "$(dirname "$0")" || exit 1
SERVER_PID=""
trap '[ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null' EXIT

# The single-file build opens straight from disk: no web server, nothing to install.
SINGLE="Super Jasmin World 3.html"
if [ -f "$SINGLE" ]; then
  URL="file://$(pwd | sed 's/ /%20/g')/$(echo "$SINGLE" | sed 's/ /%20/g')"
else
  # Fallback: serve the folder (needs Python 3 or Node.js).
  PORT=8765
  URL="http://localhost:$PORT/"
  # Use python3 only if it is a real install (Apple's /usr/bin/python3 stub pops up an
  # installer when the developer tools are missing).
  if command -v python3 >/dev/null 2>&1 && { [ "$(command -v python3)" != "/usr/bin/python3" ] || xcode-select -p >/dev/null 2>&1; }; then
    python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
    SERVER_PID=$!
  elif command -v npx >/dev/null 2>&1; then
    npx --yes http-server -p "$PORT" -a 127.0.0.1 -c-1 -s &
    SERVER_PID=$!
  else
    osascript -e 'display alert "Cannot start the game" message "Super Jasmin World 3.html is missing from this folder."'
    exit 1
  fi
  sleep 1
fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -x "$CHROME" ]; then
  # A separate profile so these flags apply even if Chrome is already open.
  "$CHROME" \
    --user-data-dir="$HOME/Library/Application Support/SuperJasminWorld3" \
    --kiosk \
    --autoplay-policy=no-user-gesture-required \
    --no-first-run --no-default-browser-check --disable-session-crashed-bubble \
    "$URL"
else
  osascript -e 'display alert "Google Chrome not found" message "Opening in Safari instead. Press F (or click once) for full screen and sound."'
  open -a Safari "$URL"
  echo "Close this window when you are done playing."
  wait
fi
