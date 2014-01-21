"use strict";

var Spark = require("../lib/spark");
var Emitter = require("events").EventEmitter;
var sinon = require("sinon");

// console.log(WeakMap);

function command(stub) {
  Spark.prototype.command.isTest = true;
  sinon.stub(Spark.prototype.command, "stub", stub);
}

command.reset = function() {
  if (Spark.prototype.command.isTest) {
    Spark.prototype.command.isTest = false;
    Spark.prototype.command.stub.restore();
  }
};

exports["Spark"] = {
  setUp: function(done) {

    this.clock = sinon.useFakeTimers();

    command(function(received) {
      received.handler(null, {
        connected: true
      });
    });

    this.spark = new Spark({
      token: "token",
      deviceId: "deviceId",
      stub: function() {

      }
    });

    this.command = sinon.spy(this.spark, "command");

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
      name: "command"
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
    command.reset();

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
  },
  error: function(test) {
    test.expect(1);

    command.reset();
    command(function(received) {
      received.handler({
        error: 404,
        error_description: "foo"
      });
    });

    this.spark.on("error", function() {
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

  exports[entry] = {
    setUp: function(done) {

      this.clock = sinon.useFakeTimers();

      this.spark = new Spark({
        token: "token",
        deviceId: "deviceId"
      });

      this.command = sinon.spy(this.spark, "command");

      done();
    },
    tearDown: function(done) {
      command.reset();

      this.clock.restore();
      done();
    }
  };

  // *Read Tests
  if (/read/.test(action)) {
    exports[entry].command = function(test) {
      test.expect(2);

      var handler = function(value) {
        test.equal(value, 1);
        test.done();
      };

      command(function(received) {

        test.deepEqual(received, {
          action: action,
          handler: handler,
          method: "post",
          pin: "A0",
          value: undefined,
          outbound: {
            access_token: "token",
            params: "A0"
          }
        });

        received.handler(1);
      });

      this.spark[fn]("A0", handler);

      this.clock.tick(100);
    };

    exports[entry].interval = function(test) {
      test.expect(1);

      var calls = 0;

      command(function(received) {
        received.handler();
      });


      this.spark[fn]("A0", function() {
        calls++;

        if (calls === 5) {
          test.ok(true);
          test.done();
        }
      });

      this.clock.tick(100);
    };
  } else {

    // *Write Tests
    var index = action === "analogwrite" ? 8 : 0;
    var pin = action === "analogwrite" ? "A0" : "D0";
    var value = action === "analogwrite" ? 255 : "HIGH";


    exports[entry].command = function(test) {
      test.expect(1);

      command(function(received) {
        test.deepEqual(received, {
          action: action,
          handler: undefined,
          method: "post",
          // analogwrite ? "A0" : "D0"
          pin: pin,
          // analogwrite ? 4095 : "HIGH"
          value: value,
          outbound: {
            access_token: "token",
            params: [pin, value].join()
          }
        });
        test.done();
      });

      this.spark[fn](pin, value);
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
