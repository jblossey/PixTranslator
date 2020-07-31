/* eslint-disable no-cond-assign */
const {ipcRenderer} = require('electron');
const Promise = require('promise');
const needle = require('needle');
const unhandled = require('electron-unhandled');
const {setDifference} = require('./shared/set-methods');
const {sendDebugInfoMail} = require('../shared/user-interaction');

unhandled({reportButton: error => sendDebugInfoMail(error)});

class PicCollection {
	constructor(picPath, keywords, caption) {
		this._picPath = picPath;
		this._keywords = keywords;
		this._caption = caption;
		this._translatedKeywords = [];
		this._translatedCaption = '';
		this._toSend = [caption];
		this._translationMapping = {};
	}

	get picPath() {
		return this._picPath;
	}

	get keywords() {
		return this._keywords;
	}

	get caption() {
		return this._caption;
	}

	get translatedKeywords() {
		return this._translatedKeywords;
	}

	set translatedKeywords(translated) {
		this._translatedKeywords.push(translated);
		this._translatedKeywords = this._translatedKeywords.flat(Infinity);
	}

	get translatedCaption() {
		return this._translatedCaption;
	}

	set translatedCaption(translated) {
		this._translatedCaption = translated;
	}

	get toSend() {
		return this._toSend;
	}

	set toSend(untranslated) {
		this._toSend.push(untranslated);
		// Flatten and always keep the longest element (caption) at first place
		this._toSend = this._toSend.flat(Infinity).sort((a, b) => -(a.length - b.length));
	}

	get translationMapping() {
		return this._translationMapping;
	}

	set translationMapping(translationArray) {
		this._translationMapping = translationArray;
	}

	clearToSend() {
		this._toSend = [];
	}
}

const extractTranslationFromDatabaseCall = dbResponse => {
	const translations = [];
	for (let i = 0, translated; translated = dbResponse._embedded.dict[i]; i++) {
		translations.push(translated.english);
	}

	return translations;
};

const extractUntranslatedKeywords = (originalCollection, rawDbResponse) => {
	const untranslatedArray = [];
	for (let i = 0, untranslated; untranslated = rawDbResponse._embedded.dict[i]; i++) {
		untranslatedArray.push(untranslated.german);
	}

	return setDifference(originalCollection.keywords, untranslatedArray);
};

const getDbTranslationsForOne = picCollection => new Promise((resolve, reject) => {
	let request = 'http://localhost:4712/dict/search/findAllByGermanInIgnoreCase?';
	const {keywords} = picCollection;
	for (let i = 0, keyword; keyword = keywords[i]; i++) {
		request += `german=${encodeURIComponent(keyword)}&`;
	}

	needle('get', request).then(response => {
		try {
			if (response.statusCode === 200) {
				const jsonBody = JSON.parse(response.body);
				picCollection.translatedKeywords = extractTranslationFromDatabaseCall(jsonBody);
				picCollection.toSend = extractUntranslatedKeywords(picCollection, jsonBody);
				ipcRenderer.send('progressStep');
				resolve(picCollection);
			} else {
				console.error(`+++++++++++
		Error getting DB translation for ${picCollection.picPath}.
		Response Status: ${response.statusCode}, ${response.statusMessage}
		Response body: ${response.body}
		++++++++++++++`);
				reject();
			}
			// TODO proper handling of single outages during db call
		} catch (error) {
			console.error(error);
			reject(error);
		}
	});
});

const getDbTranslationsForMany = async picCollectionArray => {
	await Promise.all(picCollectionArray.map(async currentPicCollection => {
		await getDbTranslationsForOne(currentPicCollection);
	}));
	return picCollectionArray;
};

// TODO deepl only accepts up to 50 text entries at once. handle this.
const getDeeplTranslationsForOne = (picCollection, authKey) => new Promise((resolve, reject) => {
	const requestUrl = 'https://api.deepl.com/v2/translate';
	const deeplOptions = {
		// eslint-disable-next-line camelcase
		auth_key: authKey,
		// eslint-disable-next-line camelcase
		source_lang: 'DE',
		// eslint-disable-next-line camelcase
		target_lang: 'EN',
		// eslint-disable-next-line camelcase
		split_sentences: '0' // Treat every requestparameter coherently
	};
	while (picCollection.toSend) {
		const maximumDeeplRequestSizedChunk = picCollection.toSend.splice(0, 50);
		const requestData = maximumDeeplRequestSizedChunk.map(item => `text=${encodeURIComponent(item)}`).join('&');
		needle('post', requestUrl, [deeplOptions, requestData]).then(response => {
			try {
				if (response.statusCode === 200) {
					const {translations} = response.body;
					const translationArray = [];
					// Deepl keeps the order so first element is always the longest (caption, see setter of toSend)
					picCollection.translatedCaption = translations.shift().text;
					translations.map(entry => translationArray.push(entry.text));
					picCollection.translatedKeywords = translationArray;
					picCollection.translationMapping = [picCollection.toSend.slice(1), translationArray];
					picCollection.clearToSend();
					ipcRenderer.send('progressStep');
					resolve(picCollection);
				} else {
					console.error(`+++++++++++
			Error getting DeeplTranslation for ${picCollection.picPath}.
			Response Status: ${response.statusCode}, ${response.statusMessage}
			Response body: ${response.body}
			++++++++++++++`);
					reject();
				}
				// TODO proper handling of single outages during deepl call
			} catch (error) {
				console.error(error);
				reject(error);
			}
		});
	}
});

const getDeeplTranslationsForMany = async (picCollectionArray, authKey) => {
	await Promise.all(picCollectionArray.map(async currentPicCollection => {
		await getDeeplTranslationsForOne(currentPicCollection, authKey);
	}));
	return picCollectionArray;
};

module.exports = {
	PicCollection,
	getDbTranslationsForMany,
	getDbTranslationsForOne,
	getDeeplTranslationsForMany,
	getDeeplTranslationsForOne
};
