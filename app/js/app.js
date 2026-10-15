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
app.$('undo').addEventListener('click', app.undo);
document.addEventListener('keydown', (event) => {
  if (event.altKey || !(event.ctrlKey || event.metaKey)) return;
  const box = document.activeElement?.closest?.('.text-box');
  if (!event.shiftKey && event.key.toLowerCase() === 'z' && (box || document.activeElement?.closest?.('.cue-tools') || document.activeElement?.id === 'undo')) { event.preventDefault(); app.undo(); return; }
  const shortcut = event.shiftKey && event.code?.match(/^Digit([0-4])$/);
  if (!shortcut || !box) return;
  event.preventDefault(); state.selection = app.captureSelection() || state.selection;
  app.applyWordColor(Number(box.closest('.cue').dataset.index), [null, '#ffffff', '#ff3030', '#ffcb00', '#0868f9'][Number(shortcut[1])]);
});
document.addEventListener('selectionchange', () => { const selection = app.captureSelection(); if (selection) state.selection = selection; });
app.$('reset').addEventListener('click', () => {
  const cues = app.allCues();
  if (cues.every((cue, index) => cue.text === state.originalTexts[index] && JSON.stringify(cue.marks || []) === JSON.stringify(state.originalMarks[index] || []))) return;
  app.saveHistory();
  cues.forEach((cue, index) => { cue.text = state.originalTexts[index]; cue.marks = (state.originalMarks[index] || []).map((mark) => ({ ...mark })); if (cue.reference && state.model.kind === 'reels') cue.reference.text = cue.text; });
  app.renderEditor();
});
app.$('clear').addEventListener('click', () => app.loadModel({ kind: 'empty', raw: null, cues: [], options: [], extent: state.videoURL ? app.duration() : 0 }));
app.$('media-json-file').addEventListener('change', async (event) => {
  const file = event.target.files[0]; if (!file) return;
  try { const raw = JSON.parse(await file.text()); const next = Array.isArray(raw.segments) && raw.groups !== undefined ? app.fromLegacy(raw) : raw.options !== undefined ? app.fromReels(raw) : app.fromTranscript(raw); app.loadModel(next); }
  catch (error) { app.setStatus(`Could not load JSON: ${error.message}`, true); }
  event.target.value = '';
});
app.$('download-json').addEventListener('click', () => {
  let payload;
  if (state.model.kind === 'reels') {
    app.allCues().forEach((cue) => { if (cue.reference) cue.reference.text = cue.text; });
    payload = structuredClone(state.model.raw);
  } else if (state.model.kind === 'transcript') {
    payload = structuredClone(state.model.raw);
    payload.segments = state.model.cues.map((cue) => ({ start: cue.start, end: cue.end, text: cue.text }));
  } else {
    const cues = app.allCues();
    payload = { segments: cues.map((cue) => [[cue.text, cue.start, cue.end]]), groups: cues.map((_, index) => [[[index, 0, 0]]]) };
  }
  const cueGroups = state.model.kind === 'reels' ? state.model.options.map((option) => option.clips.flatMap((clip) => clip.captions)) : [state.model.cues];
  payload.schema_version = '1.1';
  payload.caption_studio = { style: { ...app.captionStyle }, options: Object.fromEntries(cueGroups.map((cues, index) => [index, cues.map((cue) => (cue.marks || []).map((mark) => ({ ...mark }))) ])) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'edited_captions.json'; link.click(); app.setStatus('Caption project saved.'); setTimeout(() => URL.revokeObjectURL(url), 60000);
});
app.$('video-file').addEventListener('change', (event) => { app.loadVideo(event.target.files[0]); event.target.value = ''; });
app.$('export').addEventListener('click', app.exportVideo);
app.updateStylePreview();
app.loadModel(app.sample());
app.refreshLibrary();
