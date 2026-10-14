---
tool: claude
---

# Caption Studio UI — port the Desktop Preview into the real app

Idea `17`. Supersedes `improvement-caption-studio-layout.md` and the rail-layout direction
signed off on 13 October.

## Goal

Make `Raw_to_Reels_Desktop_Preview.html` the real interface of the app, driven by the engine
that already exists in `app/js`. The preview is the UI the owner would actually use. The app
is the only thing that really plays video, burns captions into an export, lists the local
library, and runs transcription. This joins them.

Built in small steps, each one checked in the browser before the next one starts. Light
checks — does the thing work when used normally — not an edge-case hunt.

## Proposed user experience

The app opens looking like the preview: the 9:16 video on the left with its play bar, a panel
on the right with four tabs — Media, Captions, Style, Assistant — and a status line along the
bottom.

You pick a video from your library or load one from disk, import a reel JSON from NebulaOne,
and the captions play over the real video. You edit caption text in the list, undo a change
you did not mean, and color individual words. You set the caption look in Style. You press
Export, name the reel, and get an MP4 with the captions — including the word colors — burned
into it. You save your work to a JSON file, and when you load that file back tomorrow your
captions, your style, and your word colors are all still there.

## Current project context

Two complete implementations exist side by side and neither can do the whole job.

**`app/js` — the engine.** Real `<video>` playback, clip sequencing, canvas burn-in export
through `MediaRecorder`, the local library served by `tools/server.py`, transcription, and
strict validation of three JSON shapes: reel v1.0, transcript, and legacy. No undo, no word
colors, and an interface the owner does not want to use.

**`Raw_to_Reels_Desktop_Preview.html` — the interface.** The layout, the visual language, and
three features the app does not have: an undo stack, word-level color marks, and a two-step
export naming dialog. It cannot play video at all — `#frame` holds a 3 MB embedded still image
and a fake clock advances the captions. Its JSON reader is looser than the app's and is not
kept.

**The constraint that breaks things silently.** `app/js` looks up all 35 of its elements by ID
the moment it loads. A missing element returns nothing without raising an error, so the damage
shows up somewhere else, later. Eight of those IDs are absent from the preview — `video`,
`stage`, `caption-text`, `library-section`, `json-file`, `clear`, `export-hint`, `option-count`
— and `json-file` has been renamed `media-json-file`. Every one has to be present from step 1,
even if it is hidden.

**The JSON decision.** NebulaOne is untouched: the Json Handler keeps writing reel JSON v1.0
and the app keeps accepting it. What changes is the file the app itself *saves*. It gains a
`caption_studio` block holding the caption style and the word color marks, and is written as
schema `1.1`. The validator learns to accept `1.0` and `1.1`, so a saved file re-opens with
everything intact. Today the validator rejects any file carrying a field it was not told
about, which is why a file saved by the preview would be refused by the app that saved it.

## Relevant files and components

| File | What happens to it |
|---|---|
| `app/index.html` | Replaced by the preview's markup, plus the eight missing IDs |
| `app/css/base.css`, `app/css/studio.css` | Replaced by the preview's stylesheet, split the same way |
| `app/js/dom.js`, `state.js` | Extended — tab state, undo history, word marks |
| `app/js/captions.js` | Validator accepts schema 1.1 and `caption_studio`; editor rebuilt around the preview's caption rows |
| `app/js/caption-style.js` | Mostly unchanged; reads and writes the `caption_studio` style block |
| `app/js/video-export.js` | `drawFrame` rewritten to paint word by word; export naming dialog in front of it |
| `app/js/app.js` | Save and load rewired; `media-json-file` wired to the strict validator |
| `app/js/library.js`, `playback.js`, `utils.js` | Re-pointed at new elements, logic unchanged |
| `blueprints/active/caption-studio-mockups/Raw_to_Reels_Desktop_Preview.html` | The source of truth. Stays as the reference; not loaded by the app |

## Implementation steps

Each step is checked in the browser before the next one begins.

**1. Shell and tabs.** Move the preview's markup and stylesheet into `app/index.html` and the
two CSS files. Drop the 3 MB embedded still, the `state-picker` demo switcher, and the mockup
disclaimer notes. Add the eight missing IDs, hidden where they have no home yet. Tabs switch;
nothing else is wired.

**2. Real video in the frame.** A real `<video>` replaces the still image. The preview's fake
clock goes; play, scrub, and the time readout run off the actual video through the existing
playback code.

**3. Captions on the video.** The overlay and the caption list render from the real engine.
Caption rows, previous/next, Reset text, and jump-to-moment all work. Reel options render
above the video when a reel JSON has more than one cut.

**4. Style controls.** The four presets and the nine appearance controls drive the live
overlay, as they already do today.

**5. Media tab.** The local library, Transcribe and its progress meter, Load video, and Caption
JSON import — the last one going through the app's strict validator, not the preview's reader.

**6. Export and the naming dialog.** The existing burn-in export, with the preview's two-step
dialog in front of it: name the reel, then record. The dialog's progress bar reports the real
recording.

**7. Undo.** The preview's history stack ported onto the real caption and style state.

**8. Word colors in the editor.** Select words in a caption row and color them. Includes the
preview's re-mapping, which keeps marks attached to the right words while text is retyped.

**9. Word colors in the export.** `drawFrame` rewritten to measure and paint each word in its
own color, so the MP4 matches the preview.

**10. Save and re-open.** Save caption JSON writes schema 1.1 with the `caption_studio` block.
The validator accepts 1.0 and 1.1. Re-uploading a saved file restores captions, style, and
word colors.

**11. Assistant tab.** The NebulaOne frame, loaded the first time the tab is opened.

## Testing approach

One light pass per step, in a browser, using the app the way it is normally used. The browser
console stays open throughout — a blank console is most of what confirms a step, because a
missing element in this app fails silently rather than erroring.

| Step | Check |
|---|---|
| 1 | App opens looking like the preview; all four tabs switch; console clean |
| 2 | Load a video, it plays, scrubbing lands where expected, the time readout is right |
| 3 | Captions follow playback; clicking a caption jumps there; editing text shows on the video |
| 4 | Each preset changes the look; drag each slider and watch the overlay |
| 5 | The library lists real videos; Transcribe runs; a NebulaOne reel JSON imports |
| 6 | Export a short cut, open the MP4, captions are burned in and the audio is there |
| 7 | Type in a caption, undo, the text comes back |
| 8 | Select a word, color it, retype around it, the color stays on the right word |
| 9 | Export after coloring, the colors are in the video |
| 10 | Save, reload the page, re-upload the saved file, everything is as it was |
| 11 | Open the Assistant tab, NebulaOne loads |

Screenshotting with headless Chrome catches layout faults that reading the markup does not —
worth doing on step 1, as it was on the mockup.

## Risks and roadblocks

- **Silent element failures.** The single biggest risk, and the reason the eight missing IDs
  go in at step 1 rather than when each tab is reached.
- **Per-word drawing on canvas (step 9).** The hardest piece. Caption text wraps across lines,
  and each word has to be measured and placed individually while the line stays centred.
  If it proves unreliable it gets its own pass rather than blocking step 10.
- **Two editors, two shapes.** The app edits captions in `<textarea>` elements; the preview
  uses editable rich text so words can carry color. Step 3 adopts the preview's version, and
  the app's Reset-text behaviour has to keep working against it.
- **The preview's fake clock is woven through it.** Playback, the caption list, and the overlay
  all read from it. Step 2 has to replace it cleanly or steps 3 and 6 inherit the problem.
- **Schema 1.1 and NebulaOne.** The Json Handler keeps emitting 1.0 and is not touched. If a
  1.1 file is ever fed back to a NebulaOne agent, that agent does not know the
  `caption_studio` block — out of scope here, worth remembering.

## Open calls

Three things with no obvious answer, to settle as they come up rather than silently:

- **Clear captions** exists in the app and has no home in the preview's layout. Settled at
  step 5: it sits in the Media tab's Import row, beside Video file and Caption JSON — the row
  captions arrive through is the row to throw them out of. It greys out when there is nothing
  loaded to clear.
- **The clip sequence strip** is in the preview, but cut-sequence editing belongs to the parked
  clip-timeline work (idea `04`). It renders as a jump-to-clip strip here, nothing more. Built
  at step 3, and hidden entirely unless a reel has more than one clip — the same rule as the
  reel options bar.
- **The export hint** text under the old Export button has nowhere to sit; it stays in the DOM
  for `app/js` and is shown only if it earns a place.

Settled while building:

- **The reel options bar** now stays hidden unless there is more than one thing to pick between,
  as the preview had it. The engine used to draw a lone "Full source" button with nothing to
  choose. Settled 14 October at step 2.
- **The live overlay is held to what the export actually draws.** The preview's stylesheet was
  written to look good over a still, not to match `drawFrame`: it wrapped text at 88% rather
  than 80%, carried a drop shadow the export never draws, and gave each wrapped line its own
  background box where the export draws one box around the whole caption. All four were pulled
  into line at step 4, along with the box padding and corner radius. Per-line boxes are the
  nicer look of the two — worth revisiting at step 9, when `drawFrame` is being rewritten
  anyway, rather than leaving the preview telling a story the MP4 does not.
- **The video is letterboxed in the frame, not cropped.** The preview's stylesheet cropped the
  video to fill the 9:16 frame, but the export fits the whole frame inside 1080 × 1920 with
  bars. Cropping would have meant the preview lied about the export. Whether the export itself
  should crop instead is a separate question, and a real one for 16:9 source footage.

## Definition of done

The app at `app/index.html` is the preview's interface, running on the real engine. A reel JSON
from NebulaOne loads, plays over a real video, and exports to an MP4 with the captions and
their word colors burned in. Work saves to a file that re-opens with everything intact. All
eleven steps are checked, the console is clean, and no element lookup in `app/js` is pointing
at something that no longer exists.

## Status

In progress. Written 14 October 2026 after the owner chose the Desktop Preview over the
rail-layout mockup, confirmed word colors must appear in the export, and asked for the work to
be built and checked one small step at a time.

Steps 1 to 5 done and checked on 14 October 2026. The app wears the preview's interface, all
four tabs switch, every ID `app/js` looks up resolves, and a real video plays in the frame with
the play bar, scrubbing, and the time readout running off it. The caption list is the preview's:
editable rich-text rows with a timestamp that jumps to the moment, previous/next, Reset text,
and a reel options bar and clip strip that appear only when there is something to choose.
The four presets and the nine appearance controls drive that overlay, and the overlay now
measures itself exactly as `drawFrame` does. Console clean throughout.

The Media tab lists the real library, loads video from disk, and imports caption JSON through
the app's strict validator — a malformed reel file is refused with a reason and the work already
loaded is left alone. The hidden `json-file` input is gone; `media-json-file` is the real one.

One gap: transcription could not be checked past the point of failure, because `faster_whisper`
is not installed for the Python on this machine. The Transcribe button, the job, the progress
meter, the failure detail, the library refresh and the status line were all confirmed against a
real job — but a transcript has never actually come out the other end in testing.

Step 6 is next — export, with the two-step naming dialog in front of it.

## Picking this up again

Everything through step 5 is committed and pushed to `main` as `1625765`.

**To run it.** Windows: `run-raw-to-reels.cmd`. Mac or Linux: `.venv/bin/python tools/server.py`.
Either way it opens `127.0.0.1:8765`. The server needs `faster-whisper` and `numpy` in `.venv` —
`numpy` is imported at the top of `transcribe.py`, so without it the server will not start at
all, never mind transcribe.

**The one thing outstanding before step 6.** Transcription has never been seen to succeed. Put a
video with speech in `videos/input`, open the Media tab with the browser console showing, and
press Transcribe. Watch for: the progress strip appearing; its label moving through `Preparing
transcription` → `Loading local transcription model` → `Transcribing <file>` → `Transcription
complete`; the count and meter tracking together; the Transcribe button and every `↻` greying
out while it runs and coming back after; the card flipping from `No transcript` to `Ready` with
its button changing from `Preview` to `Load`. Then press **Load** — the video and its captions
should arrive together, with real words on timings that land when you play it.

Anything red in the console is worth reporting, as is a card stuck on `No transcript` after a run
that claimed success, or buttons that stay grey once it finishes.

**How the checks were run.** From step 2 onward, by driving a real Chrome over the DevTools
protocol — headless `--virtual-time-budget` fast-forwards timers while video decodes in real
time, so the page outruns its own playback and nothing media-related can be trusted. File
uploads went through the real pickers using `DOM.setFileInputFiles`. The scripts were scratch
and are not in the repo.

---
_Authored with Claude Code._
