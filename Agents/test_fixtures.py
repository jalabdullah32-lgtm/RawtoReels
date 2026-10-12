"""Check the fixtures load, then build a reel from one and validate it.

This is the dry run of what the Json Handler will do: read a transcript, pick
moments, pad them, recompute durations, and validate. If this passes, the contract
and the validator agree with each other on realistic data.

The validator is extracted from the skill at runtime rather than copied, so this
tests the code the agent will actually be given, not a stale duplicate.

Run:  python Agents/test_fixtures.py
"""

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
FIXTURES = HERE / "test-fixtures"
SKILL = HERE / "skills" / "raw-to-reels-reel-json-v1.md"

# Pull the validator straight out of the skill document.
code = re.search(r"```python\n(.*?)```", SKILL.read_text(encoding="utf-8"), re.S).group(1)
skill = {}
exec(compile(code, str(SKILL), "exec"), skill)

validate_reels = skill["validate_reels"]
pad_clips = skill["pad_clips"]
recompute_duration = skill["recompute_duration"]
valid_time = skill["valid_time"]

failures = []


def check(name, condition, detail=""):
    if condition:
        print(f"PASS  {name}")
    else:
        print(f"FAIL  {name}{': ' + detail if detail else ''}")
        failures.append(name)


def check_transcript(path):
    """Mirror of app.fromTranscript's requirements in app/js/captions.js."""
    raw = json.loads(path.read_text(encoding="utf-8"))
    problems = []
    if not isinstance(raw.get("source"), str):
        problems.append("source must be a string")
    if not isinstance(raw.get("language"), str):
        problems.append("language must be a string")
    if not isinstance(raw.get("segments"), list) or not raw["segments"]:
        problems.append("segments must be a non-empty list")
        return raw, problems

    for index, seg in enumerate(raw["segments"], start=1):
        where = f"segment {index}"
        if not valid_time(seg.get("start")) or not valid_time(seg.get("end")):
            problems.append(f"{where}: invalid start or end")
        elif seg["end"] <= seg["start"]:
            problems.append(f"{where}: end must be after start")
        if not isinstance(seg.get("text"), str):
            problems.append(f"{where}: text must be a string")
        words = seg.get("words")
        if words is None:
            continue
        if not isinstance(words, list):
            problems.append(f"{where}: words must be a list")
            continue
        for word_index, word in enumerate(words, start=1):
            spot = f"{where}, word {word_index}"
            if not isinstance(word.get("text"), str) or not word["text"].strip():
                problems.append(f"{spot}: empty text")
            elif not valid_time(word.get("start")) or not valid_time(word.get("end")):
                problems.append(f"{spot}: invalid timestamps")
            elif word["end"] < word["start"]:
                problems.append(f"{spot}: end before start")
            # transcribe.py clamps words inside their segment; confirm the
            # fixtures honour that, since a real file always will.
            elif word["start"] < seg["start"] - 1e-9 or word["end"] > seg["end"] + 1e-9:
                problems.append(f"{spot}: outside its segment")
    return raw, problems


def captions_from(segments, start, end):
    """Group a segment's words into caption lines the way the app does.

    app.fromTranscript breaks a line every 5 words or on a gap over 0.5 s. Matching
    that keeps caption lengths looking like what Caption Studio already renders.
    """
    captions = []
    for seg in segments:
        batch = []
        last = None
        for word in seg["words"]:
            if word["start"] < start or word["end"] > end:
                continue
            if batch and (len(batch) >= 5 or word["start"] - last > 0.5):
                captions.append(batch)
                batch = []
            batch.append(word)
            last = word["end"]
        if batch:
            captions.append(batch)
    return [
        {
            "start": group[0]["start"],
            "end": group[-1]["end"],
            "text": " ".join(w["text"].strip() for w in group),
        }
        for group in captions
    ]


def build_reel(raw, picks, title, option_id="option_1"):
    """Do what the agent will do: cut, pad, recompute, in that order."""
    segments = raw["segments"]
    transcript_end = max(seg["end"] for seg in segments)

    clips = []
    for first, last in picks:
        chosen = segments[first : last + 1]
        start, end = chosen[0]["start"], chosen[-1]["end"]
        clips.append(
            {"start": start, "end": end, "captions": captions_from(chosen, start, end)}
        )
    clips.sort(key=lambda c: c["start"])

    padded = pad_clips(clips, transcript_end)
    # Padding widens the bounds but never moves a caption, so captions stay inside.
    return {
        "schema_version": "1.0",
        "source": raw["source"],
        "transcript_end_seconds": transcript_end,
        "timestamp_unit": "seconds_from_source_start",
        "target_duration_seconds": {"min": 45, "max": 60},
        "options": [
            {
                "id": option_id,
                "title": title,
                "duration_seconds": recompute_duration(padded),
                "clips": padded,
            }
        ],
    }


def main():
    print("--- fixtures load as transcripts ---")
    loaded = {}
    for path in sorted(FIXTURES.glob("*.transcript.json")):
        raw, problems = check_transcript(path)
        check(f"{path.name} is a valid transcript", not problems, "; ".join(problems))
        loaded[path.name] = raw

    print("\n--- build a reel from clean.transcript.json and validate it ---")
    clean = loaded["clean.transcript.json"]
    # Three moments from across the source: the hook, the turning point, the payoff.
    reel = build_reel(clean, [(0, 1), (4, 5), (14, 15)], "Diagnosed with narcolepsy")
    try:
        validate_reels(reel)
        check("built reel passes the validator", True)
    except ValueError as error:
        check("built reel passes the validator", False, str(error))

    option = reel["options"][0]
    clips = option["clips"]
    print(f"      {len(clips)} clips, {option['duration_seconds']}s total")
    for clip in clips:
        print(
            f"      {clip['start']:>7.2f} - {clip['end']:>7.2f}  "
            f"({clip['end'] - clip['start']:>5.2f}s, {len(clip['captions'])} captions)"
        )

    print("\n--- padding behaved ---")
    check(
        "clips stay in order and never overlap",
        all(clips[i]["end"] <= clips[i + 1]["start"] for i in range(len(clips) - 1)),
    )
    check(
        "no clip runs past the end of the transcript",
        all(c["end"] <= reel["transcript_end_seconds"] for c in clips),
    )
    check("no clip starts below zero", all(c["start"] >= 0 for c in clips))
    check(
        "every caption sits inside its clip",
        all(
            c["captions"][0]["start"] >= c["start"] and c["captions"][-1]["end"] <= c["end"]
            for c in clips
        ),
    )

    reference = FIXTURES / "expected-reel.json"
    reference.write_text(json.dumps(reel, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {reference.relative_to(HERE.parent)}")

    if failures:
        print(f"\n{len(failures)} check(s) failed")
        sys.exit(1)
    print("\nall checks passed")


if __name__ == "__main__":
    main()
