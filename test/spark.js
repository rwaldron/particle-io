"use strict";

var Spark = require("../lib/spark");
var Emitter = require("events").EventEmitter;
var sinon = require("sinon");

sinon.stub(Spark.Server, "create", function(spark, onCreated) {
  process.nextTick(onCreated);
});

// function command(stub) {
//   Spark.prototype.command.isTest = true;
//   if (Spark.prototype.command.stub.restore) {
//     Spark.prototype.command.stub.restore();
//   }
//   sinon.stub(Spark.prototype.command, "stub", stub);
// }

// command.reset = function() {
//   if (Spark.prototype.command.isTest) {
//     Spark.prototype.command.isTest = false;
//     Spark.prototype.command.stub.restore();
//   }
// };

exports["Spark"] = {
  setUp: function(done) {

    this.clock = sinon.useFakeTimers();
    // Spark.prototype.command = function() {};

    this.command = sinon.stub(Spark.prototype, "command", function(opts) {
      opts.handler(null);
    });

    this.spark = new Spark({
      token: "token",
      deviceId: "deviceId"
    });

    // command(function(received) {
    //   received.handler.call(this.spark, null, {
    //     connected: true
    //   });
    // });


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
    this.command.restore();
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
      console.log( "message" );
      test.done();
    });
  }
};

// [
//   'analogWrite',
//   'digitalWrite',
//   'analogRead',
//   'digitalRead'
// ].forEach(function(fn) {
//   var entry = "Spark.prototype." + fn;
//   var action = fn.toLowerCase();

//   exports[entry] = {
//     setUp: function(done) {

//       this.clock = sinon.useFakeTimers();

//       var state = {
//         isConnected: true,
//         deviceId: "deviceId",
//         token: "token",
//         service: "service",
//         port: 9000,
//         server: {},
//         socket: {
//           write: function() {}
//         },
//         timers: {},
//         interval: 20
//       };

//       this.map = sinon.stub(Map.prototype, "get").returns(state);

//       this.socketwrite = sinon.spy(state.socket, "write");


//       // command(function(received) {
//       //   received.handler(null, {
//       //     connected: true
//       //   });
//       // });

//       this.spark = new Spark({
//         token: "token",
//         deviceId: "deviceId"
//       });

//       done();
//     },
//     tearDown: function(done) {
//       // command.reset();

//       this.map.restore();
//       this.socketwrite.restore();
//       this.clock.restore();

//       done();
//     }
//   };

//   // *Read Tests
//   if (/read/.test(action)) {
//     // exports[entry].command = function(test) {
//     //   test.expect(2);

//     //   var handler = function(value) {
//     //     test.equal(value, 1);
//     //     test.done();
//     //   };

//     //   command(function(received) {

//     //     test.deepEqual(received, {
//     //       action: action,
//     //       handler: handler,
//     //       method: "post",
//     //       pin: "A0",
//     //       value: undefined,
//     //       outbound: {
//     //         access_token: "token",
//     //         params: "A0"
//     //       }
//     //     });

//     //     received.handler(1);
//     //   });

//     //   this.spark[fn]("A0", handler);

//     //   this.clock.tick(100);
//     // };

//     // exports[entry].interval = function(test) {
//     //   test.expect(1);

//     //   var calls = 0;

//     //   command(function(received) {
//     //     received.handler();
//     //   });


//     //   this.spark[fn]("A0", function() {
//     //     calls++;

//     //     if (calls === 5) {
//     //       test.ok(true);
//     //       test.done();
//     //     }
//     //   });

//     //   this.clock.tick(100);
//     // };
//   } else {

//     // *Write Tests
//     var index = action === "analogwrite" ? 10 : 0;
//     var pin = action === "analogwrite" ? "A0" : "D0";
//     var value = action === "analogwrite" ? 255 : 1;
//     var sent = action === "analogwrite" ? [2, 10, 255]: [1, 0, 1];


//     exports[entry].write = function(test) {
//       test.expect(4);

//       this.spark[fn](pin, value);

//       test.ok(this.socketwrite.calledOnce);

//       var buffer = this.socketwrite.args[0][0];

//       for (var i = 0; i < sent.length; i++) {
//         test.equal(sent[i], buffer.readUInt8(i));
//       }

//       test.done();
//     };

//     exports[entry].stored = function(test) {
//       test.expect(1);

//       this.spark[fn](pin, value);

//       test.equal(this.spark.pins[index].value, value);

//       test.done();
//     };
//   }
// });


// exports["Spark.prototype.servoWrite"] = {
//   setUp: function(done) {
//     done();
//   },
//   tearDown: function(done) {
//     done();
//   },
//   alias: function(test) {
//     test.expect(1);
//     test.equal(
//       Spark.prototype.servoWrite,
//       Spark.prototype.analogWrite
//     );
//     test.done();
//   }
// };


// exports["Spark.prototype.pinMode"] = {
//   setUp: function(done) {

//     this.clock = sinon.useFakeTimers();

//     var state = {
//       isConnected: true,
//       deviceId: "deviceId",
//       token: "token",
//       service: "service",
//       port: 9000,
//       server: {},
//       socket: {
//         write: function() {}
//       },
//       timers: {},
//       interval: 20
//     };

//     this.map = sinon.stub(Map.prototype, "get").returns(state);

//     this.socketwrite = sinon.spy(state.socket, "write");

//     // command(function(received) {
//     //   received.handler(null, {
//     //     connected: true
//     //   });
//     // });

//     this.spark = new Spark({
//       token: "token",
//       deviceId: "deviceId"
//     });

//     done();
//   },
//   tearDown: function(done) {
//     // command.reset();

//     this.map.restore();
//     this.socketwrite.restore();
//     this.clock.restore();

//     done();
//   },
//   analog: function(test) {
//     test.expect(4);

//     var sent = [0, 11, 1];

//     this.spark.pinMode("A1", 1);

//     test.ok(this.socketwrite.calledOnce);

//     var buffer = this.socketwrite.args[0][0];


//     for (var i = 0; i < sent.length; i++) {
//       test.equal(sent[i], buffer.readUInt8(i));
//     }
//     test.done();
//   },
//   digital: function(test) {
//     test.expect(4);

//     var sent = [0, 0, 1];

//     this.spark.pinMode("D0", 1);

//     test.ok(this.socketwrite.calledOnce);

//     var buffer = this.socketwrite.args[0][0];


//     for (var i = 0; i < sent.length; i++) {
//       test.equal(sent[i], buffer.readUInt8(i));
//     }
//     test.done();
//   }
// };
