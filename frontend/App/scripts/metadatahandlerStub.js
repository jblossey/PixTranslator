/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
/* eslint-disable prefer-template */
const needle = require('needle');

exports.requestKeywordsAndCaption = (picPath, callback) => {
  let keywords;
  let caption;
  needle.get('http://localhost:4711/getKeywordsAndCaption?path=' + picPath, (error, response) => {
    if (!error && response.statusCode === 200) {
      keywords = response.body.Keywords;
      caption = response.body.Caption;
    }
    callback({ keywords, caption });
  });
};

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
