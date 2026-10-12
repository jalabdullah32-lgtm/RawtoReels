# Changelog

## 2026-10-12

- Rewrote `main` history to remove four large input videos and force-pushed the cleaned branch to GitHub.

## 2026-10-11

- Set up the Raw to Reels project structure, README, and technical notes.
- Split the caption studio into modular CSS and JavaScript files.
- Added a local transcription workflow with a launcher, server, and video library UI.
- Switched transcript handling to JSON and removed SRT output.
- Added `.gitignore` rules and placeholder folders for source videos and transcripts.

### Blockers and roadblocks

- Large source videos and generated transcript files were committed, making the repository heavy and difficult to manage. Removed tracked media, added `.gitignore`, and kept `.gitkeep` placeholders.
- The workflow required manually selecting matching video and transcript files. The local library now discovers available videos so the interface can load them directly.
- The caption studio lived in one large HTML file, which made changes harder to isolate. The UI now separates CSS and JavaScript by responsibility.
- Transcribing four large `.MOV` files took a long time because the app extracted full WAV audio and ran the local Faster-Whisper `base` model sequentially on the CPU, with word-level timestamps and no silence filtering.
- The progress meter only advanced after a whole video completed, so long jobs appeared stuck. It also reported “Transcription complete” when a transcript JSON file had been saved, before captions were verified in the preview or export workflow.
- Follow-up: report extraction, model loading, and transcription separately; include elapsed time and the current video; say “Transcript JSON saved”; verify the preview can load captions before declaring a video ready; evaluate GPU use, voice-activity detection, and a smaller model.
