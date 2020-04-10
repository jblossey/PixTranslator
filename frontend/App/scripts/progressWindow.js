/* eslint-disable no-plusplus */
// eslint-disable-next-line no-unused-vars
const { ipcRenderer } = require('electron');
const $ = require('jquery');
const unhandled = require('electron-unhandled');

unhandled();

let currentProgress = 0;
let totalProgress;

/**
 * totalProgress is 4 times totalPicnumber (dbtranslate, deepltranslate, writing, rereading)
 * @param {*} totalPicNumber 
 */
const assignTotalProgress = (totalPicNumber) => { totalProgress = totalPicNumber * 4; };

ipcRenderer.on('initProgressbar', (event, message) => {
  assignTotalProgress(message[0]);
});

// TODO display step currently being worked on below progress bar, get current working step via ipc -> add parameters to call!
ipcRenderer.on('progressStep', () => {
  currentProgress++;
  const valueField = $('#valueField');
  const progressInPercent = currentProgress / totalProgress;
  const progressBarValue = progressInPercent < 0.5
    ? Math.ceil(progressInPercent)
    // eslint-disable-next-line no-bitwise
    : ~~progressInPercent;
  valueField.css('width', `${progressBarValue}%`);
  valueField.text(`${progressBarValue}% Completed`);
});
