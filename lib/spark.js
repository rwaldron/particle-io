var es6 = require("es6-shim");
var os = require("os");
var net = require("net");
var Emitter = require("events").EventEmitter;
var rest = require("restler");
var priv = new Map();
var interfaces = os.networkInterfaces();
var ipAddress;


if (interfaces) {
  ipAddress = Object.keys(interfaces).reduce(function(accum, name) {
    if (!accum) {
      return interfaces[name].reduce(function(ip, iface) {
        if (!ip && !iface.internal && iface.family === "IPv4") {
          return iface.address;
        }
        return ip;
      }, "");
    }
  }, null);
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

var DIGITAL_READ = 0x03;
var ANALOG_READ = 0x04;

function service(deviceId) {
  return "https://api.spark.io/v1/devices/" + deviceId + "/";
}

function processReceived(spark, data) {
  var dlength = data.length;
  var length, action, pin, value, event;

  for (var i = 0; i < dlength; i++) {
    spark.buffer.push(data.readUInt8(i));
  }

  length = spark.buffer.length;

  if (length >= 3) {
    action = spark.buffer[0];
    pin = spark.buffer[1];
    value = spark.buffer[2];

    if (action === DIGITAL_READ ||
        action === ANALOG_READ) {

      if (action === ANALOG_READ) {
        pin = "A" + (pin - 10);
      }

      if (action === DIGITAL_READ) {
        pin = "D" + pin;
      }

      event = "read-" + pin;

      spark.emit(event, value);
    }

    if (length === 3) {
      // If the buffer was exactly 3 bytes...
      spark.buffer.length = 0;
    } else {
      // If the buffer was 3 or more...
      spark.buffer = spark.buffer.slice(3);
    }
  }
}


function Spark(opts) {
  Emitter.call(this);

  if (!(this instanceof Spark)) {
    return new Spark(opts);
  }

  var state = {
    isConnected: false,
    isReading: false,
    deviceId: opts.deviceId,
    token: opts.token,
    service: service(opts.deviceId),
    port: opts.port || 8001,
    server: null,
    socket: null
  };

  this.name = "spark-io";
  this.buffer = [];
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

  // Store private state
  priv.set(this, state);

  var connector = function() {
    this.connect(function(error, data) {
      // console.log( "connect -> connect -> handler" );
      if (error !== null) {
        this.emit("error", error);
      } else {
        state.isConnected = true;
        // Set ready state bit
        this.isReady = true;

        this.emit("ready");

        if (state.socket) {
          state.isReading = true;
          state.socket.on("data", function(data) {
            processReceived(this, data);
          }.bind(this));
        }
      }
    }.bind(this));
  }.bind(this);

  Spark.Server.create(this, connector);
}

Spark.Server = {
  create: function(spark, afterCreate) {
    if (!(spark instanceof Spark)) {
      throw new Error("Expected instance of Spark");
    }
    var state = priv.get(spark);
    state.server = net.createServer(function(socket) {
      socket.setKeepAlive(true);
      // spark.emit("connected");
      state.socket = socket;
    });

    state.server.listen(state.port);

    process.nextTick(afterCreate);
  }
};

Spark.prototype = Object.create(Emitter.prototype, {
  constructor: {
    value: Spark
  },
  MODES: {
    value: modes
  },
  HIGH: {
    value: 1
  },
  LOW: {
    value: 0
  }
});

Spark.prototype.connect = function(handler) {
  var state = priv.get(this);
  var url = state.service;
  var action = "connect";
  var outbound = {
    access_token: state.token,
    params: ipAddress + ":" + state.port
  };
  var request;

  if (state.isConnected) {
    return this;
  }

  handler = handler.bind(this);

  // console.log( url + action, outbound );

  request = rest.post(url + action, {
    data: outbound
  });

  request.on("complete", function(data) {
    var err = null;

    if (data.error) {
      err = "ERROR: " + data.code + " " + data.error_description;
    }

    if (handler) {
      handler(err, data);
    }
  });

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

    // console.log( "writing: ", buffer );
    state.socket.write(buffer);

    this.pins[pinInt].value = value;

    return this;
  };
});


// TODO: Define protocol for gather this information.
["analogRead", "digitalRead"].forEach(function(fn) {
  var isAnalog = fn === "analogRead";
  var action = isAnalog ? 0x04 : 0x03;
  var offset = isAnalog ? 10 : 0;

  Spark.prototype[fn] = function(pin, handler) {
    var state = priv.get(this);
    var buffer = new Buffer(3);
    var pinInt = (pin.replace(/A|D/i, "") | 0) + offset;
    var event = "read-" + pin;

    buffer[0] = action;
    buffer[1] = pinInt;
    buffer[2] = 1;

    // register a handler for
    this.on(event, handler);

    if (!state.isReading) {
      state.isReading = true;
      state.socket.on("data", function(data) {
        processReceived(this, data);
      }.bind(this));
    }

    // Tell the board we have a new pin to read
    state.socket.write(buffer);

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

Spark.prototype.reset = function() {
  return this;
};

Spark.prototype.close = function() {
  var state = priv.get(this);
  state.socket.close();
  state.server.close();
};



module.exports = Spark;
