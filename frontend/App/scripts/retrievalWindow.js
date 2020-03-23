// eslint-disable-next-line no-unused-vars
function sendInfo(){
    const deepl_key = document.getElementById('deepl_key_el').value;
    const save_check = document.getElementById('save_check_el').value;
    if (deepl_key){
        const remote = require('electron').remote;
        var main_window = remote.getGlobal('main_window');
        if (main_window) {
            main_window.webContents.send('key_ready', [deepl_key, save_check]);
        }
        let main_process = remote.require('./main.js');
        main_process.setLocalDeeplKey(deepl_key);
        const ipc = require('electron').ipcRenderer;
        ipc.on('key_ack', () => {
            var self_window = remote.getCurrentWindow();
            self_window.close();
        });
    }
}