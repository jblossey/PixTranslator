/* eslint-disable no-continue */
/* eslint-disable no-cond-assign */
/* eslint-disable no-plusplus */
/* eslint-disable no-loop-func */
/* eslint-disable no-restricted-syntax */
const { remote, ipcRenderer } = require('electron');
const needle = require('needle');
const storage = require('electron-json-storage');
const $ = require('jquery');
const unhandled = require('electron-unhandled');
// eslint-disable-next-line import/no-unresolved
const metadatahandlerStub = require('./scripts/metadatahandlerStub');
// eslint-disable-next-line import/no-unresolved
const translator = require('./scripts/translationRoutine');

const mainProcess = remote.require('./main.js');

// '27c44ce2-ddbb-47ed-e8c6-1809382b6000';// TODO delete

let picCollectionArray = [];

let charCount;
let charLim;

unhandled();

// TODO handle clicks and multi-select

function fetchDeeplCharCount(key) {
  if (key === null) {
    // eslint-disable-next-line no-use-before-define
    getDeeplKey();
    return;
  }
  needle.get(encodeURI(`https://api.deepl.com/v2/usage?auth_key=${key}`), (error, response) => {
    if (!error && response.statusCode === 200) {
      charCount = response.body.character_count;
      charLim = response.body.character_limit;
    }
    // eslint-disable-next-line no-undef
    $('#deepl_character_count').text(`Characters left on Deepl: ${charLim - charCount}`);
  });
  // return {character_count: charCount, character_limit: charLim};
}

/**
 * Either fetches the Deepl-Key from const deeplKey_FILE
 * or
 * provokes a form window to be shown for the user to input the key
 */
async function getDeeplKey() {
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
  let totalCharCount = 0;
  for (const file of files) {
    // eslint-disable-next-line no-undef
    if (document.getElementById(file.path.replace(/\s/g, ''))) continue; // skip if element already exists
    metadatahandlerStub.requestKeywordsAndCaption(file.path).then((keysAndCaps) => {
      const currentPicCollection = new translator.PicCollection(
        file.path,
        keysAndCaps.keywords,
        keysAndCaps.caption,
      );
      picCollectionArray.push(currentPicCollection);
      const currentCharCount = metadatahandlerStub.countKeysAndCapChars(keysAndCaps);
      // eslint-disable-next-line no-undef
      const newEntry = document.createElement('tr');
      newEntry.id = file.path.replace(/\s/g, '');
      // eslint-disable-next-line no-undef
      const imageElem = document.createElement('img');
      imageElem.src = file.path;
      totalCharCount += currentCharCount;
      children = [
        createAndAssignInnerHtml('td', file.name),
        createAndAssignInnerHtml('td', currentPicCollection.caption),
        createAndAssignInnerHtml('td', currentPicCollection.keywords),
        createAndAssignInnerHtml('td', currentCharCount),
        // eslint-disable-next-line no-undef
        document.createElement('td').appendChild(imageElem),
      ];
      for (const child of children) {
        newEntry.appendChild(child);
      }
      tableBody.append(newEntry);
      $('#picture_character_count').text(`Characters in Pictures: ${totalCharCount}`);
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
  picCollectionArray = [];
}

// eslint-disable-next-line no-unused-vars
function showPreExecutionNotice() {
  mainProcess.showPreExecutionNotice();
}

// eslint-disable-next-line no-unused-vars
ipcRenderer.on('startTranslation', (event) => {
  storage.get('deeplKey', async (error, data) => {
    if (error) throw error;
    if (data.deeplKey) {
      const { deeplKey } = data;
      mainProcess.showProgressWindow();
      const progressWindow = remote.getGlobal('progressWindow');
      // eslint-disable-next-line no-undef
      const totalPicNumber = document.getElementById('table_body').rows.length;
      if (progressWindow) progressWindow.webContents.send('initProgressbar', [totalPicNumber]);
      picCollectionArray = await translator.getDbTranslationsForMany(picCollectionArray);
      picCollectionArray = await translator.getDeeplTranslationsForMany(
        picCollectionArray,
        deeplKey,
      );
      await Promise.all([
        metadatahandlerStub.writeKeywordsAndCaptionForMany(picCollectionArray),
        // updateDatabase is allowed to fail
        metadatahandlerStub.updateDatabaseForMany(picCollectionArray).catch((err) => err),
      ]);
    } else {
      mainProcess.retrieveDeeplKeyViaWindow();
    }
  });
});

const checkServiceHealth = (service, port) => {
  needle.get(`http://localhost:${port}/actuator/health`, (err, response) => {
    if (err || response.statusCode !== 200) {
      $(`#${service}_status`).css('color', 'red');
    } else {
      $(`#${service}_status`).css('color', 'lime');
    }
  });
};

/**
 * Bundled place for all regularly occuring checks, routines, etc.
 */
const intervalFunctions = () => {
  setInterval(() => { checkServiceHealth('metadatahandler', 4711); }, 10000);
  setInterval(() => { checkServiceHealth('databasehandler', 4712); }, 10000);
};

const initIntervals = () => {
  checkServiceHealth('metadatahandler', 4711);
  checkServiceHealth('databasehandler', 4712);
  intervalFunctions();
};

// eslint-disable-next-line no-undef
window.onload = () => {
  fetchDeeplCharCount(null);
  setTimeout(() => { initIntervals(); }, 5000);
};
