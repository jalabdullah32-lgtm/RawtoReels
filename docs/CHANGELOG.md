# Changelog

> Folder paths changed on 13 October 2026. Entries below were written against the
> older layout and are left as they were recorded. See **Repo Map** in `README.md`
> for how the old paths map onto the current ones.

## 2026-10-13

- Added `IDEAS.md` at the repo root. Thirteen numbered ideas grouped by area, open ones plain and closed ones struck through, with permanent numbers so an idea can be referred to by number for its whole life. _(claude)_
- Folded the README's "What I Want Next" wishlist into `IDEAS.md` and added a repo map row for it. _(claude)_
- Taught the blueprint-planner skill to capture ideas: sweep them in at natural pauses rather than mid-thought, nudge in one line when a conversation drifts off scope, and accept an idea number as the starting point for a blueprint. Both the `.claude` and `.codex` copies. _(claude)_
- Reorganized the folder structure. The root went from thirteen entries to ten and the deepest path from six levels to five. _(claude)_
- Grouped loose files: `docs/` now holds the changelog, worklog, and technical notes; `tools/` holds `server.py` and `transcribe.py`. _(claude)_
- Collapsed `ui-layout-mockups/design-directions/` into `blueprints/active/caption-studio-mockups/` and renamed `slop-garbage/` to `rejected/`. _(claude)_
- Renamed `Agents/` to `nebulaone/`, `Videos/` to `videos/`, and dropped the space from `Technical Notes.md`. _(claude)_
- Deleted three unused reel fixtures and retired the remaining seven to `slop/retired-test-fixtures/`, since the setup guides still describe how to use them. _(claude)_
- Moved the clip timeline blueprint to `blueprints/parked/` so `main` matches what the worklog already recorded. _(claude)_
- Added a **Repo Map** to `README.md`. _(claude)_
- Set a repo-local Git identity. Commits had been failing because no `user.name` or `user.email` was configured at any level. _(claude)_

## 2026-10-12

- Rewrote `main` history to remove four large input videos and force-pushed the cleaned branch to GitHub.
- Added authorship tagging to the blueprint-planner and project-worklog skills so each entry records which assistant produced the work. _(claude)_
- Authored blueprints for the NebulaOne agents, the clip timeline editor, the caption studio layout, and the NebulaOne capabilities investigation, and parked an earlier agent-system draft. _(claude)_
- Completed the NebulaOne capabilities investigation and moved its blueprint to `blueprints/completed`. _(claude)_
- Confirmed a NebulaOne agent loads a full transcript with Python and reports accurate counts, so the Json Handler needs no pre-filtering step. _(claude)_
- Updated `feature-nebulaone-agents.md` to mark the investigation dependency resolved and carry its findings into the build. _(claude)_
- Documented the real reel JSON schema in `Technical Notes.md`, replacing an example the application rejects. _(claude)_
- Added the shared agent skill `Agents/skills/raw-to-reels-reel-json-v1.md` with the output contract, clip buffer rules, and a Python validator. _(claude)_
- Added the Json Handler setup guide and three fabricated test transcripts. _(claude)_
- Built the Json Handler in NebulaOne. All six test cases passed and its output loads in Caption Studio without manual repair.
- Fixed the Json Handler splitting continuous speech into separate clips, by telling it to merge touching selections. Not yet re-tested. _(claude)_
- Added the shared agent skill `Agents/skills/raw-to-reels-video-planning-v1.md`, built around one rule: no rubric until the conversation has happened. _(claude)_
- Added the Video Planner setup guide, and extracted the internship rant from `Agents/Config.md` into a pasteable test fixture. _(claude)_
- Built the Video Planner in NebulaOne. It asks instead of planning on the first reply and holds a thread across turns. Testing parked after cases 1 and 2.
- Added the Orchestrator setup guide, including hand-off conditions for both specialists and four chat starters with one left unassigned. _(claude)_
- Built the Orchestrator in NebulaOne. Hand-off to both specialists confirmed working. Remaining cases not run.
- Recorded the Json Handler merge re-test procedure, with the zero-gap baseline measured from the 12 October outputs. _(claude)_
- Prototyped breathing-room padding and manual reel-boundary controls in Caption Studio, then parked the feature for later evaluation on real videos. _(codex)_
- Stopped Caption Studio from scrolling the caption editor during playback while keeping the active-caption highlight. _(codex)_
- Added local sample reel JSON files for `IMG_9372` and `IMG_9347`; they remain outside Git because they contain personal transcript excerpts. _(codex)_
- Added a one-primary-feature-per-chat rule to the blueprint planner and pushed the timeline experiment to `codex/clip-timeline-experiment`. _(codex)_

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
