'use strict';

var app = window.RawToReels;
var state = app.state;
var elements = app.elements;

const sampleWords = [
  [['Yes,',0,.54],['hit',4.8,5.58],['it',5.58,6.1],['because',6.1,6.88],['I',6.88,7.16],['taste',7.16,7.38],['real',7.38,7.66],['banana.',7.66,8.04],['I',8.94,9.44]],
  [['Tastes',9.44,9.64],['real',9.64,9.92],['banana.',9.92,10.38],["Let's",10.38,10.8],['go',10.8,10.9],['from',10.9,11.1],['the',11.1,11.2],['thing',11.2,11.64],['like',11.64,11.88],['that.',11.88,12.06],['The',12.34,12.56],['thing',12.56,12.72],['is',12.72,12.94],['usually',12.94,13.34],['when',13.34,13.58],['I',13.58,13.68],['have',13.68,13.84],['something',13.84,14.18],['banana',14.18,14.56]],
  [["It's",14.56,15.06],['like',15.06,15.16],['that',15.16,15.3],['artificial',15.3,15.8],['gold',15.8,16.18],['banana.',16.18,16.76],['Yeah,',17.02,17.18],['like',17.22,17.4],['the',17.4,17.46],['banana',17.46,17.66],['ice',17.66,17.98],['cream',17.98,18.14],['sometimes.',18.14,18.52],['Yeah,',18.58,19.08],['I',19.08,19.44],['know',19.44,19.54],['exactly',19.54,19.76],['what',19.76,19.92],["you're",19.92,19.92],['talking',19.92,20.12],['about',20.12,20.36]],
  [['But',20.36,20.88],['this',20.88,21.12],['tastes',21.12,21.28],['like',21.28,21.58],['real',21.58,22.06],['banana',22.06,22.56]],
  [["It's",25.44,25.94],['hitting',25.94,26.08],['right',26.08,26.34],['literally',26.34,27],['in',27,27.44],['the',27.44,27.6],['ice',27.6,27.82],['group.',27.82,28.08],['Oh',28.2,28.36],['unbelievable.',28.36,29.52],['You',29.9,30.4],['have',30.4,30.52],['another',30.52,30.76],['one',30.76,30.92]]
];
const sampleRanges = [[[[0,0,0]]],[[[0,1,4]],[[0,5,7]]],[[[0,8,8]]],[[[1,0,2]]],[[[1,3,6]],[[1,7,9]]],[[[1,10,14]],[[1,15,18]]],[[[2,0,2]],[[2,3,5]]],[[[2,6,8]],[[2,9,12]]],[[[2,13,16]],[[2,17,20]]],[[[3,0,3]],[[3,4,5]]],[[[4,0,3]],[[4,4,7]]],[[[4,8,9]]],[[[4,10,13]]]];

app.cue = (start, end, text, reference) => ({ start, end, text, reference });
app.sample = () => {
  const cues = sampleRanges.map((lines) => {
    const words = lines.flatMap((line) => line.flatMap(([segment, start, end]) => sampleWords[segment].slice(start, end + 1)));
    return app.cue(words[0][1], words.at(-1)[2], words.map((word) => word[0]).join(' '));
  });
  return { kind: 'sample', raw: null, cues, options: [], extent: 30.92 };
};
function checkKeys(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !keys.includes(key))) throw Error(`${label} has unexpected fields.`);
}
app.fromReels = (raw) => {
  checkKeys(raw, ['schema_version','source','transcript_end_seconds','timestamp_unit','target_duration_seconds','options'], 'Reel JSON');
  if (raw.schema_version !== '1.0' || typeof raw.source !== 'string' || !app.validTime(raw.transcript_end_seconds) || raw.timestamp_unit !== 'seconds_from_source_start') throw Error('Expected Raw to Reels output schema v1.0 with source times in seconds.');
  checkKeys(raw.target_duration_seconds, ['min','max'], 'Target duration');
  const target = raw.target_duration_seconds;
  if (!app.validTime(target.min) || !app.validTime(target.max) || target.min > target.max) throw Error('Invalid target duration range.');
  if (!Array.isArray(raw.options) || raw.options.length > 3) throw Error('Options must contain at most three reels.');
  const seen = new Set();
  const options = raw.options.map((option, optionIndex) => {
    checkKeys(option, ['id','title','duration_seconds','clips'], `Option ${optionIndex + 1}`);
    if (!/^option_[1-9][0-9]*$/.test(option.id) || seen.has(option.id) || typeof option.title !== 'string' || !option.title.trim() || !Array.isArray(option.clips) || !option.clips.length || !app.validTime(option.duration_seconds) || option.duration_seconds === 0) throw Error(`Invalid option ${optionIndex + 1}.`);
    seen.add(option.id); let priorEnd = 0; let sum = 0;
    const clips = option.clips.map((clip, clipIndex) => {
      checkKeys(clip, ['start','end','captions'], `Clip ${clipIndex + 1}`);
      if (!app.validTime(clip.start) || !app.validTime(clip.end) || clip.start >= clip.end || clip.start < priorEnd || clip.end > raw.transcript_end_seconds || !Array.isArray(clip.captions) || !clip.captions.length) throw Error(`Option ${optionIndex + 1}, clip ${clipIndex + 1}: invalid source times or captions.`);
      priorEnd = clip.end; sum += clip.end - clip.start; let last = clip.start;
      const captions = clip.captions.map((caption, captionIndex) => {
        checkKeys(caption, ['start','end','text'], `Caption ${captionIndex + 1}`);
        if (!app.validTime(caption.start) || !app.validTime(caption.end) || caption.start < last || caption.start >= caption.end || caption.end > clip.end || typeof caption.text !== 'string' || !caption.text.trim()) throw Error(`Option ${optionIndex + 1}, clip ${clipIndex + 1}: invalid caption time or text.`);
        last = caption.end; return app.cue(caption.start, caption.end, caption.text, caption);
      });
      return { start: clip.start, end: clip.end, captions };
    });
    if (Math.abs(option.duration_seconds - Math.round(sum * 100) / 100) > .005) throw Error(`Option ${optionIndex + 1} duration does not match its clips.`);
    return { ...option, clips };
  });
  return { kind: 'reels', raw, cues: [], options, extent: raw.transcript_end_seconds };
};
app.fromTranscript = (raw) => {
  if (typeof raw.source !== 'string' || typeof raw.language !== 'string' || !Array.isArray(raw.segments)) throw Error('Transcript needs source, language, and segments.');
  let extent = 0; const cues = [];
  raw.segments.forEach((segment, segmentIndex) => {
    if (!app.validTime(segment.start) || !app.validTime(segment.end) || segment.end <= segment.start || typeof segment.text !== 'string') throw Error(`Segment ${segmentIndex + 1} needs valid start, end, and text.`);
    extent = Math.max(extent, segment.end);
    if (segment.words !== undefined) {
      if (!Array.isArray(segment.words)) throw Error(`Segment ${segmentIndex + 1} words must be an array.`);
      let batch = []; let last = segment.start;
      const flush = () => { if (batch.length) { const items = batch; cues.push(app.cue(items[0].start, items.at(-1).end, items.map((word) => word.text).join(' '), { segment: segmentIndex, words: items.map((word) => word.index) })); batch = []; } };
      segment.words.forEach((word, wordIndex) => {
        if (typeof word.text !== 'string' || !word.text.trim() || !app.validTime(word.start) || !app.validTime(word.end) || word.end < word.start) throw Error(`Segment ${segmentIndex + 1}, word ${wordIndex + 1}: invalid text or timestamps.`);
        const start = Math.max(segment.start, last, word.start);
        const end = Math.max(start, Math.min(segment.end, word.end));
        if (batch.length && (batch.length >= 5 || start - last > .5)) flush();
        batch.push({ ...word, start, end: Math.max(end, start + .045), index: wordIndex }); last = end;
      });
      flush();
    } else if (segment.text.trim()) cues.push(app.cue(segment.start, segment.end, segment.text, { segment: segmentIndex }));
  });
  return { kind: 'transcript', raw, cues, options: [], extent };
};
app.fromLegacy = (raw) => {
  if (!Array.isArray(raw.segments) || !Array.isArray(raw.groups)) throw Error('Legacy JSON needs segments and groups.');
  let extent = 0;
  raw.segments.forEach((row, index) => { if (!Array.isArray(row)) throw Error(`Invalid segment ${index + 1}.`); row.forEach((word) => { if (!Array.isArray(word) || typeof word[0] !== 'string' || !app.validTime(word[1]) || !app.validTime(word[2]) || word[2] < word[1]) throw Error('Invalid legacy word.'); extent = Math.max(extent, word[2]); }); });
  const cues = raw.groups.map((lines) => {
    if (!Array.isArray(lines) || !lines.length) throw Error('Invalid legacy caption group.');
    const words = lines.flatMap((line) => { if (!Array.isArray(line)) throw Error('Invalid legacy caption line.'); return line.flatMap((reference) => { if (!Array.isArray(reference) || reference.length !== 3 || !reference.every(Number.isInteger) || !raw.segments[reference[0]] || reference[1] < 0 || reference[2] < reference[1] || reference[2] >= raw.segments[reference[0]].length) throw Error('Legacy group references an unknown word.'); return raw.segments[reference[0]].slice(reference[1], reference[2] + 1); }); });
    if (!words.length) throw Error('Empty legacy group.'); return app.cue(words[0][1], words.at(-1)[2], words.map((word) => word[0].trim()).join(' '));
  });
  return { kind: 'legacy', raw, cues, options: [], extent };
};
app.setStatus = (text, error = false) => { elements.status.textContent = text; elements.status.classList.toggle('error', error); };
app.duration = () => state.videoURL && Number.isFinite(elements.video.duration) ? elements.video.duration : (state.model?.extent || 0);
app.activeClips = () => state.selected < 0 ? [{ start: 0, end: app.duration(), captions: state.model.cues }] : state.model.options[state.selected].clips;
app.reelDuration = () => app.activeClips().reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0);
app.sourceAt = (time) => { if (state.selected < 0) return Math.min(time, app.duration()); let elapsed = 0; for (const clip of app.activeClips()) { const length = clip.end - clip.start; if (time < elapsed + length) return clip.start + (time - elapsed); elapsed += length; } return app.activeClips().at(-1)?.end || 0; };
app.elapsedAt = (time) => { if (state.selected < 0) return time; let elapsed = 0; for (const clip of app.activeClips()) { if (time < clip.start) return elapsed; if (time <= clip.end) return elapsed + time - clip.start; elapsed += clip.end - clip.start; } return elapsed; };
app.activeCue = (time) => { const clip = app.activeClips().find((item) => time >= item.start && time < item.end); return clip?.captions.find((caption) => time >= caption.start && time < caption.end) || null; };
app.visibleCues = () => state.selected < 0 ? state.model.cues : app.activeClips().flatMap((clip) => clip.captions);
app.allCues = () => [...state.model.cues, ...state.model.options.flatMap((option) => option.clips.flatMap((clip) => clip.captions))];
app.renderOptions = () => {
  const root = app.$('options'); root.replaceChildren();
  const options = [{ title: 'Full source', duration: app.duration() }, ...state.model.options.map((option) => ({ title: option.title, duration: option.duration_seconds }))];
  root.hidden = options.length < 2;
  options.forEach((option, index) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = `${option.title} · ${app.formatClock(option.duration)}`; button.setAttribute('aria-pressed', String(state.selected === index - 1)); button.addEventListener('click', () => { if (state.exporting) return; state.selected = index - 1; app.update(); }); root.append(button); });
  app.$('option-count').textContent = state.model.options.length ? `${state.model.options.length} REEL${state.model.options.length > 1 ? 'S' : ''}` : 'SOURCE';
};
app.jumpToCue = (index, scroll = true) => { const cues = app.visibleCues(); const cue = cues[Math.max(0, Math.min(index, cues.length - 1))]; if (!cue) return; app.stop(); state.sourceTime = cue.start; if (state.videoURL) elements.video.currentTime = Math.min(cue.start, elements.video.duration || cue.start); state.lastActiveIndex = -1; app.setActiveCue(cues.indexOf(cue)); app.paint(); if (scroll) elements.editor.querySelector(`.cue[data-index="${cues.indexOf(cue)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
app.setActiveCue = (index) => {
  state.activeCueIndex = index;
  elements.editor.querySelectorAll('.cue.active').forEach((row) => row.classList.remove('active'));
  elements.editor.querySelector(`.cue[data-index="${index}"]`)?.classList.add('active');
};
app.replayCue = (index) => { const cue = app.visibleCues()[index]; if (!cue) return; app.jumpToCue(index, false); state.replayEnd = cue.end; app.startPlayback(); };
app.renderEditor = () => {
  elements.editor.replaceChildren(); state.lastActiveIndex = -1; const cues = app.visibleCues();
  app.$('cue-count').textContent = `${cues.length} caption${cues.length === 1 ? '' : 's'}`;
  app.$('prev-cue').disabled = app.$('next-cue').disabled = app.$('reset').disabled = !cues.length;
  app.$('clear').disabled = state.model.kind === 'empty';
  app.$('list-empty').hidden = Boolean(cues.length);
  if (!cues.length) { state.activeCueIndex = -1; return; }
  const fragment = document.createDocumentFragment();
  cues.forEach((cue, index) => {
    const row = document.createElement('article'); row.className = 'cue'; row.dataset.index = index;
    const stamp = document.createElement('button'); stamp.type = 'button'; stamp.className = 'cue-time'; stamp.textContent = app.formatClock(cue.start);
    stamp.setAttribute('aria-label', `Jump to caption ${index + 1} at ${app.formatTime(cue.start)}`);
    stamp.addEventListener('click', () => app.jumpToCue(index));
    const body = document.createElement('div');
    const box = document.createElement('div'); box.className = 'text-box'; box.contentEditable = 'plaintext-only'; box.textContent = cue.text; box.spellcheck = false;
    box.setAttribute('role', 'textbox'); box.setAttribute('aria-multiline', 'true'); box.setAttribute('aria-label', `Caption ${index + 1}`);
    box.addEventListener('focus', () => { app.setActiveCue(index); if (!state.playing && Math.abs(state.sourceTime - cue.start) > .05) app.jumpToCue(index, false); });
    box.addEventListener('input', () => { cue.text = box.innerText.replace(/\r/g, ''); app.paint(); });
    const tools = document.createElement('div'); tools.className = 'cue-tools';
    const bottom = document.createElement('div'); bottom.className = 'cue-bottom';
    const replay = document.createElement('button'); replay.type = 'button'; replay.className = 'link'; replay.textContent = '▶ Replay caption';
    replay.addEventListener('click', () => app.replayCue(index));
    const span = document.createElement('span'); span.className = 'cue-hint'; span.textContent = `${app.formatTime(cue.start)} – ${app.formatTime(cue.end)}`;
    bottom.append(replay, span); tools.append(bottom); body.append(box, tools); row.append(stamp, body); fragment.append(row);
  });
  elements.editor.append(fragment); app.setActiveCue(state.activeCueIndex); app.paint();
};
app.renderSequence = () => {
  const root = app.$('sequence'); root.replaceChildren(); const clips = app.activeClips();
  const solo = clips.length < 2; app.$('sequence-head').hidden = solo; root.hidden = solo;
  if (solo) return;
  let elapsed = 0;
  clips.forEach((clip, index) => {
    const start = elapsed; elapsed += Math.max(0, clip.end - clip.start);
    const button = document.createElement('button'); button.type = 'button'; button.className = 'cut';
    const title = document.createElement('strong'); title.textContent = `Clip ${index + 1} · ${app.formatClock(clip.start)} – ${app.formatClock(clip.end)}`;
    const length = document.createElement('span'); length.textContent = `${(clip.end - clip.start).toFixed(1)}s`;
    button.append(title, length);
    button.addEventListener('click', () => { app.stop(); state.sourceTime = app.sourceAt(start); if (state.videoURL) elements.video.currentTime = state.sourceTime; app.paint(); });
    root.append(button);
  });
};
app.loadModel = (next) => { app.stop(); state.model = next; state.selected = -1; state.originalTexts = next.cues.map((cue) => cue.text); next.options.forEach((option) => option.clips.forEach((clip) => clip.captions.forEach((cue) => state.originalTexts.push(cue.text)))); app.update(); app.setStatus(next.kind === 'reels' ? `Loaded ${next.options.length} reel option${next.options.length === 1 ? '' : 's'}. Select a cut and export it with your video.` : 'Captions loaded. Add a video to preview and export.'); };
