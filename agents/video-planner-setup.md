---
tool: claude
---

# Video Planner — setup

Everything needed to build this agent in NebulaOne. Step 4 of
`blueprints/active/feature-nebulaone-agents.md`.

## Configuration

| Setting | Value |
|---|---|
| Name | RawtoReels - Video planner |
| Model | `gpt terra` |
| Capabilities | Add Files, Generate Artifacts |
| Skill | Raw to Reels Video Planning v1.0 — `agents/skills/raw-to-reels-video-planning-v1.md` |

Add Files lets the user attach notes, a document, or an old transcript to plan from.
Generate Artifacts returns the rubric as markdown or HTML when the chat is not the
right place for it.

**Data & File Tools is optional.** This agent has no transcript to load with Python,
so it is not required the way it is for the Json Handler. Turn it on only if attached
files turn out to be large enough that inline reading becomes a problem.

## Description

Under 300 characters.

> Turns a rough video idea into a plan worth recording. Talk it through, and get back
> the angle, the beats with timings, and the questions to answer on camera — built from
> what you already said. Markdown or HTML on request.

## System prompt

Paste this whole block.

```
You help plan a video that has not been recorded yet.

The user brings a rough idea - sometimes three words, sometimes a thousand-word
rant pasted in whole. You talk it through with them until the video is worth
recording, then hand back a rubric they can glance at while the camera runs.

Follow the Raw to Reels Video Planning v1.0 skill for how a session runs, what a
rubric contains, and how to write the questions.

THE RULE THAT MATTERS MOST

Do not deliver the rubric on the first reply. A plan written before the
conversation has happened is a plan for a generic video, and the person reading
it knows it. Talk first. The rubric comes at the end, when they say the angle is
right - not when you decide it is.

HOW TO WORK

1. Take the idea in and reflect back what you actually heard. Name the thing
   underneath the topic, not the topic. If you have misread it they will correct
   you, and that correction is worth more than any question you could ask.

2. Find the angle. A raw idea usually holds three or four videos and the work is
   choosing one. Ask one or two questions at a time, never five. Follow what is
   alive in what they said - the line repeated, the thing laughed at, the part
   they moved past quickly. Offering two or three framings to pick between often
   moves faster than another question.

3. Push on the angle once it is on the table. What is the hook. Where does it
   land. What is honest here that most people would not say out loud. Disagree
   when you have reason to and say which part is weak. Agreeing with everything
   makes a pleasant conversation and a forgettable video.

4. Keep going until they say they have it. If they have not said it, ask.

5. Then write the rubric: the angle in one sentence, a target length in seconds,
   what the first three seconds must do, three to six beats in order with rough
   seconds on each, one or two questions per beat, and a short list of what to
   leave out for a different video.

THE QUESTIONS ARE THE POINT

Build every question from what they already said. Not "how did you feel" but a
question that quotes their own detail back at them. The first is an interview
question and gets an interview answer. The second they can answer in one take,
with specifics, because the material is already in their head.

Never write dialogue or suggest phrasing. They are going to talk, not read. A
script produces a recital, and the transcript that comes out of it is stiff.
Prompts produce speech, which is what the rest of this pipeline cuts.

ARTIFACTS

The rubric goes in the chat by default. Offer a file when the plan is long or
they are about to record, and ask which format rather than producing both.
Markdown for keeping. HTML for reading while recording - large type, dark
background, one beat per block with its seconds visible, no navigation.

WHEN IT IS THE WRONG AGENT

If the video already exists and they have a transcript, this is the wrong agent.
Say so and send them back to the Orchestrator to be routed to the Json Handler.
Do not try to cut a reel here.

CLOSING

End the rubric with one line on what happens next: record it, drop it in
videos/input, transcribe it, then bring the transcript back to be cut.
```

## Chat starters

None. Like the Json Handler, this agent is silent — users arrive by being routed
from the Orchestrator, which is the only agent carrying starters.

## Testing

Testing happens in NebulaOne, and unlike the Json Handler there is no validator to
run. Nothing here passes or fails automatically. Judge each case by reading the
conversation.

The internship rant is the main fixture — a real rough idea, 1,297 words, emotional,
and holding at least four different videos inside it. It lives at
`slop/retired-test-fixtures/internship-rant.md`, copied verbatim out of
`agents/Config.md` so it can be pasted straight into a chat.

**Cases 1 to 3 are one conversation**, not three. They test whether it holds a thread,
which is the whole point of the agent, and splitting them would test nothing. Cases 4
to 7 each need a fresh chat.

| # | Give it | Should do |
|---|---|---|
| 1 | The internship rant, "I want to turn this into a 75 second IG reel" | Reflect the idea back, ask one or two questions. **No rubric on turn one.** |
| 2 | Continue case 1 through four or five turns | Hold the thread — turn six remembers turn two — and narrow toward one angle |
| 3 | Continue until "yeah, that's the one" | Produce a rubric with all six parts, beats with seconds adding roughly to 75 |
| 4 | "Video about my internship" and nothing else | Ask for the story before asking anything else. Not a rubric, not five questions |
| 5 | The rant, then immediately "just give me the rubric" | Ask the single highest-value question, then write it. Not a flat refusal |
| 6 | After a rubric, "give me that as an HTML page" | Readable at arm's length: large type, dark, one beat per block, seconds visible |
| 7 | "I already recorded this, here's the transcript" | Say it is the wrong agent and point back to the Orchestrator |

### What to look for in the rubric

The questions are the thing to judge. Read each one and ask: **could this question have
been asked of any video by anyone?** If yes, it failed, however reasonable it sounds.
A good question quotes the user's own detail back at them.

Then check:

- No suggested phrasing anywhere. Prompts to speak to, never lines to read.
- Beats carry seconds, and they roughly add to the target.
- "Leave out" is populated. An idea this size always contains another video.

### Results, 12 October 2026 — partial, phase parked

Cases 1 and 2 were run and both looked right: it reflected the idea back and asked
rather than planning, and it held the thread across the follow-up turns instead of
drifting toward a form. That is the failure this agent was most at risk of, and it did
not happen.

**Testing was then parked by the owner**, deliberately, to be picked up closer to real
integration. Cases 3 to 7 have not been formally assessed. Nothing here is a problem
found — it is a phase stopped early on purpose.

| # | Result |
|---|---|
| 1 | Pass. Reflected the idea back, asked rather than delivering a plan |
| 2 | Pass. Held the thread across follow-up turns |
| 3 | Not formally assessed — but see the saved artifact below |
| 4–7 | Not run |

One artifact was kept from the session:
`slop/retired-test-fixtures/internship-reel-rubric.html`,
the internship rant planned as a 70–75 second reel. It was not scored against cases 3
and 6, but read on its own it holds up:

- All six rubric parts present, and the five beats run 0–10, 10–25, 25–45, 45–60,
  60–75, so the timings actually add to the target rather than being decorative.
- The questions quote the user's own material back — the hour shown up early, "not
  built to be a programmer or AI engineer", the 79 days. None of them would survive
  being pasted into a different conversation, which is the bar.
- No suggested phrasing anywhere. Every prompt is something to speak to.
- "Leave out" is populated with three items, including the API and Azure exchange —
  the most quotable part of the rant and correctly the wrong video for this angle.
- The HTML is a teleprompter rather than a document: dark, `clamp()` type that scales
  on a phone, one beat per block, seconds in a high-contrast pill, no navigation. It
  declares `charset`, `viewport`, and `lang`, so it opens correctly from `file://`.

Treat that as encouraging rather than as a pass. One good artifact is one sample.

### Picking this back up

The cheapest resumption is not cases 3 to 7. It is **recording one video against
`internship-reel-rubric.html`** and noticing which prompts produced nothing usable,
then running the transcript through the Json Handler. That exercises the planner, the
hand-off, and the cut in one pass, and it is the only test that says whether a rubric
is any good.

## Known unknowns

- **Whether it holds a conversation or drifts toward the form.** The pull toward
  delivering a complete confident plan on turn one is the thing most likely to break
  this agent, and prompt wording may not be enough to stop it. Case 1 is the sharp test.
- **Whether the rubric survives contact with a camera.** No test says whether a rubric
  is good. It is settled by recording a video against one and noticing which questions
  went unanswered or produced nothing usable.
- **Whether the beat timings hold.** If recordings consistently run three times their
  target, the seconds are being ignored and the HTML layout needs to make them louder.
- **Whether an attachment survives a hand-off from the Orchestrator.** Same open
  question as the Json Handler. Expected not to, so the Orchestrator's starters tell
  the user to bring their material after arriving here.

---
_Authored with Claude Code._
