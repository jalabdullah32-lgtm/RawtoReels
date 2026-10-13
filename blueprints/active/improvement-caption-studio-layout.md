---
tool: claude
---

# Improvement: Caption Studio Layout

## Goal

Rework the Caption Studio layout into three columns — library on the left, phone preview in the middle, agent chat on the right — and cut the visual bloat so the space goes to the things actually being used.

Reference: `blueprints/active/assets/RawtoReels UI change Oct 12.jpeg`.

## What is wrong today

From the marked-up screenshot:

- **The header bar is bloat.** It takes a full strip across the top and says nothing useful.
- **The boxes flanking the phone preview are too wide.** Trimming them frees space for the agent panel and the captions.
- **The library sits at the bottom.** It belongs on the left, with the phone centered.
- **The export controls are clunky.** They need to be one clean button, somewhere obvious.
- **There is a redundant box** marked for deletion in the screenshot.

## Proposed layout

Three columns:

| Left | Middle | Right |
|---|---|---|
| Your videos library, load controls | Phone preview, playback bar | NebulaOne agent chat |

The phone preview stays the visual center. The agent panel gets real estate rather than being squeezed in as an afterthought.

## Mockups

Three standalone HTML files, opened in a browser and clicked through, built with the project's existing CSS variables so the proportions are honest. They become the starting point for the real layout rather than throwaway art.

The three vary in how the left column and export controls are arranged. Pick one, or mix parts of them.

## Current project context

- `app/index.html` holds the current single-column-ish structure.
- `app/css/base.css` holds variables and shared styling; `app/css/studio.css` holds the studio layout.
- The app is vanilla HTML/CSS/JS by design. No framework, no build step. The layout work should stay that way.
- `app/js/dom.js` caches element references, so renaming or restructuring elements means checking it.

## The agent panel

Embedded with the standard NebulaOne iframe:

```html
<iframe
  src="https://cs.nebulaone.ai/chat/<agent-id>?embed=true&silentLogin=true"
  frameborder="0"
  title="Raw to Reels Agent"
  loading="lazy"
  allow="microphone">
</iframe>
```

**What can be styled:** the frame itself — width, height, position in the grid, border radius, how it responds when the window narrows.

**What cannot:** anything inside the frame. `cs.nebulaone.ai` is a different origin, so project CSS stops at the boundary. Theming the chat itself has to come from NebulaOne's own options or URL parameters.

This is worth knowing before the design work starts, so the surrounding layout is built to make the frame look intentional rather than bolted on.

## Implementation steps

1. **Build three HTML mockups** using the existing CSS variables. No JS behavior, just layout.
2. **Pick a direction** from the mockups, or combine them.
3. **Restructure `app/index.html`** into the three-column grid.
4. **Rework `app/css/studio.css`** for the new grid. Remove the header bar, trim the flanking boxes, move the library left.
5. **Consolidate the export controls** into one clear button.
6. **Add the agent iframe** to the right column.
7. **Check `app/js/dom.js`** and any JS that queries restructured elements, so nothing silently breaks.
8. **Handle narrow windows** — decide whether the agent panel collapses, tabs, or scrolls when there is not enough width for three columns.

## Testing approach

- Every existing control still works after restructuring: load video, load JSON, transcribe, caption editing, export.
- The video library still lists and loads videos.
- The agent panel loads and is usable at a normal window size.
- Nothing in the browser console errors from a missing element reference.
- The layout is usable on a laptop screen, not just a wide monitor.

### User visual acceptance test

1. Open Caption Studio and confirm the three columns appear as intended.
2. Load a video and confirm the phone preview is still the focal point.
3. Load a JSON and confirm caption editing is comfortable, not cramped.
4. Use the agent panel and confirm it has enough room to be genuinely usable.
5. Narrow the window and confirm the layout degrades sensibly.
6. Export a video and confirm the flow still makes sense with the new button.

## Risks and roadblocks

- **Restructuring HTML can break JS silently.** Element lookups that return nothing often fail quietly rather than loudly. Step 7 exists for this.
- **Three columns need width.** On a laptop, three columns plus a phone-shaped preview is tight. The narrow-window behavior is a real design decision, not a detail to leave until last.
- **The iframe cannot be restyled.** If the chat's own look clashes with the studio, the only lever is the surrounding frame.
- **Scope creep.** This is layout work. Changing how captions or export actually behave belongs in other blueprints.

## Parked for later

- Theming the agent chat to match the studio, if NebulaOne ever exposes it.
- A collapsible or pop-out agent panel.

## Definition of done

- Three-column layout matching the marked-up screenshot's intent.
- Header bar removed, flanking boxes trimmed, library moved left, phone centered.
- One clean export button.
- Agent panel embedded with room to work.
- Every existing control still functions.
- The user completes the visual acceptance test.

## Status

**Blueprint approved on 12 October 2026. Design review in progress.**

**Codex contribution:** Built the initial mockups and revised Version B from the owner's feedback. Created three further interactive directions under `caption-studio-mockups/`: Splice, Proofroom, and Storyboard, with a comparison gallery, local recording frames, and full transcript review. The directions reflect the owner's light, warm palette constraints, compact media management, on-demand transcript review, and optional NebulaOne assistant.

The owner will choose a visual direction before changes to the real Caption Studio app begin. The previews demonstrate editing flows; source files and the app remain unchanged.

---
_Authored with Claude Code._
