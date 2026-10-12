'use strict';

var app = window.RawToReels;
var state = app.state;
var elements = app.elements;

function recordingType() { const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4']; return types.find((type) => MediaRecorder.isTypeSupported(type)) || ''; }
function seekTo(element, time) { return new Promise((resolve, reject) => { if (Math.abs(element.currentTime - time) < .005 && element.readyState >= 2) { resolve(); return; } const cleanup = () => { element.removeEventListener('seeked', done); element.removeEventListener('error', fail); }; const done = () => { cleanup(); resolve(); }; const fail = () => { cleanup(); reject(Error('Could not seek the video.')); }; element.addEventListener('seeked', done, { once: true }); element.addEventListener('error', fail, { once: true }); element.currentTime = time; }); }
function wrapCaption(context, text, maxWidth) { const lines = []; for (const block of text.split('\n')) { let line = ''; for (const word of block.split(/\s+/).filter(Boolean)) { const next = line ? `${line} ${word}` : word; if (line && context.measureText(next).width > maxWidth) { lines.push(line); line = word; } else line = next; } lines.push(line); } return lines.filter(Boolean); }
function drawFrame(context, canvas, media, cue) {
  const width = canvas.width; const height = canvas.height; context.fillStyle = '#201f1b'; context.fillRect(0, 0, width, height);
  if (media.readyState >= 2 && media.videoWidth && media.videoHeight) { const scale = Math.min(width / media.videoWidth, height / media.videoHeight); const drawWidth = media.videoWidth * scale; const drawHeight = media.videoHeight * scale; context.drawImage(media, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight); }
  if (!cue || !cue.text.trim()) return;
  const style = app.captionStyle; const ratio = width / 360; const font = style.size * ratio; const lineHeight = font * 1.2; const text = style.uppercase ? cue.text.toLocaleUpperCase() : cue.text;
  context.save(); context.font = `900 ${font}px ${app.fontFamily()}`; context.textAlign = 'center'; context.textBaseline = 'middle'; context.lineJoin = 'round';
  const maxTextWidth = width * .80; const lines = wrapCaption(context, text, maxTextWidth); const padX = 9 * ratio; const padY = 5 * ratio; const boxHeight = lines.length * lineHeight + padY * 2; const top = height * (1 - style.position / 100) - boxHeight; const boxWidth = Math.min(width * .86, Math.max(...lines.map((line) => context.measureText(line).width)) + padX * 2);
  if (style.bg > 0) { context.fillStyle = app.rgba(style.bgColor, style.bg / 100); const boxX = (width - boxWidth) / 2; const radius = 7 * ratio; context.beginPath(); context.roundRect ? context.roundRect(boxX, top, boxWidth, boxHeight, radius) : context.rect(boxX, top, boxWidth, boxHeight); context.fill(); }
  context.fillStyle = style.color; context.strokeStyle = style.outlineColor; context.lineWidth = style.outline * ratio * 2; lines.forEach((line, index) => { const y = top + padY + (index + .5) * lineHeight; if (style.outline > 0) context.strokeText(line, width / 2, y); context.fillText(line, width / 2, y); }); context.restore();
}
app.exportVideo = async () => {
  if (!state.videoURL || state.exporting) return;
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { app.setStatus('This browser cannot record canvas video. Try a current Chrome, Edge, or Safari.', true); return; }
  const mime = recordingType(); if (!mime) { app.setStatus('This browser does not support MP4 or WebM recording.', true); return; }
  const clips = app.activeClips().filter((clip) => clip.end > clip.start); if (!clips.length) { app.setStatus('This cut has no footage to export.', true); return; }
  if (clips.some((clip) => clip.end > elements.video.duration + .05)) { app.setStatus('A cut ends after the uploaded video. Load the matching source video.', true); return; }
  state.exporting = true; app.stop(); app.$('export').disabled = true; app.$('export').textContent = 'Exporting…'; app.setStatus('Exporting in real time. Keep this tab open.'); let worker; let audioContext; let stream; let recorder; let frameId; let objectUrl;
  try {
    worker = document.createElement('video'); worker.src = state.videoURL; worker.preload = 'auto'; worker.playsInline = true; worker.muted = false;
    await new Promise((resolve, reject) => { if (worker.readyState >= 2) { resolve(); return; } worker.addEventListener('loadeddata', resolve, { once: true }); worker.addEventListener('error', () => reject(Error('Could not decode the video.')), { once: true }); });
    const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 1280; const context = canvas.getContext('2d'); stream = canvas.captureStream(30);
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) { audioContext = new AudioContextClass(); await audioContext.resume(); const source = audioContext.createMediaElementSource(worker); const destination = audioContext.createMediaStreamDestination(); source.connect(destination); destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track)); }
    const chunks = []; recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5000000 }); recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); }; const finished = new Promise((resolve, reject) => { recorder.onstop = resolve; recorder.onerror = () => reject(Error('Recording failed.')); });
    for (let index = 0; index < clips.length; index += 1) { const clip = clips[index]; await seekTo(worker, clip.start); drawFrame(context, canvas, worker, clip.captions.find((cue) => clip.start >= cue.start && clip.start < cue.end)); if (index === 0) recorder.start(250); else recorder.resume(); await worker.play(); await new Promise((resolve, reject) => { const render = () => { try { drawFrame(context, canvas, worker, clip.captions.find((cue) => worker.currentTime >= cue.start && worker.currentTime < cue.end)); if (worker.currentTime >= clip.end - .015 || worker.ended) { worker.pause(); cancelAnimationFrame(frameId); resolve(); } else frameId = requestAnimationFrame(render); } catch (error) { reject(error); } }; frameId = requestAnimationFrame(render); }); if (index < clips.length - 1) recorder.pause(); }
    recorder.stop(); await finished; const extension = mime.includes('mp4') ? 'mp4' : 'webm'; objectUrl = URL.createObjectURL(new Blob(chunks, { type: mime })); const link = document.createElement('a'); link.href = objectUrl; link.download = `${state.selected < 0 ? 'captioned_video' : state.model.options[state.selected].title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'reel'}.${extension}`; link.click(); app.setStatus(`Download ready: ${link.download}`); setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (error) { app.setStatus(`Export failed: ${error.message}`, true); if (recorder && recorder.state !== 'inactive') recorder.stop(); }
  finally { cancelAnimationFrame(frameId); worker?.pause(); worker?.removeAttribute('src'); worker?.load(); stream?.getTracks().forEach((track) => track.stop()); if (audioContext) await audioContext.close(); state.exporting = false; app.$('export').disabled = false; app.$('export').innerHTML = '↓ &nbsp;Export video'; }
};
