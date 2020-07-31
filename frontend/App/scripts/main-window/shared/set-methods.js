const unhandled = require('electron-unhandled');
const {sendDebugInfoMail} = require('../../shared/user-interaction');

unhandled({reportButton: error => sendDebugInfoMail(error)});

exports.setDifference = (minuend, subtrahend) => minuend.filter(x => !subtrahend.includes(x));

exports.setUnion = (...args) => [...new Set([...args.flat(Infinity)])];
