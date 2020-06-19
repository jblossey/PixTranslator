/* eslint-disable no-undef */
const {remote} = require('electron');
const unhandled = require('electron-unhandled');
const {sendDebugInfoMail} = require('./scripts/userInteraction');

unhandled({reportButton: error => sendDebugInfoMail(error)});
// eslint-disable-next-line no-unused-vars
function sendInfo() {
	const deeplKey = document.querySelector('#deepl_key_el').value;
	const saveCheck = document.querySelector('#save_check_el').checked;
	if (deeplKey) {
		const mainProcess = remote.require('./main.js');
		mainProcess.setLocalDeeplKey(deeplKey, saveCheck);
	}
}
