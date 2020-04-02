/* eslint-disable no-console */
/* eslint-disable prefer-template */
const { app, BrowserWindow } = require('electron');
const requestPromise = require('minimal-request-promise');
const unhandled = require('electron-unhandled');
let serverProcess = require('child_process');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
global.mainWindow = null;
global.retrievalWindow = null;
global.preExecutionNotice = null;
let DEEPL_KEY = null;

// enable user-friendly handling of unhandled errors
unhandled();
// TODO Add electron "about this app"-window -> see https://github.com/rhysd/electron-about-window
// TODO Replace ipc communication with electron router -> see https://github.com/m0n0l0c0/electron-router

// Check operating system
const platform = process;
if (platform === 'win32') {
  serverProcess.spawn('cmd.exe', ['/c', 'metadatahandler-0.1.0.exe'],
    {
      cwd: app.getAppPath() + '/bin',
    });
} else {
  serverProcess.spawn(app.getAppPath() + '/bin/metadatahandler-0.1.0.jar');
}

const metadatahandlerUrl = 'http://localhost:4711';

const startGui = function createMainWindow() {
  // Create the browser window.
  global.mainWindow = new BrowserWindow({
    width: 1240,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
    'min-width': 500,
    'min-height': 200,
    'accept-first-mouse': true,
    'title-bar-style': 'hidden',
  });

  global.mainWindow.removeMenu();

  // and load the index.html of the app.
  global.mainWindow.loadFile('./App/index.html');

  // Open the DevTools.
  // global.mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  global.mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    global.mainWindow = null;
    global.preExecutionNotice = null;
    global.retrievalWindow = null;
  });
};

exports.retrieveDeeplKeyViaWindow = function startRetrieveWindows() {
  global.retrievalWindow = new BrowserWindow({
    parent: global.mainWindow,
    modal: true,
    width: 600,
    height: 200,
    center: true,
    webPreferences: {
      nodeIntegration: true,
    },
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    titleBarStyle: 'hidden',
  });
  // global.retrievalWindow.webContents.openDevTools();
  global.retrievalWindow.removeMenu();
  global.retrievalWindow.loadFile('./App/retrievalWindow.html');
  global.retrievalWindow.on('closed', () => {
    if (!DEEPL_KEY) app.quit();
    global.retrievalWindow = null;
  });
};

exports.closeRetrievalWindow = () => {
  global.retrievalWindow.close();
};

exports.setLocalDeeplKey = (key) => {
  DEEPL_KEY = key;
};

exports.showPreExecutionNotice = () => {
  global.preExecutionNotice = new BrowserWindow({
    parent: global.mainWindow,
    modal: true,
    width: 600,
    height: 350,
    center: true,
    webPreferences: {
      nodeIntegration: true,
    },
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    titleBarStyle: 'hidden',
  });
  // global.preExecutionNotice.webContents.openDevTools();
  global.preExecutionNotice.removeMenu();
  global.preExecutionNotice.loadFile('./App/preExecutionNotice.html');
  global.preExecutionNotice.on('closed', () => {
    global.retrievalWindow = null;
  });
};

exports.startTranslationRoutine = () => {

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  requestPromise.get(metadatahandlerUrl + '/actuator/health').then((response) => {
    const answer = JSON.parse(response.body);
    if (answer.status === 'UP') {
      console.log('Server started!');
      startGui();
    }
  // eslint-disable-next-line no-unused-vars
  }, (response) => {
    console.log('Waiting for the server start...');
    setTimeout(() => {
      startGui();
    }, 200);
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
// On macOS it is common for applications and their menu bar
// to stay active until the user quits explicitly with Cmd + Q
  // eslint-disable-next-line no-unused-vars
  requestPromise.post(metadatahandlerUrl + '/actuator/shutdown').then((response) => {
    console.log('Stop signal sent to metadatahandler.');
    serverProcess = null;
  });
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
  if (global.mainWindow === null) {
    startGui();
  }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
