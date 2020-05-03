const unhandled = require('electron-unhandled');
const { sendDebugInfoMail } = require('./userInteraction');

unhandled({reportButton: error => sendDebugInfoMail(error)});

exports.setDifference = (minuend, subtrahend) => minuend.filter((x) => !subtrahend.includes(x));

exports.setUnion = (...args) => [...new Set([...args.flat(Infinity)])];

// This only works because set elements in js are always treated in insertion order;
// thus in fact providing a sorted set.
// It also depends on Deepl always translating words in the same way (which has yet to be examined)
exports.translationMappingUnion = (picCollectionArray) => [
  picCollectionArray.reduce(
    (accumulator, currentValue) => this.setUnion(
      accumulator, currentValue.translationMapping[0],
    ), picCollectionArray[0].translationMapping[0],
  ),
  picCollectionArray.reduce(
    (accumulator, currentValue) => this.setUnion(
      accumulator, currentValue.translationMapping[1],
    ), picCollectionArray[0].translationMapping[1],
  ),
];
