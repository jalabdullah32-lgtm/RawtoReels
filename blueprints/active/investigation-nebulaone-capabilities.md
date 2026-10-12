---
tool: claude
---

# Investigation: NebulaOne Capabilities

## Goal

Find out what a NebulaOne agent can actually do with a Raw to Reels transcript **before** designing the three agents. The answers change how the Json Handler is built, so this work comes first.

## Why this is separate

Two designs are possible and they are very different:

- **If the agent can handle a full transcript in code** — it loads the file with Python, picks moments, and emits one JSON artifact. Simple.
- **If it cannot** — the transcript has to be cut down before the agent ever sees it, which means pre-filtering work on our side and a much more complicated agent.

Guessing wrong means rebuilding the agent. This investigation is cheap and settles it.

## Questions to answer

### 1. Size — can it take the biggest file this project will ever produce?

Test with the transcript from the 54-minute 4K video. That is the realistic ceiling.

- Does the upload succeed?
- Does the agent respond without truncating or timing out?
- Does it report the correct number of segments and words, or does it guess?

### 2. Method — does it use code, or does it read the file inline?

This matters more than size. A model that reads a large transcript into the conversation will burn its context and start forgetting the beginning. One that loads it with Python does not care how big the file is.

**Probe prompt** — attach the transcript and paste this:

> Do not read the attached transcript inline. Use Data & File Tools to load it with Python, then report only: file size in MB, number of segments, number of words, first and last timestamp, and the three longest gaps between consecutive words with their timestamps. Return a short table. Do not summarize the content.

What to look for:

- Does it actually run Python, or does it answer from reading?
- Are the numbers correct? Check against the file.
- The silence gaps are a bonus — that data directly feeds the clip buffer work in `feature-clip-timeline-editor.md`.

### 3. Artifacts — is the handoff reliable?

- Can it produce a downloadable `.json` artifact on request?
- Does it do so consistently, or does it sometimes dump JSON into the chat instead?
- Does a multi-step task still end with a clean artifact?

### 4. Platform limits — confirm the numbers

- Skill body under 30k characters, description under 300 characters, title required.
- Chat starters: how many, and can they be phrased to trigger a hand-off?
- Hand-off behavior: when one agent hands to another, does the user keep their attached file, or do they have to re-upload it?

That last one is important. If the attachment is lost on hand-off, the Orchestrator cannot take the file first — the user has to attach it *after* landing on the Json Handler, which changes the chat starter wording.

### 5. Model

- Confirm `gpt terra` is the right pick, and note its context limit.
- Note which models offer reasoning-effort and verbosity controls, in case output quality needs tuning later.

## What each outcome changes

| Finding | Effect |
|---|---|
| Handles the full transcript in code | Json Handler is built as planned. No pre-filtering. |
| Chokes on size | A pre-filter step is needed before the agent sees the file. Significant extra work. |
| Reads inline despite instructions | The system prompt needs stronger wording, or the transcript must be trimmed. |
| Artifacts are unreliable | Caption Studio needs a paste-JSON box as a fallback to the file upload. |
| Attachment lost on hand-off | Orchestrator chat starters must tell the user to attach *after* routing. |

## Testing approach

This investigation *is* the test. Record the result of each probe directly in this file under **Findings** as you go.

## Findings

_To be filled in as the tests run._

- Size:
- Method (code vs inline):
- Artifact reliability:
- Hand-off and attachments:
- Model and context limit:

## Risks and roadblocks

- A single test run can mislead. The same model can behave differently on a second attempt, so repeat anything surprising before treating it as settled.
- Testing with a small transcript proves nothing about the large one. Use the real ceiling file.

## Definition of done

- All five questions above have a recorded answer in **Findings**.
- It is clear whether the Json Handler can be built as planned or needs a pre-filter.
- `feature-nebulaone-agents.md` has been updated to match what was learned.

## Status

**In progress.** The big-JSON probe is being run now.

---
_Authored with Claude Code._
