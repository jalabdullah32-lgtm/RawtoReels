---
tool: codex
---

# Mac launcher

## Goal

Make Raw to Reels easy to start on a MacBook with a double-click launcher and clear setup instructions.

## Proposed user experience

The user opens the project folder and double-clicks `run-raw-to-reels.command`. On first launch, it creates a Python virtual environment and installs the app's Python packages. It checks for FFmpeg, starts the local server, and opens Caption Studio in the browser. If a prerequisite is missing, it explains how to install it.

## Current project context

Caption Studio is a browser app served locally by `tools/server.py`. The repo documents a manual Mac/Linux launch command, `.venv/bin/python tools/server.py`, but has no Mac launcher or dependency manifest. Transcription uses NumPy and Faster Whisper; the app also invokes the `ffmpeg` command directly. Faster Whisper's current documentation requires Python 3.9 or newer: https://github.com/SYSTRAN/faster-whisper.

## Relevant files and components

- `run-raw-to-reels.cmd` — existing Windows launcher and behavior reference.
- `tools/server.py` — starts the local server and opens the browser.
- `tools/transcribe.py` — imports NumPy and calls FFmpeg and Faster Whisper.
- `README.md` — startup and setup instructions.
- `requirements.txt` — proposed manifest for Python dependencies.

## Implementation steps

1. Add a `requirements.txt` for the Python packages needed by the app.
2. Add `run-raw-to-reels.command` to locate the project directory, check Python and FFmpeg, create `.venv` if needed, install dependencies, and launch the server.
3. Update `README.md` with Mac setup and launch instructions, including what to do when Python or FFmpeg is missing.
4. Keep the existing Windows launcher working.

## Testing approach

- On macOS, launch from Finder on a clean checkout and confirm first-run setup works.
- Launch it again and confirm it reuses the environment and opens Caption Studio.
- Confirm missing Python or FFmpeg produces a useful instruction.
- Confirm transcription works with a short video.
- Confirm the Windows launcher still starts the app.

## Risks and roadblocks

- Python package availability can vary by macOS version and processor architecture, so the dependency setup needs a real Mac check.
- The launcher needs executable permission in Git to work smoothly from Finder.
- FFmpeg is a separate system dependency because the app invokes its command directly.

## Definition of done

A Mac user can follow the README, double-click the launcher, and reach Caption Studio. The launcher sets up its Python environment, reports missing prerequisites clearly, and leaves the Windows startup path working.

## Status

Implementation complete on 15 October 2026. Mac execution still needs a real MacBook for end-to-end verification.

---
_Authored with Codex._
