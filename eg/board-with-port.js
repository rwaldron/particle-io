var five = require("johnny-five"),
  Spark = require("../lib/spark"),
  board;

// Johnny-Five will try its hardest to detect the port for you,
// however you may also explicitly specify the port by passing
// it as an optional property to the Board constructor:
board = new five.Board({
  io: new Spark({
    token: process.env.SPARK_TOKEN,
    deviceId: process.env.SPARK_DEVICE_ID
  }),
  port: "/dev/cu.usbmodem1421"
});

// The board's pins will not be accessible until
// the board has reported that it is ready
board.on("ready", function() {
  console.log("CONNECTED");

  var val = 0;

  // Set built in LED on D7 to OUTPUT mode
  this.pinMode("D7", this.MODES.OUTPUT);

  // Create a loop to "flash/blink/strobe" an led
  this.loop(100, function() {
    this.digitalWrite("D7", (val = val ? 0 : 1));
  });
});

board.on("error", function(error) {
  console.log(error);
});

