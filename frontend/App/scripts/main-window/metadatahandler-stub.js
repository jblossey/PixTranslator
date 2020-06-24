const needle = require('needle');
const Promise = require('promise');
const {ipcRenderer} = require('electron');
const unhandled = require('electron-unhandled');
const {translationMappingUnion} = require('./shared/set-methods');
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

// TODO implement efficient writing to Database
exports.updateDatabaseForOne = translationMapping => new Promise((resolve, reject) => {
	const requestURL = 'http://localhost:4712/dict';
	const requestOptions = {
		json: true
	};

	if (translationMapping[0].length !== translationMapping[1].length) {
		reject(new Error(`Mapping of translation and originals was not correct.
		0:${translationMapping[0].length}
		1:${translationMapping[1].length}`));
	}

	if (translationMapping[0].length === 0) {
		resolve();
	}

	for (let i = 0; i < translationMapping[0].length; i++) {
		const native = translationMapping[0][i];
		const translation = translationMapping[1][i];
		const requestData = {german: native, english: translation};
		needle('post', requestURL, requestData, requestOptions).then(response => {
			if (response.statusCode < 200 || response.statusCode >= 300) {
				console.error(`+++++++++++
		Error updating DB at mapping ${native} - ${translation}.
		Response Status: ${response.statusCode}, ${response.statusMessage}
		Response body: ${typeof response.body === 'string' ? response.body : response.body.toString()}
		++++++++++++++`);
				reject();
			} else if (i === translationMapping[0].length - 1) {
				resolve();
			}
		});
	}
});

exports.updateDatabaseForMany = async picCollectionArray => {
	console.log(`Array before mapping: ${picCollectionArray.length}`);
	const translationMappingArray = translationMappingUnion(picCollectionArray);
	await this.updateDatabaseForOne(translationMappingArray);
};
