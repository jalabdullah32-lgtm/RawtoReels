'use strict';

var app = window.RawToReels;

app.state = {
  videoURL: null, videoFile: null, revokeVideoURL: false, model: null, selected: -1, sourceTime: 0,
  playing: false, exporting: false, raf: 0, originalTexts: [], originalMarks: [], lastActiveIndex: -1,
  tab: 'captions', activeCueIndex: -1, replayEnd: null, history: [], selection: null
};
