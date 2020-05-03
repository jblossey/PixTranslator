const test = require('ava');
const {api} = require('electron-util');
const mainWindow = require(`${api.app.getAppPath()}/App/scripts/main_window.js`)

test.todo('fetchDeeplCharCount');
