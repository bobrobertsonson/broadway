#!/bin/bash
# One-time install on the Mac. Run from this folder: ./setup.sh
set -euo pipefail
cd "$(dirname "$0")"
command -v python3 >/dev/null || { echo "Install Python 3.10+ first (xcode-select --install or python.org)"; exit 1; }
python3 -m venv .venv
./.venv/bin/pip install -q --upgrade pip
./.venv/bin/pip install -q -e .
mkdir -p ~/LogicBridge
echo "Installed. Next: grant permissions (see README), then run ./start.sh"
