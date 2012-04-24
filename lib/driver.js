var EventEmitter = require('events').EventEmitter;

function Driver() {
  EventEmitter.constructor.call(this);
}

Driver.prototype = EventEmitter.prototype;

Driver.prototype.connect = function(options, callback) {
  throw new Error('Driver#connect must be implemented.');
}

module.exports = Driver;