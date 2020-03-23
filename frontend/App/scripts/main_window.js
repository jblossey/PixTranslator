const request = require('request');
const jetpack = require('fs-jetpack');
const remote = require('electron').remote;
const main_process = remote.require('./main.js');
const ipc = require('electron').ipcRenderer;

let DEEPL_KEY = null;//'27c44ce2-ddbb-47ed-e8c6-1809382b6000';//TODO Assign null on publish
let DEEPL_KEY_FILE = 'translation_access.dat';
let CWD = null;//'C:/Users/janni/Desktop/iptc_translator/photon_GUI'//TODO assign null on publish, specify path on debugging

let char_count, char_lim;

/**
 * Either fetches the Deepl-Key from const DEEPL_KEY_FILE
 * or
 * provokes a form window to be shown for the user to input the key
 */
function getDeeplKey(){
    var read_data;
    if ( (read_data = jetpack.read('./'+DEEPL_KEY_FILE, 'utf8')) ){
        DEEPL_KEY = read_data;
        fetchDeeplCharCount(DEEPL_KEY);
    }
    else{
        main_process.retrieveDeeplKeyViaWindow();
        //fetchDeeplCharCount call is done by ipc from retrieval_window
    }
}

ipc.on('key_ready', (event, message) => {
    DEEPL_KEY = message[0];
    if (DEEPL_KEY){
        jetpack.write('./'+DEEPL_KEY_FILE, DEEPL_KEY);
        fetchDeeplCharCount(DEEPL_KEY);
        const retrieval_window = remote.getGlobal('retrievalWindow');
        if (retrieval_window) {retrieval_window.webContents.send('key_ack');}
    }
});

function fetchDeeplCharCount(key){
    //global variabel DEEPL_KEY can be set for convenience during dev
    //in every user-case it should be null
    if (key == null){
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
 * TODO Check each Element if it is really a JPG -> Open New Window and Communicate to user if one or more elements are not JPEG
 * @param {event} event The Parameter passed from HTML-ondrop to the script.
 */
// eslint-disable-next-line no-unused-vars
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
    if (!CWD) CWD = process.cwd();
    fetchDeeplCharCount(DEEPL_KEY);
}


