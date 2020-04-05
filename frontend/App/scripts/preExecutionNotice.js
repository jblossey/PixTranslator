/* eslint-disable no-unused-vars */
const { remote } = require('electron');

function executeOk() {
  const mainWindow = remote.getGlobal('mainWindow');
  if (mainWindow) {
    mainWindow.webContents.send('startTranslation');
    const selfWindow = remote.getCurrentWindow();
    selfWindow.close();
  }
}

function executeCancel() {
  const selfWindow = remote.getCurrentWindow();
  selfWindow.close();
}
