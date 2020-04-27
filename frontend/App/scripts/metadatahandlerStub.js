/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const needle = require('needle');
const Promise = require('promise');
const { ipcRenderer } = require('electron');
const unhandled = require('electron-unhandled');
const assert = require('assert');
// eslint-disable-next-line import/no-unresolved
const { translationMappingUnion } = require('./setMethods');

unhandled();

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
  const requestURL = encodeURI(`http://localhost:4711/updateKeywordsAndCaption?path=${picCollection.picPath}`);
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
        ipcRenderer.send('progressStep');
        console.info(`Done with ${picCollection.picPath}`);
        fulfill('done');
      } else {
        unhandled.logError(`+++++++++++
        Error writing to ${picCollection.picPath}.
        Response Status: ${response.statusCode}, ${response.statusMessage}
        Response body: ${response.body}
        ++++++++++++++`);
        reject();
      }
    } catch (error) {
      console.error(
        `Error while writing to ${picCollection.picPath}
        Error Message: ${error}`,
      );
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
  if (translationMapping[0].length === 0) fulfill();
  for (let i = 0; i < translationMapping[0].length; i++) {
    const native = translationMapping[0][i];
    const translation = translationMapping[1][i];
    const requestData = { german: native, english: translation };
    // eslint-disable-next-line max-len
    needle('post', requestURL, requestData, requestOptions).then((response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        console.error(`+++++++++++
        Error updating DB at mapping ${native} - ${translation}.
        Response Status: ${response.statusCode}, ${response.statusMessage}
        Response body: ${response.body}
        ++++++++++++++`);
        reject();
      } else if (i === translationMapping[0].length - 1) fulfill();
    });
  }
});

exports.updateDatabaseForMany = async (picCollectionArray) => {
  const translationMappingArray = translationMappingUnion(picCollectionArray);
  await this.updateDatabaseForOne(translationMappingArray);
};
