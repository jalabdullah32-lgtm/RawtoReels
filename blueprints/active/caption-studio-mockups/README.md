# Caption Studio UI — where this stands

The Caption Studio redesign is in planning. **No implementation blueprint exists yet, on
purpose.** The owner wants to see a UI he would actually use before anything gets written up
or built.

## What is in this folder

| File | What it is |
|---|---|
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

## Next action: build the mockup

One self-contained HTML file. No frameworks, no build step, no external assets — the same rules
as the prototype.

- The rail layout above, with all four real sections filled with the app's **actual** controls,
  not placeholders. Every control that exists in `app/index.html` today should appear in the
  section it belongs to.
- A **theme switcher** across four palettes, so they can be compared on the real layout:
  - **Cloud Blue** — `#F7F8FA` `#FFFFFF` `#1F2937` `#2F6FED` `#EAF2FF`
  - **Warm Studio** — `#F5F4F1` `#FFFEFC` `#242424` `#2563EB` `#EAF2FF`
  - **Cool Mist** — `#F3F6F7` `#FBFCFC` `#20303A` `#0F766E` `#E6F4F1`
  - **Signal Red** — the accent from `assets/sectionsForeditor.png`
- Desktop only. Cosmetic interactions only — no real video, no real file loading.

Once a theme and the structure are signed off, the per-section blueprints get written through
the `blueprint-planner` skill.

---
_Authored with Claude Code._
