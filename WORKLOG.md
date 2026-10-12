# Worklog

## 2026-10-11

### Goal

Turn the caption studio into a local workflow for loading videos and generating usable transcript data.

### Completed

- Organized the project, added the README and technical notes, and separated the caption studio into dedicated CSS and JavaScript files.
- Added a local server, launcher, video library, and `transcribe.py` workflow that writes JSON transcript data.
- Removed the SRT workflow and committed sample media and transcripts, then added `.gitignore` rules and placeholder folders to keep generated files out of Git.

### Blockers and discoveries

- Processing multiple large `.MOV` files on the CPU is slow. Each file first passes through FFmpeg audio extraction, then Faster-Whisper performs word-timestamp transcription. Jobs run sequentially, and silence is not filtered.
- The UI only reported progress after each full video. This left a long-running first video at `0 of 4`, making the job look stalled.
- “Transcription complete” meant that JSON existed on disk. It did not confirm that captions rendered in the preview or that an export contained them.

### Next steps

- Expose separate extraction, model-loading, and transcription states with elapsed time and the active filename.
- Rename the completed state to “Transcript JSON saved,” then validate caption loading before calling a video ready.
- Evaluate GPU transcription, voice-activity detection, and a smaller model to reduce turnaround time.
- Connect transcript JSON to caption rendering and exported video.

### Project status

- Moved the local-transcription blueprint from `blueprints/active` to `blueprints/completed` in the working tree.
