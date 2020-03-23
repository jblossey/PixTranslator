/* eslint-disable no-unused-vars */
const remote = require('electron').remote;
const main_process = remote.require('./main.js');

function executeOk(){
    main_process.startTranslationRoutine();
    var self_window = remote.getCurrentWindow();
    self_window.close();
}

function executeCancel(){
    var self_window = remote.getCurrentWindow();
    self_window.close();
}