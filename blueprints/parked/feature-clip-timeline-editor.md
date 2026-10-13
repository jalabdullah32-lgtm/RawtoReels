---
tool: claude
---

# Feature: Clip Timeline Editor

## Goal

Stop the cuts feeling jerky. Two parts: give every clip some breathing room automatically, and give the user a timeline to nudge clip boundaries by hand when the automatic version is not quite right.

Reference: `sliderBar.png` in this folder.

## The problem

Testing produced three good videos with one complaint: the cuts were too tight to the timestamps. A clip that starts exactly on the first word of a sentence feels clipped, because real speech has a breath before it. The transcript's word timings are accurate but not natural.

## Part one: the automatic buffer

Pad each clip on both sides so it starts slightly before the first word and ends slightly after the last.

**Rules that cannot be broken** — these come from `app.fromReels` in `app/js/captions.js:27`:

- padding must not push `start` below 0
- padding must not push `end` past `transcript_end_seconds`
- a padded clip must not overlap the previous clip — where two clips would collide, the padding shrinks
- `duration_seconds` must still equal the sum of clip lengths within 0.005 after padding

Captions stay valid automatically, because padding only ever widens a clip and captions are already inside it.

**How much padding?** Undecided, and it matters:

- `README.md` suggests 2–3 seconds
- at 2.5s per side, a four-clip reel gains 20 seconds — enough to blow a 60-second target

So the real question is whether the buffer counts against the target duration or sits outside it. This is the main thing the timeline is meant to resolve by feel rather than by argument.

**Where the padding is applied:** Caption Studio adds a small browser-side baseline when a loaded clip begins and ends exactly with its captions. It leaves clips that already contain breathing room alone, which avoids doubling padding supplied by the agent. The selected reel can then be rebuilt from its caption boundaries with the breathing-room control. This needs no schema change.

## Part two: the timeline

From `sliderBar.png` — a horizontal timeline with:

- a **filmstrip** of video thumbnails along the clip
- a **waveform** of the audio underneath
- a **playhead** showing the current position
- draggable handles at each end of a clip

The waveform is the important half. Silence is visible in a waveform and invisible in a filmstrip, so seeing where speech actually starts and stops is what makes trimming feel obvious instead of guesswork.

### Why this is the hard part

Neither of these exists in the project today:

- **Thumbnails** mean seeking the video repeatedly and drawing frames to a canvas. Doable in the browser, but slow on a long video, and the results need caching.
- **Waveforms** mean decoding the audio track and reducing it to peaks. The browser can do this with Web Audio, but decoding a 54-minute 4K file's audio is not instant.

Both are significantly more work than the buffer. They can ship separately — the buffer alone may be enough.

## Current project context

- `app/js/playback.js` handles play, pause, and seeking across clips.
- `app/js/captions.js` holds `activeClips`, `sourceAt`, and `elapsedAt`, which already map between reel time and source time. A timeline needs exactly this mapping, so the logic exists.
- `app/js/video-export.js` assembles the final video from clips.
- `app/index.html` currently has a simple playback bar, not a timeline.
- The project is vanilla JS with no framework and no build step. A timeline should not change that.

## Implementation steps

**Stage one — buffer only**

1. Start with a 0.5-second baseline for a clip that has no existing room, leaving the amount open for real-video evaluation.
2. Apply the baseline in Caption Studio, with the clamping and overlap rules above.
3. Confirm padded output still passes `fromReels`.
4. Watch real reels and judge whether the cuts feel natural.

**Stage two — timeline, if stage one is not enough**

5. Add a timeline strip under the preview showing the current clip with a playhead.
6. Add draggable start and end sliders to adjust a clip, honoring the same rules.
7. Add the waveform.
8. Add the filmstrip, with caching so scrubbing stays responsive.
9. Make edited boundaries persist — decide whether they write back to the loaded JSON or stay in the session.

Stage two is deliberately ordered so each step is useful alone. A plain timeline with handles is valuable before any waveform exists.

## Testing approach

### Buffer checks

- padding never produces overlapping clips
- padding never crosses 0 or `transcript_end_seconds`
- `duration_seconds` still matches the clip sum after padding
- a reel with many short clips does not overshoot its target duration unacceptably

### Timeline checks

- dragging a handle cannot create an invalid clip
- the playhead matches what is actually playing
- scrubbing stays responsive on a long video
- edited boundaries survive switching between options and back

### User visual acceptance test

1. Load a reel and play it. Do the cuts feel natural rather than clipped?
2. Find a cut that is slightly wrong and fix it on the timeline.
3. Confirm the waveform makes it obvious where speech starts and stops.
4. Export and confirm the output matches the preview exactly.

## Risks and roadblocks

- **Performance on long videos.** The 54-minute 4K file is the realistic worst case. Thumbnail generation and audio decoding both scale badly. Caching and lazy work are not optional at that size.
- **Buffer versus target duration.** Padding every clip can meaningfully overshoot a requested length. Needs a decision, and the timeline is what makes that decision by feel.
- **Scope.** A full filmstrip-and-waveform editor is a large feature. Stage one may be sufficient, and shipping it first avoids building an editor nobody needs.
- **Export must match preview.** If hand-edited boundaries are not carried into `video-export.js` identically, the exported video differs from what was previewed — the worst possible bug here, because it is invisible until after export.

## Open questions

- Does the buffer count against the target duration, or sit outside it?
- Do hand-edited boundaries write back into the JSON file, or live only in the session?
- Is the timeline for the whole source video, or only the selected clip?

## Parked for later

- Multi-track editing.
- Overlay video and image tracks (listed in `README.md` under what comes next).
- A sound-effects library track.

## Definition of done

**Stage one:** clips carry a buffer, output still validates, and cuts feel natural in a real reel.

**Stage two:** a timeline with waveform and draggable handles, edits that cannot produce invalid clips, and an export that matches the preview exactly.

## Status

**Parked on 2026-10-12.** Codex added a first working pass: a 0.5-second browser-side baseline for flush clips, a selected-reel timeline with live playheads, editable start and end sliders, reset controls, and JSON synchronization. It passed code syntax checks and a fixture test that reloaded the edited JSON through `fromReels`.

The project owner paused this feature because it is too early to judge how cuts should feel on real videos. The unresolved padding and editing decisions should be revisited only after the core Caption Studio workflow is clearer.

---
_Authored with Claude Code._
