#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

fail() {
  printf '\n%s\n' "$1" >&2
  if [ -t 0 ]; then
    read -r -p "Press Return to close this window... " _
  fi
  exit 1
}

if ! command -v python3 >/dev/null 2>&1; then
  fail "Python 3 is required. Install Python 3.9 or newer, then run this launcher again."
fi

if ! python3 -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 9) else 1)' >/dev/null 2>&1; then
  fail "Python 3.9 or newer is required. Install a newer Python 3, then run this launcher again."
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  fail "FFmpeg is required for transcription. On a Mac with Homebrew, open Terminal and run: brew install ffmpeg"
fi

PYTHON="$PROJECT_DIR/.venv/bin/python"
if [ ! -x "$PYTHON" ]; then
  printf 'Creating the Raw to Reels Python environment...\n'
  python3 -m venv "$PROJECT_DIR/.venv" || fail "Could not create the Python environment. Check that Python 3 includes the venv module."
fi

if ! "$PYTHON" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 9) else 1)' >/dev/null 2>&1; then
  fail "The project's Python environment uses Python older than 3.9. Remove the .venv folder and run this launcher again with Python 3.9 or newer installed."
fi

REQUIREMENTS_HASH="$("$PYTHON" -c 'import hashlib, pathlib; print(hashlib.sha256(pathlib.Path("requirements.txt").read_bytes()).hexdigest())')"
HASH_FILE="$PROJECT_DIR/.venv/.requirements.sha256"
INSTALLED_HASH=""
if [ -f "$HASH_FILE" ]; then
  INSTALLED_HASH="$(cat "$HASH_FILE")"
fi

if [ "$REQUIREMENTS_HASH" != "$INSTALLED_HASH" ] || ! "$PYTHON" -c 'import faster_whisper, numpy' >/dev/null 2>&1; then
  printf 'Installing or updating Raw to Reels Python packages...\n'
  "$PYTHON" -m pip install -r "$PROJECT_DIR/requirements.txt" || fail "Could not install Python packages. Check your internet connection and try again."
  printf '%s\n' "$REQUIREMENTS_HASH" > "$HASH_FILE"
fi

printf 'Starting Raw to Reels...\n'
exec "$PYTHON" "$PROJECT_DIR/tools/server.py"
