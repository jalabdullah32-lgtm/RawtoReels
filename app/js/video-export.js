'use strict';

var app = window.RawToReels;
var state = app.state;
var elements = app.elements;

function recordingType() { const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4']; return types.find((type) => MediaRecorder.isTypeSupported(type)) || ''; }
function seekTo(element, time) { return new Promise((resolve, reject) => { if (Math.abs(element.currentTime - time) < .005 && element.readyState >= 2) { resolve(); return; } const cleanup = () => { element.removeEventListener('seeked', done); element.removeEventListener('error', fail); }; const done = () => { cleanup(); resolve(); }; const fail = () => { cleanup(); reject(Error('Could not seek the video.')); }; element.addEventListener('seeked', done, { once: true }); element.addEventListener('error', fail, { once: true }); element.currentTime = time; }); }
function captionLines(context, cue, style, maxWidth) {
  const marks = (cue.marks || []).filter((mark) => mark.start < mark.end && mark.start < cue.text.length && mark.end > 0);
  const lines = [];
  let blockStart = 0;
  for (const block of cue.text.split('\n')) {
    let line = { words: [], width: 0 };
    for (const match of block.matchAll(/\S+/g)) {
      const start = blockStart + match.index;
      const end = start + match[0].length;
      const edges = new Set([start, end]);
      marks.forEach((mark) => {
        if (mark.start < end && mark.end > start) {
          edges.add(Math.max(start, mark.start));
          edges.add(Math.min(end, mark.end));
        }
      });
      const offsets = [...edges].sort((left, right) => left - right);
      const runs = [];
      for (let index = 0; index < offsets.length - 1; index += 1) {
        const runStart = offsets[index];
        const runEnd = offsets[index + 1];
        const mark = marks.find((item) => runStart >= item.start && runStart < item.end);
        const source = cue.text.slice(runStart, runEnd);
        runs.push({ text: style.uppercase ? source.toLocaleUpperCase() : source, color: mark?.color || style.color });
      }
      const word = { runs, width: runs.reduce((sum, run) => sum + context.measureText(run.text).width, 0) };
      const spaceWidth = line.words.length ? context.measureText(' ').width : 0;
      if (line.words.length && line.width + spaceWidth + word.width > maxWidth) {
        lines.push(line);
        line = { words: [], width: 0 };
      }
      if (line.words.length) line.width += context.measureText(' ').width;
      line.words.push(word);
      line.width += word.width;
    }
    if (line.words.length) lines.push(line);
    blockStart += block.length + 1;
  }
  return lines;
}

function drawCaptionLine(context, line, centerX, y, outline) {
  const spaceWidth = context.measureText(' ').width;
  const drawRuns = (stroke) => {
    let x = centerX - line.width / 2;
    line.words.forEach((word, wordIndex) => {
      if (wordIndex) x += spaceWidth;
      word.runs.forEach((run) => {
        if (stroke) context.strokeText(run.text, x, y);
        else { context.fillStyle = run.color; context.fillText(run.text, x, y); }
        x += context.measureText(run.text).width;
      });
    });
  };
  if (outline) drawRuns(true);
  drawRuns(false);
}

function drawFrame(context, canvas, media, cue) {
  const width = canvas.width; const height = canvas.height; context.fillStyle = '#201f1b'; context.fillRect(0, 0, width, height);
  if (media.readyState >= 2 && media.videoWidth && media.videoHeight) { const scale = Math.min(width / media.videoWidth, height / media.videoHeight); const drawWidth = media.videoWidth * scale; const drawHeight = media.videoHeight * scale; context.drawImage(media, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight); }
  if (!cue || !cue.text.trim()) return;
  const style = app.captionStyle; const ratio = width / 360; const font = style.size * ratio; const lineHeight = font * 1.2;
  context.save(); context.font = `900 ${font}px ${app.fontFamily()}`; context.textAlign = 'left'; context.textBaseline = 'middle'; context.lineJoin = 'round';
  const maxTextWidth = width * .80; const lines = captionLines(context, cue, style, maxTextWidth); const padX = 9 * ratio; const padY = 5 * ratio; const boxHeight = lines.length * lineHeight + padY * 2; const top = height * (1 - style.position / 100) - boxHeight; const boxWidth = Math.min(width * .86, Math.max(...lines.map((line) => line.width)) + padX * 2);
  if (style.bg > 0) { context.fillStyle = app.rgba(style.bgColor, style.bg / 100); const boxX = (width - boxWidth) / 2; const radius = 7 * ratio; context.beginPath(); context.roundRect ? context.roundRect(boxX, top, boxWidth, boxHeight, radius) : context.rect(boxX, top, boxWidth, boxHeight); context.fill(); }
  context.strokeStyle = style.outlineColor; context.lineWidth = style.outline * ratio * 2; lines.forEach((line, index) => { const y = top + padY + (index + .5) * lineHeight; drawCaptionLine(context, line, width / 2, y, style.outline > 0); }); context.restore();
}
function exportInputs() {
  if (!state.videoURL || state.exporting) return null;
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { app.setStatus('This browser cannot record canvas video. Try a current Chrome, Edge, or Safari.', true); return null; }
  const mime = recordingType(); if (!mime) { app.setStatus('This browser does not support MP4 or WebM recording.', true); return null; }
  const clips = app.activeClips().filter((clip) => clip.end > clip.start);
  if (!clips.length) { app.setStatus('This cut has no footage to export.', true); return null; }
  if (clips.some((clip) => clip.end > elements.video.duration + .05)) { app.setStatus('A cut ends after the uploaded video. Load the matching source video.', true); return null; }
  return { mime, clips, duration: clips.reduce((sum, clip) => sum + clip.end - clip.start, 0) };
}

function suggestedTitle() {
  if (state.selected >= 0) return state.model.options[state.selected].title;
  const filename = state.videoFile?.name || 'captioned_video';
  return filename.replace(/\.[^.]+$/, '') || 'captioned_video';
}

function safeFilename(title) {
  let name = title.normalize('NFKC').trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').replace(/\s+/g, '_').replace(/_+/g, '_').slice(0, 100);
  if (!name || /^\.+$/.test(name)) name = 'captioned_video';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name)) name = `_${name}`;
  return name;
}

function closeExportDialog() {
  app.$('export-state').hidden = true;
  app.$('export-form').hidden = false;
  app.$('export-progress').hidden = true;
  app.$('export-meter').value = 0;
  app.$('export-elapsed').textContent = '';
  if (dialogReturnFocus?.isConnected && !dialogReturnFocus.disabled) dialogReturnFocus.focus();
  dialogReturnFocus = null;
}

let dialogReturnFocus = null;

app.exportVideo = () => {
  const inputs = exportInputs();
  if (!inputs) return;
  dialogReturnFocus = document.activeElement;
  app.$('export-title').value = suggestedTitle();
  app.$('export-meta').textContent = `9:16 · 1080 × 1920 · ${app.formatClock(inputs.duration)}`;
  app.$('export-form').hidden = false;
  app.$('export-progress').hidden = true;
  app.$('export-state').hidden = false;
  app.$('export-title').focus();
  app.$('export-title').select();
};

app.$('export-cancel').addEventListener('click', closeExportDialog);
app.$('export-state').addEventListener('click', (event) => { if (event.target === app.$('export-state') && !state.exporting) closeExportDialog(); });
app.$('export-title').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); app.$('export-go').click(); }
});
app.$('export-state').addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !state.exporting) { event.preventDefault(); closeExportDialog(); return; }
  if (event.key !== 'Tab') return;
  if (state.exporting) { event.preventDefault(); return; }
  const first = app.$('export-title'); const last = app.$('export-go');
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  else if (!app.$('export-state').contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
});
app.$('export-go').addEventListener('click', () => { void startExport(); });

function updateExportProgress(recorded, duration, startedAt) {
  const safeRecorded = Math.max(0, Math.min(recorded, duration));
  app.$('export-meter').value = duration ? safeRecorded / duration : 0;
  app.$('export-elapsed').textContent = `${app.formatClock(safeRecorded)} / ${app.formatClock(duration)} · ${Math.round(duration ? safeRecorded / duration * 100 : 0)}% · ${app.formatClock((performance.now() - startedAt) / 1000)} elapsed`;
}

async function startExport() {
  const inputs = exportInputs();
  if (!inputs) { closeExportDialog(); return; }
  const title = app.$('export-title').value.trim();
  if (!title) { app.setStatus('Enter a name for this reel.', true); app.$('export-title').focus(); return; }

  state.exporting = true;
  app.stop();
  app.$('export').disabled = true;
  app.$('export').textContent = 'Exporting…';
  app.$('export-form').hidden = true;
  app.$('export-progress').hidden = false;
  app.$('export-progress').tabIndex = -1;
  app.$('export-progress').focus();
  app.$('export-meter').value = 0;
  const startedAt = performance.now();
  updateExportProgress(0, inputs.duration, startedAt);
  app.setStatus('Exporting in real time. Keep this tab open.');

  let worker; let audioContext; let stream; let recorder; let frameId; let objectUrl;
  try {
    worker = document.createElement('video'); worker.src = state.videoURL; worker.preload = 'auto'; worker.playsInline = true; worker.muted = false;
    await new Promise((resolve, reject) => { if (worker.readyState >= 2) { resolve(); return; } worker.addEventListener('loadeddata', resolve, { once: true }); worker.addEventListener('error', () => reject(Error('Could not decode the video.')), { once: true }); });
    const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 1280; const context = canvas.getContext('2d'); stream = canvas.captureStream(30);
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) { audioContext = new AudioContextClass(); await audioContext.resume(); const source = audioContext.createMediaElementSource(worker); const destination = audioContext.createMediaStreamDestination(); source.connect(destination); destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track)); }
    const chunks = []; recorder = new MediaRecorder(stream, { mimeType: inputs.mime, videoBitsPerSecond: 5000000 }); recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); }; const finished = new Promise((resolve, reject) => { recorder.onstop = resolve; recorder.onerror = () => reject(Error('Recording failed.')); });
    let completedDuration = 0;
    for (let index = 0; index < inputs.clips.length; index += 1) {
      const clip = inputs.clips[index];
      await seekTo(worker, clip.start);
      drawFrame(context, canvas, worker, clip.captions.find((cue) => clip.start >= cue.start && clip.start < cue.end));
      if (index === 0) recorder.start(250); else recorder.resume();
      await worker.play();
      await new Promise((resolve, reject) => {
        const render = () => {
          try {
            drawFrame(context, canvas, worker, clip.captions.find((cue) => worker.currentTime >= cue.start && worker.currentTime < cue.end));
            updateExportProgress(completedDuration + Math.max(0, Math.min(worker.currentTime - clip.start, clip.end - clip.start)), inputs.duration, startedAt);
            if (worker.currentTime >= clip.end - .015 || worker.ended) { worker.pause(); cancelAnimationFrame(frameId); resolve(); }
            else frameId = requestAnimationFrame(render);
          } catch (error) { reject(error); }
        };
        frameId = requestAnimationFrame(render);
      });
      completedDuration += clip.end - clip.start;
      updateExportProgress(completedDuration, inputs.duration, startedAt);
      if (index < inputs.clips.length - 1) recorder.pause();
    }
    recorder.stop(); await finished;
    const extension = inputs.mime.includes('mp4') ? 'mp4' : 'webm';
    objectUrl = URL.createObjectURL(new Blob(chunks, { type: inputs.mime }));
    const link = document.createElement('a'); link.href = objectUrl; link.download = `${safeFilename(title)}.${extension}`; link.click();
    app.setStatus(`Download ready: ${link.download}`);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (error) {
    app.setStatus(`Export failed: ${error.message}`, true);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  } finally {
    cancelAnimationFrame(frameId); worker?.pause(); worker?.removeAttribute('src'); worker?.load();
    stream?.getTracks().forEach((track) => track.stop());
    if (audioContext) await audioContext.close();
    state.exporting = false;
    app.$('export').disabled = !state.videoURL;
    app.$('export').innerHTML = '↑ Export reel';
    closeExportDialog();
  }
}
