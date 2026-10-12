# Worklog

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
