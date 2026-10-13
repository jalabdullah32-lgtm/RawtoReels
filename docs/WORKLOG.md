# Worklog

> Folder paths changed on 13 October 2026. Entries below were written against the
> older layout and are left as they were recorded. See **Repo Map** in `README.md`
> for how the old paths map onto the current ones.

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
