'use strict';

var app = window.RawToReels;

app.state = {
  videoURL: null, videoFile: null, model: null, selected: -1, sourceTime: 0,
  playing: false, exporting: false, raf: 0, originalTexts: [], lastActiveIndex: -1
};
