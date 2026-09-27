#!/bin/bash
# Start a Claude Code session on this Mac that you can drive from the Claude app on your phone.
# caffeinate keeps the Mac (and its display, which UI scripting needs) awake while the session runs.
set -euo pipefail
cd "$(dirname "$0")"
[ -x .venv/bin/logic-bridge ] || ./setup.sh
exec caffeinate -dims claude remote-control
