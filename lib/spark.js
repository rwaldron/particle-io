var es6 = require("es6-shim");
var querystring = require("querystring");
var os = require("os");
var net = require("net");
var Emitter = require("events").EventEmitter;
var rest = require("restler");
var priv = new Map();
var interfaces = os.networkInterfaces();
var ipAddress;


function service(deviceId) {
  return "https://api.spark.io/v1/devices/" + deviceId + "/";
}

if (interfaces) {
  ipAddress = Object.keys(interfaces).reduce(function(accum, name) {
    return interfaces[name].reduce(function(ip, iface) {
      if (!iface.internal && iface.family === "IPv4") {
        return iface.address;
      }
    }, "");
  }, null);
}

// console.log(ipAddress);
// process.exit(1);

var pins = [
  { id: "D0", modes: [0, 1, 3, 4] },
  { id: "D1", modes: [0, 1, 3, 4] },
  { id: "D2", modes: [0, 1] },
  { id: "D3", modes: [0, 1] },
  { id: "D4", modes: [0, 1] },
  { id: "D5", modes: [0, 1] },
  { id: "D6", modes: [0, 1] },
  { id: "D7", modes: [0, 1] },

  { id: "", modes: [] },
  { id: "", modes: [] },

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
    port: opts.port || 9000,
    server: null,
    socket: null,
    timers: {},
    interval: 20
  };

  this.name = "spark-io";
  this.isReady = false;

  this.pins = pins.map(function(pin) {
    return {
      supportedModes: pin.modes,
      mode: pin.modes[0],
      value: 0
    };
  });

  this.analogPins = this.pins.slice(10).map(function(pin, i) {
    return i;
  });

  // Needs to happen because es6-collections is a fucking
  // busted piece of shit and doesn't implement Map.prototype
  // methods on the prototype.
  if (!priv) {

  }

  // Store private state
  priv.set(this, state);

  var connect = function() {
    this.command({
      method: "post",
      action: "connect",
      pin: ipAddress + ":" + state.port,
      handler: function(error, data) {
        if (error === null) {
          this.emit("ready");
        } else {
          this.emit("error", error);
        }
      }.bind(this)
    });
  }.bind(this);

  Spark.Server.create(this, function() {
    process.nextTick(connect);
  });
}

Spark.Server = {
  create: function(spark, onCreated) {
    if (!(spark instanceof Spark)) {
      throw new Error("Expected instance of Spark");
    }
    var state = priv.get(spark);
    var server = net.createServer(function(socket) {
      socket.setKeepAlive(true);

      // Set ready state bit
      spark.isReady = true;

      // Store socket and server references
      state.socket = socket;
      state.server = server;

      onCreated();
    });
    server.listen(state.port);
  }
};

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


// TODO: Replace this crap with something that isn"t horrible.
Spark.prototype.command.isTest = false;
Spark.prototype.command.stub = function() {};

// replace this.command with socket.write changes.

["analogWrite", "digitalWrite"].forEach(function(fn) {
  var isAnalog = fn === "analogWrite";
  var action = isAnalog ? 0x02 : 0x01;
  var offset = isAnalog ? 10 : 0;

  Spark.prototype[fn] = function(pin, value) {
    var state = priv.get(this);
    var buffer = new Buffer(3);
    var pinInt = (pin.replace(/A|D/i, "") | 0) + offset;

    buffer[0] = action;
    buffer[1] = pinInt;
    buffer[2] = value;

    state.socket.write(buffer);

    this.pins[pinInt].value = value;

    return this;
  };
});


// TODO: Define protocol for gather this information.
["analogRead", "digitalRead"].forEach(function(fn) {
  var action = fn.toLowerCase();

  Spark.prototype[fn] = function(pin, handler) {
    var state = priv.get(this);
    var key = action + "-" + pin;
    // var timer = state.timers[key];

    // TODO: REFACTOR ALL OF THIS CRAP TO SOCKET + BUFFER
    //
    // if (timer) {
    //   clearInterval(timer);
    // }

    // timer = setInterval(function() {
    //   this.command({
    //     action: action,
    //     pin: pin,
    //     handler: handler
    //   });
    // }.bind(this), state.interval);

    // state.timers[key] = timer;



    // 1. create handler
    // 2. send write request

    // state


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
  var state = priv.get(this);
  var offset = pin[0] === "A" ? 10 : 0;
  var pinInt = (pin.replace(/A|D/, "") | 0) + offset;

  this.pins[pinInt].mode = mode;

  state.socket.write(new Buffer([ 0x00, pinInt, mode ]));

  return this;
};

Spark.prototype.reset = function() {
  return this;
};

Spark.prototype.close = function() {
  var state = priv.get(this);
  state.socket.close();
  state.server.close();
};



module.exports = Spark;
