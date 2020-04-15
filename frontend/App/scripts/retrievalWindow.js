const { remote, ipcRenderer } = require('electron');
const unhandled = require('electron-unhandled');

unhandled();
/* eslint-disable no-undef */
// eslint-disable-next-line no-unused-vars
function sendInfo() {
  const deeplKey = document.getElementById('deepl_key_el').value;
  const saveCheck = document.getElementById('save_check_el').checked;
  if (deeplKey) {
    const mainProcess = remote.require('./main.js');
    mainProcess.setLocalDeeplKey(deeplKey, saveCheck);
  }
}
