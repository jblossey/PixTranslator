const request = require('request');
const jetpack = require('fs-jetpack');
const remote = require('electron').remote;
const storage = require('electron-json-storage');
const main_process = remote.require('./main.js');
const ipc = require('electron').ipcRenderer;

//'27c44ce2-ddbb-47ed-e8c6-1809382b6000';//TODO delete

let char_count, char_lim;

//TODO handle clicks and multi-select
//TODO enable user to delete items

/**
 * Either fetches the Deepl-Key from const DEEPL_KEY_FILE
 * or
 * provokes a form window to be shown for the user to input the key
 */
function getDeeplKey(){
    storage.get('DeeplKey', (error, data) => {
        if (error) throw error;
        if (data) {
            fetchDeeplCharCount(data.deepl_key);
        } else {
            main_process.retrieveDeeplKeyViaWindow();
        }
    });
}

ipc.on('key_ready', (event, message) => {
    deepl_key = message[0];
    if (deepl_key){
        if (message[1]) {
            storage.set('DeeplKey', {deepl_key}, (error) => {
                if (error) throw error;
            });
        }
        fetchDeeplCharCount(deepl_key);
        const retrieval_window = remote.getGlobal('retrievalWindow');
        if (retrieval_window) {retrieval_window.webContents.send('key_ack');}
    }
});

function fetchDeeplCharCount(key){
    if (key === null){
        getDeeplKey();
        return;
    }
    request('https://api.deepl.com/v2/usage?auth_key='+key, function(error, response, body){
        if(!error && response.statusCode == 200){
            const values = JSON.parse(body);
            char_count = values.character_count;
            char_lim = values.character_limit;
        }
        document.getElementById('deepl_character_count').innerHTML = "Characters left on Deepl: "+(char_lim-char_count);
    });
    //return {character_count: char_count, character_limit: char_lim};
}

/**
 * ! The ID of each list element consists of its lastModified-value concatenated with its size - both as strings!
 * @param {event} event The Parameter passed from HTML-ondrop to the script.
 */
// eslint-disable-next-line no-unused-vars

//TODO check each element if jpeg
//TODO fetch keywords and caption for each element and write to fields
function handleDrop(event){
    function createAndAssignInnerHtml(el_type, inner){
        let el = document.createElement(el_type);
        el.innerHTML = inner;
        return el;
    }

    event.preventDefault();
    //hide call, show file-list
    document.getElementById('call_for_drop').style.display = "none";
    document.getElementById('file_list').style.display = "table";
    //add dropped items to list
    var table_body = document.getElementById('table_body');
    var files = event.dataTransfer.files;
    for (var file of files){
        var new_entry = document.createElement('tr');
        new_entry.id = (file.lastModified.toString() + file.size.toString());
        var image_elem = document.createElement('img');
        image_elem.src = file.path;
        var children = [
            createAndAssignInnerHtml('td',file.name),
            createAndAssignInnerHtml('td', 'N/A'),
            document.createElement('td').appendChild(image_elem)
        ];
        for (var child of children){
            new_entry.appendChild(child);
        }
        table_body.appendChild(new_entry);
    }
    /*
    TODO Active beibehalten wenn clicked, rechtsklick, auswahl, mehrfachauswahl und löschen
    var all_entries = document.getElementsByTagName('tr');
    for (entry of all_entries){
        entry.addEventListener('click', )
    }
    */
    //return false;
}

// eslint-disable-next-line no-unused-vars
function allowDrop(event){
    event.preventDefault();
}

function removeFromPictureList(){}

// eslint-disable-next-line no-unused-vars
function showPreExecutionNotice(){
    main_process.showPreExecutionNotice();
}

window.onload = () => {
    fetchDeeplCharCount(null);
}


