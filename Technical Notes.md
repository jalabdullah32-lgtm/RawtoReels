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

### Reel JSON schema v1.0

This section is the contract enforced by `app.fromReels` in `app/js/captions.js`.
It is strict: `checkKeys` rejects **any** field not listed, so extra keys fail the
load rather than being ignored. Keep this section in step with the code.

Every time is a number, finite, and `>= 0`, in seconds from the start of the source.

**Top level** — exactly these six keys:

| Key | Rule |
|---|---|
| `schema_version` | must be `"1.0"` |
| `source` | string |
| `transcript_end_seconds` | valid time |
| `timestamp_unit` | must be `"seconds_from_source_start"` |
| `target_duration_seconds` | exactly `{min, max}`, both valid times, `min <= max` |
| `options` | array, at most 3 |

**Each option** — exactly `id`, `title`, `duration_seconds`, `clips`.

- `id` matches `option_1`, `option_2`, … and is unique within the file
- `title` is a non-empty string
- `clips` is a non-empty array
- `duration_seconds` is a valid time and not zero
- `duration_seconds` must equal the summed clip lengths, rounded to two decimals,
  within a tolerance of 0.005

**Each clip** — exactly `start`, `end`, `captions`.

- `start < end`
- `end <= transcript_end_seconds`
- each clip starts at or after the previous clip's end, so clips run forward
  through one source and never overlap
- `captions` is a non-empty array

**Each caption** — exactly `start`, `end`, `text`.

- `start < end`
- the first caption starts at or after `clip.start`
- each caption starts at or after the previous caption's end
- the last caption ends at or before `clip.end`
- `text` is a non-empty string

```json
{
  "schema_version": "1.0",
  "source": "conversation.mp4",
  "transcript_end_seconds": 2947.1,
  "timestamp_unit": "seconds_from_source_start",
  "target_duration_seconds": { "min": 45, "max": 60 },
  "options": [
    {
      "id": "option_1",
      "title": "Example reel",
      "duration_seconds": 43.4,
      "clips": [
        {
          "start": 125.4,
          "end": 168.8,
          "captions": [
            { "start": 125.4, "end": 128.1, "text": "Example caption" }
          ]
        }
      ]
    }
  ]
}
```

All options for a request ship in one file. The schema already allows this, so a
request for three cuts produces three entries in `options`, not three files.

## Current Limitations

- SRT output has been removed. Legacy JSON is still accepted by `app.fromLegacy`
  and is scheduled for removal.
- The AI editor is external to the main application.
- The exact AI editor interface and failure handling are not yet defined.

## Development Principles

- Keep the application lightweight and modular.
- Prefer vanilla JavaScript and Python.
- Separate HTML, CSS, JavaScript, and Python responsibilities.
- Avoid unnecessary frameworks and dependencies.
- Preserve compatibility with the current JSON schema.

## Planned Changes

- Remove legacy JSON support.
- Define the AI editor’s input, output, and error behavior.
- Finalize how processed videos are detected and skipped.
- Separate the Caption Studio code into maintainable modules.
- Support a structured workflow from raw voice note to finished video.
- Keep the AI outline step optional and voice processing local.
