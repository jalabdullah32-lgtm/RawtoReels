'use strict';

var app = window.RawToReels;

app.formatTime = (time) => `${Math.floor(time / 60)}:${(time % 60).toFixed(2).padStart(5, '0')}`;
app.formatClock = (time) => `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(Math.floor(time % 60)).padStart(2, '0')}`;
app.validTime = (time) => typeof time === 'number' && Number.isFinite(time) && time >= 0;
app.rgba = (hex, alpha) => {
  const value = hex.replace('#', '');
  const parts = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
  return `rgba(${parts.join(',')},${alpha})`;
};
app.fontFamily = () => ({
  system: 'system-ui, sans-serif', arial: 'Arial, sans-serif',
  impact: 'Impact, "Arial Narrow", sans-serif', georgia: 'Georgia, serif'
})[app.captionStyle.font] || 'system-ui, sans-serif';
