/* eslint-disable no-bitwise */
/* eslint-disable no-plusplus */
/* eslint-disable no-console */
const {
  app, BrowserWindow, dialog, ipcMain,
// electron must be listed in dev dependencies for electronbuilder reasons
// eslint-disable-next-line import/no-extraneous-dependencies
} = require('electron');
const needle = require('needle');
const unhandled = require('electron-unhandled');
const ProgressBar = require('electron-progressbar');
let serverProcess = require('child_process');
const { autoUpdater } = require('electron-updater');
const { fixPathForAsarUnpack } = require('electron-util');
const openAboutWindow = require('about-window').default;
const { sendDebugInfoMail } = require('./App/scripts/userInteraction');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let retrievalWindow;
let progressBarWindow;
let DEEPL_KEY = null;

// enable user-friendly handling of unhandled errors
unhandled({reportButton: error => sendDebugInfoMail(error)});

// TODO Replace ipc communication with electron router -> see https://github.com/m0n0l0c0/electron-router

const backendUrls = {
  metadatahandler: 'http://localhost:4711',
  databasehandler: 'http://localhost:4712',
};

const backendProcesses = [];

const spawnBackendServices = () => {
  const backendBinaries = [
    'metadatahandler-0.1.0',
    'databasehandler-0.1.0',
  ];
  // Check operating system
  const { platform } = process;
  backendBinaries.forEach((binary) => {
    const servicePath = fixPathForAsarUnpack(`${app.getAppPath()}/${binary}`);
    let childProcess;
    if (platform === 'win32') {
      childProcess = serverProcess.execFile(`${servicePath}.exe`, {
        cwd: fixPathForAsarUnpack(`${app.getAppPath()}`),
      }, (err, stdout, stderr) => {
        if (err) throw err;
        console.info(stdout);
      });
    } else {
      childProcess = serverProcess.execFile(`${servicePath}.jar`, {
        cwd: fixPathForAsarUnpack(`${app.getAppPath()}`),
      }, (err, stdout, stderr) => {
        if (err) throw err;
        console.info(stdout);
      });
    }
    backendProcesses.push(childProcess);
  });
};

const startGui = function createMainWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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

  mainWindow.removeMenu();

  // and load the index.html of the app.
  mainWindow.loadFile('./App/index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Send shutdown signal to all backend services
    backendProcesses.forEach((child) => {
      const success = child.kill('SIGTERM');
      if (success) {
        child = null;
      } else {
        throw Error(`${child} could not be terminated.`);
      }
    });
    serverProcess = null;
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    retrievalWindow = null;
  });
};

exports.retrieveDeeplKeyViaWindow = function startRetrieveWindows() {
  retrievalWindow = new BrowserWindow({
    parent: mainWindow,
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
  // retrievalWindow.webContents.openDevTools();
  retrievalWindow.removeMenu();
  retrievalWindow.loadFile('./App/retrievalWindow.html');
  retrievalWindow.on('closed', () => {
    if (!DEEPL_KEY) app.quit();
    retrievalWindow = null;
  });
};

exports.closeRetrievalWindow = () => {
  retrievalWindow.close();
};

exports.setLocalDeeplKey = (key, saveCheck) => {
  DEEPL_KEY = key;
  mainWindow.webContents.send('key_ready', [key, saveCheck]);
};

exports.showPreExecutionNotice = () => dialog.showMessageBoxSync(mainWindow, {
  type: 'question',
  buttons: [
    'I execute this program at my own risk.',
    'Better not risk it.',
  ],
  defaultId: 1,
  title: 'Are you sure?',
  message: `
  This program works on your files in binary.
  Changes made can not be reverted so you better only let this program work on copies of your pictures.
  The author of this program by no means guarantees that every operation will work out as expected.
  For further information on warranty etc. please refer to the MIT License under which this program is published.
  `,
  cancelId: 1,
});

exports.showAboutWindow = () => {
  openAboutWindow({
    icon_path: `${__dirname}/icon.png`,
    package_json_dir: __dirname,
    //open_devtools: process.env.NODE_ENV !== 'production',
  });
};

function showProgressWindow(totalPicCount) {
  if (progressBarWindow) return;
  global.progressCounter = 0;
  // 4 times totalPicnumber (dbtranslate, deepltranslate, writing, rereading)
  global.progressTotal = totalPicCount * 4;
  progressBarWindow = new ProgressBar({
    indeterminate: false,
    browserWindow: {
      parent: mainWindow,
      text: 'Preparing data...',
      webPreferences: {
        nodeIntegration: true,
      },
    },
  });
  progressBarWindow
    .on('completed', () => {
      progressBarWindow.close();
    })
    .on('aborted', (value) => {
      console.info(`aborted... ${value}`);
    })
    .on('progress', (value) => {
      progressBarWindow.text = `Value ${value} out of ${progressBarWindow.getOptions().maxValue}...`;
    });
}

function progressStep() {
  if (progressBarWindow) {
    global.progressCounter++;
    const progressInPercent = global.progressCounter / global.progressTotal;
    progressBarWindow.value = progressInPercent < 0.5
      ? Math.ceil(progressInPercent * 100)
      : Math.floor(progressInPercent * 100);
  }
}

exports.showCompletedWindow = () => {
  if (progressBarWindow) {
    progressBarWindow.setCompleted();
  }
  dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    title: 'Task complete',
    message: 'Translation done.',
    buttons: ['OK'],
    normalizeAccessKeys: true,
  });
  progressBarWindow = null;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
  spawnBackendServices();
  startGui();
  ipcMain.on('showProgressWindow', (event, message) => showProgressWindow(message));
  ipcMain.on('progressStep', progressStep);
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    startGui();
  }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
