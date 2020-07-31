/* eslint-disable no-cond-assign */
const {ipcRenderer} = require('electron');
const Promise = require('promise');
const needle = require('needle');
const unhandled = require('electron-unhandled');
const {setDifference} = require('./shared/set-methods');
const {sendDebugInfoMail} = require('../shared/user-interaction');
const { error } = require('jquery');

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

const getDeeplCaptionTranslation = (originalCaption, authKey, requestUrl, deeplOptions) => new Promise((resolve, reject) => {
	const requestData = `text=${encodeURIComponent(originalCaption)}`;
	needle('post', requestUrl, [deeplOptions, requestData]).then(response => {
		try {
			if (response.statusCode === 200) {
				const {translations} = response.body;
				resolve(translations.shift().text);
			} else {
				console.error(`+++++++++++
		Error getting DeeplTranslation for Caption ${originalCaption}.
		Response Status: ${response.statusCode}, ${response.statusMessage}
		Response body: ${response.body}
		++++++++++++++`);
				reject();
			}
		} catch (error) {
			console.error(error);
			reject(error);
		}
	});
});

const getDeeplKeywordsTranslations = (picCollection, authKey, requestUrl, deeplOptions) => new Promise((resolve, reject) => {
	while (picCollection.toSend) {
		const maximumDeeplRequestSizedChunk = picCollection.toSend.splice(0, 50);
		const requestData = maximumDeeplRequestSizedChunk.map(item => `text=${encodeURIComponent(item)}`).join('&');
		needle('post', requestUrl, [deeplOptions, requestData]).then(response => {
			try {
				if (response.statusCode === 200) {
					const {translations} = response.body;
					const translationArray = [];
					translations.map(entry => translationArray.push(entry.text));
					resolve(translationArray);
				} else {
					console.error(`+++++++++++
			Error getting DeeplTranslation for Keywords of ${picCollection.picPath}.
			Response Status: ${response.statusCode}, ${response.statusMessage}
			Response body: ${response.body}
			++++++++++++++`);
					reject();
				}
			} catch (error) {
				console.error(error);
				reject(error);
			}
		});
	}
});


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
	const originalCaption = picCollection.toSend.shift();
	Promise.allSettled([
		getDeeplCaptionTranslation(originalCaption, authKey, requestUrl, deeplOptions),
		getDeeplKeywordsTranslations(picCollection, authKey, requestUrl, deeplOptions)
	]).then(resolvedValue => {
		const translatedCaption = resolvedValue[0];
		const translatedKeywords = resolvedValue[1];
		picCollection.translatedCaption = translatedCaption;
		picCollection.translatedKeywords = translatedKeywords;
		picCollection.clearToSend();
		ipcRenderer.send('progressStep');
		resolve(picCollection);
	}, error_ => reject(error_));
});

const getDeeplTranslationsForMany = async (picCollectionArray, authKey) => {
	await Promise.allSettled(picCollectionArray.map(async currentPicCollection => {
		await getDeeplTranslationsForOne(currentPicCollection, authKey);
	}));
	return picCollectionArray;
};

module.exports = {
	PicCollection,
	getDbTranslationsForMany,
	getDbTranslationsForOne,
	getDeeplTranslationsForMany,
	getDeeplTranslationsForOne,
	getDeeplCaptionTranslation,
	getDeeplKeywordsTranslations
};
