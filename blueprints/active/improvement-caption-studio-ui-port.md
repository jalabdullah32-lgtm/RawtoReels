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

- **Clear captions** exists in the app and has no home in the preview's layout.
- **The clip sequence strip** is in the preview, but cut-sequence editing belongs to the parked
  clip-timeline work (idea `04`). It renders as a jump-to-clip strip here, nothing more.
- **The export hint** text under the old Export button has nowhere to sit; it stays in the DOM
  for `app/js` and is shown only if it earns a place.

## Definition of done

The app at `app/index.html` is the preview's interface, running on the real engine. A reel JSON
from NebulaOne loads, plays over a real video, and exports to an MP4 with the captions and
their word colors burned in. Work saves to a file that re-opens with everything intact. All
eleven steps are checked, the console is clean, and no element lookup in `app/js` is pointing
at something that no longer exists.

## Status

Approved and not yet started. Written 14 October 2026 after the owner chose the Desktop Preview
over the rail-layout mockup, confirmed word colors must appear in the export, and asked for the
work to be built and checked one small step at a time.

---
_Authored with Claude Code._
