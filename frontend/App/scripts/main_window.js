/* eslint-disable no-loop-func */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-template */
const { remote, ipcRenderer } = require('electron');
const needle = require('needle');
const storage = require('electron-json-storage');
const $ = require('jquery');
// eslint-disable-next-line import/no-unresolved
const metadatahandlerStub = require('./scripts/metadatahandlerStub');

const mainProcess = remote.require('./main.js');

// '27c44ce2-ddbb-47ed-e8c6-1809382b6000';// TODO delete

let charCount;
let charLim;

// TODO handle clicks and multi-select

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
// eslint-disable-next-line no-unused-vars
function handleDrop(event) {
  function createAndAssignInnerHtml(elType, inner) {
    // eslint-disable-next-line no-undef
    const el = document.createElement(elType);
    el.innerHTML = inner;
    return el;
  }

  event.preventDefault();
  // do nothing if metadatahandler is not ready
  if ($('#metadatahandler_status').css('color') !== 'rgb(0, 255, 0)') return;
  // hide call, show file-list
  $('#call_for_drop').css('display', 'none');
  $('#file_list').css('display', 'table');
  // add dropped items to list
  const tableBody = $('tbody');
  const { files } = event.dataTransfer;
  let children = [];
  for (const file of files) {
    metadatahandlerStub.requestKeywordsAndCaption(file.path).then((keysAndCaps) => {
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
function removeAllItemsFromTable() {
  $('#table_body').empty();
  $('#file_list').css('display', 'none');
  $('#call_for_drop').css('display', 'initial');
}

// eslint-disable-next-line no-unused-vars
function showPreExecutionNotice() {
  mainProcess.showPreExecutionNotice();
}

const checkMetadatahandlerHealth = () => {
  needle.get('http://localhost:4711/actuator/health', (err, response) => {
    if (err || response.statusCode !== 200) {
      $('#metadatahandler_status').css('color', 'red');
    } else {
      $('#metadatahandler_status').css('color', 'lime');
    }
  });
};

/**
 * Bundled place for all regularly occuring checks, routines, etc.
 */
const intervalFunctions = () => {
  setInterval(() => { checkMetadatahandlerHealth(); }, 10000);
};

// eslint-disable-next-line no-undef
window.onload = () => {
  fetchDeeplCharCount(null);
  checkMetadatahandlerHealth();
  setTimeout(() => { intervalFunctions(); }, 5000);
};
