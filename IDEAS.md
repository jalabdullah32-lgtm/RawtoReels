# Ideas

Everything Raw to Reels could become. Open ideas are plain, ~~closed ideas are struck through~~.
Numbers are permanent and never reused, so `07` means the same thing forever — say "let's do 07"
and the blueprint planner knows what you mean.

Nothing here is a commitment. Most of these will never get built, and that is the point of
having somewhere to put them.

---

## Caption Studio

- `01` **Overlays** — drop a video, image, or GIF on top of the footage while you are talking about it, resizable and positionable.
- `02` **Sound library** — a shelf of trendy sound effects to drop on the timeline. The FAHHHHHHHHH. A ding for each item in an on-screen list.
- `03` **Sticky caption text** — a spoken phrase appears and *stays* while the next one joins it underneath, building a list on screen. "Being lazy." "Being a bum." "Being a loser."
- `04` **Clip timeline editor** — manual control over where each clip starts and ends, instead of taking the agent's boundaries as final. Blueprint already drafted and parked.
- `05` **Export at 1080×1920** — currently 720×1280. Fine on a phone, soft on a desktop feed.
- `06` **Crop landscape footage to vertical** — today a horizontal source gets letterboxed with bars. Cropping to the speaker would use the whole frame.
- `07` ~~**Breathing-room padding** — add 2–3 seconds before and after each clip so cuts feel less jerky.~~
- `14` **Audio controls** — original audio level, mute, and a background music track with volume and fade in/out.
- `15` **Brand kit** — a saved logo, watermark and position, brand colors, and a default font, applied to every export.
- `16` **Aspect ratio choice** — export 1:1 or 16:9 as well as 9:16, with fit/fill and a focal point. Related to `06`.
- '17' UI. It has to come from raw to reels desktop studio. It it what I would actually be comfortable using.  
- `18` **Smooth transcription progress** — fill the status bar gradually while a transcript loads instead of jumping to completion all at once; the controls already disable during processing and re-enable afterward.
- `19` **Delete or merge caption bubbles** — remove a caption without changing the video or audio, and optionally merge strangely grouped text into the previous caption. Clearing the bubble text works as the current workaround.

## NebulaOne

- `08` **Editor-voice markers** — say "keep that" or "scratch that" mid-recording. The Json Handler reads the intent, drops the rejected take, and cuts the instruction itself out of the video. Works on natural phrasing, not a fixed word list.
- `09` **Restart detection** — when a flub makes you back up and repeat a few words, near-duplicate matching finds the pair and keeps the later attempt.
- `10` **Beat grouping** — map transcript spans onto the planner's beats, so you audition the four times you covered beat 3 instead of scrubbing ten minutes of footage.
- `11` **Delivery scoring** — rank the takes inside a beat by filler rate, mid-sentence pauses, and speech rate, then pick a default you can override.
- `12` **Local hosting** — run the agents on this machine instead of in NebulaOne.

## Planning and workflow

- `13` **Voice note to outline** — talk at your phone on a Sunday, get a recording outline back, record Monday and Tuesday. Optional step, not part of every video.

---

## How this works

Add a line the moment you have the thought. Don't polish it, don't decide whether it's good,
and don't worry about which section it belongs in — a bad idea written down costs one line,
and a good idea lost costs a lot more.

When an idea is worth building, it graduates to a blueprint in `blueprints/active/` through the
`blueprint-planner` skill, which is where the real thinking happens. This file stays shallow on
purpose. If a line here is growing paragraphs, it wants to be a blueprint instead.

Strike an idea through when it ships, and strike it through when you decide against it. `07` is
the second kind: it was prototyped, tested on real footage, and the cuts felt worse with it than
without it.
