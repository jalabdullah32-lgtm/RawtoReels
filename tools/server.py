"""Local-only server for the Raw to Reels studio and video library."""

import json
import mimetypes
import re
import threading
import webbrowser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

from transcribe import (
    VIDEO_EXTENSIONS,
    find_videos,
    retranscribe_video_file,
    transcript_is_usable,
    transcript_path,
    transcribe_directory,
)


ROOT = Path(__file__).resolve().parent.parent
APP_DIR = ROOT / "app"
VIDEOS_DIR = ROOT / "videos" / "input"
TRANSCRIPTS_DIR = ROOT / "videos" / "transcripts"
HOST = "127.0.0.1"
PORT = 8765
JOB_LOCK = threading.Lock()
JOB_STATUS = {"state": "idle", "total": 0, "completed": 0, "created": 0, "skipped": 0, "failures": []}


def contained_path(root, requested):
    candidate = (root / requested).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return None
    return candidate


def video_records():
    records = []
    for video in find_videos(VIDEOS_DIR):
        relative = video.relative_to(VIDEOS_DIR)
        transcript = transcript_path(video, VIDEOS_DIR, TRANSCRIPTS_DIR)
        transcript_exists = transcript.exists()
        usable_transcript = transcript_exists and transcript_is_usable(transcript)
        record = {
            "id": relative.as_posix(),
            "name": relative.name,
            "video_url": f"/media/videos/{quote(relative.as_posix())}",
            "transcribe_url": f"/api/videos/{quote(relative.as_posix())}/transcribe",
            "has_transcript": usable_transcript,
        }
        if transcript_exists:
            transcript_relative = transcript.relative_to(TRANSCRIPTS_DIR)
            record["transcript_name"] = transcript_relative.name
            record["transcript_url"] = f"/media/transcripts/{quote(transcript_relative.as_posix())}"
            if not usable_transcript:
                record["transcript_issue"] = "empty or unreadable"
        records.append(record)
    return records


def job_snapshot():
    with JOB_LOCK:
        return {**JOB_STATUS, "failures": JOB_STATUS["failures"].copy()}


def start_transcription(video=None):
    """Start one local transcription job and return its first status."""
    global JOB_STATUS
    with JOB_LOCK:
        if JOB_STATUS["state"] in {"queued", "running"}:
            return None
        JOB_STATUS = {
            "state": "queued", "phase": "queued", "current": None,
            "total": 0, "completed": 0, "created": 0, "skipped": 0, "failures": [],
        }

    def update(progress):
        with JOB_LOCK:
            JOB_STATUS.update({"state": "running", **progress})

    def run():
        global JOB_STATUS
        try:
            if video is None:
                result = transcribe_directory(VIDEOS_DIR, TRANSCRIPTS_DIR, update)
            else:
                result = retranscribe_video_file(video, VIDEOS_DIR, TRANSCRIPTS_DIR, update)
            with JOB_LOCK:
                JOB_STATUS.update({
                    "state": "finished", "phase": "finished", "current": None,
                    "created": len(result["created"]), "skipped": len(result["skipped"]),
                    "completed": len(result["created"]) + len(result["failures"]),
                    "failures": result["failures"],
                })
        except Exception as exc:
            with JOB_LOCK:
                JOB_STATUS.update({"state": "failed", "phase": "failed", "current": None, "failures": [{"error": str(exc)}]})

    threading.Thread(target=run, daemon=True).start()
    return job_snapshot()


class RawToReelsHandler(BaseHTTPRequestHandler):
    server_version = "RawToReels/1.0"

    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")

    def send_json(self, payload, status=HTTPStatus.OK):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def send_file(self, path):
        if not path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        size = path.stat().st_size
        start, end = 0, size - 1
        status = HTTPStatus.OK
        range_header = self.headers.get("Range")
        if range_header:
            match = re.fullmatch(r"bytes=(\d*)-(\d*)", range_header.strip())
            if not match:
                self.send_error(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                return
            start = int(match.group(1)) if match.group(1) else 0
            end = int(match.group(2)) if match.group(2) else end
            if start >= size or start > end:
                self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                self.send_header("Content-Range", f"bytes */{size}")
                self.end_headers()
                return
            end = min(end, size - 1)
            status = HTTPStatus.PARTIAL_CONTENT
        length = end - start + 1
        self.send_response(status)
        self.send_header("Content-Type", mimetypes.guess_type(path.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(length))
        self.send_header("Accept-Ranges", "bytes")
        if status == HTTPStatus.PARTIAL_CONTENT:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        if self.command == "HEAD":
            return
        with path.open("rb") as file:
            file.seek(start)
            remaining = length
            try:
                while remaining:
                    chunk = file.read(min(64 * 1024, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
            except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
                # Browsers routinely cancel unused preview and seek requests.
                return

    def do_GET(self):
        path = unquote(urlparse(self.path).path)
        if path == "/api/videos":
            self.send_json({"videos": video_records()})
            return
        if path == "/api/transcribe/status":
            self.send_json(job_snapshot())
            return
        if path.startswith("/media/videos/"):
            file_path = contained_path(VIDEOS_DIR, path.removeprefix("/media/videos/"))
            if not file_path or file_path.suffix.lower() not in VIDEO_EXTENSIONS:
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            self.send_file(file_path)
            return
        if path.startswith("/media/transcripts/"):
            file_path = contained_path(TRANSCRIPTS_DIR, path.removeprefix("/media/transcripts/"))
            if not file_path or not file_path.name.endswith(".transcript.json"):
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            self.send_file(file_path)
            return
        requested = "index.html" if path == "/" else path.lstrip("/")
        file_path = contained_path(APP_DIR, requested)
        if not file_path:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.send_file(file_path)

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        if path == "/api/transcribe":
            result = start_transcription()
        elif path.startswith("/api/videos/") and path.endswith("/transcribe"):
            requested = path.removeprefix("/api/videos/").removesuffix("/transcribe")
            video = contained_path(VIDEOS_DIR, requested)
            if not video or video.suffix.lower() not in VIDEO_EXTENSIONS:
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            result = start_transcription(video)
        else:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        if result is None:
            self.send_json({"error": "A transcription job is already running."}, HTTPStatus.CONFLICT)
            return
        self.send_json(result, HTTPStatus.ACCEPTED)


def main():
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), RawToReelsHandler)
    url = f"http://{HOST}:{PORT}/"
    print(f"Raw to Reels is running at {url}")
    threading.Timer(0.2, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nRaw to Reels stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
