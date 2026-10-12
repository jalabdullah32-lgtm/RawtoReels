# Technical Notes

## Workflow

1. Transcribe a long source video with word-level timestamps.
2. Optionally provide the transcript and a prompt to an external AI editor.
3. Review suggested sections or use the transcript for captioning.
4. Select a section and customize its captions.
5. Export a finished video with its original audio.

## Architecture

- `transcribe.py`: finds videos and creates transcript data.
- AI Editor: converts transcript data into reel options.
- Caption Studio: previews reels, edits captions, and exports videos.
- FFmpeg and Faster-Whisper: support transcription and media processing.

## Data and File Formats

- Transcript data includes words and timestamps.
- Reel data follows the Raw to Reels JSON schema v1.0.
- The system should preserve accurate timestamps and source chronology.
- Final exports are MP4 or WebM video files.

Basic reel data example:

```json
{
  "schema_version": "1.0",
  "source_video": "conversation.mp4",
  "reels": [
    {
      "title": "Example reel",
      "start": 125.4,
      "end": 168.8,
      "captions": [
        { "text": "Example caption", "start": 125.4, "end": 128.1 }
      ]
    }
  ]
}
```

## Current Limitations

- Legacy JSON and SRT functionality is scheduled for removal.
- The AI editor is external to the main application.
- The exact AI editor interface and failure handling are not yet defined.

## Development Principles

- Keep the application lightweight and modular.
- Prefer vanilla JavaScript and Python.
- Separate HTML, CSS, JavaScript, and Python responsibilities.
- Avoid unnecessary frameworks and dependencies.
- Preserve compatibility with the current JSON schema.

## Planned Changes

- Remove legacy JSON and SRT support.
- Define the AI editor’s input, output, and error behavior.
- Finalize how processed videos are detected and skipped.
- Separate the Caption Studio code into maintainable modules.
- Support a structured workflow from raw voice note to finished video.
- Keep the AI outline step optional and voice processing local.
