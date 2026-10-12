# Extract Caption Studio Assets

**Status:** Complete. Verified with a complete transcript in Caption Studio.

## Goal

Move the inline CSS and JavaScript from `app/index.html` into maintainable files without changing Caption Studio behavior or requiring a local server. Opening `index.html` by double-clicking it must continue to work.

## Proposed Experience

You continue to open `app/index.html` from its folder. The browser displays a `file:///.../index.html` address, and the app still loads local videos and JSON files, previews captions, and exports captioned video.

## Current Context

- `app/index.html` is the complete browser application: markup, styling, sample captions, JSON parsing, editing, preview playback, caption styling, and video export.
- The technical notes call for HTML, CSS, JavaScript, and Python to have separate responsibilities.
- No frontend asset folders or build tooling exist today.
- ES modules would require a local HTTP server in Chrome. This improvement uses ordered classic scripts so the app remains double-clickable.

## Target Files

```text
app/
  index.html
  css/
    base.css
    studio.css
  js/
    app.js
    dom.js
    state.js
    utils.js
    captions.js
    playback.js
    caption-style.js
    video-export.js
```

## Responsibilities

- `index.html`: semantic page structure and stylesheet/script references only.
- `css/base.css`: design tokens, global element rules, layout, shared controls, and responsive rules.
- `css/studio.css`: preview-stage, caption-editor, and caption-style panel rules.
- `js/dom.js`: a single documented collection of required DOM elements and lookup helpers.
- `js/state.js`: one shared `window.RawToReels` namespace for mutable application state and cross-feature APIs.
- `js/utils.js`: time formatting, color conversion, and font-family helpers.
- `js/captions.js`: sample data, JSON schema validation, parsing, cue selection, caption editing, reset, and JSON download.
- `js/playback.js`: play/pause behavior, timeline mapping, caption painting, preview updates, and video-file loading.
- `js/caption-style.js`: caption appearance state, presets, controls, and live preview updates.
- `js/video-export.js`: canvas frame rendering, audio-stream setup, MediaRecorder orchestration, and output download.
- `js/app.js`: controlled startup sequence and remaining cross-feature event wiring.

## Implementation Steps

1. Create the `app/css/` and `app/js/` directories.
2. Copy the existing style block into `base.css` and `studio.css` without visual changes; replace the block with stylesheet links in `index.html`.
3. Create the shared namespace, DOM references, state, and utilities before extracting feature code.
4. Move caption, playback, style, and export behavior into their named script files.
5. Add deferred script tags in dependency order: shared foundation first, feature files next, then `app.js`.
6. Remove the inline script only after the external files reproduce every current behavior.
7. Add concise README instructions confirming that `app/index.html` opens directly by double-clicking, with no server setup.

## Testing Approach

Open `app/index.html` directly from File Explorer and confirm:

- Sample captions play and follow the timeline.
- A video loads, previews, pauses, scrubs, and clears correctly.
- Transcript, Raw to Reels v1.0, and legacy JSON inputs retain their current validation and behavior.
- Caption text edits, reset, clear, selection navigation, and JSON download work.
- Caption presets and each appearance control update the preview.
- Selected cuts map playback timing correctly and export with captions and source audio.
- The browser console shows no JavaScript errors and missing assets do not appear in the Network or Console views.

## Risks and Roadblocks

- Classic scripts share a browser global scope. The explicit `window.RawToReels` namespace and fixed script order prevent accidental coupling.
- The existing playback, caption style, and export code share timing and style state. The extraction must preserve those interfaces before any cleanup.
- Browser support for MediaRecorder and video codecs varies independently of this refactor; the current fallback messages must stay intact.

## Definition of Done

- `index.html` contains no inline `<style>` or executable application `<script>` blocks.
- CSS and JavaScript live in their respective `app/css/` and `app/js/` folders.
- Double-clicking `app/index.html` opens a fully working Caption Studio without a local host command.
- Existing behavior passes the listed manual checks.
