# Worklog

> Folder paths changed on 13 October 2026. Entries below were written against the
> older layout and are left as they were recorded. See **Repo Map** in `README.md`
> for how the old paths map onto the current ones.

## 2026-10-15: Caption Studio UI port, steps 9–11
**Tool:** Codex, with browser checks by the project owner

### Goal

Finish the remaining Caption Studio UI port work: word colors in exported video, resumable
schema 1.1 project files, and the embedded NebulaOne Assistant.

### Completed

- Finished colored-word rendering in exported video. The owner confirmed it works.
- Added schema 1.1 project saving and restoration. The owner intentionally left it untested.
- Added the lazy-loaded NebulaOne Assistant frame. The owner confirmed it works.
- Recorded that all eleven planned implementation steps are complete.

### Results and discoveries

- Exported word colors retain the caption's wrapping, centering, outline, background, uppercase
  setting, and position.
- Caption Studio files now store style and word-color ranges while the loader continues to accept
  untouched NebulaOne schema 1.0 files.
- The Assistant frame loads once and keeps its chat session when switching tabs. An external link
  remains available if the embedded view cannot load.

### Next steps

- Optionally check step 10 by saving, refreshing, and reopening a Caption Studio file.
- Run a final console pass, mark the blueprint complete, and commit the finished port.

## 2026-10-15 — Caption Studio export, undo, and word colors
**Tool:** Codex, with hands-on transcription testing by the project owner

### Goal

Continue the Caption Studio UI port by confirming transcription works end to end and building steps 6–8: export controls, undo history, and word-level caption colors.

### Completed

- Confirmed the transcription workflow through hands-on testing. Controls disabled while the transcript loaded, re-enabled afterward, and the generated captions played with the source video.
- Wired the existing export dialog to the real export process. It suggests a title, converts it into a safe filename, shows recording progress based on completed clip time, and supports Cancel, Escape, backdrop closing, and keyboard focus management.
- Produced a four-second MP4 smoke export. The file contained both video and audio tracks, and the progress meter advanced during recording.
- Added a shared undo stack that keeps up to 100 edits. Caption typing, style changes, presets, Reset text, and Reset style now save restorable snapshots.
- Added Ctrl/Cmd+Z support while editing captions and cleared history when a different caption file or reel option loads.
- Added word-level color ranges to captions. Selected text can be made white, red, yellow, or blue from the active caption row or with Ctrl/Cmd+Shift shortcuts.
- Rendered word colors in both the caption editor and live video preview. Color ranges follow edits made before or after them and are removed when the colored text itself is rewritten.
- Included word colors in undo history and Reset text behavior.
- Updated the active Caption Studio blueprint with the implementation status and remaining checks.
- Recorded Idea `18` for smoother transcription progress.
- Recorded Idea `19` for deleting or merging caption bubbles. Clearing a caption's text was confirmed as a useful current workaround for unwanted Faster-Whisper groupings.

### Results and discoveries

- Faster-Whisper's transcription quality is strong, although it can occasionally split one fluid sentence into awkward caption groups.
- Clearing the text inside an unwanted caption bubble hides it without changing the source video or audio.
- Export recording progress can follow the actual accumulated clip duration rather than moving only when the job finishes.
- The exported MP4 could not be visually reopened through the automated browser because local file URLs were blocked. Its video and audio tracks were confirmed, but burned-in captions still need a direct visual check.
- Steps 7 and 8 have not yet received a browser interaction check.
- All changes from this session remain uncommitted in the current worktree.

### Next steps

- Open the smoke export directly and confirm captions are burned into the picture.
- Exercise undo and word-color editing with real captions in the browser.
- Continue with step 9: draw word-level colors into exported video.

## 2026-10-14 — Caption Studio UI port, steps 1–5 built
**Tool:** Claude Code

### Goal

Make `Raw_to_Reels_Desktop_Preview.html` the real interface of the app, one small step at a
time, each checked in a browser before the next begins. Committed as `1625765` on `main`.

### Completed

- **Step 1, shell and tabs.** The preview's markup and stylesheet moved into `app/index.html`,
  `base.css` and `studio.css`, minus the 3 MB embedded still, the demo state picker and the
  mockup disclaimer notes. All eight missing element IDs went in at once, as the blueprint
  required. Four tabs switch; every one of the engine's 35 lookups resolves.
- **Step 2, real video.** Play, scrubbing and the time readout run off the actual video. The
  readout took the preview's `mm:ss` format; caption timestamps keep sub-second precision
  because real transcripts have cues less than a second apart. Fullscreen wired.
- **Step 3, captions on the video.** The caption list is the preview's — a narrow timestamp
  button that jumps to the moment, and an editable rich-text row. Previous/next, Reset text,
  Replay caption, the reel options bar and the clip sequence strip all work.
- **Step 4, style controls.** The four presets and nine appearance controls drive the live
  overlay, and the overlay now measures itself exactly as `drawFrame` does.
- **Step 5, Media tab.** Real library, Transcribe and its progress meter, Load video, and
  Caption JSON import through the strict validator.

### Discoveries

- **The visible Caption JSON picker was never wired.** `media-json-file` sat in the preview's
  Media tab doing nothing; a hidden `json-file` input carried the handler. Anyone reading the
  markup would have assumed the visible one worked.
- **The live overlay was lying about the export.** The preview's stylesheet wrapped text at 88%
  where `drawFrame` wraps at 80%, carried a drop shadow the export never draws, and gave each
  wrapped line its own background box where the export draws one box around the whole caption.
  All four are now in line. Per-line boxes are the better look of the two and are left for step
  9, when `drawFrame` is being rewritten anyway.
- **Crop versus letterbox.** The preview cropped the video to fill the 9:16 frame; the export
  letterboxes. Matched the preview to the export. Whether the *export* should crop instead is a
  real question for 16:9 source footage, and is recorded in the blueprint rather than decided.
- **Headless Chrome cannot check video playback.** `--virtual-time-budget` fast-forwards timers
  while the media pipeline runs in real time, so the page races past its own video. Checking
  from step 2 onward was done by driving a real Chrome over the DevTools protocol instead,
  including real file uploads through the actual pickers via `DOM.setFileInputFiles`.
- **`faster_whisper` is not installed for the Python on this machine**, so transcription cannot
  complete here. The Faster-Whisper `base` model is in the user cache, so it has run somewhere
  before; the most likely explanation is a Python upgrade that left the old environment behind.

### Left to test

- **Transcription end to end.** The button, the job, the progress meter, the failure detail, the
  library refresh and the status line were all confirmed against a real job — but the job failed
  on the missing module, so a transcript has never come out the other end in testing. Needs a
  machine where Faster-Whisper runs. Watch the progress strip move through its phases, the
  buttons grey out while running, the card flip from `No transcript` to `Ready`, and then
  **Load** bringing video and captions in together.

### Useful next steps

- Step 6, export with the preview's two-step naming dialog in front of it, then steps 7–11:
  undo, word colors in the editor, word colors in the export, save and re-open at schema 1.1,
  and the Assistant tab.
- Two small things noticed and deliberately left: clicking a clip in the sequence strip does not
  scroll the caption list to that clip, and previous/next stay enabled at the ends of the list.

## 2026-10-14 — Caption Studio UI port, planned
**Tool:** Claude Code

### Goal

Plan how the mockup becomes a working interface, with the owner's stated concern being that
everything ties in cleanly — the JSON, the HTML, and the engine that already exists.

### Completed

- Established which artifact the build follows. Idea `17`, filed earlier the same day, says the
  UI has to come from `Raw_to_Reels_Desktop_Preview.html`. That contradicted the previous day's
  sign-off of the rail-layout mockup, and the owner confirmed the Desktop Preview wins.
- Audited both candidates against the engine before asking anything, so the choice was made
  with its real cost visible rather than on appearance alone.
- Settled four decisions: the Desktop Preview is the source of truth; its undo stack, word
  color marks, and export dialog get ported now rather than deferred; word colors must appear
  in the exported MP4; and a saved file carries the caption style and word colors in one file
  so re-opening restores the look.
- Wrote `blueprints/active/improvement-caption-studio-ui-port.md` and deleted the superseded
  `improvement-caption-studio-layout.md`.
- Corrected the mockup folder `README.md`, which still read as though the rail layout were the
  agreed direction.

### Failed attempts

- **The first plan was rejected for being too big.** It divided the work into four
  feature-sized blueprints — Media, Captions, Style, Assistant — each shipping before the next
  started. The owner wanted something smaller: build a bit, check it lightly, move on. The
  blueprint was rewritten as one document with eleven small steps, each checked in the browser
  in a minute or two. Worth remembering as a standing preference, not a one-off correction.
- The per-section rule inherited from 13 October does not survive contact with this prototype.
  The Desktop Preview is one integrated file, and the tab chrome, video stage, play bar, export
  button, and status footer belong to no single tab. Any first section would have had to carry
  the whole shell anyway.

### Discoveries

- **The Desktop Preview cannot play video.** `#frame` holds a 3 MB embedded still image and a
  fake clock advances the captions. It reads as a working app but has no `<video>` element at
  all. Replacing that clock cleanly is the load-bearing step, since playback, the caption list,
  and the overlay all read from it.
- **Eight of the engine's 35 element IDs are missing** from the preview — `video`, `stage`,
  `caption-text`, `library-section`, `json-file`, `clear`, `export-hint`, `option-count` — and
  `json-file` was renamed `media-json-file`. All 35 are looked up the moment `app/js` loads, and
  a missing one returns nothing without raising an error, so they all go in at step 1.
- **A file saved by the preview would be refused by the app that saved it.** The preview writes
  a `caption_studio` block carrying style and word marks; `checkKeys` in `captions.js` rejects
  any unexpected top-level field. This was the concrete form of the owner's "does it tie in
  cleanly" question, and schema `1.1` is the answer.
- The preview is a second implementation rather than a skin — roughly 34 functions including its
  own looser JSON reader, which accepts `start_seconds` aliases the real validator rejects. The
  engine's strict validator stays as the single gate; the preview's reader is not kept.
- Word colors are new data with no home in the schema, and the export draws one color per
  caption line. Colors in the editor but not in the MP4 would make the preview lie about the
  finished video, so the two ship together in the same step.

### Next steps

- **Step 1 — shell and tabs.** The preview's markup and stylesheet into `app/index.html` and the
  two CSS files, the 3 MB still and the demo switcher dropped, the eight missing IDs put in.
- Three calls left open in the blueprint rather than settled quietly: where Clear captions goes,
  what the clip sequence strip is allowed to be before idea `04` is unparked, and whether the
  export hint earns a place in the new layout.

## 2026-10-13 — Caption Studio rail-layout mockup
**Tool:** Claude Code

### Goal

Build the mockup the previous session stopped short of: the rail layout with all four real
sections and a theme switcher, so the owner could see a UI he would actually use before any
implementation blueprint gets written.

### Completed

- Built `rail-layout-mockup.html` as one self-contained file — no frameworks, no build step,
  no external assets, same rules as the owner's prototype.
- Filled all four sections with the app's actual controls rather than placeholders, and
  verified every one of the 34 IDs `app/js` looks up is present.
- Wired the Style controls to the caption overlay for real, so the four presets and the nine
  appearance controls can be judged rather than just looked at.
- Added `?theme=` and `#section` deep links so any combination can be opened directly.
- Settled the theme: Cloud Blue.
- Rewrote the folder `README.md` around the signed-off design.

### Failed attempts

- **The first mockup was rejected.** It read as a prototype because too many elements competed
  at the same visual weight — large pills, cards, buttons, panels, and blue accents everywhere.
  The owner's correction became the spec for the rebuild: 64px rail, flexible workspace, 360px
  inspector; one 8px spacing scale, 8–10px radii, one border color; 14px controls, 16px body,
  20–24px headings; accent reserved for the selected reel and the primary action; no
  developer-facing copy.
- Two CSS bugs caught by rendering it rather than reading it: `[hidden]` lost to the layout's
  `display:flex`, so all four panels stacked at once; and `.control label` beat `.checkrow` on
  specificity, right-aligning the All caps row.

### Discoveries

- Screenshotting the file with headless Chrome caught both layout bugs immediately. Worth doing
  on every future mockup instead of trusting the markup.
- `[hidden]{display:none !important}` is now a hard requirement for the rebuild, since the
  design depends on every panel staying in the DOM and toggling `hidden`.

### Next steps

- Write the **Media** blueprint through the blueprint-planner, and ship it working before
  Captions starts.
- Three calls still need confirming: Clear captions living in the Captions section, the status
  line becoming a save state, and the export hint staying hidden until it matters.

## 2026-10-13 — Caption Studio UI direction
**Tool:** Claude Code

### Goal

The owner named the UI as the biggest source of scope drift — nothing about the interface
was settled, so every other decision kept moving. The session re-opened
`improvement-caption-studio-layout.md` to finalize a direction. It deliberately stopped short
of a blueprint: he wants to see a UI he would actually use before anything is written up.

### Completed

- Rejected all four Codex design directions and archived them under `codex-rejected/`,
  moved as one block so their relative paths still resolve.
- Settled the direction from the owner's own two files: a working prototype
  (`Raw_to_Reels_Desktop_Preview.html`) and a layout reference
  (`assets/sectionsForeditor.png`) showing an icon rail, centre video, and a right context
  panel.
- Agreed the rail carries four sections only — Media, Captions, Style, Assistant — and that
  the existing app gets re-skinned rather than replaced.
- Agreed each section becomes its own blueprint and ships working before the next starts,
  rather than building the whole UI and stripping it back afterwards.
- Rewrote the mockup folder `README.md` as the handoff document.
- Filed ideas `14`–`16` for the three reference-image sections the app cannot support.

### Discoveries

- The app is entirely ID-driven: 34 `getElementById` lookups across `app/js`, plus a handful
  of `.cue` and `[data-preset]` selectors. The HTML can be rearranged freely as long as those
  IDs survive the move, which is what makes a re-skin cheap.
- Those lookups all run at load. A panel built on demand would return nothing without raising
  an error, so every panel has to stay in the page and be hidden instead. This is the single
  constraint the rebuild has to respect.
- The owner's prototype already reuses most of those same IDs — `overlay`, `scrub`, `play`,
  `time`, `editor`, `status`, `cue-count`, every `cap-*` control — which suggests the engine
  and the new design were never far apart.
- The prototype overshot its own brief. The prompt asked for three switchable themes and
  explicitly excluded JSON import/export, undo, and keyboard shortcuts; what came back was one
  theme with all of them working, plus word-level color marks that survive retyping.
- Splice, the surviving Codex direction, had quietly stopped matching the approved blueprint:
  two columns instead of three, phone on the left instead of centred, library and agent demoted
  to modals. The blueprint had said three columns since 12 October and nobody had noticed the
  drift.

### Open

- The mockup itself. Rail layout, four real sections, four themes to compare.
- Per-section blueprints, written only after a theme and the structure are signed off.

## 2026-10-13 — Idea capture
**Tool:** Claude Code

### Goal

The session started as a scope conversation. The project owner said the build
had stopped converging and wanted an MVP: one planned video, recorded,
captioned, exported, and posted. Partway through, a second problem surfaced that
turned out to be the more urgent one — good ideas were being produced faster than
they were being recorded, and were dying in chat threads.

### Completed

- Added `IDEAS.md` at the root, seeded with thirteen ideas: the README wishlist
  plus the take-selection ideas produced during this conversation.
- Replaced the README's "What I Want Next" section with a pointer to it, and
  added a repo map row.
- Added a `Capturing Ideas` section to both copies of the blueprint-planner
  skill covering when to sweep, how hard to nudge, and how numbering works.

### Discoveries

- Export is already platform-ready. `app/js/video-export.js:30` renders to a
  720×1280 canvas with audio mixed in and writes MP4 where the browser supports
  it, so output format was never MVP work. It letterboxes rather than crops, so
  landscape source gets bars.
- The Video Planner deliberately produces prompts rather than lines to read
  (`nebulaone/video-planner-setup.md:148`). That rules out aligning a transcript
  against a script to find takes, because there is no script to align against.
  Takes are different attempts at a beat, not repeats of a sentence.
- The README's "What I Want Next" section had quietly become the project's idea
  list, which is why it had stopped growing — it is a document written for other
  people to read.
- `.claude/` is excluded in `.git/info/exclude:9`, so the Claude copy of each
  skill is local to this machine while the `.codex` copy is versioned. The two
  can drift without Git showing it.

### Decisions

- Verbal markers will be interpreted by the agent rather than matched against a
  hardcoded word list. Natural phrasing like "add that in the video" is outside
  any list worth maintaining, and a string match cannot tell an instruction to
  the editor from the same words spoken to the camera. The agent decides what a
  marker means; timestamps stay deterministic.
- A recommendation to ship Friday on current capability and build nothing first
  was declined. The owner is confident of a video by Thursday morning and chose
  to keep building.
- Agreed build order: editor-voice markers first, because they change how the
  recording is made and are worthless if they arrive after it; overlays second.
- One file rather than a folder, strikethrough as the only closed state, and no
  reason notes on closed ideas. Asked for explicitly on the grounds that more
  functionality is not better.

### Next steps

- Blueprint idea `08`, editor-voice markers, in a new chat. Deadline is the
  Wednesday recording, not the Thursday edit.
- Overlays (`01`) after that, as its own blueprint.
- Consider tracking `.claude/` so skill copies cannot silently drift.

## 2026-10-13 — Folder cleanup
**Tool:** Claude Code

### Goal

Make the project navigable. The root had grown to thirteen entries and the
mockups ran six levels deep, which pushed the file tree off the edge of the pane.

### Completed

- Grouped loose root files into `docs/` and `tools/`, and flattened the redundant
  `ui-layout-mockups/design-directions/` pair into `caption-studio-mockups/`.
- Normalized casing: `Agents/` to `nebulaone/`, `Videos/` to `videos/`. The first
  rename also removed a confusing adjacency with `.agents/`, the Claude skills
  directory, which is unrelated to it.
- Updated `server.py`'s `ROOT` to climb one extra level now that it sits in
  `tools/`, and pointed the launcher at `tools\server.py`.
- Pointed both copies of the project-worklog skill at the new `docs/` paths.
- Retired the agent test fixtures to `slop/` and fixed the setup guides that
  referenced them.

### Discoveries

- Committing had been blocked because no Git identity was set at any level,
  local or global. The two identities in the history came from elsewhere.
- Verification caught three broken links the plan had not predicted: a
  `Videos/input` string in `app/js/library.js`, a director-desk link in the
  mockup index, and two nav links in `splice.html` pointing at pages that moved
  into `rejected/`. The first was missed because the initial reference sweep
  covered `.md`, `.py`, and `.html` but not `.js`.
- `core.autocrlf` made several diffs display as whole-file rewrites. Comparing
  the stored blobs directly confirmed the committed content was only the
  intended few lines.

### Decisions

- Historical changelog and worklog entries were left exactly as written rather
  than rewritten to the new paths. Each log now carries a note pointing at the
  Repo Map instead.
- `codex/clip-timeline-experiment` was left alone. This cleanup barely touches
  it; its real conflict risk is the upcoming Caption Studio UI overhaul, which
  will rewrite the same `app/js/captions.js` the branch changed.

### Next steps

- Start the Caption Studio UI overhaul in a new chat from `main`.

## 2026-10-12 — Clip timeline experiment parked
**Tool:** Codex

### Goal

Try automatic breathing room and manual cut-boundary controls in Caption Studio, then decide whether the project was ready to define how video cuts should work.

### Completed

- Added a browser-side 0.5-second breathing-room baseline for reel clips that arrived flush with their captions. Clips already carrying padding were left unchanged.
- Added a selected-reel timeline prototype with a live playhead, a jump-to-cut action, editable start and end sliders, boundary validation, reset controls, and JSON synchronization for exports.
- Created local sample reel JSON files for `IMG_9372` and `IMG_9347`, then tightened the `IMG_9347` selection into a focused systems-and-outcomes reel. The files stay in ignored `Videos/reels` because they contain personal transcript excerpts.
- Removed automatic caption-editor scrolling during playback. The active caption still highlights, while manual caption navigation still scrolls to the selected line.
- Updated the blueprint-planner skill so one chat handles one primary feature. Related fixes may stay together; a larger independent feature moves to a new chat after the current one is completed or parked.
- Moved the clip timeline blueprint to `blueprints/parked` on the experiment branch and pushed commit `dff58e3` to `codex/clip-timeline-experiment`.

### Results and decision

- The reel JSON fixtures and edited boundaries passed Caption Studio's strict loader. The timeline controls were functional enough to preserve as an experiment.
- The project owner could not yet judge what padding or cut behavior should become the product default. The feature is parked rather than merged into `main`.
- The no-scroll playback change was included with the experiment because it was necessary to watch a reel without the page being pulled into the caption editor.

### Next steps

- Start the Caption Studio UI overhaul in a new chat from `main`.
- Resume the timeline only after real-video use reveals what controls are actually needed. Switch to `codex/clip-timeline-experiment` to revisit the saved prototype.

## 2026-10-12 — Agent planning and the NebulaOne capabilities investigation
**Tool:** Claude Code

### Goal

Decide what the NebulaOne agents should be before building any of them, and settle
whether an agent can process a full Raw to Reels transcript — the answer decides how
the Json Handler is built.

### Completed

- Added authorship tagging to the blueprint-planner and project-worklog skills, so
  blueprints carry `tool:` frontmatter and log entries carry a `_(tool)_` or `**Tool:**`
  marker. Existing tags are never altered and untagged history is left alone.
- Authored four blueprints: the NebulaOne agents, the clip timeline editor, the caption
  studio layout, and the capabilities investigation. Parked an earlier, broader
  agent-system draft rather than deleting it.
- Ran the investigation probes against NebulaOne and recorded findings for all five
  questions. Reformatted the Q2 result table, which had come back as one run-together line.
- Moved the investigation blueprint to `blueprints/completed` and updated the
  `Depends on` section of `feature-nebulaone-agents.md` to mark it resolved and carry
  the build-time findings forward.

### Discoveries

- The agent used the code interpreter rather than reading inline, and returned correct
  segment and word counts on a 0.96 MB, 753-segment, 8,403-word transcript in 17 seconds.
  The Json Handler can be built as designed, with no pre-filtering step.
- Downloadable `.json` artifacts were produced reliably, including at the end of a
  multi-step task. Caption Studio does not need a paste-JSON fallback.
- The agent can measure silence gaps on demand — the longest was 18.68 s at 00:35:44 —
  so the clip buffer work needs no separate pre-pass.
- An attachment is expected to be lost on hand-off. The Orchestrator should route first
  and have the user attach afterward, landing them back at the Orchestrator when done.
  Four chat starters are available, matching the four planned.
- `Technical Notes.md` documents a schema the code rejects: `source_video` instead of
  `source`, `reels[]` instead of `options[]`, and three missing required keys. Any prompt
  built from that file would fail immediately.
- The transcript used as the ceiling file ends at 00:49:07, not the ~54:00 assumed. Wrong
  file, but it changes no conclusion.

### Deferred

- Confirming `gpt terra` and its context limit. The agent works in code rather than
  reading the transcript into context, so the limit is no longer the binding constraint
  it looked like, and a model swap is configuration rather than rework.
- Chat starter wording for the hand-off, which is an adjustment to make while building
  the agents.

### Next steps

- Fix the wrong schema in `Technical Notes.md` before any prompt is built from it.
- Author the shared "Raw to Reels Reel JSON v1.0" skill with its Python validator.
- Build the Json Handler, Video Planner, and Orchestrator.

## 2026-10-12 — Json Handler built and tested
**Tool:** Claude Code, with the agent testing done by hand in NebulaOne

### Goal

Get the first of the three agents working end to end: a transcript goes in, reel
JSON comes out, and it loads in Caption Studio without repair.

### Completed

- Replaced the reel JSON example in `Technical Notes.md` with the real contract.
  The old one used `source_video` and `reels[]`, omitted three required keys, and
  flattened clips into the reel, so anything built from it would have failed.
- Wrote `Agents/skills/raw-to-reels-reel-json-v1.md`, the skill attached to the
  agent: the output contract, the clip buffer rules, a Python validator, and a
  list of the ways this output usually breaks.
- Wrote `Agents/json-handler-setup.md` with the agent's configuration, system
  prompt, and test cases.
- Generated three fabricated transcripts in `Agents/test-fixtures/` matching the
  exact shape `transcribe.py` writes, sized so each test can only pass honestly.
- Built the agent in NebulaOne and ran all six test cases.

### Results

All six passed, and the output loads in Caption Studio without manual repair.

- Clean transcript: three options, 67–73 s against a 60–75 s target.
- Short transcript: returned 15.14 s for a 55–65 s ask and said it ran short,
  rather than padding to fake the length.
- Silences: not one clip spanned any gap. Zero dead air across five clips.
- Vague request: asked one clarifying question, then committed when told to
  surprise it.
- Topic not present: named the mismatch and asked for the right transcript.
- Code use: reported 405 words and 148.36 s exactly, which is only possible by
  loading the file with Python rather than reading it.

### Discoveries

- The clip buffer is being applied as specified: 0.5 s lead-in and 0.4 s tail on
  every clip, dropping to zero exactly where the rules require clamping.
- One defect. The agent split continuous speech into separate clips — a boundary
  at 117.58 s in two separate runs, and the whole short fixture chopped into three
  touching clips. Valid output, but a clip boundary where nothing is removed is
  not a cut. The system prompt now tells it to merge touching selections.
- The validator in the skill agrees with the browser's `app.fromReels`. That was
  an open question until a real agent file loaded.
- An editor buffer overwrote the setup file with a stale version partway through,
  which would have silently dropped the test results and the merge fix. Caught in
  the diff before committing.

### Next steps

- Re-test the merge fix. Case 2 is the sharper test, since it produced three
  touching clips where one would do.
- Build the Video Planner.
- Build the Orchestrator, whose chat starters must tell the user to attach the
  transcript after being routed rather than before.
- Judge the buffer defaults against a real reel with video, now that valid JSON
  can be produced on demand.

## 2026-10-12 — Video Planner and Orchestrator built
**Tool:** Claude Code

The setup guides, skill, and fixtures were authored with Claude Code. Creating and
testing the agents in NebulaOne was done by hand.

### Goal

Finish steps 4 and 5 of `feature-nebulaone-agents.md` so all three agents exist and
the Orchestrator routes between them.

### Completed

- Authored the Video Planning skill and the Video Planner setup guide, with seven
  test cases. Add Files and Generate Artifacts; Data & File Tools left off, since
  there is no transcript to load here.
- Authored the Orchestrator setup guide with hand-off conditions, four chat starters,
  and eight test cases. No file capabilities and no skill, both on purpose.
- Extracted the internship rant into `Agents/test-fixtures/internship-rant.md` so it
  can be pasted without unpicking the `<details>` block it lives in.
- Built both agents in NebulaOne and confirmed the hand-off works.
- Wrote up the Json Handler merge re-test with a measured baseline.

### Results

- Video Planner: cases 1 and 2 passed. It reflected the idea back and asked rather
  than planning, and held the thread across turns. Parked there.
- Orchestrator: hand-off confirmed working. The eight cases were not run one by one.
- Both pauses were deliberate, to resume closer to real integration.

### Discoveries

- The hand-off working is the finding that validates the whole design. Without it the
  Orchestrator has no reason to exist and each specialist needs its own front door.
- A hand-off's "When to use" text is what the model actually routes on, so it matters
  more than the routing prose in the system prompt. Each one now names the trigger,
  the single deciding question, and when not to fire — a model given two hand-offs and
  no reason to prefer either tends to pick whichever is described more richly.
- A zero gap between clips in Json Handler output does not prove the agent picked
  touching selections. `LEAD_IN + TAIL` is 0.9 s and padding clamps to the next clip's
  start, so padding closes sub-second gaps by itself. It does not change the test: a
  boundary with nothing removed is the defect whichever step created it.
- The saved HTML rubric holds up on its own reading — beats summing to target,
  questions quoting the user's own words, `charset` and `viewport` declared so it opens
  correctly from `file://`. One artifact is one sample, so it is encouraging, not a pass.

### Next steps

- Re-run Json Handler case 2 and check no clip boundary has a zero gap.
- Orchestrator case 4 first, then 6 and 8 — those two settle whether an attachment
  survives a hand-off and whether the round trip is real.
- Record one video against the saved rubric and run it through the Json Handler. That
  exercises planner, hand-off, and cut in one pass, and is the only test that says
  whether a rubric is any good.

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
