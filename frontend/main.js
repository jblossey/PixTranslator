const { app, BrowserWindow, ipcMain } = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
global.main_window = null;
global.retrievalWindow = null;
global.preExecutionNotice = null;
let DEEPL_KEY = null;

function createMainWindow () {
	// Create the browser window.
	global.main_window = new BrowserWindow({
		width: 1240,
		height: 800,
		webPreferences: {
		nodeIntegration: true
		},
		'min-width': 500,
		'min-height': 200,
		'accept-first-mouse': true,
		'title-bar-style': 'hidden'
	})

	global.main_window.removeMenu()

	// and load the index.html of the app.
	global.main_window.loadFile('./App/index.html')

	// Open the DevTools.
	//global.main_window.webContents.openDevTools()

	// Emitted when the window is closed.
	global.main_window.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		global.main_window = null
	})
}

exports.retrieveDeeplKeyViaWindow = () => {
	global.retrievalWindow = new BrowserWindow({
		parent: global.main_window,
		modal: true,
		width: 600,
		height: 200,
		center:true,
		webPreferences: {
			nodeIntegration: true
		},
		resizable:false,
		movable:false,
		minimizable:false,
		maximizable:false,
		titleBarStyle: "hidden"
	});
	//global.retrievalWindow.webContents.openDevTools();
	global.retrievalWindow.removeMenu();
	global.retrievalWindow.loadFile('./App/retrievalWindow.html');
	global.retrievalWindow.on('closed', () => {
		if(!DEEPL_KEY) app.quit();
		global.retrievalWindow = null;
	});
}

exports.setLocalDeeplKey = (key) => {
	DEEPL_KEY = key;
}

exports.showPreExecutionNotice = () => {
	global.preExecutionNotice = new BrowserWindow({
		parent: global.main_window,
		modal: true,
		width: 600,
		height: 350,
		center:true,
		webPreferences: {
			nodeIntegration: true
		},
		resizable:false,
		movable:false,
		minimizable:false,
		maximizable:false,
		titleBarStyle: "hidden"
	});
	//global.preExecutionNotice.webContents.openDevTools();
	global.preExecutionNotice.removeMenu();
	global.preExecutionNotice.loadFile('./App/preExecutionNotice.html');
	global.preExecutionNotice.on('closed', () => {
		global.retrievalWindow = null;
	});
}

exports.startTranslationRoutine = () => {}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	createMainWindow();
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (global.main_window === null) {
		createMainWindow()
	}
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
