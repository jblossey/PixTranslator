/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-template */
const { remote, ipcRenderer } = require('electron');
const needle = require('needle');
const storage = require('electron-json-storage');
const $ = require('jquery');
const Promise = require('promise');
// eslint-disable-next-line import/no-unresolved
const metadatahandlerStub = require('./scripts/metadatahandlerStub');

const mainProcess = remote.require('./main.js');

// '27c44ce2-ddbb-47ed-e8c6-1809382b6000';// TODO delete

let charCount;
let charLim;

// TODO handle clicks and multi-select
// TODO enable user to delete items

function fetchDeeplCharCount(key) {
  if (key === null) {
    // eslint-disable-next-line no-use-before-define
    getDeeplKey();
    return;
  }
  needle.get('https://api.deepl.com/v2/usage?auth_key=' + key, (error, response) => {
    if (!error && response.statusCode === 200) {
      charCount = response.body.character_count;
      charLim = response.body.character_limit;
    }
    // eslint-disable-next-line no-undef
    $('#deepl_character_count').text('Characters left on Deepl: ' + (charLim - charCount));
  });
  // return {character_count: charCount, character_limit: charLim};
}

/**
 * Either fetches the Deepl-Key from const deeplKey_FILE
 * or
 * provokes a form window to be shown for the user to input the key
 */
function getDeeplKey() {
  storage.get('deeplKey', (error, data) => {
    if (error) throw error;
    if (data.deeplKey) {
      fetchDeeplCharCount(data.deeplKey);
    } else {
      mainProcess.retrieveDeeplKeyViaWindow();
    }
  });
}

ipcRenderer.on('key_ready', (event, message) => {
  const deeplKey = message[0];
  if (deeplKey) {
    if (message[1]) {
      storage.set('deeplKey', { deeplKey }, (error) => {
        if (error) throw error;
      });
    }
    fetchDeeplCharCount(deeplKey);
    mainProcess.closeRetrievalWindow();
  }
});

/**
 * ! The ID of each list element consists of its lastModified-value concatenated with its size
 * ! - both as strings!
 * @param {event} event The Parameter passed from HTML-ondrop to the script.
 */
// eslint-disable-next-line no-unused-vars

// TODO check each element if jpeg
// TODO fetch keywords and caption for each element and write to fields
// TODO rewrite function in proper jQuery
// eslint-disable-next-line no-unused-vars
function handleDrop(event) {
  function createAndAssignInnerHtml(elType, inner) {
    // eslint-disable-next-line no-undef
    const el = document.createElement(elType);
    el.innerHTML = inner;
    return el;
  }

  event.preventDefault();
  // hide call, show file-list
  $('#call_for_drop').css('display', 'none');
  $('#file_list').css('display', 'table');
  // add dropped items to list
  const tableBody = $('#tableBody');
  const { files } = event.dataTransfer;
  let children = [];
  for (const file of files) {
    // TODO: make sure keysAndCaps is not used before it is assigned.
    // eslint-disable-next-line no-loop-func
    const reqKeyNCap = Promise.denodeify(metadatahandlerStub.requestKeywordsAndCaption);

    metadatahandlerStub.requestKeywordsAndCaption(file.path, (keysAndCaps) => {
      console.log(keysAndCaps);
      // eslint-disable-next-line no-undef
      const newEntry = document.createElement('tr');
      newEntry.id = (file.lastModified.toString() + file.size.toString());
      // eslint-disable-next-line no-undef
      const imageElem = document.createElement('img');
      imageElem.src = file.path;
      children = [
        createAndAssignInnerHtml('td', file.name),
        createAndAssignInnerHtml('td', keysAndCaps.caption),
        createAndAssignInnerHtml('td', keysAndCaps.keywords),
        createAndAssignInnerHtml('td', metadatahandlerStub.countKeysAndCapChars(keysAndCaps)),
        // eslint-disable-next-line no-undef
        document.createElement('td').appendChild(imageElem),
      ];
      for (const child of children) {
        newEntry.appendChild(child);
      }
      tableBody.append(newEntry);
    });
  }
}

// eslint-disable-next-line no-unused-vars
function allowDrop(event) {
  event.preventDefault();
}

// eslint-disable-next-line no-unused-vars
function removeFromPictureList() {}

// eslint-disable-next-line no-unused-vars
function showPreExecutionNotice() {
  mainProcess.showPreExecutionNotice();
}

// eslint-disable-next-line no-undef
window.onload = () => {
  fetchDeeplCharCount(null);
};
