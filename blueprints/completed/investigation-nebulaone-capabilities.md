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
    - yes
- Does the agent respond without truncating or timing out?
    - took 17 seconds
- Does it report the correct number of segments and words, or does it guess?
    - it is right

### 2. Method — does it use code, or does it read the file inline?

This matters more than size. A model that reads a large transcript into the conversation will burn its context and start forgetting the beginning. One that loads it with Python does not care how big the file is.

**Probe prompt** — attach the transcript and paste this:

> Do not read the attached transcript inline. Use Data & File Tools to load it with Python, then report only: file size in MB, number of segments, number of words, first and last timestamp, and the three longest gaps between consecutive words with their timestamps. Return a short table. Do not summarize the content.

What to look for:

- Does it actually run Python, or does it answer from reading?
    - uses code interperter
- Are the numbers correct? Check against the file.
    - they line up
- The silence gaps are a bonus — that data directly feeds the clip buffer work in `feature-clip-timeline-editor.md`.

What it returned:

| Metric | Result |
|---|---|
| File size | 0.96 MB |
| Segments | 753 |
| Words | 8,403 |
| First timestamp | 00:00:03.76 |
| Last timestamp | 00:49:07.10 |
| Longest gap 1 | 18.68 s · 00:35:44.23–00:36:02.91 |
| Longest gap 2 | 13.23 s · 00:22:27.10–00:22:40.33 |
| Longest gap 3 | 7.69 s · 00:29:19.63–00:29:27.32 |

### 3. Artifacts — is the handoff reliable?

- Can it produce a downloadable `.json` artifact on request?
    - yes we can specify to return an artifact.
- Does it do so consistently, or does it sometimes dump JSON into the chat instead?
    - we can get an artifact
- Does a multi-step task still end with a clean artifact?
    - Yes 

### 4. Platform limits — confirm the numbers

- Skill body under 30k characters, description under 300 characters, title required.
- Chat starters: how many, and can they be phrased to trigger a hand-off?
    - 4 starters 
- Hand-off behavior: when one agent hands to another, does the user keep their attached file, or do they have to re-upload it?
    - Will most likely have to re upload. I think it will be better for the orchestrator to send us to the other agent we perform our tasks then we get routed back.

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

**Size — passes.** The ceiling transcript (0.96 MB, 753 segments, 8,403 words) uploaded without trouble and came back in 17 seconds. No truncation, no timeout. Segment and word counts were correct rather than guessed.

**Method — uses code.** Told not to read inline, it went to the code interpreter. Every number it reported lined up with the file. This is the finding the whole investigation hung on: the Json Handler can be built as planned, with no pre-filtering step.

**Silence gaps — usable.** Three gaps over 7 seconds, the longest 18.68 s at 00:35:44. The agent can measure these on demand, so the clip buffer work in `feature-clip-timeline-editor.md` does not need its own pre-pass.

**Artifacts — reliable.** It produces a downloadable `.json` when asked, it keeps doing so rather than dumping JSON into the chat, and a multi-step task still ends with a clean artifact. Caption Studio does not need a paste-JSON fallback.

**Hand-off — attachment is probably lost.** Not confirmed outright, but the working assumption is the user has to re-upload after a hand-off. The preferred shape is therefore a round trip: the Orchestrator routes out, the specialist agent does its work, the user lands back at the Orchestrator. Chat starters have to be worded so the file is attached *after* routing, never before. Four starters are available.

**Model — deferred.** `gpt terra` stays the pick for now. The context limit was never recorded and does not need to be: the agent loads the transcript with Python instead of reading it into context, so the limit is no longer the constraint it looked like when this investigation was written. If output quality disappoints, swapping the model is a configuration change, not a redesign.

**Ceiling file.** The last word lands at 00:49:07, not the ~54:00 the blueprint assumed — the wrong file was grabbed. It changes nothing: a 0.96 MB transcript handled in code leaves plenty of headroom, and the method answer does not depend on length.

## Risks and roadblocks

- A single test run can mislead. The same model can behave differently on a second attempt, so repeat anything surprising before treating it as settled.
- Testing with a small transcript proves nothing about the large one. Use the real ceiling file.

## Definition of done

- All five questions above have a recorded answer in **Findings**.
- It is clear whether the Json Handler can be built as planned or needs a pre-filter.

## Status

**Complete.** The question this investigation existed to settle is settled: the agent loads the full transcript with Python and reports accurate numbers, so the Json Handler is built as designed with no pre-filtering step. Artifacts are reliable, which also removes the need for a paste-JSON fallback in Caption Studio.

Two small items were deliberately deferred rather than left blocking:

- **Model confirmation.** `gpt terra` stands until something gives a reason to change it. A swap is configuration, not rework.
- **Hand-off wording.** The Orchestrator chat starters need to tell the user to attach the transcript *after* routing, and the round-trip shape — route out, do the work, land back at the Orchestrator — is the preferred design. Both are adjustments to make while building `feature-nebulaone-agents.md`, not reasons to hold this open.

---
_Authored with Claude Code._
