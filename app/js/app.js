'use strict';

var app = window.RawToReels;
var state = app.state;

app.$('prev-cue').addEventListener('click', () => {
  const cues = app.visibleCues();
  const current = cues.findIndex((cue) => cue === app.activeCue(state.sourceTime));
  const upcoming = current < 0 ? cues.findIndex((cue) => cue.start > state.sourceTime) : current;
  app.jumpToCue(Math.max(0, upcoming - 1));
});
app.$('next-cue').addEventListener('click', () => {
  const cues = app.visibleCues(); const current = cues.findIndex((cue) => cue === app.activeCue(state.sourceTime)); const upcoming = cues.findIndex((cue) => cue.start > state.sourceTime + .025);
  app.jumpToCue(upcoming >= 0 ? upcoming : Math.min(cues.length - 1, current + 1));
});
app.$('reset').addEventListener('click', () => { app.allCues().forEach((cue, index) => { cue.text = state.originalTexts[index]; if (cue.reference && state.model.kind === 'reels') cue.reference.text = cue.text; }); app.renderEditor(); });
app.$('clear').addEventListener('click', () => app.loadModel({ kind: 'empty', raw: null, cues: [], options: [], extent: state.videoURL ? app.duration() : 0 }));
app.$('json-file').addEventListener('change', async (event) => {
  const file = event.target.files[0]; if (!file) return;
  try { const raw = JSON.parse(await file.text()); const next = raw.schema_version !== undefined || raw.options !== undefined ? app.fromReels(raw) : Array.isArray(raw.segments) && raw.groups !== undefined ? app.fromLegacy(raw) : app.fromTranscript(raw); app.loadModel(next); }
  catch (error) { app.setStatus(`Could not load JSON: ${error.message}`, true); }
  event.target.value = '';
});
app.$('download-json').addEventListener('click', () => {
  let payload;
  if (state.model.kind === 'reels') { app.allCues().forEach((cue) => { if (cue.reference) cue.reference.text = cue.text; }); payload = state.model.raw; }
  else if (state.model.kind === 'transcript') { payload = structuredClone(state.model.raw); state.model.cues.forEach((cue) => { if (cue.reference?.words) { const words = payload.segments[cue.reference.segment].words; const edited = cue.text.trim().split(/\s+/); if (edited.length === cue.reference.words.length) cue.reference.words.forEach((wordIndex, index) => { words[wordIndex].text = edited[index]; }); else payload.segments[cue.reference.segment].text = cue.text; } else if (cue.reference) payload.segments[cue.reference.segment].text = cue.text; }); }
  else payload = { segments: app.allCues().map((cue) => [[cue.text, cue.start, cue.end]]), groups: app.allCues().map((_, index) => [[[index, 0, 0]]]) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'edited_captions.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
});
app.$('video-file').addEventListener('change', (event) => { app.loadVideo(event.target.files[0]); event.target.value = ''; });
app.$('export').addEventListener('click', app.exportVideo);
app.updateStylePreview();
app.loadModel(app.sample());
app.refreshLibrary();
