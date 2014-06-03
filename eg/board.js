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
  console.log("CONNECTED");

  // Once connected, we can do normal Johnny-Five stuff
  var led = new five.Led("D7");

  led.blink();

});

board.on("error", function(error) {
  console.log(error);
});
