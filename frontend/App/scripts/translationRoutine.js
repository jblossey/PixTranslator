/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-cond-assign */
/* eslint-disable no-plusplus */
const { ipcRenderer } = require('electron');
const Promise = require('promise');
const needle = require('needle');
const unhandled = require('electron-unhandled');
// eslint-disable-next-line import/no-unresolved
const { setDifference } = require('./setMethods');
const { sendDebugInfoMail } = require('./userInteraction');

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

  get picPath() { return this._picPath; }

  get keywords() { return this._keywords; }

  get caption() { return this._caption; }

  get translatedKeywords() { return this._translatedKeywords; }

  get translatedCaption() { return this._translatedCaption; }

  get toSend() { return this._toSend; }

  get translationMapping() { return this._translationMapping; }

  set translatedKeywords(translated) {
    this._translatedKeywords.push(translated);
    this._translatedKeywords = this._translatedKeywords.flat(Infinity);
  }

  set translatedCaption(translated) { this._translatedCaption = translated; }

  set toSend(untranslated) {
    this._toSend.push(untranslated);
    // flatten and always keep the longest element (caption) at first place
    this._toSend = this._toSend.flat(Infinity).sort((a, b) => -(a.length - b.length));
  }

  set translationMapping(translationArray) { this._translationMapping = translationArray; }

  clearToSend() { this._toSend = []; }
}

const extractTranslationFromDatabaseCall = (dbResponse) => {
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

// TODO deepl only accepts up to 50 text entries at once. handle this.
const getDbTranslationsForOne = (picCollection) => new Promise((fulfill, reject) => {
  let request = 'http://localhost:4712/dict/search/findAllByGermanInIgnoreCase?';
  const { keywords } = picCollection;
  for (let i = 0, keyword; keyword = keywords[i]; i++) {
    request += `german=${encodeURIComponent(keyword)}&`;
  }
  needle('get', request).then((response) => {
    try {
      if (response.statusCode === 200) {
        const jsonBody = JSON.parse(response.body);
        picCollection.translatedKeywords = extractTranslationFromDatabaseCall(jsonBody);
        picCollection.toSend = extractUntranslatedKeywords(picCollection, jsonBody);
        ipcRenderer.send('progressStep');
        fulfill(picCollection);
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

const getDbTranslationsForMany = async (picCollectionArray) => {
  await Promise.all(picCollectionArray.map(async (currentPicCollection) => {
    await getDbTranslationsForOne(currentPicCollection);
  }));
  return picCollectionArray;
};

const getDeeplTranslationsForOne = (picCollection, authKey) => new Promise((fulfill, reject) => {
  const requestUrl = 'https://api.deepl.com/v2/translate';
  const deeplOptions = {
    auth_key: authKey,
    source_lang: 'DE',
    target_lang: 'EN',
    split_sentences: '0', // treat every requestparameter coherently
  };
  const requestData = picCollection.toSend.map((item) => `text=${encodeURIComponent(item)}`).join('&');
  needle('post', requestUrl, [deeplOptions, requestData]).then((response) => {
    try {
      if (response.statusCode === 200) {
        const { translations } = response.body;
        const translationArray = [];
        // eslint-disable-next-line max-len
        // Deepl keeps the order so first element is always the longest (caption, see setter of toSend)
        picCollection.translatedCaption = translations.shift().text;
        translations.map((entry) => translationArray.push(entry.text));
        picCollection.translatedKeywords = translationArray;
        picCollection.translationMapping = [picCollection.toSend.slice(1), translationArray];
        picCollection.clearToSend();
        ipcRenderer.send('progressStep');
        fulfill(picCollection);
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
});

const getDeeplTranslationsForMany = async (picCollectionArray, authKey) => {
  await Promise.all(picCollectionArray.map(async (currentPicCollection) => {
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
};
