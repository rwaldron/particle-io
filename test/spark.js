"use strict";

var Spark = require("../lib/spark");
var Emitter = require("events").EventEmitter;
var sinon = require("sinon");
var SparkAPIVariable = {cmd: "VarReturn", result: "127.0.0.1:48879"};


function restore(target) {
  for (var prop in target) {
    if (target[prop] != null &&
        typeof target[prop].restore === "function") {
      target[prop].restore();
    }
    if (typeof target[prop] === "object") {
      restore(target[prop]);
    }
  }
}


function State() {
  this.isConnected = false;
  this.isReading = false;
  this.deviceId = "deviceId";
  this.token = "token";
  this.service = "service";
  this.port = 9000;
  this.server = {};
  this.socket = new Emitter();
  this.socket.write = function() {};
  this.rgb = {
    red: null,
    green: null,
    blue: null
  };
}

sinon.stub(Spark.Client, "create", function(spark, onCreated) {
  process.nextTick(function() {
    spark.emit("ready");
  });
  process.nextTick(onCreated);
});

exports["Spark"] = {
  setUp: function(done) {

    this.clock = sinon.useFakeTimers();

    this.state = new State();
    this.map = sinon.stub(Map.prototype, "get").returns(this.state);
    this.socketwrite = sinon.spy(this.state.socket, "write");
    this.connect = sinon.stub(Spark.prototype, "connect", function(handler) {
      handler(null, {cmd: "VarReturn", result: "127.0.0.1:48879"});
    });

    this.spark = new Spark({
      token: "token",
      deviceId: "deviceId"
    });

    this.proto = {};

    this.proto.functions = [{
      name: "analogRead"
    }, {
      name: "analogWrite"
    }, {
      name: "connect"
    }, {
      name: "digitalRead"
    }, {
      name: "digitalWrite"
    }, {
      name: "pinMode"
    }, {
      name: "servoWrite"
    }];

    this.proto.objects = [{
      name: "MODES"
    }];

    this.proto.numbers = [{
      name: "HIGH"
    }, {
      name: "LOW"
    }];

    this.instance = [{
      name: "pins"
    }, {
      name: "analogPins"
    }];

    done();
  },
  tearDown: function(done) {
    restore(this);
    done();
  },
  shape: function(test) {
    test.expect(
      this.proto.functions.length +
      this.proto.objects.length +
      this.proto.numbers.length +
      this.instance.length
    );

    this.proto.functions.forEach(function(method) {
      test.equal(typeof this.spark[method.name], "function");
    }, this);

    this.proto.objects.forEach(function(method) {
      test.equal(typeof this.spark[method.name], "object");
    }, this);

    this.proto.numbers.forEach(function(method) {
      test.equal(typeof this.spark[method.name], "number");
    }, this);

    this.instance.forEach(function(property) {
      test.notEqual(typeof this.spark[property.name], "undefined");
    }, this);

    test.done();
  },
  readonly: function(test) {
    test.expect(7);

    test.equal(this.spark.HIGH, 1);

    test.throws(function() {
      this.spark.HIGH = 42;
    });

    test.equal(this.spark.LOW, 0);

    test.throws(function() {
      this.spark.LOW = 42;
    });

    test.deepEqual(this.spark.MODES, {
      INPUT: 0,
      OUTPUT: 1,
      ANALOG: 2,
      PWM: 3,
      SERVO: 4
    });

    test.throws(function() {
      this.spark.MODES.INPUT = 42;
    });

    test.throws(function() {
      this.spark.MODES = 42;
    });

    test.done();
  },
  emitter: function(test) {
    test.expect(1);
    test.ok(this.spark instanceof Emitter);
    test.done();
  },
  connected: function(test) {
    test.expect(1);

    this.spark.on("connect", function() {
      test.ok(true);
      test.done();
    });
  },
  ready: function(test) {
    test.expect(1);

    this.spark.on("ready", function() {
      test.ok(true);
      test.done();
    });
  }
};

[
  "analogWrite",
  "digitalWrite",
  "analogRead",
  "digitalRead"
].forEach(function(fn) {
  var entry = "Spark.prototype." + fn;
  var action = fn.toLowerCase();
  var isAnalog = action === "analogwrite" || action === "analogread";

  var index = isAnalog ? 10 : 0;
  var pin = isAnalog ? "A0" : "D0";
  // All reporting messages are received as:
  //
  // [action, pin, lsb, msb]
  //
  // Where lsb and msb are 7-bit bytes that represent a single value
  //
  //
  var receiving = new Buffer(isAnalog ? [4, 10, 127, 31] : [3, 0, 1, 0]);
  var sent, value, type;

  exports[entry] = {
    setUp: function(done) {

      this.clock = sinon.useFakeTimers();

      this.state = new State();
      this.map = sinon.stub(Map.prototype, "get").returns(this.state);
      this.socketwrite = sinon.spy(this.state.socket, "write");
      this.connect = sinon.stub(Spark.prototype, "connect", function(handler) {
        handler(null, {cmd: "VarReturn", result: "127.0.0.1:48879"});
      });

      this.spark = new Spark({
        token: "token",
        deviceId: "deviceId"
      });

      done();
    },
    tearDown: function(done) {
      restore(this);
      done();
    }
  };

  // *Read Tests
  if (/read/.test(action)) {
    type = isAnalog ? "analog" : "digital";
    value = isAnalog ? 1023 : 1;
    // This triggers the "reporting" action to start
    sent = isAnalog ?
      [5, 10, 2] : // continuous, analog 0, analog
      [5, 0, 1];   // continuous, digital 0, digital

    exports[entry].data = function(test) {
      test.expect(4);

      var handler = function(data) {
        test.equal(data, value);
        test.done();
      };

      this.spark[fn](pin, handler);

      var buffer = this.socketwrite.args[0][0];

      for (var i = 0; i < sent.length; i++) {
        test.equal(sent[i], buffer.readUInt8(i));
      }

      this.state.socket.emit("data", receiving);
    };

    exports[entry].handler = function(test) {
      test.expect(1);

      var handler = function(data) {
        test.equal(data, value);
        test.done();
      };

      this.spark[fn](pin, handler);
      this.state.socket.emit("data", receiving);
    };

    exports[entry].event = function(test) {
      test.expect(1);

      var event = type + "-read-" + pin;

      this.spark.once(event, function(data) {
        test.equal(data, value);
        test.done();
      });

      var handler = function(data) {};

      this.spark[fn](pin, handler);
      this.state.socket.emit("data", receiving);
    };

    if (isAnalog) {
      exports[entry].analogPin = function(test) {

        test.expect(1);

        var handler = function(data) {
          test.equal(data, value);
          test.done();
        };

        // Analog read on pin 0 (zero), which is A0 or 10
        this.spark.analogRead(0, handler);
        this.state.socket.emit("data", receiving);
      };
    }

  } else {
    // *Write Tests
    value = isAnalog ? 255 : 1;
    sent = isAnalog ? [2, 10, 255] : [1, 0, 1];
    exports[entry].write = function(test) {
      test.expect(4);

      this.spark[fn](pin, value);

      test.ok(this.socketwrite.calledOnce);

      var buffer = this.socketwrite.args[0][0];

      for (var i = 0; i < sent.length; i++) {
        test.equal(sent[i], buffer.readUInt8(i));
      }

      test.done();
    };

    exports[entry].stored = function(test) {
      test.expect(1);

      this.spark[fn](pin, value);

      test.equal(this.spark.pins[index].value, value);

      test.done();
    };
  }
});


exports["Spark.prototype.servoWrite"] = {
  setUp: function(done) {
    this.clock = sinon.useFakeTimers();

    this.state = new State();
    this.map = sinon.stub(Map.prototype, "get").returns(this.state);
    this.socketwrite = sinon.spy(this.state.socket, "write");
    this.connect = sinon.stub(Spark.prototype, "connect", function(handler) {
      handler(null, {cmd: "VarReturn", result: "127.0.0.1:48879"});
    });

    this.spark = new Spark({
      token: "token",
      deviceId: "deviceId"
    });

    done();
  },
  tearDown: function(done) {
    restore(this);
    done();
  },
  analogWriteToDigital: function(test) {
    test.expect(3);

    var sent = [2, 0, 180];

    this.spark.analogWrite("D0", 180);

    var buffer = this.socketwrite.args[0][0];

    for (var i = 0; i < sent.length; i++) {
      test.equal(sent[i], buffer.readUInt8(i));
    }
    test.done();
  },
  analogWriteToAnalog: function(test) {
    test.expect(3);

    var sent = [2, 10, 255];

    this.spark.analogWrite("A0", 255);

    var buffer = this.socketwrite.args[0][0];

    for (var i = 0; i < sent.length; i++) {
      test.equal(sent[i], buffer.readUInt8(i));
    }
    test.done();
  },

  servoWriteDigital: function(test) {
    test.expect(3);

    var sent = [0x41, 0, 180];

    this.spark.servoWrite("D0", 180);

    var buffer = this.socketwrite.args[0][0];

    for (var i = 0; i < sent.length; i++) {
      test.equal(sent[i], buffer.readUInt8(i));
    }
    test.done();
  },

  servoWriteAnalog: function(test) {
    test.expect(3);

    var sent = [0x41, 10, 180];

    this.spark.servoWrite("A0", 180);

    var buffer = this.socketwrite.args[0][0];

    for (var i = 0; i < sent.length; i++) {
      test.equal(sent[i], buffer.readUInt8(i));
    }
    test.done();
  }
};



exports["Spark.prototype.pinMode"] = {
  setUp: function(done) {

    this.clock = sinon.useFakeTimers();
    this.state = new State();
    this.map = sinon.stub(Map.prototype, "get").returns(this.state);
    this.socketwrite = sinon.spy(this.state.socket, "write");
    this.connect = sinon.stub(Spark.prototype, "connect", function(handler) {
      handler(null, {cmd: "VarReturn", result: "127.0.0.1:48879"});
    });

    this.spark = new Spark({
      token: "token",
      deviceId: "deviceId"
    });

    done();
  },
  tearDown: function(done) {
    restore(this);
    done();
  },
  analogOutput: function(test) {
    test.expect(4);

    var sent = [0, 11, 1];

    this.spark.pinMode("A1", 1);
    test.ok(this.socketwrite.calledOnce);

    var buffer = this.socketwrite.args[0][0];

    for (var i = 0; i < sent.length; i++) {
      test.equal(sent[i], buffer.readUInt8(i));
    }
    test.done();
  },
  analogInput: function(test) {
    test.expect(4);

    var sent = [0, 11, 0];

    this.spark.pinMode("A1", 0);
    test.ok(this.socketwrite.calledOnce);

    var buffer = this.socketwrite.args[0][0];

    for (var i = 0; i < sent.length; i++) {
      test.equal(sent[i], buffer.readUInt8(i));
    }
    test.done();
  },

  analogInputMapped: function(test) {
    test.expect(4);

    var sent = [0, 11, 2];

    this.spark.pinMode(1, 2);
    test.ok(this.socketwrite.calledOnce);

    var buffer = this.socketwrite.args[0][0];

    for (var i = 0; i < sent.length; i++) {
      test.equal(sent[i], buffer.readUInt8(i));
    }
    test.done();
  },

  digitalOutput: function(test) {
    test.expect(4);

    var sent = [0, 0, 1];

    this.spark.pinMode("D0", 1);

    test.ok(this.socketwrite.calledOnce);

    var buffer = this.socketwrite.args[0][0];

    for (var i = 0; i < sent.length; i++) {
      test.equal(sent[i], buffer.readUInt8(i));
    }
    test.done();
  },

  digitalInput: function(test) {
    test.expect(4);

    var sent = [0, 0, 0];

    this.spark.pinMode("D0", 0);

    test.ok(this.socketwrite.calledOnce);

    var buffer = this.socketwrite.args[0][0];

    for (var i = 0; i < sent.length; i++) {
      test.equal(sent[i], buffer.readUInt8(i));
    }
    test.done();
  },

  servo: function(test) {
    test.expect(4);

    var sent = [0, 0, 4];

    this.spark.pinMode("D0", 4);

    test.ok(this.socketwrite.calledOnce);

    var buffer = this.socketwrite.args[0][0];

    for (var i = 0; i < sent.length; i++) {
      test.equal(sent[i], buffer.readUInt8(i));
    }
    test.done();
  },

  pwmCoercedToOutput: function(test) {
    test.expect(4);

    var sent = [0, 0, 1];

    this.spark.pinMode("D0", 3);

    test.ok(this.socketwrite.calledOnce);

    var buffer = this.socketwrite.args[0][0];

    for (var i = 0; i < sent.length; i++) {
      test.equal(sent[i], buffer.readUInt8(i));
    }
    test.done();
  },

  pwmError: function(test) {
    test.expect(9);

    try {
      this.spark.pinMode("D0", 3);
      this.spark.pinMode("D1", 3);
      this.spark.pinMode("A0", 3);
      this.spark.pinMode("A1", 3);
      this.spark.pinMode("A4", 3);
      this.spark.pinMode("A5", 3);
      this.spark.pinMode("A6", 3);
      this.spark.pinMode("A7", 3);

      test.ok(true);
    } catch(e) {
      test.ok(false);
    }

    try {
      this.spark.pinMode("D2", 3);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("D3", 3);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("D4", 3);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("D5", 3);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("D6", 3);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("D7", 3);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("A2", 3);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("A3", 3);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    test.done();
  },

  servoError: function(test) {
    test.expect(9);

    try {
      this.spark.pinMode("D0", 4);
      this.spark.pinMode("D1", 4);
      this.spark.pinMode("A0", 4);
      this.spark.pinMode("A1", 4);
      this.spark.pinMode("A4", 4);
      this.spark.pinMode("A5", 4);
      this.spark.pinMode("A6", 4);
      this.spark.pinMode("A7", 4);

      test.ok(true);
    } catch(e) {
      test.ok(false);
    }

    try {
      this.spark.pinMode("D2", 4);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("D3", 4);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("D4", 4);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("D5", 4);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("D6", 4);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("D7", 4);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("A2", 4);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    try {
      this.spark.pinMode("A3", 4);
      test.ok(false);
    } catch(e) {
      test.ok(true);
    }

    test.done();
  }
};

exports["Spark.prototype.internalRGB"] = {
  setUp: function(done) {

    this.clock = sinon.useFakeTimers();
    this.state = new State();
    this.map = sinon.stub(Map.prototype, "get").returns(this.state);
    this.socketwrite = sinon.spy(this.state.socket, "write");
    this.connect = sinon.stub(Spark.prototype, "connect", function(handler) {
      handler(null, {cmd: "VarReturn", result: "127.0.0.1:48879"});
    });

    this.spark = new Spark({
      token: "token",
      deviceId: "deviceId"
    });

    done();
  },
  tearDown: function(done) {
    restore(this);
    done();
  },

  get: function(test) {
    test.expect(2);

    test.deepEqual(this.spark.internalRGB(), {
      red: null, green: null, blue: null
    });
    test.ok(this.socketwrite.notCalled);

    test.done();
  },

  setReturnsThis: function(test) {
    test.expect(1);

    test.equal(this.spark.internalRGB(0, 0, 0), this.spark);
    test.done();
  },

  setWithThreeArgs: function(test) {
    test.expect(6);

    this.spark.internalRGB(0, 0, 0);

    test.ok(this.socketwrite.called);

    var buffer = this.socketwrite.getCall(0).args[0];

    test.equal(buffer.readUInt8(0), 0x07);
    test.equal(buffer.readUInt8(1), 0);
    test.equal(buffer.readUInt8(2), 0);
    test.equal(buffer.readUInt8(3), 0);

    test.deepEqual(this.spark.internalRGB(), {
      red: 0, green: 0, blue: 0
    });

    test.done();
  },

  setWithArrayOfThreeBytes: function(test) {
    test.expect(6);

    this.spark.internalRGB([0, 0, 0]);

    test.ok(this.socketwrite.called);

    var buffer = this.socketwrite.getCall(0).args[0];

    test.equal(buffer.readUInt8(0), 0x07);
    test.equal(buffer.readUInt8(1), 0);
    test.equal(buffer.readUInt8(2), 0);
    test.equal(buffer.readUInt8(3), 0);

    test.deepEqual(this.spark.internalRGB(), {
      red: 0, green: 0, blue: 0
    });

    test.done();
  },

  setWithObjectContainingPropertiesRGB: function(test) {
    test.expect(6);

    this.spark.internalRGB({
      red: 0, green: 0, blue: 0
    });

    test.ok(this.socketwrite.called);

    var buffer = this.socketwrite.getCall(0).args[0];

    test.equal(buffer.readUInt8(0), 0x07);
    test.equal(buffer.readUInt8(1), 0);
    test.equal(buffer.readUInt8(2), 0);
    test.equal(buffer.readUInt8(3), 0);

    test.deepEqual(this.spark.internalRGB(), {
      red: 0, green: 0, blue: 0
    });

    test.done();
  },

  setWithHexString: function(test) {
    test.expect(6);

    this.spark.internalRGB("#000000");

    test.ok(this.socketwrite.called);

    var buffer = this.socketwrite.getCall(0).args[0];

    test.equal(buffer.readUInt8(0), 0x07);
    test.equal(buffer.readUInt8(1), 0);
    test.equal(buffer.readUInt8(2), 0);
    test.equal(buffer.readUInt8(3), 0);

    test.deepEqual(this.spark.internalRGB(), {
      red: 0, green: 0, blue: 0
    });

    test.done();
  },

  setWithHexStringNoPrefix: function(test) {
    test.expect(6);

    this.spark.internalRGB("000000");

    test.ok(this.socketwrite.called);

    var buffer = this.socketwrite.getCall(0).args[0];

    test.equal(buffer.readUInt8(0), 0x07);
    test.equal(buffer.readUInt8(1), 0);
    test.equal(buffer.readUInt8(2), 0);
    test.equal(buffer.readUInt8(3), 0);

    test.deepEqual(this.spark.internalRGB(), {
      red: 0, green: 0, blue: 0
    });

    test.done();
  },

  setConstrainsValues: function(test) {
    test.expect(6);

    this.spark.internalRGB(300, -1, 256);

    test.ok(this.socketwrite.called);

    var buffer = this.socketwrite.getCall(0).args[0];

    test.equal(buffer.readUInt8(0), 0x07);
    test.equal(buffer.readUInt8(1), 255);
    test.equal(buffer.readUInt8(2), 0);
    test.equal(buffer.readUInt8(3), 255);

    test.deepEqual(this.spark.internalRGB(), {
      red: 255, green: 0, blue: 255
    });

    test.done();
  },

  setBadValues: function(test) {
    var spark = this.spark;

    test.expect(8);

    // null
    test.throws(function() {
      spark.internalRGB(null);
    });

    // shorthand not supported
    test.throws(function() {
      spark.internalRGB("#fff");
    });

    // bad hex
    test.throws(function() {
      spark.internalRGB("#ggffff");
    });

    // by params
    test.throws(function() {
      spark.internalRGB(10, 20, null);
    });
    test.throws(function() {
      spark.internalRGB(10, 20);
    });

    // by array
    test.throws(function() {
      console.log('by array');
      spark.internalRGB([10, 20, null]);
    });
    test.throws(function() {
      console.log('by array');
      spark.internalRGB([10, 20]);
    });

    // by object
    test.throws(function() {
      spark.internalRGB({red: 255, green: 100});
    });

    test.done();
  }
};
