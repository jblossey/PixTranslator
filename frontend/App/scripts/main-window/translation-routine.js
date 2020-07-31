const {ipcRenderer} = require('electron');
const Promise = require('promise');
const needle = require('needle');
const unhandled = require('electron-unhandled');
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
		this._translationMapping = [];
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

// TODO: Test this
const getDbTranslationsForOne = picCollection => new Promise((resolve, reject) => {
	// Concurrently send each keyword of one picCollection to the DB
	Promise.allSettled(picCollection.keywords.map(keyword =>
		needle('get', `http://localhost:4712/germanword/${encodeURIComponent(keyword)}`).then(response => {
			try {
				if (response.statusCode === 200) {
					if (response.body) {
						// Add translation to picCollection
						response.body.englishWords.map(englishWord =>
							picCollection.translatedKeywords.push(englishWord.word)
						);
					} else {
						// Word not yet in DB -> mark as "to send"
						picCollection.toSend.push(keyword);
					}
				} else {
					console.error(`+++++++++++
		Error getting DB translation for keyword ${keyword} of ${picCollection.picPath}.
		Response Status: ${response.statusCode}, ${response.statusMessage}
		Response body: ${response.body}
		++++++++++++++`);
					reject();
				}
			} catch (error) {
				console.error(error);
			}
		})
	)).then(() => {
		ipcRenderer.send('progressStep');
		resolve(picCollection);
	}, error_ => reject(error_));
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
	const keywordsToSend = picCollection.toSend;
	// eslint-disable-next-line no-unmodified-loop-condition
	while (keywordsToSend) {
		// Never send chunks of more than 50 Word at the same time -> obligation by Deepl API
		const maximumDeeplRequestSizedChunk = keywordsToSend.splice(0, 50);
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

const mapTranslationsToOriginals = (translations, originals) => {
	if (translations.length === originals.length) {
		return [originals, translations];
	}

	throw new Error('Cannot map. Translationarray and Originalarray are not the same length!');
};

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
		picCollection.translatedKeywords = picCollection.translatedKeywords.concat(translatedKeywords);
		picCollection.translationMapping = mapTranslationsToOriginals(translatedKeywords, picCollection.toSend);
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
