# Feature: Local Transcription and Video Library

## Goal

Turn RawtoReels into a simple local app where the user launches it once, adds videos to `Videos/input`, transcribes new videos with one click, and chooses paired video and transcript files inside the app.

## Proposed user experience

1. Double-click a Windows launcher.
2. RawtoReels opens locally in the default browser.
3. Add video files to `Videos/input`.
4. Open the **Your videos** section.
5. Each video appears as a card with a still preview, its filename, and its matching transcript JSON filename when one exists.
6. Click a card to load the video and matching captions together.
7. Click **Transcribe new videos** to create JSON transcripts for videos not already transcribed.

Normal use requires no commands, paths, or separate JSON selection. The application remains entirely local: no cloud service, uploads, Flask, or external web framework.

## Current project context

- `transcribe.py` currently accepts paths on the command line, writes JSON and SRT files, and uses Faster-Whisper with the `base` model on CPU/int8.
- `app/index.html` is currently opened as a standalone local page and separately loads video and transcript JSON files.
- Personal video and transcript files are currently tracked in Git, making the repository unsuitable for sharing.

## Relevant files and components

- `transcribe.py`: reusable transcription functions that create transcript JSON only.
- `server.py`: new standard-library local server that serves the app and exposes local-only actions.
- Windows launcher: new script that starts the server and opens the browser.
- `app/index.html`: add the transcription control and **Your videos** library.
- App JavaScript: request transcription, list local videos, render still previews, and load matching video/JSON pairs.
- `.gitignore`: ignore personal media and generated transcripts.
- `Videos/input/` and `Videos/transcripts/`: retain empty folder structure without committing user content.

## Implementation steps

1. Refactor transcription.
   - Use `Videos/input` as the input directory and `Videos/transcripts` as the output directory.
   - Process supported video files, including nested folders when present.
   - Generate only `<video name>.transcript.json`.
   - Skip a video with a usable matching transcript JSON.
   - Keep the existing Faster-Whisper model configuration unchanged.

2. Add a local-only server.
   - Use Python's standard library rather than Flask or another framework.
   - Bind only to `127.0.0.1`.
   - Serve the application and files only from the RawtoReels project and its configured video/transcript folders.
   - Provide local actions to list videos, retrieve matching transcripts, and start transcription.

3. Build the in-app video library.
   - Add **Transcribe new videos** and **Your videos** to the app.
   - List videos from `Videos/input`.
   - Show one still frame as a preview without creating saved thumbnail files.
   - Show whether a matching transcript exists and its filename.
   - Load the video and matching JSON together when the user selects a card.
   - Retain a separate JSON upload only as an optional fallback for outside or AI-generated files.
   - Show compact progress, completion, skipped files, and failures in the library.

4. Add the launcher.
   - Start the local server with the installed Python command.
   - Open RawtoReels automatically in the user's default browser.
   - Avoid requiring the user to type commands for normal operation.

5. Clean up generated files and Git configuration.
   - Stop generating SRT files.
   - Remove existing SRT files from the project.
   - Remove personal videos and generated transcripts from Git tracking without deleting local originals.
   - Ignore media files in `Videos/input` and generated files in `Videos/transcripts`.
   - Keep the empty folder structure with placeholder files.

6. Update documentation.
   - Replace manual terminal-based transcription instructions with the launcher and in-app workflow.
   - Explain where users add source videos and find generated transcripts.

## Testing approach

### Code and local-server checks

- Verify the launcher and server setup without using a browser automation session.
- Verify that the server listens only on `127.0.0.1`.
- Verify video discovery, filename pairing, empty-transcript recovery, per-video replacement, progress status, and SRT removal.
- Verify `.gitignore` excludes personal media and generated transcript files.
- Verify generated transcript JSON remains compatible with the Caption Studio parser.

### User visual acceptance test

The user runs this final browser test themselves:

1. Double-click the launcher and confirm RawtoReels opens.
2. Add a new supported video to `Videos/input` and refresh the app if needed.
3. Confirm the video appears in **Your videos** with a still preview.
4. Click **Transcribe new videos** and confirm the progress bar reports the current video and completed count. Confirm an empty or missing transcript produces matching JSON in `Videos/transcripts`, with no SRT file created.
5. Click the video card and confirm the video and captions load together.
6. Confirm a video without a usable JSON transcript is visibly marked as needing transcription.
7. Click **Re-transcribe** for a card with an incorrect transcript and confirm the replacement completes with progress feedback.

## Risks and roadblocks

- Python, FFmpeg, and Faster-Whisper must be installed locally; the launcher simplifies use but does not replace those requirements.
- Transcription can take time. The progress view reports whole-video completion rather than an estimated percentage inside a video.
- The local server must strictly limit requests and file paths to the project directories.
- Removing files from Git tracking must not delete local personal originals.

## Definition of done

- One double-click opens RawtoReels locally.
- Normal use requires no typed commands or file paths.
- The app shows a visual library of videos from `Videos/input`.
- Each ready card loads its video and matching transcript JSON together.
- New input videos can be transcribed from the app and previously transcribed videos are skipped.
- The app shows transcription progress and lets you replace a bad transcript per video.
- No SRT files are generated.
- The GitHub project includes only the application and empty folder structure, not personal videos or generated transcripts.
- The user completes the visual acceptance test above.

## Status

Complete.

## Approved amendment: transcription feedback and recovery

- Add an in-app progress bar with the current video, completed count, skipped count, and failures.
- Treat missing, unreadable, and empty transcript JSON files as unfinished work and transcribe them again.
- Add a per-video **Re-transcribe** action so you can replace a transcript that exists but is wrong.
- Preserve usable transcripts unless you choose to re-transcribe that specific video.
- Keep the browser responsive during transcription by running the local job in the background and polling its status.
- Transcribe the current English-language workflow with English locked and voice-activity filtering disabled, so the model does not stop after a short false-positive segment.
- Treat a run with no caption segments as a visible failure rather than a completed transcript.
- Clamp model word timestamps to their segment boundaries so valid speech does not fail Caption Studio loading.
