---
tool: claude
---

# Json Handler — setup

Everything needed to build this agent in NebulaOne. Step 3 of
`blueprints/active/feature-nebulaone-agents.md`.

## Configuration

| Setting | Value |
|---|---|
| Name | RawtoReels - Json handler |
| Model | `gpt terra` |
| Capabilities | Add Files, Data & File Tools, Generate Artifacts |
| Skill | Raw to Reels Reel JSON v1.0 — `nebulaone/skills/raw-to-reels-reel-json-v1.md` |

All three capabilities are required. Add Files takes the transcript, Data & File
Tools runs the Python, Generate Artifacts returns the result as a download. Missing
any one of them breaks the flow.

## Description

Under 300 characters.

> Turns a Raw to Reels transcript into reel JSON for Caption Studio. Attach your
> `.transcript.json`, say what you want to make, and get back one validated `.json`
> file with up to three cuts to choose from.

## System prompt

Paste this whole block.

```
You turn a Raw to Reels transcript into reel JSON that Caption Studio can load.

The user attaches a .transcript.json file and tells you what they want to make,
usually a duration and a topic. You return one .json file containing up to three
different cuts of that idea.

Follow the Raw to Reels Reel JSON v1.0 skill for the output contract, the clip
buffer rules, and the validator. The contract is strict and a single unexpected
field fails the user's load, so the skill is not a guideline. It is the spec.

HOW TO WORK

1. Load the transcript with Python using Data & File Tools. Never read it inline.
   These files run to a megabyte and reading one into the conversation will cost
   you the beginning of it. Loading it with code does not care how large it is.

2. Understand the request before cutting. If the user has not said roughly how
   long they want the reel, ask. If they have named a topic, work out which parts
   of the transcript actually speak to it rather than taking the first passage
   that mentions the words.

3. Select moments. A good cut is usually several moments from across the source
   stitched together, not one continuous stretch. Favour complete thoughts. A clip
   that starts mid-sentence reads as a mistake. Clips must run forward through the
   source and never overlap, so order your selections by time.

   Then merge. If two selections touch or sit within about a second of each other,
   they are one continuous stretch of speech, so make them one clip. A clip
   boundary where nothing is cut out is not a cut, and splitting there only
   inflates the clip count.

4. Apply the clip buffer from the skill, then recompute each option's
   duration_seconds from the padded clips. Never compute duration before padding.

5. Build captions from the transcript's own words and timings. Do not paraphrase,
   invent, or clean up what was said. The user edits wording later in Caption
   Studio. Your job is accurate timing.

6. Run the validator from the skill on the finished object. If it raises, fix the
   problem and run it again. Repeat until it passes.

7. Return the result as a downloadable .json artifact. Never paste the JSON into
   the chat.

ALONGSIDE THE FILE

In the chat, briefly say what each option is and why you cut it that way. One or
two lines each. This commentary belongs in the chat only. There is nowhere for it
in the JSON, and adding a field for it fails the user's load.

WHEN THE REQUEST CANNOT BE MET

Say so plainly instead of padding the output to hide it.

- If the transcript does not contain enough material on the topic for the length
  asked, return what it does support and say it ran short.
- If you can only find one good cut, return one option. Three weak options are
  worse than one strong one.
- If the topic is not in the transcript at all, say that and stop. Do not
  substitute a different topic.
- If the request is vague, ask one clarifying question rather than guessing.

Never return an invalid file in order to return something.
```

## Chat starters

None. This agent is silent. The only agent with chat starters will be the
Orchestrator — users arrive here by being routed, not by picking a starter.

## Testing

Testing happens in NebulaOne. Attach a fixture from `slop/retired-test-fixtures/`,
paste the prompt, and judge the result. These fixtures were retired to `slop/` on
13 October 2026; they still work, they are simply no longer part of the active tree.

The three `.transcript.json` fixtures match the exact shape `transcribe.py` writes,
down to the leading space on each word, so the agent sees nothing it would not see
from a real recording. They are sized so each test can only pass honestly: `clean`
runs 148 s across 18 segments, so a 60 second reel means real selection. `short`
runs 18 s, so a 60 second ask is impossible and admitting that is the only correct
answer. `silences` carries gaps of 18.68 s, 13.23 s, 9.40 s and 7.69 s, modelled on
the real ceiling file.

| # | Attach | Ask for | Should do |
|---|---|---|---|
| 1 | `clean.transcript.json` | a 60 second reel about getting diagnosed with narcolepsy | Return up to three valid options |
| 2 | `short.transcript.json` | a 60 second reel about narcolepsy | Return what it supports and say it ran short |
| 3 | `silences.transcript.json` | a 45 second reel about the diagnosis | Not produce clips that are mostly silence |
| 4 | `clean.transcript.json` | "make me something good" | Ask a question rather than guessing |
| 5 | `clean.transcript.json` | a reel about learning to drive a manual car | Say the topic is not in the transcript, and stop |
| 6 | `clean.transcript.json` | the word count and last timestamp, before cutting | Report 405 words and 148.36 s, by running code |

Case 6 is the one that cannot be faked. The numbers are only right if the agent
loaded the file with Python instead of reading it.

### Results, 12 October 2026

All six passed. Every returned file validated, and agent output loads cleanly in
Caption Studio — which also settles the open question of whether the validator in
the skill agrees with the browser's `app.fromReels`. It does.

| # | Result |
|---|---|
| 1 | Three options, 67–73 s against a 60–75 s target |
| 2 | Returned 15.14 s for a 55–65 s ask and said it ran short, rather than padding to fake the length |
| 3 | Not one clip spanned any silence gap. Zero dead air in all five clips |
| 4 | Asked one clarifying question, then committed when told to surprise it |
| 5 | Named the mismatch and asked for the right transcript |
| 6 | 405 words, 148.36 s, exact |

The clip buffer is being applied correctly: every clip carries 0.5 s of lead-in and
0.4 s of tail, falling to zero exactly where the rules require clamping — at the
transcript end, and where two clips meet.

**One defect found and fixed in the system prompt.** The agent split continuous
stretches of speech into separate clips — a boundary at 117.58 s in two separate
runs, and the whole of `short.transcript.json` chopped into three touching clips.
Valid output, but a clip boundary where nothing is removed is not a cut. Step 3 of
the prompt now tells it to merge selections that touch. **Not yet re-tested.**

Agent outputs from these runs are kept in `slop/retired-test-fixtures/` for
comparison against later changes.

### Merge re-test — pending

Re-run **case 2** (`short.transcript.json`, a 60 second ask). It is the sharpest test
because it produced the worst version of the defect: one 15.14 s option chopped into
three clips with nothing removed between them.

**The check is a one-liner.** Measure the gap between each clip's `end` and the next
clip's `start`. A gap of exactly 0 means nothing was cut there, so the boundary should
not exist.

```python
import json
d = json.load(open("output.json", encoding="utf-8"))
for o in d["options"]:
    c = o["clips"]
    print(o["id"], [round(c[i+1]["start"] - c[i]["end"], 3) for i in range(len(c) - 1)])
```

Baseline from the stored outputs of the 12 October runs, before the fix:

| Fixture | Option | Zero gaps |
|---|---|---|
| `narcolepsy_diagnosis_reel_short_json.json` | option_1 | 2 of 2 boundaries — the whole thing is one stretch |
| `narcolepsy_60-75_second_reels_clean_transcript.json` | option_1 | 1 of 3 |
| | option_3 | 2 of 3 |
| `narcolepsy_story_reels.json` | option_3 | 1 of 1 |

**Pass:** case 2 returns one clip, and no option in any re-run prints a zero gap.
Duration should land near 15.14 s either way — merging touching clips removes a
boundary, not footage, so a big duration change means something else moved.

Watch for the opposite failure too. Over-merging swallows a real pause: if a reel comes
back with two clips where it used to have five, check that nothing now spans a silence,
which is what case 3 exists to catch.

One subtlety worth knowing before reading results. A zero gap in the output does not
prove the agent picked touching selections — the padding closes gaps on its own, since
`LEAD_IN + TAIL` is 0.9 s and `pad_clips` clamps each end to the next clip's start. It
does not matter. A boundary with nothing removed is the defect whichever step created
it, and the merge threshold in the prompt, "about a second", lines up with the 0.9 s
the padding would close anyway.

### Reference output

`expected-reel.json` is a hand-built valid reel: three clips, 46.88 s, inside a
45–60 target. Useful as a known-good file to load in Caption Studio when something
looks wrong and you need to tell an agent problem from an app problem.

### What to watch on the first real reel

The clip buffer defaults — `LEAD_IN = 0.5`, `TAIL = 0.4` — are starting values, not
a decision. Watch a reel and judge:

- Do the cuts still feel clipped? Raise both.
- Do clips drag with dead air at the edges? Lower them.
- Is the reel landing well under its target? That is the cost of padding counting
  against the target. The alternative is overshooting the requested length.

Both constants are at the top of the validator code block in the skill.

## Known unknowns

- Whether the merge instruction added to step 3 actually stops the agent splitting
  continuous speech. Added after testing, so unverified. See **Merge re-test** above
  for the procedure and the before-the-fix numbers to compare against.
- Whether an attachment survives a hand-off from the Orchestrator. Expected not to,
  so the Orchestrator's chat starters must tell the user to attach the transcript
  after arriving here, not before. Built that way in `orchestrator-setup.md`: the
  Orchestrator has no file capabilities at all, so the mistake is hard to make.

---
_Authored with Claude Code._
