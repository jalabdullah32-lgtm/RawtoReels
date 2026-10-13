# Caption Studio UI — where this stands

The Caption Studio redesign is in planning. **No implementation blueprint exists yet, on
purpose.** The owner wants to see a UI he would actually use before anything gets written up
or built.

## What is in this folder

| File | What it is |
|---|---|
| `rail-layout-mockup.html` | **The mockup to review.** The rail layout with all four sections and a theme switcher. |
| `Raw_to_Reels_Desktop_Preview.html` | The owner's own prototype. Open it in a browser. |
| `assets/sectionsForeditor.png` | The layout reference that was chosen. |
| `codex-rejected/` | Every earlier design direction, all rejected. Kept as a record. |

## The direction

A narrow **icon rail** down the far left, the **9:16 video fixed in the middle**, and **one
context panel on the right** whose contents change with the selected rail item. From
`assets/sectionsForeditor.png`.

The prototype is more than a mockup — it has a working undo stack, word-level color marks,
Captions/Style tabs, and JSON import and save. It also reuses the real app's element IDs
almost exactly, which is why re-skinning is cheap. It is a two-panel layout, though; the rail
in the reference image supersedes it.

## Decisions already made

- **Re-skin the real app, don't replace it.** `app/js` already does real playback, burn-in
  export, the local library, and transcription. That engine stays; `index.html` and the CSS
  get rebuilt around it.
- **Four rail sections, and only four:** Media, Captions, Style, Assistant.
  - **Media** — the `videos/input` library with thumbnails, Load video, Import JSON,
    Transcribe new videos and its progress meter.
  - **Captions** — the caption list, caption count, previous/next, Reset text.
  - **Style** — four presets, nine appearance controls, Reset style.
  - **Assistant** — the NebulaOne iframe, loaded the first time it is opened.
- **Header:** source/project name on the left, status message centre, Save caption JSON and a
  primary Export video on the right. Export video is the burn-in and earns the loud button.
- **Audio, Layout, and Brand are out.** They appear in the reference image but do not exist in
  the app. Filed as ideas `14`–`16` instead. Nothing in the design should imply a feature that
  is not coming.
- **Reel/cut chips sit directly above the video**, not inside a rail panel — you pick between
  cuts while watching.
- **The cut-sequence thumbnail strip is out.** It belongs to the parked clip-timeline
  blueprint (`04`).
- **Layout first.** Word coloring and undo from the prototype become their own blueprints
  afterwards.
- **One blueprint per section.** Each section ships working before the next one starts, rather
  than building the whole UI and then stripping it back.

## The one technical constraint

Every panel stays in the page and gets hidden with the `hidden` attribute. It must never be
built on demand. `app/js` grabs all 34 of its elements by ID the moment it loads, and a missing
element returns nothing without raising an error — so a panel that isn't there yet breaks
things silently, somewhere else, later.

## The mockup is built

`rail-layout-mockup.html` — one self-contained file, no frameworks, no build step, no external
assets. Open it in a browser.

- All four sections are filled with the app's **actual** controls. Every element `app/js` looks
  up by ID is present, so the markup can be lifted into `index.html` without the silent
  lookup failures described above.
- Cosmetic only — no real video, no real file loading, no export. The style controls do drive
  the caption overlay live, so the four presets and the nine appearance controls can be judged
  properly.

### The rules it is built to

Three columns: a **64px icon rail**, a **flexible preview workspace** that takes everything
left over, and a **360px inspector**. One 8px spacing scale, 8–10px radii, one border color per
theme, near-white surfaces. 14px controls, 16px body, 20px section headings.

The accent is spent in exactly two places: **the selected reel and the Export button.** Rail
selection, caption selection, and every secondary control are neutral, so nothing competes with
those two.

Developer-facing copy is gone — no JSON schema paragraph, no `videos/input` path. Transcribe is
a compact toolbar action above the media grid rather than a full-width button.

### Themes

**Cloud Blue is the one.** The other three stay in the mockup for reference and do not ship.

The four palettes sit behind a row of dots in the bottom-left corner. That control is a review
tool, deliberately faint and outside the product chrome; it is not part of the design and does
not ship.

- **Cloud Blue** ✅ — `#F7F8FA` `#FFFFFF` `#1F2937` `#2F6FED` `#EAF2FF`
- **Warm Studio** — `#F5F4F1` `#FFFEFC` `#242424` `#2563EB` `#EAF2FF`
- **Cool Mist** — `#F3F6F7` `#FBFCFC` `#20303A` `#0F766E` `#E6F4F1`
- **Signal Red** — `#F7F7F8` `#FFFFFF` `#171717` `#E5473B` `#FDECEA`, from `assets/sectionsForeditor.png`

A section and a theme can also be deep-linked: `rail-layout-mockup.html?theme=signal-red#style`.
Sections are `media`, `captions`, `style`, `assistant`.

### Three calls made while building, worth confirming

- **Clear captions** sits in the Captions section next to Reset text. It is the only existing
  control the four-section split had no home for.
- **The status line became a save state.** The header reads "All changes saved" where the app
  today prints a sentence-long status message.
- **The export hint is hidden until it matters.** It stays in the DOM for `app/js`, but a
  paragraph under the Export button would have fought the header.

## Next action: the Media blueprint

The mockup is signed off and the theme is picked, so the per-section blueprints get written
through the `blueprint-planner` skill. **Media first**, and it ships working before Captions
starts.

---
_Authored with Claude Code._
