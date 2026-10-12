'use strict';

var app = window.RawToReels;

app.refreshLibrary = async () => {
  const section = app.$('library-section');
  try {
    const response = await fetch('/api/videos', { cache: 'no-store' });
    if (!response.ok) throw Error('The local video library is unavailable.');
    const payload = await response.json();
    section.hidden = false;
    app.renderLibrary(payload.videos || []);
  } catch (_) {
    section.hidden = true;
  }
};

app.setTranscriptionControls = (disabled) => {
  app.$('transcribe').disabled = disabled;
  document.querySelectorAll('[data-retranscribe]').forEach((button) => { button.disabled = disabled; });
};

app.updateTranscriptionProgress = (job) => {
  const progress = app.$('transcription-progress');
  const total = job.total || 0;
  const completed = job.completed || 0;
  const phase = job.phase || job.state;
  const label = phase === 'loading_model' ? 'Loading local transcription model'
    : phase === 'transcribing' ? `Transcribing ${job.current || 'video'}`
      : phase === 'finished' ? 'Transcription complete'
        : phase === 'failed' ? 'Transcription stopped'
          : 'Preparing transcription';
  progress.hidden = false;
  app.$('transcription-label').textContent = label;
  app.$('transcription-count').textContent = total ? `${Math.min(completed, total)} of ${total}` : '';
  const meter = app.$('transcription-meter');
  meter.max = Math.max(total, 1);
  meter.value = Math.min(completed, meter.max);
  const parts = [];
  if (job.skipped) parts.push(`${job.skipped} already transcribed`);
  if (job.failures?.length) {
    const failure = job.failures[0];
    parts.push(`${job.failures.length} failed: ${failure.error || 'unknown error'}`);
  }
  app.$('transcription-detail').textContent = parts.join(' · ') || (total ? 'Your videos stay on this computer.' : 'No unfinished videos found.');
};

app.describeJobResult = (job) => {
  if (job.failures?.length) return `${job.created} video(s) transcribed. ${job.failures.length} failed. Check the progress detail.`;
  if (job.created) return `${job.created} video(s) transcribed. Your library is ready.`;
  return 'No unfinished videos found. Use Re-transcribe when you need to replace an existing transcript.';
};

app.pollTranscription = async () => {
  try {
    const response = await fetch('/api/transcribe/status', { cache: 'no-store' });
    if (!response.ok) throw Error('Could not read transcription progress.');
    const job = await response.json();
    app.updateTranscriptionProgress(job);
    if (job.state === 'queued' || job.state === 'running') {
      window.setTimeout(app.pollTranscription, 500);
      return;
    }
    app.setTranscriptionControls(false);
    await app.refreshLibrary();
    app.setStatus(app.describeJobResult(job), job.state === 'failed' || Boolean(job.failures?.length));
  } catch (error) {
    app.setTranscriptionControls(false);
    app.setStatus(`Could not read transcription progress: ${error.message}`, true);
  }
};

app.startTranscription = async (url) => {
  app.setTranscriptionControls(true);
  app.updateTranscriptionProgress({ state: 'queued', phase: 'queued', total: 0, completed: 0, skipped: 0, failures: [] });
  try {
    const response = await fetch(url, { method: 'POST' });
    const job = await response.json();
    if (!response.ok) throw Error(job.error || 'Could not start transcription.');
    app.updateTranscriptionProgress(job);
    app.pollTranscription();
  } catch (error) {
    app.setTranscriptionControls(false);
    app.setStatus(`Could not start transcription: ${error.message}`, true);
  }
};

app.renderLibrary = (videos) => {
  const library = app.$('video-library');
  library.replaceChildren();
  if (!videos.length) {
    const empty = document.createElement('p');
    empty.className = 'library-empty';
    empty.textContent = 'No videos found yet. Add a supported video to Videos/input, then refresh this page.';
    library.append(empty);
    return;
  }
  videos.forEach((video) => {
    const card = document.createElement('article');
    card.className = 'video-card';
    const preview = document.createElement('video');
    preview.className = 'video-still';
    preview.src = video.video_url;
    preview.muted = true;
    preview.preload = 'metadata';
    preview.setAttribute('aria-hidden', 'true');
    preview.addEventListener('loadeddata', () => { preview.currentTime = Math.min(.1, preview.duration || 0); }, { once: true });
    const name = document.createElement('strong');
    name.textContent = video.name;
    const detail = document.createElement('span');
    detail.className = video.has_transcript ? 'library-ready' : 'library-pending';
    detail.textContent = video.has_transcript ? `Transcript found · ${video.transcript_name}`
      : video.transcript_issue ? 'Transcript is empty or unreadable' : 'Needs transcription';
    const actions = document.createElement('div');
    actions.className = 'library-actions';
    const load = document.createElement('button');
    load.className = 'btn small';
    load.type = 'button';
    load.textContent = video.has_transcript ? 'Load video' : 'Preview video';
    load.addEventListener('click', () => app.loadLibraryVideo(video));
    const retranscribe = document.createElement('button');
    retranscribe.className = 'btn small';
    retranscribe.type = 'button';
    retranscribe.dataset.retranscribe = 'true';
    retranscribe.textContent = video.has_transcript ? 'Re-transcribe' : 'Transcribe';
    retranscribe.addEventListener('click', () => app.startTranscription(video.transcribe_url));
    actions.append(load, retranscribe);
    card.append(preview, name, detail, actions);
    library.append(card);
  });
};

app.loadLibraryVideo = async (video) => {
  try {
    if (video.has_transcript) {
      const response = await fetch(video.transcript_url, { cache: 'no-store' });
      if (!response.ok) throw Error('Could not read the matching transcript.');
      const raw = await response.json();
      app.loadModel(app.fromTranscript(raw));
    }
    app.loadVideoURL(video.video_url, video.name);
    app.setStatus(video.has_transcript ? `Loaded ${video.name} with its matching transcript.` : `Loaded ${video.name}. Transcribe it to add captions.`);
  } catch (error) {
    app.setStatus(`Could not load ${video.name}: ${error.message}`, true);
  }
};

app.$('transcribe').addEventListener('click', () => app.startTranscription('/api/transcribe'));
