#!/bin/bash
# One-command triage on macOS: sets up a private Python env on first run.
# Usage: ./run_triage.sh "/path/to/export-folder" [--bpm 140]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
if [ ! -x "$HERE/.venv/bin/python" ]; then
  echo "First run: creating Python environment..."
  python3 -m venv "$HERE/.venv"
  "$HERE/.venv/bin/pip" install --quiet --upgrade pip
  "$HERE/.venv/bin/pip" install --quiet -r "$HERE/requirements.txt"
fi
"$HERE/.venv/bin/python" "$HERE/triage.py" "$@"
