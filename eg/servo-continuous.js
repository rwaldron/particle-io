var five = require("johnny-five"),
  Spark = require("../lib/spark"),
  board;

// Create Johnny-Five board connected via Spark
board = new five.Board({
  io: new Spark({
    token: process.env.SPARK_TOKEN,
    deviceId: process.env.SPARK_DEVICE_ID
  })
});

// The board's pins will not be accessible until
// the board has reported that it is ready
board.on("ready", function() {

  // Create a new `servo` hardware instance.
  var servo = new five.Servo({
    pin: "D0",
    // `type` defaults to standard servo.
    // For continuous rotation servos, override the default
    // by setting the `type` here
    type: "continuous"
  });

  // Inject the `servo` hardware into
  // the Repl instance's context;
  // allows direct command line access
  board.repl.inject({
    servo: servo
  });

  // Continuous Rotation Servo API

  // cw( speed )
  // clockWise( speed)
  // ccw( speed )
  // counterClockwise( speed )
  //
  // Set the speed at which the continuous rotation
  // servo will rotate at, either clockwise or counter
  // clockwise, respectively
  servo.cw(0.5); // half speed clockwise

});