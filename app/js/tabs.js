'use strict';

var app = window.RawToReels;

const TABS = ['media', 'captions', 'style', 'assistant'];
const NEBULAONE_URL = 'https://cs.nebulaone.ai/public-chat/orchestr8/true';

function loadAssistant() {
  const host = app.$('assistant-frame');
  if (host.dataset.loaded === 'true') return;
  const frame = document.createElement('iframe');
  frame.title = 'NebulaOne Raw to Reels assistant';
  frame.src = NEBULAONE_URL;
  frame.allow = 'clipboard-read; clipboard-write';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  host.dataset.loaded = 'true';
  host.replaceChildren(frame);
}

app.showTab = (name) => {
  if (!TABS.includes(name)) return;
  app.state.tab = name;
  TABS.forEach((tab) => {
    const chosen = tab === name;
    app.$(`${tab}-tab`).setAttribute('aria-selected', String(chosen));
    app.$(`${tab}-tab`).tabIndex = chosen ? 0 : -1;
    app.$(`${tab}-panel`).hidden = !chosen;
  });
  if (name === 'assistant') loadAssistant();
};

TABS.forEach((name, index) => {
  app.$(`${name}-tab`).addEventListener('click', () => app.showTab(name));
  app.$(`${name}-tab`).addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    app.showTab(TABS[next]);
    app.$(`${TABS[next]}-tab`).focus();
  });
});

app.showTab(app.state.tab);
