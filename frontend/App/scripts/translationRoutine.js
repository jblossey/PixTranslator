const { remote } = require('electron');

class PicCollection {
  #picPath;
  #keywords;
  #caption;
  #translatedKeywords;
  #translatedCaption;
  #toSend;
  constructor(picPath, keywords, caption) {
    this.#picPath = picPath;
    this.#keywords = keywords;
    this.#caption = caption;
    this.#translatedKeywords = [];
    this.#translatedCaption = "";
    this.#toSend = [caption];
  }

  get picPath() { return this.#picPath }
  get keywords() { return this.#keywords }
  get caption() { return this.#caption }
  get translatedKeywords() { return this.#translatedKeywords }
  get translatedCaption() { return this.#translatedCaption }
  get toSend() { /*TODO*/ }

  set translatedKeywords(translated) { this.#translatedKeywords.push(translated).flat(Infinity) }
  set translatedCaption(translated) { this.#translatedCaption = translated }

}

exports.collectKeysAndCaps = () => {
  // TODO
};
