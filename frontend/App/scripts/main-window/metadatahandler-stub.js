const needle = require('needle');
const Promise = require('promise');
const {ipcRenderer} = require('electron');
const unhandled = require('electron-unhandled');
const {sendDebugInfoMail} = require('../shared/user-interaction');

unhandled({reportButton: error => sendDebugInfoMail(error)});

exports.requestKeywordsAndCaption = picPath => new Promise((resolve, reject) => {
	let keywords;
	let caption;
	needle('get', encodeURI(`http://localhost:4711/getKeywordsAndCaption?path=${picPath}`)).then(response => {
		try {
			if (response.statusCode === 200) {
				keywords = response.body.Keywords;
				caption = response.body.Caption;
			}

			resolve({keywords, caption});
		} catch (error) {
			reject(error);
		}
	});
});

exports.countKeywordChars = keywords => {
	let counter = 0;
	for (const key of keywords) {
		counter += key.length;
	}

	return counter;
};

exports.countKeysAndCapChars = keysAndCapToCount =>
	this.countKeywordChars(keysAndCapToCount.keywords) +
  keysAndCapToCount.caption[0].length;

exports.writeKeywordsAndCaptionForOne = picCollection => new Promise((resolve, reject) => {
	const requestURL = encodeURI(`http://localhost:4711/updateKeywordsAndCaption?path=${picCollection.picPath}`);
	const requestData = {
		Keywords: picCollection.keywords.concat(picCollection.translatedKeywords),
		Caption: [`${picCollection.translatedCaption}, ${picCollection.caption}`]
	};
	const requestOptions = {
		json: true
	};
	needle('post', requestURL, requestData, requestOptions).then(response => {
		try {
			if (response.statusCode === 200) {
				ipcRenderer.send('progressStep');
				console.info(`Done with ${picCollection.picPath}`);
				resolve('done');
			} else {
				unhandled.logError(`+++++++++++
		Error writing to ${picCollection.picPath}.
		Response Status: ${response.statusCode}, ${response.statusMessage}
		Response body: ${typeof response.body === 'string' ? response.body : response.body.toString()}
		++++++++++++++`);
				reject();
			}
		} catch (error) {
			console.error(
				`Error while writing to ${picCollection.picPath}
		Error Message: ${error}`
			);
			reject(error);
		}
	});
});

exports.writeKeywordsAndCaptionForMany = async picCollectionArray => {
	await Promise.all(picCollectionArray.map(async currentPicCollection => {
		await this.writeKeywordsAndCaptionForOne(currentPicCollection);
	}));
};

// TODO Test
exports.updateDatabaseForOne = translationMapping => new Promise((resolve, reject) => {
	const requestURL = 'http://localhost:4712/germanword/englishword/writemany';
	const requestOptions = {
		json: true
	};

	if (translationMapping[0].length === 0) {
		resolve();
	}

	const natives = translationMapping[0];
	const translations = translationMapping[1];
	const requestData = {};
	// eslint-disable-next-line array-callback-return
	natives.map((native, index) => {
		requestData.native = [translations[index]];
	});
	needle('post', requestURL, requestData, requestOptions).then(response => {
		if (response.statusCode < 200 || response.statusCode >= 300) {
			console.error(`+++++++++++
	Error updating DB for ${translationMapping.toString()}.
	Response Status: ${response.statusCode}, ${response.statusMessage}
	Response body: ${typeof response.body === 'string' ? response.body : response.body.toString()}
	++++++++++++++`);
			reject();
		} else {
			resolve();
		}
	});
});

// TODO test
exports.updateDatabaseForMany = async picCollectionArray => {
	await Promise.allSettled(picCollectionArray.map(async currentPicCollection => {
		await this.updateDatabaseForOne(currentPicCollection.translationMapping);
	}));
};
