'use strict';

var app = window.RawToReels;
var state = app.state;
var elements = app.elements;

app.paint = () => {
  const total = app.reelDuration();
  elements.scrub.max = String(total || 0);
  elements.scrub.value = String(Math.min(app.elapsedAt(state.sourceTime), total));
  app.$('time').textContent = `${app.formatClock(Number(elements.scrub.value))} / ${app.formatClock(total)}`;
  app.$('duration-label').textContent = total ? `${Math.round(total)} seconds · 9:16` : '9:16';
  const cue = app.activeCue(state.sourceTime);
  app.renderColoredText(app.$('caption-text'), cue);
  const index = app.visibleCues().indexOf(cue);
  if (index >= 0 && index !== state.lastActiveIndex) {
    app.setActiveCue(index);
    if (state.playing && !elements.editor.contains(document.activeElement)) elements.editor.querySelector(`.cue[data-index="${index}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    state.lastActiveIndex = index;
  }
};
app.stop = () => { state.playing = false; cancelAnimationFrame(state.raf); elements.video.pause(); app.$('play').textContent = '▶'; app.$('play').setAttribute('aria-label', 'Play'); };
app.update = () => { app.stop(); state.sourceTime = app.sourceAt(0); if (state.videoURL && Number.isFinite(elements.video.duration)) elements.video.currentTime = Math.min(state.sourceTime, elements.video.duration); app.paint(); app.renderOptions(); app.renderSequence(); app.renderEditor(); };
function tick() {
  if (!state.playing) return;
  state.sourceTime = state.videoURL ? elements.video.currentTime : state.sourceTime + 1 / 60;
  if (state.selected >= 0) {
    const clips = app.activeClips(); const current = clips.find((clip) => state.sourceTime >= clip.start - .03 && state.sourceTime < clip.end - .02);
    if (!current) { const next = clips.find((clip) => clip.start >= state.sourceTime - .05); if (next) { state.sourceTime = next.start; if (state.videoURL) elements.video.currentTime = next.start; } else { state.sourceTime = clips.at(-1).end; app.stop(); app.paint(); return; } }
  }
  if (state.replayEnd !== null && state.sourceTime >= state.replayEnd - .015) { state.replayEnd = null; app.stop(); app.paint(); return; }
  if (state.sourceTime >= app.duration()) { app.stop(); app.paint(); return; }
  app.paint(); state.raf = requestAnimationFrame(tick);
}
app.startPlayback = async () => {
  if (state.exporting || state.playing) return;
  if (app.elapsedAt(state.sourceTime) >= app.reelDuration() - .01) state.sourceTime = app.sourceAt(0);
  if (state.videoURL) { elements.video.currentTime = state.sourceTime; try { await elements.video.play(); } catch (error) { app.setStatus(`Video cannot play: ${error.message}`, true); return; } }
  state.playing = true; app.$('play').textContent = 'Ⅱ'; app.$('play').setAttribute('aria-label', 'Pause'); state.raf = requestAnimationFrame(tick);
};
app.$('play').addEventListener('click', () => {
  if (state.exporting) return;
  state.replayEnd = null;
  if (state.playing) { app.stop(); return; }
  app.startPlayback();
});
elements.scrub.addEventListener('input', () => { app.stop(); state.sourceTime = app.sourceAt(Number(elements.scrub.value)); if (state.videoURL) elements.video.currentTime = Math.min(state.sourceTime, elements.video.duration || state.sourceTime); app.paint(); });
elements.video.addEventListener('ended', () => { app.stop(); app.paint(); });
app.$('fullscreen').addEventListener('click', () => { elements.stage.requestFullscreen?.().catch(() => app.setStatus('Fullscreen is unavailable here.', true)); });
app.setVideoSource = (url, name, file, revokeWhenReplaced) => {
  if (!url) return;
  app.stop(); if (state.videoURL && state.revokeVideoURL) URL.revokeObjectURL(state.videoURL);
  state.videoFile = file || { name }; state.videoURL = url; state.revokeVideoURL = revokeWhenReplaced; elements.video.src = state.videoURL; elements.stage.classList.add('has-video'); app.$('export').disabled = false;
  app.$('export-hint').textContent = 'Recording happens in real time. Keep this tab open until your download begins.';
  elements.video.addEventListener('loadedmetadata', () => { if (state.model.kind === 'empty') state.model.extent = elements.video.duration; app.update(); }, { once: true });
  app.setStatus(`Video ready: ${name}. Captions and audio will be included in export.`);
};
app.loadVideo = (file) => { if (file) app.setVideoSource(URL.createObjectURL(file), file.name, file, true); };
app.loadVideoURL = (url, name) => app.setVideoSource(url, name, null, false);
