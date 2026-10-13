---
tool: claude
---

# Raw to Reels Reel JSON v1.0

**Skill title:** Raw to Reels Reel JSON v1.0

**Skill description** (under 300 characters):

> Builds and validates Raw to Reels reel JSON, schema v1.0. Defines the exact output contract Caption Studio accepts, the clip buffer rules that keep cuts from feeling jerky, and a Python validator to run before returning anything. Output is always one downloadable .json artifact.

---

## What this skill is for

Caption Studio loads reel JSON through `app.fromReels`. That function is strict in a
way most schemas are not: it rejects **any** key it does not expect, so a single extra
field fails the whole load. There is no partial success and no warning — the user sees
one error line and an empty studio.

So the job is not "produce reasonable JSON." It is to produce JSON that survives this
exact validator. Run the validator below before returning anything. If it fails, fix
the output and run it again. Never return JSON you have not validated.

## The output contract

Every time value is a number — finite, `>= 0`, in seconds from the start of the source
video. Not a string, not a timecode, not milliseconds.

### Top level

Exactly these six keys. No others.

| Key | Rule |
|---|---|
| `schema_version` | must be `"1.0"` |
| `source` | string — the source video filename |
| `transcript_end_seconds` | valid time |
| `timestamp_unit` | must be `"seconds_from_source_start"` |
| `target_duration_seconds` | exactly `{min, max}`, both valid times, `min <= max` |
| `options` | array, at most 3 |

### Each option

Exactly `id`, `title`, `duration_seconds`, `clips`.

- `id` matches `option_1`, `option_2`, … and is unique within the file
- `title` is a non-empty string
- `clips` is a non-empty array
- `duration_seconds` is a valid time and is not zero
- `duration_seconds` must equal the summed clip lengths **rounded to two decimals**,
  within 0.005

That rounding detail matters. The check is against the rounded sum, not the raw sum.
The validator below mirrors it exactly, including JavaScript's half-up rounding, which
differs from Python's default banker's rounding.

### Each clip

Exactly `start`, `end`, `captions`.

- `start < end`
- `end <= transcript_end_seconds`
- each clip starts at or after the previous clip's end — clips run forward through one
  source and never overlap
- `captions` is a non-empty array

### Each caption

Exactly `start`, `end`, `text`.

- `start < end`
- the first caption starts at or after `clip.start`
- each caption starts at or after the previous caption's end
- the last caption ends at or before `clip.end`
- `text` is a non-empty string

### One file

All options for a request ship in **one** JSON file. Three cuts means three entries in
`options`, not three files.

## Example

```json
{
  "schema_version": "1.0",
  "source": "conversation.mp4",
  "transcript_end_seconds": 2947.1,
  "timestamp_unit": "seconds_from_source_start",
  "target_duration_seconds": { "min": 45, "max": 60 },
  "options": [
    {
      "id": "option_1",
      "title": "Getting the diagnosis",
      "duration_seconds": 43.4,
      "clips": [
        {
          "start": 125.4,
          "end": 168.8,
          "captions": [
            { "start": 125.4, "end": 128.1, "text": "I kept falling asleep mid-sentence" }
          ]
        }
      ]
    }
  ]
}
```

## The clip buffer

A clip that starts exactly on the first word of a sentence feels clipped, because real
speech has a breath before it. Word timings are accurate but not natural. So pad each
clip: start slightly before the first word, end slightly after the last.

Padding only ever widens a clip, so captions stay valid automatically — they were
already inside the narrower bounds.

### Rules that cannot be broken

- padding must not push `start` below 0
- padding must not push `end` past `transcript_end_seconds`
- a padded clip must not overlap the previous clip — where two would collide, the
  padding shrinks rather than the clips overlapping
- `duration_seconds` must be recomputed **after** padding, never before

### How much

Defaults are `LEAD_IN = 0.5` and `TAIL = 0.4` seconds, set as constants at the top of
the code below so they are a one-line change.

Be aware of the arithmetic before raising them. Padding is per clip, not per reel, so a
four-clip reel at 2.5 s per side gains 20 seconds — enough to blow a 60-second target
on its own. The project README's suggestion of 2–3 seconds was written with
single-clip cuts in mind and does not survive contact with a multi-clip reel.

### Does the buffer count against the target duration?

**It counts against it.** Select moments to land inside `target_duration_seconds`
*after* padding, so a reel asked for 60 seconds comes back at roughly 60 seconds rather
than 60 plus however much padding happened to accumulate.

This is the one genuinely open question in the design and it is meant to be settled by
watching real reels, not by argument. If the padded cuts feel right but consistently
run short, this is the setting to revisit.

## Required behaviour

1. **Load the transcript with Python.** Do not read it inline. A long transcript read
   into the conversation burns context and the beginning gets forgotten. Loading it
   with code does not care how large the file is.
2. **Select the moments** that answer what the user actually asked for.
3. **Apply the buffer** using the rules above.
4. **Run the validator** and fix any failure before returning anything.
5. **Return one downloadable `.json` artifact.** Never paste JSON into the chat body.

## The validator

Mirrors `app.fromReels` in `app/js/captions.js`. Run it on the finished object. It
raises on the first problem with a message naming the option and clip, so the fix is
usually obvious.

```python
import json
import math
import re
from numbers import Real

LEAD_IN = 0.5   # seconds of breath before each clip
TAIL = 0.4      # seconds of breath after each clip

OPTION_ID = re.compile(r"^option_[1-9][0-9]*$")


def valid_time(value):
    """Finite, non-negative number. Booleans are not numbers here."""
    return (
        isinstance(value, Real)
        and not isinstance(value, bool)
        and math.isfinite(value)
        and value >= 0
    )


def check_keys(value, keys, label):
    """Reject anything that is not a plain object with exactly the allowed keys."""
    if not isinstance(value, dict) or any(key not in keys for key in value):
        raise ValueError(f"{label} has unexpected fields.")
    missing = [key for key in keys if key not in value]
    if missing:
        raise ValueError(f"{label} is missing {', '.join(missing)}.")


def round2(value):
    """JavaScript's Math.round(x * 100) / 100 - half-up, not banker's rounding."""
    return math.floor(value * 100 + 0.5) / 100


def pad_clips(clips, transcript_end, lead_in=LEAD_IN, tail=TAIL):
    """Widen each clip for breathing room without breaking the forward-only rule.

    Returns new clip dicts. Captions are untouched: padding only widens, so a caption
    that was inside the tight bounds is still inside the padded ones.
    """
    padded = []
    prior_end = 0.0
    for index, clip in enumerate(clips):
        start = max(clip["start"] - lead_in, prior_end, 0.0)
        # Do not run into the next clip's first word.
        next_start = clips[index + 1]["start"] if index + 1 < len(clips) else None
        limit = transcript_end if next_start is None else min(transcript_end, next_start)
        end = min(clip["end"] + tail, limit)
        if start >= end:  # no room to pad; keep the original bounds
            start, end = clip["start"], clip["end"]
        padded.append({"start": start, "end": end, "captions": clip["captions"]})
        prior_end = end
    return padded


def recompute_duration(clips):
    """Sum clip lengths the way the validator expects to see them."""
    return round2(sum(clip["end"] - clip["start"] for clip in clips))


def validate_reels(raw):
    """Mirror of app.fromReels. Raises ValueError on the first problem found."""
    check_keys(
        raw,
        [
            "schema_version",
            "source",
            "transcript_end_seconds",
            "timestamp_unit",
            "target_duration_seconds",
            "options",
        ],
        "Reel JSON",
    )
    if (
        raw["schema_version"] != "1.0"
        or not isinstance(raw["source"], str)
        or not valid_time(raw["transcript_end_seconds"])
        or raw["timestamp_unit"] != "seconds_from_source_start"
    ):
        raise ValueError(
            "Expected Raw to Reels output schema v1.0 with source times in seconds."
        )

    check_keys(raw["target_duration_seconds"], ["min", "max"], "Target duration")
    target = raw["target_duration_seconds"]
    if (
        not valid_time(target["min"])
        or not valid_time(target["max"])
        or target["min"] > target["max"]
    ):
        raise ValueError("Invalid target duration range.")

    if not isinstance(raw["options"], list) or len(raw["options"]) > 3:
        raise ValueError("Options must contain at most three reels.")

    seen = set()
    for option_index, option in enumerate(raw["options"], start=1):
        check_keys(
            option, ["id", "title", "duration_seconds", "clips"], f"Option {option_index}"
        )
        if (
            not isinstance(option["id"], str)
            or not OPTION_ID.match(option["id"])
            or option["id"] in seen
            or not isinstance(option["title"], str)
            or not option["title"].strip()
            or not isinstance(option["clips"], list)
            or not option["clips"]
            or not valid_time(option["duration_seconds"])
            or option["duration_seconds"] == 0
        ):
            raise ValueError(f"Invalid option {option_index}.")
        seen.add(option["id"])

        prior_end = 0.0
        total = 0.0
        for clip_index, clip in enumerate(option["clips"], start=1):
            where = f"Option {option_index}, clip {clip_index}"
            check_keys(clip, ["start", "end", "captions"], f"Clip {clip_index}")
            if (
                not valid_time(clip["start"])
                or not valid_time(clip["end"])
                or clip["start"] >= clip["end"]
                or clip["start"] < prior_end
                or clip["end"] > raw["transcript_end_seconds"]
                or not isinstance(clip["captions"], list)
                or not clip["captions"]
            ):
                raise ValueError(f"{where}: invalid source times or captions.")
            prior_end = clip["end"]
            total += clip["end"] - clip["start"]

            last = clip["start"]
            for caption_index, caption in enumerate(clip["captions"], start=1):
                check_keys(
                    caption, ["start", "end", "text"], f"Caption {caption_index}"
                )
                if (
                    not valid_time(caption["start"])
                    or not valid_time(caption["end"])
                    or caption["start"] < last
                    or caption["start"] >= caption["end"]
                    or caption["end"] > clip["end"]
                    or not isinstance(caption["text"], str)
                    or not caption["text"].strip()
                ):
                    raise ValueError(f"{where}: invalid caption time or text.")
                last = caption["end"]

        if abs(option["duration_seconds"] - round2(total)) > 0.005:
            raise ValueError(f"Option {option_index} duration does not match its clips.")

    return raw


def write_artifact(raw, path="reels.json"):
    """Validate, then write. Never emit a file that has not passed."""
    validate_reels(raw)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(raw, handle, indent=2)
    return path
```

## Failure modes to watch for

These are the ways output usually breaks. Check each one before returning.

- **An extra key.** Adding `notes`, `reason`, `confidence`, or `score` to an option
  fails the whole load. There is nowhere to put commentary. Say it in the chat instead.
- **Duration computed before padding.** The sum has to be recomputed after the buffer
  is applied, or it will miss by exactly the padding.
- **Captions outside the clip.** Usually a caption copied from the transcript whose end
  runs past the chosen clip end. Trim the clip or drop the caption.
- **Overlapping clips.** Two moments chosen close together, then padded into each other.
  `pad_clips` handles this, but only if clips are sorted by start time first.
- **Clips out of order.** The schema is forward-only. Picking a later moment first and
  an earlier one second fails, even though both are valid on their own.
- **An option with no clips.** An empty `clips` array fails. Return fewer options
  instead.
- **Times as strings.** `"125.4"` is not `125.4`.

## Portability

This skill is plain markdown on purpose. Moving off NebulaOne should cost
configuration, not a rewrite. The contract and the validator are the durable part; the
platform wrapper around them is not.

---
_Authored with Claude Code._
