var os = require('os');
var net = require('net');
var Emitter = require("events").EventEmitter;
var rest = require("restler");
var querystring = require("querystring");
var es6 = require("es6-collections");
var priv = new Map();

var ipAddress = null;

function gatherIPAddress() {
  // gather ip Address
  var interfaces = os.networkInterfaces();
  for (var ifName in os.networkInterfaces()) {
    if (!ipAddress) {
      interfaces[ifName].forEach(function (iface){
        if (!ipAddress && !iface.internal && 'IPv4' === iface.family) {
          ipAddress = iface.address;
        }
      });
    }
  }
  console.log(ipAddress);
}



function service(deviceId) {
  return "https://api.spark.io/v1/devices/" + deviceId + "/";
}

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


  this.name = "spark-io";
  this.isReady = false;

  this.localServer = null;
  // this is odd as we could have a pool of sockets really with many devices..
  // TODO: Consider a pooling and identification method for sending commands.
  this.localSocket = null;

  this.localPort = opts.port || 9000;




  var bindLocalTCPServer = function() {
    var that = this;
    console.log("Binding TCP server");
    var localServer = net.createServer(function(socket){
      socket.setKeepAlive(true);
      console.log("SOCKET OPEN!!!");
      that.isReady = true;
      that.emit("ready", socket.remoteAddress);
      that.localSocket = socket;
    });
    localServer.listen(this.localPort);
    this.localServer = localServer;
    console.log("Binding TCP server to "+this.localPort);
  }.bind(this);

  var connectSparkCore = function() {
    console.log("connecting spark core");
    this.command({
      method: "post",
      action: "connect",
      pin: ipAddress+":"+this.localPort,
      handler: function(error, data) {
        // wait for the socket to connect.
        if (error != null) {
          console.log("Handler error");
          console.log(arguments);
          this.emit("error", error);
        } else {
          console.log("Connection request sent");
          console.log(data);
          // this.emit("ready", data);
        }
      }.bind(this)
    });
  }.bind(this);


  if (!ipAddress)
    gatherIPAddress();
  bindLocalTCPServer();

  // coalese CPU
  process.nextTick(connectSparkCore);


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
  console.log(outbound);

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



Spark.prototype.close = function () {
  this.localSocket.close();
  this.localServer.close();
};






// replace this.command with socket.write changes.

["analogWrite", "digitalWrite"].forEach(function(fn) {
  var action = fn.toLowerCase();
  var offset = action === "analogwrite" ? 8 : 0;

  Spark.prototype[fn] = function(pin, value) {
    console.log(fn);
    var buff = new Buffer(4);

    if (fn === "digitalWrite") {
      buff[0] = 0x01;
      if (value !== 1 && value !== 0 &&
        value !== "HIGH" && value !== "LOW") {

        throw new Error(
          "Unexpected digitalWrite value"
        );
      }
      if (value == "HIGH") {
        value = 1;
      } else if (value == "LOW") {
        value = 0;
      }
    } else {
      buff[0] = 0x02;
    }

    // write out pin
    pin = ""+pin; // coerce to string so we don't care about input format
    buff[1] = ((pin[0] == 'A' || pin[0] == 'a') ? 'A' : 'D').charCodeAt();
    buff[2] = parseInt(pin.replace(/A|D/i, ""), 10);
    // write value
    buff[3] = value;

    console.log("writing: "+buff.toString())
    this.localSocket.write(buff);
  };
});


// TODO: Define protocol for gather this information.
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


