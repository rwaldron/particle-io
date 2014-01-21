var es6 = require("es6-collections");
var querystring = require("querystring");
var Emitter = require("events").EventEmitter;
var rest = require("restler");
var priv = new Map();

function service(deviceId) {
  return "https://api.spark.io/v1/devices/" + deviceId + "/";
}

var pins = [
  { id: "D0", modes: [0, 1, 3, 4] },
  { id: "D1", modes: [0, 1, 3, 4] },
  { id: "D2", modes: [0, 1] },
  { id: "D3", modes: [0, 1] },
  { id: "D4", modes: [0, 1] },
  { id: "D5", modes: [0, 1] },
  { id: "D6", modes: [0, 1] },
  { id: "D7", modes: [0, 1] },

  { id: "A0", modes: [0, 1, 2, 3, 4] },
  { id: "A1", modes: [0, 1, 2, 3, 4] },
  { id: "A2", modes: [0, 1, 2] },
  { id: "A3", modes: [0, 1, 2] },
  { id: "A4", modes: [0, 1, 2] },
  { id: "A5", modes: [0, 1, 2, 3, 4] },
  { id: "A6", modes: [0, 1, 2, 3, 4] },
  { id: "A7", modes: [0, 1, 2, 3, 4] }
];

var modes = Object.freeze({
  INPUT: 0,
  OUTPUT: 1,
  ANALOG: 2,
  PWM: 3,
  SERVO: 4
});

function Spark(opts) {
  Emitter.call(this);

  if (!(this instanceof Spark)) {
    return new Spark(opts);
  }

  var state = {
    isConnected: true,
    deviceId: opts.deviceId,
    token: opts.token,
    service: service(opts.deviceId),
    timers: {},
    interval: 20
  };

  this.pins = pins.map(function(pin) {
    return {
      supportedModes: pin.modes,
      mode: pin.modes[0],
      value: 0
    };
  });

  this.analogPins = this.pins.slice(8);

  var isReady = function() {
    this.command({
      method: "get",
      action: "query",
      handler: function(error, data) {
        if (error === null) {
          this.emit("ready", data);
        } else {
          this.emit("error", error);
        }
      }.bind(this)
    });
  }.bind(this);

  // Schedule a connection check for
  // the next execution turn.
  process.nextTick(isReady);

  // Store private state
  priv.set(this, state);
}

Spark.prototype = Object.create(Emitter.prototype, {
  constructor: {
    value: Spark
  },
  MODES: {
    get: function() {
      return modes;
    }
  },
  HIGH: {
    value: 1
  },
  LOW: {
    value: 0
  }
});

Spark.prototype.command = function(opts) {
  var state = priv.get(this);
  var url = state.service;
  var outbound = {};
  var method = opts.method;
  var action = opts.action;
  var pin = opts.pin;
  var handler = opts.handler;
  var value = opts.value;
  var request;

  // Allow omission of "method", default to "post"
  if (method === undefined) {
    method = "post";
  }

  if (typeof pin === "undefined" && action !== "query") {
    // error?
  }

  outbound.access_token = state.token;

  if (action !== "query") {
    outbound.params = pin;
  }

  if (value !== undefined) {
    outbound.params = [pin, value].join();
  }

  if (Spark.prototype.command.isTest) {
    Spark.prototype.command.stub({
      action: action,
      handler: handler,
      method: method,
      pin: pin,
      value: value,
      outbound: outbound
    });

    return this;
  }

  request = method === "get" ?
    rest.get(url + "?" + querystring.encode(outbound)) :
    rest.post(url + action, {
      data: outbound
    });

  request.on("complete", function(data) {
    var err = null;

    if (data.error) {
      err = "ERROR: " + data.code + " " + data.error_description;
    }

    if (handler) {
      handler.call(this, err, data);
    }
  }.bind(this));

  return this;
};

// TODO: Replace this crap with something that isn't horrible.
Spark.prototype.command.isTest = false;
Spark.prototype.command.stub = function() {};


["analogWrite", "digitalWrite"].forEach(function(fn) {
  var action = fn.toLowerCase();
  var offset = action === "analogwrite" ? 8 : 0;

  Spark.prototype[fn] = function(pin, value) {
    if (fn === "digitalWrite") {
      if (value !== 1 && value !== 0 &&
        value !== "HIGH" && value !== "LOW") {

        throw new Error(
          "Unexpected digitalWrite value"
        );
      }

      if (typeof value === "number") {
        value = value === 1 ? "HIGH" : "LOW";
      }
    }

    var index = (pin.replace(/A|D/, "") | 0) + offset;

    this.pins[index].value = value;

    return this.command({
      action: action,
      pin: pin,
      value: value
    });
  };
});

["analogRead", "digitalRead"].forEach(function(fn) {
  var action = fn.toLowerCase();

  Spark.prototype[fn] = function(pin, handler) {
    var state = priv.get(this);
    var key = action + "-" + pin;
    var timer = state.timers[key];

    if (timer) {
      clearInterval(timer);
    }

    timer = setInterval(function() {
      this.command({
        action: action,
        pin: pin,
        handler: handler
      });
    }.bind(this), state.interval);

    state.timers[key] = timer;

    return this;
  };
});

Spark.prototype.servoWrite = Spark.prototype.analogWrite;

/**
 * Compatibility Shimming
 */
Spark.prototype.setSamplingInterval = function(interval) {
  // This does not send a value to the board
  var safeint = interval < 10 ?
    10 : (interval > 65535 ? 65535 : interval);

  priv.get(this).interval = safeint;

  return this;
};

Spark.prototype.pinMode = function(pin, mode) {
  // This does not send a value to the board and
  // does not affect the mode of a given pin on
  // the board. `pinMode` is managed by
  // https://github.com/spark/core-firmware/blob/master/src/application.cpp
  var offset = pin[0] === "A" ? 8 : 0;
  var index = (pin.replace(/A|D/, "") | 0) + offset;

  this.pins[index].mode = mode;

  return this;
};

Spark.prototype.reset = function() {
  return this;
};

module.exports = Spark;
