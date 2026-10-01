#!/bin/bash
# Run any tool in this folder with a private Python env (created on first run).
# Usage: ./run.sh triage|prepare|finish "/path/to/export-folder" [options]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TOOL="${1:?usage: ./run.sh triage|prepare|finish FOLDER [options]}"; shift
if [ ! -x "$HERE/.venv/bin/python" ]; then
  echo "First run: creating Python environment..."
  python3 -m venv "$HERE/.venv"
  "$HERE/.venv/bin/pip" install --quiet --upgrade pip
  "$HERE/.venv/bin/pip" install --quiet -r "$HERE/requirements.txt"
fi
"$HERE/.venv/bin/python" "$HERE/$TOOL.py" "$@"
