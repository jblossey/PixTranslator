/* eslint-disable no-unused-vars */
const { remote } = require('electron');

const mainProcess = remote.require('./main.js');

function executeOk() {
  mainProcess.startTranslationRoutine();
  const selfWindow = remote.getCurrentWindow();
  selfWindow.close();
}

function executeCancel() {
  const selfWindow = remote.getCurrentWindow();
  selfWindow.close();
}
