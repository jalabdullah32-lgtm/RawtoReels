---
tool: claude
---

# Feature: NebulaOne Agent System

## Goal

Add three NebulaOne agents — an **Orchestrator** that routes, a **Json Handler** that turns a transcript into reel JSON, and a **Video Planner** that turns a rough idea into a recording rubric — and embed the Orchestrator into Caption Studio so planning, cutting, and editing happen in one window.

## Proposed user experience

### Cutting a video you already recorded

1. Open Caption Studio. The agent panel sits beside the editor.
   - I want this to be on the side. to the right of the phone screen. I know thta thte caption info is there but it looks off. I just added a Jpeg image of how I want the UI to look. Can you make me 3 mockup images based on it?
2. Say "I want a 60 second IG reel about how I got diagnosed with Narcolepsy."
3. The Orchestrator hands off to the Json Handler.
4. Attach the `.transcript.json` from `Videos/transcripts`.
   - Perfect. Is there any way we can have it auto open that file directory?
5. The agent returns up to three reel options as a downloadable `.json` file.
   - I want this agent to place it all in one Json file. I was able to do this with a 54min 4k video and talked a ton this should be fine we can rework it if any issues.
6. Download it, click **Load JSON**, pick an option, edit captions, export.

### Planning a video you have not recorded

1. Paste a rough idea or voice-note transcript into the panel.
2. Say "I want to turn this into a 75 second IG reel."
3. The Orchestrator hands off to the Video Planner.
4. The agent returns a rubric plus up to five questions about what you already said.
   - Yes, I really want this to be fairly conversational until the user feels satisfied.
5. Record your answers on camera, drop the file into `Videos/input`, transcribe it, then run the cutting flow above.

## Current project context

- `app.fromReels` (`app/js/captions.js:27`) already validates Raw to Reels schema v1.0 strictly. Its `checkKeys` helper rejects **any** unexpected field, so the agent cannot invent keys.
- `app/js/app.js:20` already routes an uploaded file to the right parser when it sees `schema_version` or `options`. Agent output will load today with no new code.
- `Technical Notes.md` documents a `reels: [{title, start, end, captions}]` shape that the code does not use — the real shape is `options[].clips[]`. This doc is stale and would produce a broken agent prompt if copied.
- NebulaOne agents are public, need no key, and support skills (skill body under 30k chars, Skill description must be under 300 chars, needs a title), system prompts, chat starters (Orchestrator should have a chat starter that would allow use to select it and be routed to agent json or video planner agent. Also a chat starter as a breakdown pf the agent, how to use etc.), Data & File Tools, file attachments, artifact generation, and agent hand-off.
- The project principle is that video, audio, and editing stay local, and only transcript JSON goes to an AI. This design keeps that true.

### The iframe gives co-location, not integration

`cs.nebulaone.ai` is a different origin. Caption Studio cannot read the chat inside the frame, and the agent cannot push data out to the page. Embedding puts the agent *next to* the editor in one window — it does not wire them together. The download step is a consequence of that boundary, not an oversight.

## The output contract
 -  This section is over my head, but if we have any problems We'll trouble shoot accordingly 
Taken from the code, not from `Technical Notes.md`. All times are seconds, finite, and `>= 0`.

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
- each clip must start at or after the previous clip's end — clips run forward through one source and never overlap
- `captions` is a non-empty array

**Each caption** — exactly `start`, `end`, `text`.

- chronological within the clip
- the first caption starts at or after `clip.start`
- the last caption ends at or before `clip.end`
- `text` is a non-empty string

## Relevant files and components

- `app/index.html` — add the agent panel iframe.
- `app/css/studio.css` — layout so the panel does not crowd the editor.
- `Technical Notes.md` — correct the stale schema section.
- `app/js/captions.js` — read-only reference. This is the source of truth for the contract.
- NebulaOne — three agents and one shared skill, configured outside this repo.

## Implementation steps

1. **Correct the stale schema doc** in `Technical Notes.md` so every later prompt is built from the real contract rather than the old `reels[]` shape.
   - What is stale, just point it out ot me.

2. **Author the shared skill, "Raw to Reels Reel JSON v1.0."** It holds the contract above plus a Python validator mirroring `fromReels`, including the 0.005 duration tolerance and the no-overlap rule. Write it as platform-neutral markdown so it survives a move off NebulaOne.
   -  Over my head. A skill within nebOne to ensure it fits our python exactly is a great Idea though. I trust you can ensure this.

3. **Build the Json Handler agent.** Capabilities: Add Files, Data & File Tools, Generate Artifacts. Attach the skill. The system prompt must require it to:
   - load the transcript with Python rather than reading it inline
   - select the moments that answer the user's request
   - apply the clip buffer
   - run the validator and fix any failure before returning anything
   - emit the result as a **downloadable `.json` artifact, never as JSON in the chat body**

4. **Add the clip buffer.** Pad each clip by a default 1.5s on both sides, clamped to 0 and `transcript_end_seconds`, shrinking the padding where two clips would collide. This needs no schema change — captions stay in bounds because padding only widens the clip.
 - Sound great, my only issue with this is we will probably need some type of video editor/bar slider. Please work with me to Iron out the best way to make the videos flow well and not be Jerky. 

5. **Build the Video Planner agent.** Chat plus file attachment. Its skill produces a rubric and at most five questions about what the user already said. Output is human-readable; there is no file contract.

6. **Build the Orchestrator.** The system prompt routes on a single distinction: a recording that already exists goes to the Json Handler, an idea not yet recorded goes to the Video Planner. Four chat starters covering both paths.

7. **Embed the Orchestrator** in `app/index.html` as a side panel using the standard NebulaOne iframe embed.
 - Is there any styling or changing we can do to this? 
## Testing approach

### Contract checks

Run the agent's output through `fromReels` for each of:

- a clean transcript
- a transcript shorter than the requested duration
- a transcript with long silences
- a deliberately malformed request

Confirm failures produce a message you can act on rather than a silent bad load.

### Buffer checks

- padding never produces overlapping clips
- padding never crosses 0 or `transcript_end_seconds`
- `duration_seconds` still matches the clip sum after padding

### User visual acceptance test

1. Open Caption Studio and confirm the agent panel loads and the editor is still usable.
2. Ask for a 60-second reel, attach a real transcript, download the `.json`.
3. Load it with **Load JSON** and confirm up to three options appear.
4. Play an option and confirm the cuts feel natural rather than jerky.
5. Export and confirm the video matches the preview.
6. Run the planning flow on a rough idea and confirm the questions are answerable on camera.

## Risks and roadblocks

- **The iframe is isolated.** No automatic handoff between agent and editor. The download step cannot be removed in v1 without a postMessage mechanism from NebulaOne.
- **Artifact discovery is unsolved.** Caption Studio cannot learn the newest artifact URL on its own. This is why the handoff is manual.
   - This is fine
- **Artifact URLs behave like bearer tokens.** Testing showed an artifact URL remained downloadable from a private/incognito context. Possession of the URL may be enough to retrieve the file. The agent being secure does not make the artifact access-controlled, and reel JSON carries your transcript's content.
   - Also fine
- **Transcript size.** A long video's word-level JSON can exceed any context window. Mitigated by processing the file in code rather than reading it into the conversation — but this must be stated in the system prompt, or the model will read it inline anyway.
   - Im doing a test in nebulaOne platform with the biggest Json this program will ever experience. CAn you give me a tiny prompt to see how it will fair?
- **Public agents.** Anyone with the link can use them, and the transcripts you upload are personal. Worth deciding what you are comfortable sending.
   - Yes 
- **Model nondeterminism.** The validator is the guard. Without it, invalid JSON reaches the app and fails with a terse error.
   - What does this mean?
- **The Video Planner's output cannot be verified.** The Json Handler has a validator; the planner only produces text. There is no automated test for "is this a good rubric." That agent improves by iteration, not by a passing check.
   - We can talk with this agent back and forth. This agent can also generate md/HTML/CSS/JS outputs.
- **The platform may change.** NebulaOne holds "as long as it can be." Keeping skill bodies as portable markdown means a move costs configuration, not a rewrite.
   - Soudnds good.

## Open questions

- **Does the clip buffer count against the target duration?** The default here is 1.5s per side; `README.md` suggests 2–3s. At 2.5s per side a four-clip reel gains 20 seconds, which will overshoot a 60-second target.
   - Thats fine, I mentioned this above. Will most likely need to do some fine tuning via some editing slider or somthing.

-
## Decisions made

- **Handoff is by file download**, using the existing **Load JSON** button. No new code and no outbound HTTPS, so `server.py` stays local-only.
- **v1 holds to schema v1.0.** No schema bump.

## Parked for later

Each of these needs a schema bump plus changes to validation, playback, and export:

- **Multi-angle mashup** — schema v1.0 has a single `source` and requires forward-only, non-overlapping clips. Multi-source cannot be expressed today.
- **Per-word caption styling** — a `caption` accepts exactly `start`, `end`, and `text`. Any style field is rejected.
- **Fetching the artifact by pasted URL** — revisit once agent output is good and the URL format proves stable. Would need a host allowlist so the server cannot become a general-purpose fetcher.
- **Idea database and analytics** — the Video Planner recommending topics based on stored ideas or past video performance.

## Explicitly out of scope

The overlay architecture described in `Agents/AI_Caption_Studio_Build_Guide_Updated.pdf` is superseded: `caption_design.json`, `caption_style.css`, `captions_overlay.mov`, SRT output, and the Playwright/Remotion renderer. Current code burns captions in through `video-export.js`, and SRT support was removed deliberately.

## Definition of done

- Three agents exist and the Orchestrator routes correctly on both paths.
- The Json Handler returns a `.json` that loads in Caption Studio without manual repair.
- Clips carry a buffer and the cuts feel natural.
- The agent panel is embedded and the editor remains usable.
- `Technical Notes.md` matches the code.
- The user completes the visual acceptance test.

## Status

**Parked — superseded by four focused blueprints.**

### Why this is parked

This document tried to cover three unrelated kinds of work at once: configuring agents on an external platform, redesigning the app's layout, and building a timeline editor. Different tools, different testing, different risks. It grew past the point of being useful to plan from.

It was split on 12 October 2026 into:

- `investigation-nebulaone-capabilities.md` — what the platform can actually do, tested before the agents are designed
- `feature-nebulaone-agents.md` — the Orchestrator, Json Handler, and Video Planner
- `improvement-caption-studio-layout.md` — the three-column redesign
- `feature-clip-timeline-editor.md` — the clip buffer and the filmstrip/waveform timeline

### Why it is kept rather than deleted

The inline comments throughout this file are the original source material for all four. They record what was wanted and why, in the owner's own words. The split blueprints carry the conclusions; this one carries the reasoning.

Nothing here should be implemented directly. Work from the four files above.

---
_Authored with Claude Code._
