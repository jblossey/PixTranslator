/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const needle = require('needle');
const Promise = require('promise');
const { remote } = require('electron');
const assert = require('assert');
// eslint-disable-next-line import/no-unresolved
const { translationMappingUnion } = require('./setMethods');

const mainProcess = remote.require('./main.js');

exports.requestKeywordsAndCaption = (picPath) => new Promise((fulfill, reject) => {
  let keywords;
  let caption;
  needle('get', encodeURI(`http://localhost:4711/getKeywordsAndCaption?path=${picPath}`)).then((response) => {
    try {
      if (response.statusCode === 200) {
        keywords = response.body.Keywords;
        caption = response.body.Caption;
      }
      fulfill({ keywords, caption });
    } catch (error) {
      reject(error);
    }
  });
});

exports.countKeywordChars = (keywords) => {
  let counter = 0;
  // eslint-disable-next-line prefer-const
  for (const key of keywords) {
    counter += key.length;
  }
  return counter;
};

exports.countKeysAndCapChars = (keysAndCapToCount) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  this.countKeywordChars(keysAndCapToCount.keywords)
  + keysAndCapToCount.caption[0].length;

exports.writeKeywordsAndCaptionForOne = (picCollection) => new Promise((fulfill, reject) => {
  const requestURL = `http://localhost:4711/updateKeywordsAndCaption?path=${picCollection.picPath}`;
  const requestData = {
    Keywords: picCollection.keywords.concat(picCollection.translatedKeywords),
    Caption: [`${picCollection.caption}, ${picCollection.translatedCaption}`],
  };
  const requestOptions = {
    json: true,
  };
  needle('post', requestURL, requestData, requestOptions).then((response) => {
    try {
      if (response.statusCode === 200) {
        mainProcess.progressStep();
        fulfill('done');
      } else reject();
    } catch (error) {
      reject(error);
    }
  });
});

exports.writeKeywordsAndCaptionForMany = async (picCollectionArray) => {
  await Promise.all(picCollectionArray.map(async (currentPicCollection) => {
    await this.writeKeywordsAndCaptionForOne(currentPicCollection);
  }));
};

// TODO implement efficient writing to Database
exports.updateDatabaseForOne = (translationMapping) => new Promise((fulfill, reject) => {
  const requestURL = 'http://localhost:4712/dict';
  const requestOptions = {
    json: true,
  };
  assert(translationMapping[0].length === translationMapping[1].length);
  for (let i = 0; i < translationMapping[0].length; i++) {
    const native = translationMapping[0][i];
    const translation = translationMapping[1][i];
    const requestData = { german: native, english: translation };
    // eslint-disable-next-line max-len
    needle('post', requestURL, requestData, requestOptions).then((response) => {
      if (response.statusCode !== 200) reject();
      else fulfill();
    });
  }
});

exports.updateDatabaseForMany = async (picCollectionArray) => {
  const translationMappingArray = translationMappingUnion(picCollectionArray);
  await this.updateDatabaseForOne(translationMappingArray);
};
