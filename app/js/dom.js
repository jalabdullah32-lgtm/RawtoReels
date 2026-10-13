'use strict';

window.RawToReels = window.RawToReels || {};
var app = window.RawToReels;

app.$ = (id) => document.getElementById(id);
app.elements = {
  video: app.$('video'), stage: app.$('stage'), scrub: app.$('scrub'),
  overlay: app.$('overlay'), editor: app.$('editor'), status: app.$('status'),
  timeline: app.$('clip-timeline'), timelineList: app.$('clip-timeline-list')
};
