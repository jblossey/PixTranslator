/* eslint-disable no-plusplus */
/* eslint-disable no-console */
const { app, BrowserWindow, dialog } = require('electron');
const requestPromise = require('minimal-request-promise');
const unhandled = require('electron-unhandled');
const ProgressBar = require('electron-progressbar');
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

const backendUrls = {
  metadatahandler: 'http://localhost:4711',
  databasehandler: 'http://localhost:4712',
};

const spawnBackendServices = () => {
  const backendBinaries = [
    'metadatahandler-0.1.0',
    'databasehandler-0.1.0',
  ];

  // Check operating system
  const platform = process;
  backendBinaries.forEach((binary) => {
    if (platform === 'win32') {
      serverProcess.spawn('cmd.exe', ['/c', `${binary}.exe`],
        {
          cwd: `${app.getAppPath()}/bin`,
        });
    } else {
      serverProcess.spawn(`${app.getAppPath()}/bin/${binary}.jar`);
    }
  });
};

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
    global.preExecutionNotice = null;
  });
};

exports.showProgressWindow = (totalPicCount) => {
  global.progressCounter = 0;
  global.progressBarWindow = new ProgressBar({
    browserwindow: {
      indeterminate: false,
      parent: global.mainWindow,
      modal: true,
      resizable: false,
      closable: false,
      minimizable: false,
      maximizable: false,
      width: 500,
      height: 170,
      webPreferences: {
        nodeIntegration: true,
      },
      maxValue: totalPicCount * 4, // 4 times totalPicnumber (dbtranslate, deepltranslate, writing, rereading)
      value: 0,
      title: 'Translating...',
      text: 'Preparing data...',
    },
  });
  global.progressBarWindow
    .on('completed', () => {
      dialog.showMessageBoxSync(global.progressBarWindow, {
        type: 'info',
        title: 'Task complete',
        message: 'Translation done.',
      }, () => {
        global.progressBarWindow.close();
      });
    })
    .on('aborted', (value) => {
      console.info(`aborted... ${value}`);
    })
    .on('progress', (value) => {
      // global.progressBarWindow.detail = `Value ${value} out of ${global.progressBarWindow.getOptions().maxValue}...`;
    });
};

exports.progressStep = () => {
  global.progressCounter++;
  const progressInPercent = global.progressCounter / global.progressBarWindow.getOptions().maxValue;
  global.progressBarWindow.value = progressInPercent < 0.5
    ? Math.ceil(progressInPercent * 100)
    : Math.floor(progressInPercent * 100);
};

exports.showCompletedWindow = () => {
  global.progressBarWindow.setCompleted();
  global.progressBarWindow = null;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  spawnBackendServices();
  startGui();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // Send shutdown request to all backend services
  Object.keys(backendUrls).forEach(async (key) => {
    requestPromise.post(`${backendUrls[key]}/actuator/shutdown`);
  });
  serverProcess = null;
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
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
