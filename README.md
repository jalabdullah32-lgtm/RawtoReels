# Raw to Reels

## Why I Made This

Raw to Reels helps turn videos into usable, captioned social media content. The core purpose of this application is captioning.

### Long Rant videos

I record very long videos with little or no structure. To turn them into useful content, I can upload the timed JSON transcript to an AI agent and describe the type of video I want to make. The agent can help me find the relevant parts of what I already said. Local hosting is planned, but it is not an immediate change.


### The lack of AI

It does not create my voice, replace my recording, or determine the final edit. I don't know how to quantitize this, but most of the work is being done through code logic. The only AI aspect of this is JSON being analyzed.

I think AI is used like too much of a crutch, and there are still limitations to it. The though of uploading a video into a model and say "edit this" is poor and lazy. People also tell me I have a nice voice. I don't want to hear my voice in a marvel movie in 10 years.

The intended AI usage is limited to helping create the application and generating JSON files to place inside the file for longer videos. The video, audio, transcription, captioning, and editing workflow stays local. This keeps the process economical and avoids sending the same media through AI data centers repeatedly.

### How it works 
__FFmpeg and __Faster are models used by python and the compute on your computer. It allows us to extract audio from videos and transcriube that audio.

The editing is also almost instant. The application gets passed the words from __Faster-. It then uses the timestamps in the JSON to find those moments and place them against the original video, automatically editing them.

## What It Does Now

- Extracts audio locally with **FFmpeg** and transcribes speech locally with **Faster-Whisper**.
- Uses the exact words and timestamps to create captions and find moments in the original video.
- Exports a finished captioned video.

## Open Caption Studio

Double-click `run-raw-to-reels.cmd`. It uses the project virtual environment when present, otherwise the Windows Python launcher, then starts a local server at `127.0.0.1` and opens Caption Studio in your default browser.

On macOS, install Python 3.9 or newer and FFmpeg, then double-click `run-raw-to-reels.command`. With Homebrew, you can install both from Terminal with `brew install python ffmpeg`. The first launch creates the project virtual environment and installs the Python packages; later launches reuse it. The launcher starts a local server at `127.0.0.1` and opens Caption Studio in your default browser. Press **Control+C** in Terminal to stop it.

Put source videos in `videos/input`. The **Your videos** library lists them with a preview and shows whether a matching transcript exists. Click **Transcribe new videos** to create a local JSON transcript for each new video, then click a ready card to load its video and captions together. Transcripts live in `videos/transcripts` and preserve any subfolder structure from `videos/input`.

You can still use **Load video** and **Load JSON** for files outside the local library. Raw source videos and generated transcripts stay on your computer and are excluded from Git.

## Repo Map

| Folder | What's in it |
| --- | --- |
| `app/` | Caption Studio itself — the browser front end. `js/` holds the logic, `css/` the styling. |
| `tools/` | `server.py` serves Caption Studio locally; `transcribe.py` runs FFmpeg and Faster-Whisper. |
| `videos/` | `input/` for your source videos, `transcripts/` for generated JSON. Contents stay off Git. |
| `nebulaone/` | Setup guides and shared skills for the NebulaOne agents that turn transcripts into reel JSON. |
| `blueprints/` | Plans for features, split into `active/`, `parked/`, and `completed/`. |
| `IDEAS.md` | Every idea for the project, numbered. Ideas worth building graduate to a blueprint. |
| `docs/` | `CHANGELOG.md`, `WORKLOG.md`, and the technical notes on the reel JSON schema. |
| `slop/` | Archive. Superseded drafts and retired test fixtures, kept for reference rather than deleted. |

The layout was reorganized on 13 October 2026. Log entries written before that date
refer to the older paths — `Agents/`, `Videos/`, `Technical Notes.md`, and
`blueprints/active/ui-layout-mockups/` — which map onto the table above.

## What I Want Next

Overlays, a sound library, captions that stay on screen, and finding the good takes in a
recording. The full list lives in [`IDEAS.md`](IDEAS.md), where open ideas are plain and
closed ones are struck through.


