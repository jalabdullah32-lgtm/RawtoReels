October 11 2026
Raw to Reels: Project Overview

Raw to Reels is an AI-assisted video editing application that transforms long-form videos into engaging 30–60 second social media reels.

Core Workflow

Video Input: Users provide a video file.
 - I belive that transcribe.py will find the video file and find transcribe videos. If it has already done a video it will not retranscruibe.

Transcription: Python, FFmpeg, and Faster-Whisper generate transcript JSON with word-level timestamps.

AI Analysis: An external AI agent analyzes the transcript and generates three reel options optimized for engagement.
 - If you need more details about this ask m . 

Reel Selection: Users import the AI-generated JSON and select their preferred edit.

Caption Editing: Users customize caption text, fonts, colors, positioning, and styling.

Video Export: The browser assembles selected clips, burns in captions, preserves original audio, and exports MP4/WebM.

Architecture

transcribe.py: Video-to-transcript JSON generation.

AI Editor: External agent generating Raw to Reels JSON schema v1.0.

Caption Studio: Browser-based video preview, reel selection, caption editing, and export.

Git: Local version control.

Development Principles

Keep the application lightweight and modular.

Prefer vanilla JavaScript and Python.

Maintain transcript JSON and Raw to Reels schema v1.0 compatibility.

Preserve source chronology and accurate timestamps.


Separate HTML, CSS, JavaScript, and Python into maintainable modules.


Avoid unnecessary frameworks and dependencies.

Goal: Create a streamlined pipeline from raw video to finished, captioned social media reels with minimal manual editing.

To change:
Remove legacy JSON and SRT functionality
Separate HTML, CSS, JavaScript, and Python into maintainable modules.



