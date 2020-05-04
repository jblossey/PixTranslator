/* eslint-disable no-cond-assign */
const {remote, ipcRenderer} = require('electron');
const needle = require('needle');
const storage = require('electron-json-storage');
const $ = require('jquery');
const {is} = require('electron-util');
const unhandled = require('electron-unhandled');
const metadatahandlerStub = require('./scripts/metadatahandler-stub');
const translator = require('./scripts/translation-routine');
const {sendDebugInfoMail} = require('./scripts/user-interaction');

const mainProcess = remote.require('./main.js');

let picCollectionArray = [];

let charCount;
let charLim;

unhandled({reportButton: error => sendDebugInfoMail(error)});

// eslint-disable-next-line no-warning-comments
// TODO handle clicks and multi-select

function fetchDeeplCharCount(key) {
	if (key === null) {
		getDeeplKey();
		return;
	}

	needle.get(encodeURI(`https://api.deepl.com/v2/usage?auth_key=${key}`), (error, response) => {
		if (!error && response.statusCode === 200) {
			charCount = response.body.character_count;
			charLim = response.body.character_limit;
		}

		$('#deepl_character_count').text(`Characters left on Deepl: ${charLim - charCount}`);
	});
	// Return {character_count: charCount, character_limit: charLim};
}

/**
 * Either fetches the Deepl-Key from const deeplKey_FILE
 * or
 * provokes a form window to be shown for the user to input the key
 */
async function getDeeplKey() {
	storage.get('deeplKey', (error, data) => {
		if (error) {
			throw error;
		}

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
			storage.set('deeplKey', {deeplKey}, error => {
				if (error) {
					throw error;
				}
			});
		}

		fetchDeeplCharCount(deeplKey);
		mainProcess.closeRetrievalWindow();
	}
});

/**
 * ! The ID of each list element consists of its lastModified-value concatenated with its size
 * ! - both as strings!
 * TODO check each element if jpeg
 * @param {event} event The Parameter passed from HTML-ondrop to the script.
 */
// eslint-disable-next-line no-unused-vars
function handleDrop(event) {
	function createAndAssignInnerHtml(elementType, inner) {
		// eslint-disable-next-line no-undef
		const element = document.createElement(elementType);
		element.innerHTML = inner;
		return element;
	}

	function isNotOnSameHarddrive(files) {
		for (const file of files) {
			if (!file.path.startsWith('C')) {
				return true;
			}
		}

		return false;
	}

	event.preventDefault();
	// Do nothing if metadatahandler is not ready
	if ($('#metadatahandler_status').css('color') !== 'rgb(0, 255, 0)') {
		return;
	}

	const {files} = event.dataTransfer;
	if (is.windows) {
		if (isNotOnSameHarddrive(files)) {
			throw new Error(`One or more files are on an external hard drive. 
        Pixtranslator is not allowed to work on external devices.
        Please move these files to your main system and try again.`);
		}
	}

	// Hide call, show file-list
	$('#call_for_drop').css('display', 'none');
	$('#file_list').css('display', 'table');
	// Add dropped items to list
	const tableBody = $('tbody');
	let children = [];
	let totalCharCount = 0;
	for (const file of files) {
		// eslint-disable-next-line no-undef, unicorn/prefer-query-selector
		if (document.getElementById(file.path.replace(/\s/g, ''))) {
			continue;
		}

		metadatahandlerStub.requestKeywordsAndCaption(file.path).then(keysAndCaps => {
			const currentPicCollection = new translator.PicCollection(
				file.path,
				keysAndCaps.keywords,
				keysAndCaps.caption
			);
			picCollectionArray.push(currentPicCollection);
			const currentCharCount = metadatahandlerStub.countKeysAndCapChars(keysAndCaps);
			// eslint-disable-next-line no-undef
			const newEntry = document.createElement('tr');
			newEntry.id = file.path.replace(/\s/g, '');
			// eslint-disable-next-line no-undef
			const imageElement = document.createElement('img');
			imageElement.src = file.path;
			totalCharCount += currentCharCount;
			children = [
				createAndAssignInnerHtml('td', file.name),
				createAndAssignInnerHtml('td', currentPicCollection.caption),
				createAndAssignInnerHtml('td', currentPicCollection.keywords),
				createAndAssignInnerHtml('td', currentCharCount),
				// eslint-disable-next-line no-undef
				document.createElement('td').append(imageElement)
			];
			for (const child of children) {
				newEntry.append(child);
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

const reReadKeywordsAndCaptions = reReadArray => {
	for (let i = 0, currentPicCollection; currentPicCollection = reReadArray[i]; i++) {
		metadatahandlerStub.requestKeywordsAndCaption(currentPicCollection.picPath).then(
			keysAndCaps => {
				// eslint-disable-next-line no-undef, unicorn/prefer-query-selector
				const currentPicRow = document.getElementById(`${currentPicCollection.picPath.replace(/\s/g, '')}`);
				currentPicRow.cells[1].innerHTML = keysAndCaps.caption;
				currentPicRow.cells[2].innerHTML = keysAndCaps.keywords.toString();
				currentPicRow.cells[3].innerHTML = metadatahandlerStub.countKeywordChars(
					metadatahandlerStub.countKeysAndCapChars(keysAndCaps)
				);
				ipcRenderer.send('progressStep');
			}
		);
	}
};

const startTranslationRoutine = () => {
	storage.get('deeplKey', async (error, data) => {
		if (error) {
			throw error;
		}

		if (data.deeplKey) {
			const {deeplKey} = data;
			// eslint-disable-next-line no-undef
			const totalPicNumber = document.querySelector('#table_body').rows.length;
			// +++ TRANSLATION +++const mainProcess = remote.require('./main.js');
			ipcRenderer.send('showProgressWindow', totalPicNumber);
			picCollectionArray = await translator.getDbTranslationsForMany(picCollectionArray);
			picCollectionArray = await translator.getDeeplTranslationsForMany(
				picCollectionArray,
				deeplKey
			);
			// +++ Writeback +++
			await Promise.all([
				await metadatahandlerStub.writeKeywordsAndCaptionForMany(picCollectionArray),
				// UpdateDatabase is allowed to fail
				await metadatahandlerStub.updateDatabaseForMany(picCollectionArray)
			]);
			// +++ RE-READ +++
			reReadKeywordsAndCaptions(picCollectionArray);
			// +++ TEARDOWN +++
			mainProcess.showCompletedWindow();
			fetchDeeplCharCount(deeplKey);
		} else {
			mainProcess.retrieveDeeplKeyViaWindow();
		}
	});
};

// eslint-disable-next-line no-unused-vars
function showPreExecutionNotice() {
	if (mainProcess.showPreExecutionNotice() === 0) {
		startTranslationRoutine();
	}
}

// eslint-disable-next-line no-unused-vars
function showAboutWindow() {
	mainProcess.showAboutWindow();
}

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
	setInterval(() => {
		checkServiceHealth('metadatahandler', 4711);
	}, 10000);
	setInterval(() => {
		checkServiceHealth('databasehandler', 4712);
	}, 10000);
};

const initIntervals = () => {
	checkServiceHealth('metadatahandler', 4711);
	checkServiceHealth('databasehandler', 4712);
	intervalFunctions();
};

// eslint-disable-next-line no-undef
window.addEventListener('load', () => {
	fetchDeeplCharCount(null);
	setTimeout(() => {
		initIntervals();
	}, 5000);
});
