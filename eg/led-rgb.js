var five = require("johnny-five"),
  Spark = require("../lib/spark"),
  keypress = require("keypress"),
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


  // Initialize the RGB LED
  var led = new five.Led.RGB({
    pins: {
      red: "A5",
      green: "A6",
      blue: "A7"
    }
  });

  // RGB LED alternate constructor
  // This will normalize an array of pins in [r, g, b]
  // order to an object (like above) that's shaped like:
  // {
  //   red: r,
  //   green: g,
  //   blue: b
  // }
  //var led = new five.Led.RGB(['A5','A6','A7']);

  // Turn it on and set the initial color
  led.on();
  led.color("#FF0000");

  // Listen for user input to change the RGB color
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.setRawMode(true);

  var keymap = {
    r: "#FF0000", // red
    g: "#00FF00", // green
    b: "#0000FF", // blue
    w: "#FFFFFF"  // white
  };

  process.stdin.on("keypress", function(ch, key) {

    if (!key) {
      return;
    }

    if (keymap[key.name]) {
      led.color(keymap[key.name]);
    } else {
      led.off();
    }

  });

});

board.on("error", function(error) {
  console.log(error);
});
