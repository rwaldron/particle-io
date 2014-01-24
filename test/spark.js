"use strict";

var Spark = require("../lib/spark");
var Emitter = require("events").EventEmitter;
var sinon = require("sinon");


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
}

sinon.stub(Spark.Server, "create", function(spark, onCreated) {
  process.nextTick(onCreated);
});

exports["Spark"] = {
  setUp: function(done) {

    this.clock = sinon.useFakeTimers();

    this.state = new State();
    this.map = sinon.stub(Map.prototype, "get").returns(this.state);
    this.socketwrite = sinon.spy(this.state.socket, "write");
    this.connect = sinon.stub(Spark.prototype, "connect", function(handler) {
      handler(null);
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
      name: "digitalRead"
    }, {
      name: "digitalWrite"
    }, {
      name: "servoWrite"
    }, {
      name: "connect"
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
    this.connect.restore();
    this.map.restore();
    this.socketwrite.restore();
    this.clock.restore();
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
  ready: function(test) {
    test.expect(1);

    this.spark.on("ready", function() {
      test.ok(true);
      test.done();
    });
  }
};

[
  'analogWrite',
  'digitalWrite',
  'analogRead',
  'digitalRead'
].forEach(function(fn) {
  var entry = "Spark.prototype." + fn;
  var action = fn.toLowerCase();
  var isAnalog = action === "analogwrite" || action === "analogread";

  var index = isAnalog ? 10 : 0;
  var pin = isAnalog ? "A0" : "D0";
  var value = isAnalog ? 255 : 1;
  var sent = isAnalog ? [2, 10, 255] : [1, 0, 1];
  var receiving = new Buffer(isAnalog ? [4, 10, 4095] : [3, 0, 1]);

  exports[entry] = {
    setUp: function(done) {

      this.clock = sinon.useFakeTimers();

      this.state = new State();
      this.map = sinon.stub(Map.prototype, "get").returns(this.state);
      this.socketwrite = sinon.spy(this.state.socket, "write");
      this.connect = sinon.stub(Spark.prototype, "connect", function(handler) {
        handler(null);
      });

      this.spark = new Spark({
        token: "token",
        deviceId: "deviceId"
      });

      done();
    },
    tearDown: function(done) {
      this.connect.restore();
      this.map.restore();
      this.socketwrite.restore();
      this.clock.restore();

      done();
    }
  };

  // *Read Tests
  if (/read/.test(action)) {

    exports[entry].data = function(test) {
      test.expect(1);

      var handler = function(value) {
        test.equal(value, receiving[2]);
        test.done();
      };

      this.spark[fn](pin, handler);

      this.state.socket.emit("data", receiving);

      // this.clock.tick(100);
    };

    // exports[entry].interval = function(test) {
    //   test.expect(1);

    //   var calls = 0;

    //   connect(function(received) {
    //     received.handler();
    //   });


    //   this.spark[fn]("A0", function() {
    //     calls++;

    //     if (calls === 5) {
    //       test.ok(true);
    //       test.done();
    //     }
    //   });

    //   this.clock.tick(100);
    // };
  } else {

    // *Write Tests


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
    done();
  },
  tearDown: function(done) {
    done();
  },
  alias: function(test) {
    test.expect(1);
    test.equal(
      Spark.prototype.servoWrite,
      Spark.prototype.analogWrite
    );
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
      handler(null);
    });

    this.spark = new Spark({
      token: "token",
      deviceId: "deviceId"
    });

    done();
  },
  tearDown: function(done) {
    this.connect.restore();
    this.map.restore();
    this.socketwrite.restore();
    this.clock.restore();

    done();
  },
  analog: function(test) {
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
  digital: function(test) {
    test.expect(4);

    var sent = [0, 0, 1];

    this.spark.pinMode("D0", 1);

    test.ok(this.socketwrite.calledOnce);

    var buffer = this.socketwrite.args[0][0];


    for (var i = 0; i < sent.length; i++) {
      test.equal(sent[i], buffer.readUInt8(i));
    }
    test.done();
  }
};
