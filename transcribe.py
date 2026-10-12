import argparse
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel


VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}


def read_wav(path):
    """Read the mono, 16 kHz, 16-bit WAV produced by ffmpeg."""
    with wave.open(str(path), "rb") as wav:
        frames = wav.readframes(wav.getnframes())
    return np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0


def srt_time(seconds):
    milliseconds = round(seconds * 1000)
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def transcribe_video(video, output_dir, model):
    with tempfile.TemporaryDirectory() as temp_dir:
        audio = Path(temp_dir) / "audio.wav"
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
             "-i", str(video), "-vn", "-ac", "1", "-ar", "16000",
             "-c:a", "pcm_s16le", str(audio)],
            check=True,
        )
        segments, info = model.transcribe(read_wav(audio), word_timestamps=True, vad_filter=True)
        transcript = {"source": str(video), "language": info.language, "segments": []}
        srt_blocks = []
        for index, segment in enumerate(segments, start=1):
            text = segment.text.strip()
            transcript["segments"].append({
                "start": segment.start,
                "end": segment.end,
                "text": text,
                "words": [
                    {"start": word.start, "end": word.end, "text": word.word}
                    for word in (segment.words or [])
                ],
            })
            srt_blocks.append(
                f"{index}\n{srt_time(segment.start)} --> {srt_time(segment.end)}\n{text}"
            )

    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / f"{video.name}.transcript.json"
    srt_path = output_dir / f"{video.name}.captions.srt"
    json_path.write_text(json.dumps(transcript, indent=2, ensure_ascii=False), encoding="utf-8")
    srt_path.write_text("\n\n".join(srt_blocks) + "\n", encoding="utf-8")
    return json_path, srt_path


def main():
    parser = argparse.ArgumentParser(description="Transcribe one video or a folder of videos")
    parser.add_argument("source", type=Path, help="Input video file or directory")
    parser.add_argument(
        "--output-dir", type=Path, default=None,
        help="Optional output directory; by default, save beside each source video",
    )
    parser.add_argument("--recursive", action="store_true", help="Include subfolders")
    parser.add_argument("--overwrite", action="store_true", help="Replace existing sidecar files")
    args = parser.parse_args()

    source = args.source.expanduser().resolve()
    if source.is_file():
        videos = [source]
    elif source.is_dir():
        candidates = source.rglob("*") if args.recursive else source.iterdir()
        videos = sorted(
            path for path in candidates
            if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
        )
    else:
        parser.error(f"Input does not exist: {source}")

    if not videos:
        parser.error(f"No supported videos found in {source}")

    model = None
    failures = 0
    for video in videos:
        if args.output_dir is None:
            output_dir = video.parent
        elif source.is_dir():
            output_dir = args.output_dir / video.parent.relative_to(source)
        else:
            output_dir = args.output_dir

        json_path = output_dir / f"{video.name}.transcript.json"
        srt_path = output_dir / f"{video.name}.captions.srt"
        if not args.overwrite and (json_path.exists() or srt_path.exists()):
            print(f"Skipped {video}: output already exists (use --overwrite to replace it)")
            continue

        try:
            if model is None:
                model = WhisperModel("base", device="cpu", compute_type="int8")
            json_path, srt_path = transcribe_video(video, output_dir, model)
            print(f"Created {json_path} and {srt_path}")
        except Exception as exc:
            failures += 1
            print(f"Failed {video}: {exc}")

    if failures:
        parser.exit(1, f"{failures} video(s) failed.\n")


if __name__ == "__main__":
    main()
