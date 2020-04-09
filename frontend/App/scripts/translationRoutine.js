/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-cond-assign */
/* eslint-disable no-plusplus */
const { remote } = require('electron');
const Promise = require('promise');
const needle = require('needle');

class PicCollection {
  picPath;

  keywords;

  caption;

  translatedKeywords;

  translatedCaption;

  toSend

  constructor(picPath, keywords, caption) {
    this.picPath = picPath;
    this.keywords = keywords;
    this.caption = caption;
    this.translatedKeywords = [];
    this.translatedCaption = '';
    this.toSend = [caption];
  }

  get picPath() { return this.picPath; }

  get keywords() { return this.keywords; }

  get caption() { return this.caption; }

  get translatedKeywords() { return this.translatedKeywords; }

  get translatedCaption() { return this.translatedCaption; }

  get toSend() { return this.toSend; }

  set translatedKeywords(translated) { this.translatedKeywords.push(translated).flat(Infinity); }

  set translatedCaption(translated) { this.translatedCaption = translated; }

  set toSend(untranslated) { this.toSend.push(untranslated).flat(Infinity); }

  clearToSend() { this.toSend = []; }
}

const extractTranslationFromDatabaseCall = (dbResponse) => {
  const translations = [];
  for (let i = 0, translated; translated = dbResponse._embedded.dict[i]; i++) {
    translations.push(translated.english);
  }
  return translations;
};

const setDifference = (minuend, subtrahend) => minuend.filter((x) => !subtrahend.includes(x));

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
        fulfill(picCollection);
      } else {
        reject();
      }
      // TODO proper handling of single outages during db call
    } catch (error) {
      reject(error);
    }
  });
});

const getDbTranslationsForMany = async (picCollectionArray) => {
  const progressWindow = remote.getGlobal('progressWindow');
  await Promise.all(picCollectionArray.map(async (currentPicCollection) => {
    await getDbTranslationsForOne(currentPicCollection);
    if (progressWindow) progressWindow.webContents.send('progressStep');
  }));
  return picCollectionArray;
};

const getDeeplTranslationsForOne = (picCollection, authKey) => new Promise((fulfill, reject) => {
  const requestUrl = 'https://api.deepl.com/v2/translate';
  const deeplOptions = {
    auth_key: authKey,
    source_lang: 'DE',
    target_lang: 'EN',
    split_sentences: '0',
  };
  const requestData = picCollection.toSend.map((item) => `text=${encodeURIComponent(item)}`).join('&');
  needle('post', requestUrl, [deeplOptions, requestData]).then((response) => {
    try {
      if (response.statusCode === 200) {
        const { translations } = response.body;
        translations.sort((a, b) => -(a.text.length - b.text.length));
        picCollection.translatedCaption = translations.shift().text;
        picCollection.translatedKeywords = translations.filter((entry) => entry.text).text;
        picCollection.clearToSend();
        fulfill(picCollection);
      } else {
        reject();
      }
      // TODO proper handling of single outages during deepl call
    } catch (error) {
      reject(error);
    }
  });
});

const getDeeplTranslationsForMany = async (picCollectionArray, authKey) => {
  const progressWindow = remote.getGlobal('progressWindow');
  await Promise.all(picCollectionArray.map(async (currentPicCollection) => {
    await getDeeplTranslationsForOne(currentPicCollection, authKey);
    if (progressWindow) progressWindow.webContents.send('progressStep');
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
