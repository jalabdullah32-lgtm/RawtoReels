"""Generate fabricated transcripts for testing the Json Handler.

Writes files matching exactly what transcribe.py produces:

    {"source": str, "language": str,
     "segments": [{"start": float, "end": float, "text": str,
                   "words": [{"start": float, "end": float, "text": str}]}]}

Word text carries a leading space, the way faster-whisper emits it. Word times are
clamped inside their segment and kept ordered, the same normalisation transcribe.py
applies, so the agent sees nothing it would not see from a real recording.

Run:  python Agents/make_test_fixtures.py
"""

import json
from pathlib import Path

OUT = Path(__file__).parent / "test-fixtures"

WPS = 2.9  # words per second, a natural speaking pace


def segment(text, start, gap_before=0.0):
    """Build one segment, laying words out at a steady pace from `start`."""
    start = round(start + gap_before, 2)
    words = []
    cursor = start
    for token in text.split():
        end = round(cursor + 1 / WPS, 2)
        words.append({"start": cursor, "end": end, "text": " " + token})
        cursor = end
    return {
        "start": start,
        "end": cursor,
        "text": text,
        "words": words,
    }


def build(source, lines):
    """Lay out `lines` of (text, gap_before_seconds) into a transcript."""
    segments = []
    cursor = 3.76  # real transcripts rarely start at zero
    for text, gap in lines:
        seg = segment(text, cursor, gap)
        segments.append(seg)
        cursor = seg["end"]
    return {"source": source, "language": "en", "segments": segments}


# ---------------------------------------------------------------------------
# Case 1 and the base for cases 4 and 5: a clean transcript with a clear topic
# running well past any reasonable reel length. Narcolepsy diagnosis, the use
# case named in Agents/Config.md.
# ---------------------------------------------------------------------------

CLEAN = [
    ("So I want to talk about how I got diagnosed with narcolepsy because honestly nobody believes me when I tell this story.", 0),
    ("It started in my second year of college. I was falling asleep in lectures which, fine, everybody does that.", 0.4),
    ("But then I started falling asleep in conversations. Mid sentence. Someone would be talking to me and I would just go.", 0.3),
    ("I thought I was just tired. I genuinely thought for two years that I was just a tired person and that was my personality.", 0.5),
    ("The thing that finally made me go to a doctor was I fell asleep driving. Not for long. Maybe two seconds.", 0.4),
    ("But I drifted into the next lane and a guy honked at me and I pulled over and sat there shaking for twenty minutes.", 0.3),
    ("So I go to my doctor and I say I think something is wrong with me and she says you are probably just stressed.", 0.6),
    ("And I want to be clear, I am not mad at her. That is what it looks like. A tired college kid saying he is tired.", 0.4),
    ("But I pushed. I said no, I fell asleep at the wheel, this is not normal tired. And she referred me to a sleep clinic.", 0.3),
    ("The sleep study is the strangest night of your life. They glue about thirty electrodes to your head and say, okay, sleep naturally.", 0.5),
    ("Then the next day they do what is called a nap study. They put you in a dark room five times and tell you to try to sleep.", 0.4),
    ("A normal person takes fifteen, twenty minutes to fall asleep in that situation. If they fall asleep at all.", 0.3),
    ("I fell asleep in under three minutes every single time. And I went straight into REM, which you are not supposed to do.", 0.4),
    ("That is the diagnosis right there. That is narcolepsy. Your brain skips the queue and goes straight to dreaming.", 0.5),
    ("When the doctor told me, I did not feel sad. I felt relieved. Genuinely relieved. Because it meant I was not lazy.", 0.4),
    ("I had spent six years thinking I had a character problem. It was a neurological condition the whole time.", 0.3),
    ("And I know that sounds dramatic but if you have ever been called lazy when you were trying your hardest, you get it.", 0.5),
    ("Anyway. If you are falling asleep in conversations, that is not normal. Please go get a sleep study. That is the whole message.", 0.4),
]

# ---------------------------------------------------------------------------
# Case 2: a transcript too short to support a 60 second reel.
# ---------------------------------------------------------------------------

SHORT = [
    ("Quick one about narcolepsy. I got diagnosed in my second year of college.", 0),
    ("I kept falling asleep in conversations and I thought I was just tired.", 0.4),
    ("Turned out it was narcolepsy. Go get a sleep study if that sounds like you.", 0.3),
]

# ---------------------------------------------------------------------------
# Case 3: long silences between short bits of speech. The gaps here are modelled
# on the real ceiling file, where the three longest were 18.68 s, 13.23 s and
# 7.69 s. A naive cut spanning these would be mostly dead air.
# ---------------------------------------------------------------------------

SILENCES = [
    ("Okay so, narcolepsy. Let me think about how to say this.", 0),
    ("Right. I got diagnosed in college after I fell asleep driving.", 18.68),
    ("Sorry, I need a second.", 6.2),
    ("The sleep study is the part people find strange. Thirty electrodes on your head.", 13.23),
    ("And then they tell you to sleep naturally, which, good luck.", 2.1),
    ("Hold on.", 7.69),
    ("The relief was the part I did not expect. I was not lazy. I was ill. Those are different things.", 9.4),
]


FIXTURES = {
    "clean.transcript.json": ("narcolepsy_story.mp4", CLEAN),
    "short.transcript.json": ("quick_note.mp4", SHORT),
    "silences.transcript.json": ("rambling_voice_note.mp4", SILENCES),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (source, lines) in FIXTURES.items():
        transcript = build(source, lines)
        path = OUT / name
        path.write_text(
            json.dumps(transcript, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        words = sum(len(s["words"]) for s in transcript["segments"])
        span = transcript["segments"][-1]["end"] - transcript["segments"][0]["start"]
        print(
            f"{name:28} {len(transcript['segments']):>3} segments  "
            f"{words:>4} words  {span:>7.2f}s"
        )


if __name__ == "__main__":
    main()
