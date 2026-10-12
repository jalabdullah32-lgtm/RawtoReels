---
tool: claude
---

# Feature: NebulaOne Agents

## Goal

Build three NebulaOne agents: an **Orchestrator** that routes, a **Json Handler** that turns a transcript into reel JSON, and a **Video Planner** that helps shape an idea into something worth recording.

This blueprint covers the agents themselves. Embedding them in the app is `improvement-caption-studio-layout.md`. Cut quality is `feature-clip-timeline-editor.md`.

## Depends on

`blueprints/completed/investigation-nebulaone-capabilities.md` — **resolved.** The agent loads a full transcript with Python and reports accurate numbers, so the Json Handler is built as designed here with no pre-filtering. Artifacts proved reliable, so no paste-JSON fallback is needed.

Two findings to carry into the build:

- The attachment is expected to be lost on hand-off. Chat starters must tell the user to attach the transcript *after* routing, and the intended shape is a round trip — the Orchestrator routes out, the specialist works, the user lands back at the Orchestrator.
- Four chat starters are available, matching the four planned below.

## Proposed user experience

### Cutting a video you already recorded

1. Open the agent panel and pick the chat starter for cutting an existing recording.
2. The Orchestrator hands off to the Json Handler.
3. Attach the `.transcript.json` from `Videos/transcripts`.
4. Say what you want: "a 60 second IG reel about how I got diagnosed with Narcolepsy."
5. The agent returns **one** `.json` file containing up to three options.
6. Download it, click **Load JSON**, pick an option, edit captions, export.

### Planning a video you have not recorded

1. Pick the planning chat starter, or paste a rough idea.
2. Talk it through. This is a conversation, not a form — it keeps going until you are satisfied with the angle.
3. The agent produces a rubric and questions covering what you already said, so you can answer them on camera with clarity.
4. It can also hand you a formatted outline as markdown, or an HTML page if that is easier to read while recording.
5. Record, drop into `Videos/input`, transcribe, then run the cutting flow above.

## Current project context

- `app.fromReels` (`app/js/captions.js:27`) already validates the output strictly. `checkKeys` rejects **any** unexpected field, so the agent cannot invent keys.
- `app/js/app.js:20` already routes an uploaded file to the right parser. Agent output loads today with no new code.
- `Technical Notes.md` lines 25–42 show a **wrong** schema: `source_video` instead of `source`, `reels[]` instead of `options[]`, and no `transcript_end_seconds`, `timestamp_unit`, or `target_duration_seconds`. Line 46 also says SRT removal is "scheduled" when it is already done. Any prompt built from that file produces JSON that fails immediately.
- NebulaOne agents are public and need no key. Skills take a title, a description under 300 characters, and a body under 30k characters.

## The output contract

The Json Handler's entire job is to emit JSON that survives `fromReels`. All times are seconds, finite, `>= 0`.

**Top level** — exactly these keys, no others:

| Key | Rule |
|---|---|
| `schema_version` | must be `"1.0"` |
| `source` | string |
| `transcript_end_seconds` | valid time |
| `timestamp_unit` | must be `"seconds_from_source_start"` |
| `target_duration_seconds` | exactly `{min, max}`, with `min <= max` |
| `options` | array, at most 3 |

**Each option** — exactly `id`, `title`, `duration_seconds`, `clips`.

- `id` matches `option_1`, `option_2`, … and must be unique
- `title` is a non-empty string
- `clips` is a non-empty array
- `duration_seconds` must equal the sum of clip lengths within 0.005

**Each clip** — exactly `start`, `end`, `captions`.

- `start < end`
- `end <= transcript_end_seconds`
- each clip starts at or after the previous clip's end — clips run forward through one source and never overlap
- `captions` is a non-empty array

**Each caption** — exactly `start`, `end`, `text`.

- chronological within the clip
- the first caption starts at or after `clip.start`
- the last caption ends at or before `clip.end`
- `text` is a non-empty string

All three options live in **one file**. That is already how the schema works, so no change is needed.

## Implementation steps

1. **Fix `Technical Notes.md`** so later prompts are built from the real contract. Replace the example block and correct the SRT line.

2. **Author the shared skill, "Raw to Reels Reel JSON v1.0."** Contains the contract above plus a Python validator mirroring `fromReels` — including the 0.005 duration tolerance and the no-overlap rule. Written as plain markdown so it survives a move off NebulaOne. Must fit under 30k characters.

3. **Build the Json Handler.** Capabilities: Add Files, Data & File Tools, Generate Artifacts. Attach the skill. The system prompt must require it to:
   - load the transcript with Python rather than reading it inline
   - select the moments that answer the request
   - apply the clip buffer
   - run the validator and fix any failure before returning anything
   - emit the result as a **downloadable `.json` artifact, never as JSON in the chat body**

4. **Build the Video Planner.** Chat plus file attachment, plus artifact generation so it can hand back markdown or HTML. Its skill should make it genuinely conversational — ask, listen, refine, and keep going until the user says they have it. The rubric comes at the end, not immediately.

5. **Build the Orchestrator.** Routes on one distinction: a recording that already exists goes to the Json Handler, an idea not yet recorded goes to the Video Planner. Chat starters:
   - one for cutting an existing recording
   - one for planning a video from an idea
   - one that explains what this whole thing is and how to use it
   - one spare, to be decided once the other two are in use

## Testing approach

### Contract checks

Run the agent's output through `fromReels` for each of:

- a clean transcript
- a transcript shorter than the requested duration
- a transcript with long silences
- a deliberately vague request ("make me something good")

Confirm failures produce a message you can act on rather than a silent bad load.

### Routing checks

- Does the Orchestrator send an existing recording to the Json Handler?
- Does it send a raw idea to the Video Planner?
- Does an ambiguous request get a clarifying question rather than a guess?

### Conversation check

Run the Video Planner on a real rough idea and confirm it keeps the thread across several turns instead of dumping a rubric on the first reply.

## Risks and roadblocks

- **Model nondeterminism.** The same prompt can produce different output on different days, including output that drops a required field. This cannot be prompted away, only caught — which is what the validator is for. Without it, bad JSON reaches Caption Studio and fails with a one-line error that does not say which clip is wrong.
- **Transcript size.** Covered by the investigation. The system prompt must explicitly forbid inline reading, or the model will do it anyway.
- **Public agents.** Anyone with the link can use them, and uploaded transcripts are personal. Accepted.
- **Artifact URLs behave like bearer tokens.** Possession of the URL may be enough to retrieve the file. Accepted.
- **The Video Planner cannot be automatically verified.** No test says whether a rubric is good. It improves by use, not by a passing check — which is fine, because it is conversational and you can simply push back in the chat.
- **The platform may change.** Keeping skill bodies as portable markdown means a move costs configuration, not a rewrite.

## Decisions made

- All three options ship in **one** JSON file.
- v1 holds to schema v1.0. No schema bump.
- The Video Planner is conversational, not a one-shot form.

## Parked for later

- **Multi-angle mashup** — schema v1.0 has a single `source` and requires forward-only clips.
- **Per-word caption styling** — a caption accepts exactly `start`, `end`, `text`.
- **Idea database and analytics** — the Video Planner recommending topics from stored ideas or past video performance.

## Definition of done

- Three agents exist and the Orchestrator routes correctly on both paths.
- The Json Handler returns one `.json` that loads in Caption Studio without manual repair.
- The Video Planner holds a real back-and-forth conversation.
- `Technical Notes.md` matches the code.

## Status

**Draft for review. Not approved for implementation.**

---
_Authored with Claude Code._
