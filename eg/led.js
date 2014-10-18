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


  // Initialize the LED
  var led = new five.Led("A5");
  
  board.repl.inject({
    led: led
  });

  led.blink(1000);

});

board.on("error", function(error) {
  console.log(error);
});
