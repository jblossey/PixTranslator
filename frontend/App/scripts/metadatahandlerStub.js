/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const needle = require('needle');
const Promise = require('promise');

exports.requestKeywordsAndCaption = (picPath) => new Promise((fulfill, reject) => {
  let keywords;
  let caption;
  needle('get', `http://localhost:4711/getKeywordsAndCaption?path=${picPath}`).then((response) => {
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
