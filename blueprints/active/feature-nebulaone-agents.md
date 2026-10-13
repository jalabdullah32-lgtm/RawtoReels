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

1. ~~**Fix `Technical Notes.md`**~~ — **done.** The file now carries the real contract under "Reel JSON schema v1.0", with a corrected example. The SRT line says removal is complete; legacy JSON is still accepted and still scheduled for removal.

2. ~~**Author the shared skill, "Raw to Reels Reel JSON v1.0."**~~ — **done.** Lives at `Agents/skills/raw-to-reels-reel-json-v1.md`. Contains the contract, the buffer rules, a Python validator mirroring `fromReels`, and a failure-modes list. 13,164 characters, comfortably under the 30k limit. The code block is deliberately pure ASCII so it survives being written to a `.py` file on a non-UTF-8 default.

3. ~~**Build the Json Handler.**~~ — **built and tested.** Configuration, system prompt, and test cases live in `Agents/json-handler-setup.md`. All six test cases passed on 12 October, and its output loads in Caption Studio without manual repair, which is the bar this step was set against.

   One defect found: the agent split continuous speech into separate clips. The system prompt now tells it to merge touching selections. **That fix has not been re-tested** — re-run case 2, which produced three touching clips where one would do.

   The agent is silent, with no chat starters. Only the Orchestrator carries those.

4. **Build the Video Planner.** — **written, not yet built.** Configuration, system prompt, and seven test cases live in `Agents/video-planner-setup.md`; its skill is `Agents/skills/raw-to-reels-video-planning-v1.md` (8,624 characters). Add Files and Generate Artifacts, so it can take notes to plan from and hand back markdown or HTML. Data & File Tools is optional here — there is no transcript to load.

   The skill is built around one rule: **no rubric on the first reply.** Talk first, keep going until the user says they have the angle, and only then produce it. Every question in the rubric has to be built from what the user already said, which is the difference between a prompt they can answer in one take and an interview question. Prompts to speak to, never a script to read.

   Nothing here can be verified automatically. Case 1 — does it resist delivering a plan on turn one — is the sharp test, and the internship rant at `Agents/test-fixtures/internship-rant.md` is the fixture.

   **The agent is built in NebulaOne. Cases 1 and 2 passed; testing is parked.** It reflected the idea back and asked instead of planning, and it held the thread across follow-up turns, which is the failure it was most at risk of. The owner stopped the phase there on purpose, to resume closer to real integration — this is a deliberate pause, not a blocked step. One artifact was kept, `Agents/test-fixtures/internship-reel-rubric.html`, and it reads well against the bar in the skill.

5. **Build the Orchestrator.** — **built, hand-off confirmed working.** Configuration, system prompt, hand-off conditions, chat starters, and eight test cases live in `Agents/orchestrator-setup.md`. The eight cases were not run individually; the owner judged it good enough and moved on.

   Each hand-off is configured with a "When to use" condition under **Collaborate with another Agent**. That text is what the model actually routes on, so it carries more weight than the routing prose in the system prompt. Both conditions state the trigger, the one deciding question, and when *not* to fire — the negative clause matters, because a model given two hand-offs and no reason to prefer either tends to pick whichever is described more richly rather than whichever fits. Routes on one distinction: a recording that already exists goes to the Json Handler, an idea not yet recorded goes to the Video Planner. Anything unclear gets one question rather than a guess.

   **It has no file capabilities, deliberately.** Since an attachment is not expected to survive a hand-off, the Orchestrator cannot be allowed to take the transcript — accepting one would teach a habit that loses the user's file. No skill either; the routing rule and the project explainer both fit in the system prompt.

   Chat starters:
   - one for cutting an existing recording
   - one for planning a video from an idea
   - one that explains what this whole thing is and how to use it
   - one spare, left unassigned on purpose until the other two have seen real use. Three candidates are recorded in the setup file.

   Starter 1 deliberately does **not** mention attaching a file. That instruction belongs in the reply, after routing.

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

- [x] Three agents exist and the Orchestrator routes correctly on both paths. *Hand-off confirmed working; the full case set is not run.*
- [x] The Json Handler returns one `.json` that loads in Caption Studio without manual repair.
- [ ] The Video Planner holds a real back-and-forth conversation. *Early evidence says yes — cases 1 and 2 passed — but left unchecked while testing is parked.*
- [x] `Technical Notes.md` matches the code.

## Status

**In progress.** Steps 1 to 3 are done: the schema is documented, the shared skill is written, and the Json Handler is built and passing all six of its test cases with output that loads in Caption Studio.

**All three agents now exist in NebulaOne and the hand-off works.** That last point was the real risk in this design: if hand-offs had failed, the Orchestrator would have had no reason to exist and each specialist would have needed its own front door. It did not fail.

What is built is deliberately not fully tested. The Json Handler is the exception — six cases, all passing, output loading in Caption Studio. The Video Planner passed the two cases that mattered most and was parked. The Orchestrator was confirmed routing and parked. Both pauses were the owner's call, made to resume closer to real integration, and neither is a blocked step.

Remaining, all of it hands-on in NebulaOne:

- **Finish testing the Video Planner.** The best resumption is not cases 3 to 7 — it is recording one video against the saved rubric and running the transcript through the Json Handler, which exercises the planner, the hand-off, and the cut in one pass.
- **Finish testing the Orchestrator.** Case 4 first — an ambiguous request that should draw a question rather than a guess, and the most likely real-world phrasing of the two.
- **Re-test the merge fix** on the Json Handler. Re-run case 2 and check that no clip boundary has a zero gap. The procedure and the before-the-fix numbers are in `Agents/json-handler-setup.md` under **Merge re-test**.

Two assumptions are still assumptions, both recorded as known unknowns in the setup files: whether an attachment survives a hand-off, and whether the user lands back at the Orchestrator afterwards. Each is settled by one test — Orchestrator cases 6 and 8. The build is deliberately safe in the direction of both being true as assumed, so being wrong about either costs a wording change rather than a redesign.

---
_Authored with Claude Code._
