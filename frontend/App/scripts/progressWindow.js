/* eslint-disable prefer-template */
/* eslint-disable no-plusplus */
// eslint-disable-next-line no-unused-vars
const siimple = require('siimple');
const { ipcRenderer } = require('electron');
const $ = require('jquery');

let currentProgress = 0;
let totalProgress;

const assignTotalProgress = (totalPicNumber) => { totalProgress = totalPicNumber * 5; };

ipcRenderer.on('initProgressbar', (event, message) => {
  assignTotalProgress(message[0]);
});

// TODO display step currently being worked on below progress bar, get current working step via ipc -> add parameters to call!
ipcRenderer.on('progressStep', () => {
  currentProgress++;
  const valueField = $('#valueField');
  const progressBarValue = Math.ceil(currentProgress / totalProgress);
  valueField.css('width', progressBarValue + '%');
  valueField.text(progressBarValue + '% Completed');
});
