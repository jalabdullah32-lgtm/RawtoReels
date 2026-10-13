/* Local design-preview interactions. No application/backend calls or file writes. */
'use strict';
(async () => {
  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => [...root.querySelectorAll(s)];
  const response = await fetch('assets/transcript.json');
  if (!response.ok) throw new Error('Could not load the local sample transcript.');
  const data = await response.json();
  const originals = new Map(data.segments.map(c => [c.id, c.text]));
  const cuts = [
    { title:'Opportunity is everywhere', clips:[[14.48,27.14],[28.48,33.58],[37.42,65.82]] },
    { title:'It never hurts to ask', clips:[[37.42,51.98],[53.98,69.94]] },
    { title:'Take the opportunity', clips:[[4.62,18.94],[22.42,33.58]] }
  ];
  let cutIndex = 0, scope = 'reel', playing = false, clock = 0, priorTick = 0, active = data.segments.find(c => c.start === 37.42), dialog = null;
  let style = document.body.dataset.direction==='storyboard' ? 'paper' : 'label', fontSize = 22, height = 20, search = '', reviewState = null, reviewTime = 0;
  const changed = () => data.segments.filter(c => c.text !== originals.get(c.id)).length;
  const format = value => `${String(Math.floor(value / 60)).padStart(2,'0')}:${String(Math.floor(value % 60)).padStart(2,'0')}`;
  const duration = () => cuts[cutIndex].clips.reduce((sum,[a,b]) => sum + b-a, 0);
  const visible = () => scope === 'source' ? data.segments : data.segments.filter(c => cuts[cutIndex].clips.some(([a,b]) => c.start >= a && c.end <= b + .05));
  const reelTime = source => {
    let time=0;
    for (const [a,b] of cuts[cutIndex].clips) { if (source <= b) return time + Math.max(0,source-a); time += b-a; }
    return duration();
  };
  const sourceTime = time => {
    let remaining=time;
    for (const [a,b] of cuts[cutIndex].clips) { if (remaining < b-a-.000001) return a+remaining; remaining-=b-a; }
    return cuts[cutIndex].clips.at(-1)[1];
  };
  clock = reelTime(active.start);
  function toast(text) {
    let el=q('.demo-toast'); if(!el){el=document.createElement('div');el.className='demo-toast';el.setAttribute('role','status');document.body.append(el);}
    el.textContent=text;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>{el.hidden=true;},5000);
  }
  function syncText(origin) {
    qa('[data-active-caption], [data-current-editor], .demo-review-caption').forEach(el=>{
      if(el===origin)return;
      const text=active?.text || '';
      if(el.matches('textarea,input')){if(el.value!==text)el.value=text;}
      else if(el.textContent!==text)el.textContent=text;
    });
    qa('[data-cue-index]').forEach(row=>{
      row.classList.toggle('is-current',Number(row.dataset.cueIndex)===active?.id);
      const cue=data.segments.find(c=>c.id===Number(row.dataset.cueIndex));
      const input=q('textarea',row);
      if(input && input!==origin && document.activeElement!==input && input.value!==cue.text){input.value=cue.text;grow(input);}
    });
    const edits=changed();
    qa('[data-save-state]').forEach(el=>el.textContent=edits ? `${edits} correction${edits===1?'':'s'} in this preview` : 'Changes stay in this preview');
  }
  function paint() {
    qa('[data-time]').forEach(el=>el.textContent=`${format(clock)} / ${format(duration())}`);
    qa('[data-scrub]').forEach(el=>{el.max=String(duration());el.value=String(clock);});
    const value=Math.min(100,clock/duration()*100);
    qa('[data-progress]').forEach(el=>el.style.setProperty('--progress',`${value}%`));
    qa('[data-project-title]').forEach(el=>el.textContent=cuts[cutIndex].title);
    qa('[data-cut]').forEach(el=>{
      const option=cuts[Number(el.dataset.cut)];el.setAttribute('aria-pressed',String(Number(el.dataset.cut)===cutIndex));el.title=option.title;
      const length=option.clips.reduce((sum,[a,b])=>sum+b-a,0);const label=q('[data-cut-duration],small',el);if(label)label.textContent=format(length);
    });
    const pieces=qa('[data-piece]');
    pieces.forEach(el=>{
      const index=Number(el.dataset.piece);const clip=cuts[cutIndex].clips[index];el.hidden=!clip;
      if(clip){el.setAttribute('aria-pressed',String(sourceTime(clock)>=clip[0]&&sourceTime(clock)<=clip[1]));const label=q('[data-piece-time]',el);if(label)label.textContent=`${format(clip[0])}–${format(clip[1])}`;}
    });
    const pieceParent=pieces[0]?.parentElement;if(pieceParent)pieceParent.style.gridTemplateColumns=`repeat(${cuts[cutIndex].clips.length},minmax(0,1fr))`;
    qa('[data-play]').forEach(el=>{el.setAttribute('aria-label',playing?'Pause preview':'Play preview');el.innerHTML=playing?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="3"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7z" fill="currentColor"/></svg>';});
    const previewSource=reviewState ? reviewTime : sourceTime(clock);
    qa('[data-source-time]').forEach(el=>el.textContent=`Source ${format(previewSource)}`);
    const still = previewSource<27 ? 'frame-1.jpg' : previewSource<36 ? 'frame-2.jpg' : 'poster.jpg';
    qa('[data-preview-image]').forEach(el=>{if(!el.src.endsWith(still))el.src=`assets/${still}`;});
    qa('[data-active-caption]').forEach(el=>{
      el.style.fontSize=`clamp(14px,${fontSize/3}cqw,${fontSize*1.15}px)`;el.style.bottom=`${height}%`;
      el.style.background=style==='label'?'var(--demo-accent)':style==='paper'?'#fffaf0e8':'transparent';
      el.style.color=style==='paper'?'#59442e':'#fffef5';
      el.style.textShadow=style==='plain'?'0 1px 4px #705d42':'none';
    });
    syncText();
  }
  function stop() { playing=false;paint(); }
  function seek(time) {
    clock=Math.max(0,Math.min(duration(),time));
    const source=sourceTime(clock);
    active=visible().find(c=>source>=c.start && source<=c.end) || visible().find(c=>c.start>=source) || visible().at(-1);
    paint();
  }
  function chooseCue(id) {
    stop();active=data.segments.find(c=>c.id===Number(id));
    if(!active)return;
    if(reviewState)reviewTime=active.start;
    else clock=reelTime(active.start);
    paint();
  }
  function makeRow(cue) {
    const row=document.createElement('article');row.className='demo-cue';row.dataset.cueIndex=cue.id;
    const button=document.createElement('button');button.type='button';button.className='demo-cue-time';button.textContent=format(cue.start);button.setAttribute('aria-label',`Preview caption at ${format(cue.start)}`);
    button.addEventListener('click',()=>chooseCue(cue.id));
    const input=document.createElement('textarea');input.className='demo-cue-text';input.rows=1;input.value=cue.text;input.spellcheck=true;input.setAttribute('aria-label',`Caption at ${format(cue.start)}`);
    input.addEventListener('focus',()=>{stop();if(active?.id!==cue.id)chooseCue(cue.id);});
    input.addEventListener('input',()=>{cue.text=input.value;active=cue;grow(input);syncText(input);});
    row.append(button,input);return row;
  }
  function grow(input){input.style.height='auto';input.style.height=`${Math.max(36,input.scrollHeight)}px`;}
  function renderCues() {
    qa('[data-cues]').forEach(root=>root.replaceChildren(...visible().map(makeRow)));
    qa('[data-scope]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.scope===scope)));
    qa('[data-caption-count]').forEach(el=>el.textContent=`${visible().length} captions`);
    paint();requestAnimationFrame(()=>{
      qa('.demo-cue-text').forEach(grow);
      qa('[data-cues]').forEach(root=>{
        const row=q('.is-current',root);if(!row)return;
        root.scrollTop+=row.getBoundingClientRect().top-root.getBoundingClientRect().top-root.clientHeight/2+row.clientHeight/2;
      });
    });
  }
  function transcriptRows() {
    const root=q('[data-full-transcript]');if(!root)return;
    const rows=data.segments.filter(c=>c.text.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    root.replaceChildren(...rows.map(makeRow));
    q('[data-search-count]').textContent=`${rows.length} of ${data.segments.length} lines`;
    if(!rows.length){const p=document.createElement('p');p.textContent='No matching lines. Try another word.';root.append(p);}
    syncText();requestAnimationFrame(()=>qa('.demo-cue-text',root).forEach(grow));
  }
  function finishReview() {if(reviewState){clock=reviewState.clock;active=reviewState.active;reviewState=null;paint();}}
  function closeDialog() { const oldDialog=dialog;dialog=null;if(oldDialog?.open)oldDialog.close();oldDialog?.remove();finishReview(); }
  function openPanel(panel) {
    stop();closeDialog();dialog=document.createElement('dialog');dialog.className='demo-dialog';dialog.dataset.panel=panel;
    const openedDialog=dialog;
    if(panel==='transcript'){reviewState={clock,active};reviewTime=active.start;}
    const headings={media:['Your recordings','Load video and captions together, or choose them separately.'],transcript:['Review the full transcript','Correct spelling and grammar, then return to the reel. Select a timestamp to see that line on the preview.'],style:['Caption appearance','Keep the words clear without covering the story.'],assistant:['NebulaOne','Optional help with your hook, your cut, or your next recording.'],export:['Export your reel','Review the captioned cut before you finish.']};
    const [title,description]=headings[panel] || headings.media;
    dialog.innerHTML=`<div class="demo-dialog-head"><div><h2>${title}</h2><p>${description}</p></div><button type="button" class="demo-close" data-close aria-label="Close ${title.toLowerCase()}">×</button></div><div class="demo-dialog-body"></div>`;
    const body=q('.demo-dialog-body',dialog);
    if(panel==='transcript')body.innerHTML=`<div class="demo-review-grid"><div><div class="demo-transcript-search"><input class="demo-text-input" data-search type="search" placeholder="Find a word or phrase" aria-label="Search transcript"><span data-search-count></span></div><div class="demo-transcript-rows" data-full-transcript></div></div><aside class="demo-review-preview"><div class="demo-review-photo"><img data-preview-image src="assets/poster.jpg" alt="Frame from the source recording"><div class="demo-review-caption"></div></div><p><span data-source-time></span><br>IMG_0407.MOV<br>25 minutes, 17 seconds</p></aside></div>`;
    if(panel==='media')body.innerHTML=`<div class="demo-media-item"><img src="assets/poster.jpg" alt="Source recording thumbnail"><div><strong>IMG_0407.MOV</strong><small>25:17 recording<br>Transcript available</small></div></div><div class="demo-media-actions"><button class="demo-button" data-demo-load="video">Load video</button><button class="demo-button" data-demo-load="JSON">Load transcript JSON</button></div><p style="font-size:13px;color:var(--demo-muted)">The footage and transcript in these previews stay on this computer.</p>`;
    if(panel==='style')body.innerHTML=`<div class="demo-style-presets"><button class="demo-style-choice" data-style="plain">Plain type</button><button class="demo-style-choice" data-style="label">Olive label</button><button class="demo-style-choice" data-style="paper">Paper label</button></div><div class="demo-style-row"><label for="demo-size">Type size</label><input id="demo-size" type="range" min="18" max="34" value="${fontSize}" data-font-size><output>${fontSize}px</output></div><div class="demo-style-row"><label for="demo-height">Position</label><input id="demo-height" type="range" min="10" max="45" value="${height}" data-caption-height><output>${height}%</output></div>`;
    if(panel==='assistant')body.innerHTML=`<div class="demo-assistant-space"><svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M14 32V11h21v24H18l-8 6V32z" stroke="currentColor" stroke-width="2"/><path d="M21 19h9M21 25h6" stroke="currentColor" stroke-width="2"/></svg><h3>Give the story a second pair of eyes.</h3><p>Ask for a stronger opening, find a new angle, or plan what to record next.</p><ul class="demo-assistant-prompts"><li>Find a hook</li><li>Shape a cut</li><li>Plan a recording</li></ul><a class="demo-button" href="https://cs.nebulaone.ai/public-chat/orchestr8/true" target="_blank" rel="noopener noreferrer">Open NebulaOne</a><p>The panel shows its proposed position. The live assistant opens separately during design review.</p></div>`;
    if(panel==='export')body.innerHTML=`<div class="demo-export-summary"><img src="assets/poster.jpg" alt="Selected reel poster"><div><h3>${cuts[cutIndex].title}</h3><p>${format(duration())} reel / Vertical 9:16<br>Captions and original audio</p></div></div><div class="demo-export-field"><span>Output size</span><select aria-label="Output size"><option>1080 × 1920</option><option>720 × 1280</option></select></div><label class="demo-export-field"><span>Include captions</span><input type="checkbox" checked></label><p style="font-size:13px;color:var(--demo-muted)">This is the proposed export flow. These design previews do not render or download a video.</p>`;
    const foot=document.createElement('div');foot.className='demo-dialog-foot';
    foot.innerHTML=panel==='export'?'<small>Design preview</small><button class="demo-button primary" data-close>Return to editing</button>':panel==='transcript'?'<small>Edits stay in this preview. Original files are unchanged.</small><button class="demo-button primary" data-close>Done reviewing</button>':'<small>Interactive design preview</small><button class="demo-button primary" data-close>Done</button>';
    dialog.append(foot);document.body.append(dialog);
    openedDialog.addEventListener('close',event=>{event.currentTarget.remove();if(dialog===openedDialog){dialog=null;finishReview();}});
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();}});
    if(panel==='transcript'){search='';transcriptRows();q('[data-search]',dialog).addEventListener('input',event=>{search=event.target.value;transcriptRows();});}
    if(panel==='style')qa('[data-style]',dialog).forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.style===style)));
    dialog.showModal();paint();requestAnimationFrame(()=>qa('.demo-cue-text',openedDialog).forEach(grow));
  }
  qa('[data-active-caption], [data-current-editor]').forEach(el=>{
    el.addEventListener('focus',stop);
    el.addEventListener('input',()=>{if(active){active.text=el.matches('textarea,input')?el.value:el.textContent;syncText(el);}});
  });
  qa('[data-scrub]').forEach(el=>el.addEventListener('input',()=>{playing=false;seek(Number(el.value));}));
  document.addEventListener('click',event=>{
    const open=event.target.closest('[data-open]');if(open){openPanel(open.dataset.open);return;}
    if(event.target.closest('[data-close]')){closeDialog();return;}
    const cut=event.target.closest('[data-cut]');if(cut){cutIndex=Number(cut.dataset.cut);scope='reel';stop();clock=0;active=visible()[0];renderCues();return;}
    const scopeButton=event.target.closest('[data-scope]');if(scopeButton){scope=scopeButton.dataset.scope;renderCues();return;}
    if(event.target.closest('[data-play]')){if(clock>=duration())clock=0;playing=!playing;priorTick=performance.now();paint();return;}
    if(event.target.closest('[data-prev], [data-next]')){const rows=visible();const index=rows.findIndex(c=>c.id===active?.id);const delta=event.target.closest('[data-next]')?1:-1;chooseCue(rows[Math.max(0,Math.min(rows.length-1,index+delta))].id);return;}
    const jump=event.target.closest('[data-jump]');if(jump){chooseCue(visible()[Number(jump.dataset.jump)]?.id);return;}
    const piece=event.target.closest('[data-piece]');if(piece){const index=Number(piece.dataset.piece);const time=cuts[cutIndex].clips.slice(0,index).reduce((sum,[a,b])=>sum+b-a,0);stop();seek(time+.01);return;}
    const preset=event.target.closest('[data-style]');if(preset){style=preset.dataset.style;qa('[data-style]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.style===style)));paint();return;}
    const load=event.target.closest('[data-demo-load]');if(load){toast(`${load.dataset.demoLoad} loading will be connected after you choose a design.`);}
  });
  document.addEventListener('input',event=>{
    if(event.target.matches('[data-font-size]')){fontSize=Number(event.target.value);event.target.nextElementSibling.textContent=`${fontSize}px`;paint();}
    if(event.target.matches('[data-caption-height]')){height=Number(event.target.value);event.target.nextElementSibling.textContent=`${height}%`;paint();}
  });
  function tick(now){if(playing){clock+=Math.min(.1,(now-priorTick)/1000);if(clock>=duration()){clock=duration();playing=false;}const source=sourceTime(clock);active=visible().find(c=>source>=c.start&&source<c.end)||active;paint();}priorTick=now;requestAnimationFrame(tick);}
  renderCues();requestAnimationFrame(tick);
})().catch(error=>{const el=document.createElement('p');el.className='demo-error';el.setAttribute('role','alert');el.textContent='The sample transcript could not load. Open this preview through the local design gallery.';document.body.append(el);console.error(error);});
