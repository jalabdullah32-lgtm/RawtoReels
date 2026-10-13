# Raw to Reels design review

Open the comparison gallery at http://127.0.0.1:8877/design-directions/index.html while the local preview server is running.

If the server has stopped, run this command from the RawtoReels folder:

```powershell
& '.venv/Scripts/python.exe' -m http.server 8877 --bind 127.0.0.1 --directory 'blueprints/active/ui-layout-mockups'
```

## Directions

- Splice: an olive editing desk with the video on the left, a compact caption inspector on the right, and a cut sequence beneath the preview.
- Proofroom: an archived rust and paper document for proofreading, kept under `slop-garbage/` for reference.
- Storyboard: an archived warm yellow sequence bench, kept under `slop-garbage/` for reference.

The frontend-design skill guided the palette, typography, layout, and visual review. Each direction uses local frames and an excerpted reel from IMG_0407.MOV. Full transcript review includes its 819 source segments. Text corrections synchronize across the sample reels within the current browser tab. File loading and rendering an export remain preview flows. Playback uses still frames and a simulated clock.

The assistant panel demonstrates placement and links to NebulaOne on request. It does not automatically load an external chat or upload video or transcript data.

## Review checks

Inspect the layouts on a laptop and a narrow screen. Try caption editing, switching reels, searching the full transcript, jumping to a timestamp, and returning to the cut. Export opens the proposed settings flow.

The source recordings, source transcripts, and files under app/ remain unchanged. These previews are awaiting a visual direction choice before implementation.
