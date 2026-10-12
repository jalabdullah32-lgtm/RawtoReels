'use strict';

var app = window.RawToReels;
var elements = app.elements;

const DEFAULT_STYLE = Object.freeze({ font: 'system', size: 28, position: 20, color: '#ffffff', outlineColor: '#000000', outline: 3, bgColor: '#000000', bg: 0, uppercase: false });
const STYLE_PRESETS = {
  clean: { font: 'system', size: 28, position: 20, color: '#ffffff', outlineColor: '#000000', outline: 3, bgColor: '#000000', bg: 0, uppercase: false },
  bold: { font: 'impact', size: 35, position: 22, color: '#ffffff', outlineColor: '#000000', outline: 5, bgColor: '#000000', bg: 0, uppercase: true },
  yellow: { font: 'system', size: 30, position: 20, color: '#ffe34f', outlineColor: '#000000', outline: 4, bgColor: '#000000', bg: 0, uppercase: true },
  boxed: { font: 'arial', size: 25, position: 17, color: '#ffffff', outlineColor: '#000000', outline: 0, bgColor: '#000000', bg: 75, uppercase: false }
};
const STYLE_FIELDS = { font: 'cap-font', size: 'cap-size', position: 'cap-position', color: 'cap-color', outlineColor: 'cap-outline-color', outline: 'cap-outline', bgColor: 'cap-bg-color', bg: 'cap-bg', uppercase: 'cap-uppercase' };
app.captionStyle = { ...DEFAULT_STYLE };
app.updateStylePreview = () => {
  const style = app.captionStyle; const base = elements.stage.clientWidth || 360; const scale = base / 360;
  elements.overlay.style.bottom = `${style.position}%`; elements.overlay.style.fontFamily = app.fontFamily(); elements.overlay.style.fontSize = `${style.size * scale}px`;
  const caption = app.$('caption-text'); caption.style.color = style.color; caption.style.webkitTextStroke = `${style.outline * scale}px ${style.outlineColor}`; caption.style.paintOrder = 'stroke fill'; caption.style.background = app.rgba(style.bgColor, style.bg / 100); caption.style.textTransform = style.uppercase ? 'uppercase' : 'none';
  app.$('cap-size-value').textContent = String(style.size); app.$('cap-position-value').textContent = `${style.position}%`; app.$('cap-outline-value').textContent = `${style.outline}px`; app.$('cap-bg-value').textContent = `${style.bg}%`;
  for (const [key, id] of Object.entries(STYLE_FIELDS)) app.$(id)[key === 'uppercase' ? 'checked' : 'value'] = style[key];
  document.querySelectorAll('[data-preset]').forEach((button) => { const preset = STYLE_PRESETS[button.dataset.preset]; const active = Object.keys(preset).every((key) => preset[key] === style[key]); button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
};
for (const [key, id] of Object.entries(STYLE_FIELDS)) app.$(id).addEventListener(key === 'uppercase' ? 'change' : 'input', () => { app.captionStyle[key] = key === 'uppercase' ? app.$(id).checked : ['size','position','outline','bg'].includes(key) ? Number(app.$(id).value) : app.$(id).value; app.updateStylePreview(); });
document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => { app.captionStyle = { ...STYLE_PRESETS[button.dataset.preset] }; app.updateStylePreview(); }));
app.$('reset-style').addEventListener('click', () => { app.captionStyle = { ...DEFAULT_STYLE }; app.updateStylePreview(); });
if ('ResizeObserver' in window) new ResizeObserver(app.updateStylePreview).observe(elements.stage);
window.addEventListener('resize', app.updateStylePreview);
