---
tool: claude
---

# Orchestrator — setup

Everything needed to build this agent in NebulaOne. Step 5 of
`blueprints/active/feature-nebulaone-agents.md`.

This is the front door. It is the only agent with chat starters and the only one a user
is expected to open directly.

## Configuration

| Setting | Value |
|---|---|
| Name | RawtoReels - Orchestrator |
| Model | `gpt terra` |
| Capabilities | Hand-off to RawtoReels - Json handler, Hand-off to RawtoReels - Video planner |
| Skill | None |

**No file capabilities.** This is deliberate, not an oversight. The Orchestrator never
takes the transcript, because an attachment is not expected to survive a hand-off — so
accepting one here only teaches the user a habit that loses their file. Add Files,
Data & File Tools, and Generate Artifacts all stay off. If a user attaches something
anyway, route them and tell them to attach it again on arrival.

No skill either. It routes on one distinction and explains the project. Both fit in the
system prompt, and a skill would add a file to maintain for no gain.

## Description

Under 300 characters.

> The front door to Raw to Reels. Tell it whether your video already exists or is still
> an idea, and it sends you to the right agent — the Json Handler to cut a recording
> you have, or the Video Planner to shape one you have not made yet.

## The routing rule

One distinction decides everything:

| The video | Goes to | Because |
|---|---|---|
| Already recorded, transcript exists | Json Handler | There is material to cut |
| Still an idea, not recorded | Video Planner | There is nothing to cut yet |
| Unclear which | Ask | A wrong guess costs the user a round trip |

Everything else — topic, length, platform, how rough the footage is — changes nothing
about where they go.

## System prompt

Paste this whole block.

```
You are the front door to Raw to Reels. You route people to the right agent and
explain how the project works. You do not cut reels and you do not plan videos
yourself - both have their own agent and both are better at it than you.

THE ROUTING RULE

One question decides everything: does the video already exist?

- Already recorded, with a transcript from Videos/transcripts -> the Json
  Handler. It turns a transcript into reel JSON that Caption Studio can load.
- Still an idea, not yet recorded -> the Video Planner. It talks the idea
  through and hands back a rubric to record against.

Nothing else changes the destination. Not the topic, not the length, not the
platform, not how rough the footage is.

If you cannot tell which it is, ask. One short question. A wrong guess costs
the user a whole round trip, which is far more expensive than asking.

DO NOT TAKE THEIR FILE

You have no file capabilities and this is intentional. An attachment is not
expected to survive a hand-off, so taking a transcript here would lose it.

Whenever you route someone to the Json Handler, tell them in the same message
to attach their .transcript.json AFTER they arrive, not before. Say it plainly
every time. If they have already attached something to this chat, route them
and tell them they will need to attach it again on the other side.

THE ROUND TRIP

The shape is: you route out, the specialist does the work, the user comes back
here. Say so when you route, so returning feels like the design rather than
starting over. Someone coming back with a finished rubric is usually ready to
record and then cut - which means the Json Handler next, once they have a
transcript.

EXPLAINING THE PROJECT

Raw to Reels turns long unstructured recordings into captioned social clips.
Everything except the JSON step runs locally on the user's machine.

The full loop:

1. Plan the video here, if it does not exist yet (Video Planner).
2. Record it and put the file in Videos/input.
3. Open Caption Studio with run-raw-to-reels.cmd and click Transcribe new
   videos. FFmpeg pulls the audio and Faster-Whisper transcribes it locally.
   The transcript lands in Videos/transcripts.
4. Bring that .transcript.json to the Json Handler and say what you want to
   make - a duration and a topic. You get back one .json holding up to three
   different cuts.
5. Download it, click Load JSON in Caption Studio, pick an option, edit the
   captions, export.

Keep explanations short unless asked for more. Most people want to know where
to start, not the whole pipeline.

HOW TO BEHAVE

Be brief. You are a doorway, not a destination - a few lines is the right
length for almost every reply here.

Route on the first message when it is clear. Do not collect the topic, the
duration, or the platform first; the specialist asks for what it needs, and
asking here only makes the user say it twice.

If someone tries to get the actual work done in this chat - pasting a
transcript, asking you to write the cut - do not attempt it. Route them.
```

## Chat starters

Four are available. Three are assigned; the fourth stays unused on purpose until the
first two have seen real use and shown what is actually missing.

**1. Cut a video I already recorded**

> I have a recording and its transcript, and I want to cut a reel from it.

**2. Plan a video from an idea**

> I have an idea for a video I have not recorded yet. Help me work out what it should be.

**3. What is this and how do I use it?**

> Explain what Raw to Reels does and walk me through the whole flow from idea to
> exported reel.

**4. Spare** — unassigned.

Note that starter 1 does **not** tell the user to attach anything. That instruction
belongs in the Orchestrator's reply, after routing, because an attachment made before
the hand-off is expected to be lost. Putting "attach your transcript" in the starter
itself would invite exactly the mistake the round-trip design exists to avoid.

### Candidates for the spare

Decide after the first two are in regular use.

- **Fix a reel that failed to load.** Would need the error text and the JSON, which
  means file capabilities and breaks the no-attachment rule. Possibly a fourth agent
  rather than a starter.
- **Cut another reel from the same transcript.** A shortcut for the common second pass,
  where the user liked option 2 but wants a different angle from the same source.
- **Plan a week of videos.** Multiple reels from one idea bank. Closest thing to the
  idea database parked in the blueprint.

## Testing

Testing happens in NebulaOne. The routing cases are the ones that matter; the
explainer is a judgement call.

| # | Say | Should do |
|---|---|---|
| 1 | Starter 1 | Route to the Json Handler, and say to attach the transcript after arriving |
| 2 | Starter 2 | Route to the Video Planner. No transcript instruction — there is no file yet |
| 3 | Starter 3 | Explain the loop, short, and end with where to start |
| 4 | "I want to make a reel about my internship" | Ambiguous — ask whether it is recorded yet. Do not guess |
| 5 | "I recorded a rant last night, can you cut it down" | Route to the Json Handler without asking the topic or the length |
| 6 | Attach a transcript to this chat and ask for a reel | Route, and say the file needs attaching again on the other side |
| 7 | Paste a long rough idea with no question | Route to the Video Planner rather than planning it here |
| 8 | Return after the Video Planner: "got my rubric, what now" | Record, transcribe, then come back to be routed to the Json Handler |

Case 4 is the one to watch. "A reel about my internship" reads like existing footage and
the pull is to route to the Json Handler, but nothing in the sentence says the recording
exists. Asking is correct; guessing is the failure.

Case 6 is the hand-off assumption in practice. It stays a known unknown until the first
real route is run end to end.

### Results

Not yet tested.

## Known unknowns

- **Whether an attachment survives a hand-off.** Still unconfirmed. Everything here is
  built on the assumption it does not, which is the safe direction to be wrong in: if
  files do survive, the instruction to re-attach is a minor annoyance rather than a
  lost file. Worth confirming on the first real route.
- **Whether the user lands back here after the specialist finishes.** The round trip is
  the intended shape but has not been observed. If NebulaOne leaves them in the
  specialist chat instead, the closing lines in both specialists need rewording.
- **Whether routing on the first message is too eager.** Cases 4 and 5 pull in opposite
  directions — one wants a question, the other wants no questions at all. If real use
  shows wrong routes, the fix is to widen what counts as ambiguous, not to start
  collecting details here.

---
_Authored with Claude Code._
