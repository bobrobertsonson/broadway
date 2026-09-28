#!/bin/bash
# One-time install on the Mac. Run from this folder: ./setup.sh
set -euo pipefail
cd "$(dirname "$0")"

# The MCP SDK needs Python 3.10+. Apple's bundled python3 is 3.9, so look for a newer one.
PY=""
for c in python3.13 python3.12 python3.11 python3.10 /opt/homebrew/bin/python3 /usr/local/bin/python3 python3; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(sys.version_info < (3, 10))' 2>/dev/null; then
    PY="$c"; break
  fi
done
if [ -z "$PY" ]; then
  echo "Need Python 3.10 or newer (found: $(python3 --version 2>&1 || echo none))."
  echo "Install it with Homebrew:  brew install python@3.12"
  echo "or the installer from:     https://www.python.org/downloads/macos/"
  echo "Then run ./setup.sh again."
  exit 1
fi
echo "Using $($PY --version) at $(command -v $PY)"

rm -rf .venv
"$PY" -m venv .venv
./.venv/bin/pip install -q --upgrade pip
./.venv/bin/pip install -q -e .
mkdir -p ~/LogicBridge
echo
echo "Installed. Next: ./check.sh to set up permissions."
