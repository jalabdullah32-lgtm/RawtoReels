import argparse
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np


VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}


def read_wav(path):
    """Read the mono, 16 kHz, 16-bit WAV produced by FFmpeg."""
    with wave.open(str(path), "rb") as wav:
        frames = wav.readframes(wav.getnframes())
    return np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0


def transcript_path(video, input_dir, transcripts_dir):
    """Return the transcript path while preserving a video's subfolders."""
    relative_video = video.relative_to(input_dir)
    return transcripts_dir / relative_video.parent / f"{relative_video.name}.transcript.json"


def transcript_is_usable(json_path):
    """Return whether a transcript has at least one caption segment."""
    try:
        transcript = json.loads(json_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False
    segments = transcript.get("segments")
    return isinstance(segments, list) and any(
        isinstance(segment, dict) and isinstance(segment.get("text"), str)
        and segment["text"].strip()
        for segment in segments
    )


def find_videos(input_dir):
    if not input_dir.exists():
        return []
    return sorted(
        path for path in input_dir.rglob("*")
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
    )


def normalized_words(segment):
    """Clamp model word timestamps to their segment and keep them ordered."""
    segment_start = float(segment.start)
    segment_end = float(segment.end)
    last_end = segment_start
    words = []
    for word in segment.words or []:
        start = min(max(float(word.start), segment_start), segment_end)
        end = min(max(float(word.end), segment_start), segment_end)
        start = max(start, last_end)
        end = max(end, start)
        words.append({"start": start, "end": end, "text": word.word})
        last_end = end
    return words


def transcribe_video(video, json_path, model):
    """Create one Raw to Reels transcript JSON file for a video."""
    with tempfile.TemporaryDirectory() as temp_dir:
        audio = Path(temp_dir) / "audio.wav"
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
             "-i", str(video), "-vn", "-ac", "1", "-ar", "16000",
             "-c:a", "pcm_s16le", str(audio)],
            check=True,
        )
        segments, info = model.transcribe(
            read_wav(audio),
            language="en",
            task="transcribe",
            word_timestamps=True,
            vad_filter=False,
        )
        transcript = {"source": str(video), "language": info.language, "segments": []}
        for segment in segments:
            transcript["segments"].append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip(),
                "words": normalized_words(segment),
            })

    if not transcript["segments"]:
        raise RuntimeError("No speech was detected. Check that the video has audible English speech.")

    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(transcript, indent=2, ensure_ascii=False), encoding="utf-8")
    return json_path


def transcribe_directory(input_dir, transcripts_dir, progress=None, videos=None, force=False):
    """Transcribe missing or unusable transcripts and report each job update."""
    input_dir = input_dir.resolve()
    transcripts_dir = transcripts_dir.resolve()
    created, skipped, failures = [], [], []
    model = None
    candidates = list(videos) if videos is not None else find_videos(input_dir)
    pending = candidates if force else [
        video for video in candidates
        if not transcript_is_usable(transcript_path(video, input_dir, transcripts_dir))
    ]
    skipped = [] if force else [video for video in candidates if video not in pending]

    def report(phase, current=None):
        if progress:
            progress({
                "phase": phase,
                "current": str(current.relative_to(input_dir)) if current else None,
                "total": len(pending),
                "completed": len(created) + len(failures),
                "created": len(created),
                "skipped": len(skipped),
                "failures": failures.copy(),
            })

    report("queued")
    for video in pending:
        json_path = transcript_path(video, input_dir, transcripts_dir)
        try:
            if model is None:
                report("loading_model", video)
                from faster_whisper import WhisperModel
                model = WhisperModel("base", device="cpu", compute_type="int8")
            report("transcribing", video)
            transcribe_video(video, json_path, model)
            created.append(video)
        except Exception as exc:  # Keep other files moving if one file is invalid.
            failures.append({"video": str(video), "error": str(exc)})

        report("transcribing", None)
    report("finished")
    return {"created": created, "skipped": skipped, "failures": failures}


def retranscribe_video_file(video, input_dir, transcripts_dir, progress=None):
    """Replace one transcript, even when its existing JSON has content."""
    input_dir = input_dir.resolve()
    video = video.resolve()
    if video.parent != input_dir and input_dir not in video.parents:
        raise ValueError("Video must be inside the configured input directory.")
    return transcribe_directory(input_dir, transcripts_dir, progress, videos=[video], force=True)


def main():
    parser = argparse.ArgumentParser(description="Transcribe Raw to Reels input videos")
    parser.add_argument("--input-dir", type=Path, default=Path("videos/input"))
    parser.add_argument("--transcripts-dir", type=Path, default=Path("videos/transcripts"))
    args = parser.parse_args()

    result = transcribe_directory(args.input_dir, args.transcripts_dir)
    for video in result["created"]:
        print(f"Created {transcript_path(video, args.input_dir.resolve(), args.transcripts_dir.resolve())}")
    for video in result["skipped"]:
        print(f"Skipped {video}: transcript already exists")
    for failure in result["failures"]:
        print(f"Failed {failure['video']}: {failure['error']}")
    if result["failures"]:
        parser.exit(1, f"{len(result['failures'])} video(s) failed.\n")


if __name__ == "__main__":
    main()
