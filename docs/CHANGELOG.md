# Changelog

> Folder paths changed on 13 October 2026. Entries below were written against the
> older layout and are left as they were recorded. See **Repo Map** in `README.md`
> for how the old paths map onto the current ones.

## 2026-10-14

- Built steps 1–5 of the Caption Studio UI port. `app/index.html` is now the Desktop Preview's interface running on the existing engine: four tabs, real video in the 9:16 frame, the preview's caption rows, the style controls, and the Media tab. _(claude)_
- Replaced the caption editor's textareas with the preview's editable rich-text rows, which is what word colors will attach to at step 8. Timestamps jump to the moment, and each active row carries a Replay caption button. _(claude)_
- Wired the Media tab's Caption JSON picker to the app's strict validator. It had never been connected — a hidden `json-file` input was doing the work. A malformed reel file is now refused with a reason and the loaded work is left alone. _(claude)_
- Held the live caption overlay to what the export actually draws: it letterboxes rather than crops, wraps at 80%, and matches `drawFrame`'s padding, radius and stroke. The preview had been styled to look good over a still, not to match the MP4. _(claude)_
- Decided the reel options bar and the clip sequence strip appear only when there is more than one thing to choose, rather than showing a lone "Full source" button with nothing to pick. _(claude)_
- Gave Clear captions a home in the Media tab's Import row, beside Video file and Caption JSON. It greys out when there is nothing loaded to clear. _(claude)_
- Added `app/js/tabs.js` for tab switching, with arrow-key, Home and End navigation carried over from the preview. _(claude)_
- Silenced two pre-existing `favicon.ico` 404s, so a blank console stays a reliable signal for the remaining steps. _(claude)_
- Changed the Caption Studio UI direction: `Raw_to_Reels_Desktop_Preview.html`, the owner's own prototype, becomes the real interface. The rail-layout mockup signed off on 13 October is superseded and stays only as a record. _(claude)_
- Added idea `17` — the UI has to come from the Desktop Preview, because it is the one the owner would actually be comfortable using.
- Wrote `blueprints/active/improvement-caption-studio-ui-port.md`, which replaces `improvement-caption-studio-layout.md`. Eleven small steps, each checked in the browser before the next one starts. _(claude)_
- Decided the app's saved JSON gains a `caption_studio` block for caption style and word colors, written as schema `1.1`, so a saved file re-opens with its look intact. NebulaOne is untouched and keeps emitting `1.0`, which the validator still accepts. _(claude)_
- Decided word-level colors must appear in the burned-in export, not only the preview, so `drawFrame` gets rewritten to paint word by word. _(claude)_
- Decided the Desktop Preview's undo stack, word color marks, and export naming dialog get ported in rather than deferred to later blueprints. _(claude)_
- Corrected the mockup folder `README.md`, which still presented the rail layout as the signed-off direction. _(claude)_
- Deleted `blueprints/active/improvement-caption-studio-layout.md`, now superseded.

## 2026-10-13

- Picked Cloud Blue as the Caption Studio theme — accent `#2F6FED`, spent only on the selected reel and the Export button. The other three palettes stay in the mockup for reference. _(claude)_
- Built and signed off `blueprints/active/caption-studio-mockups/rail-layout-mockup.html`, the mockup the rebuild now works from. One self-contained file: 64px icon rail, flexible preview workspace, 360px inspector, all four sections filled with the app's real controls. _(claude)_
- Rebuilt the mockup after the first version came back inflated — too many elements competing at the same visual weight. The owner supplied the design rules the second version follows. _(claude)_
- Moved the theme switcher out of the product interface into a faint corner control, so nothing in the mockup implies a feature that ships. _(claude)_
- Cut developer-facing copy from the interface: the JSON schema paragraph and the `videos/input` path are gone, and Transcribe became a compact toolbar action above the media grid. _(claude)_
- Rewrote the mockup folder `README.md` around the signed-off design, the rules it encodes, and the three judgement calls that need confirming. _(claude)_
- Re-opened the Caption Studio UI work and settled on a direction: an icon rail on the left, the 9:16 video in the middle, and one context panel on the right that changes with the selected rail item. From the owner's own reference image. _(claude)_
- Rejected every Codex design direction. Splice, Director Desk, Proofroom, and Storyboard moved as one block to `blueprints/active/caption-studio-mockups/codex-rejected/`, kept as a record and still openable. _(claude)_
- Rewrote the mockup folder's `README.md` as a handoff: the chosen direction, eleven decisions already made, the one technical constraint, and the brief for the mockup to build next. _(claude)_
- Added ideas `14`–`16` — audio controls, brand kit, and aspect ratio choice. All three appear in the owner's reference image but do not exist in the app, so they stay out of the design. _(claude)_
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
