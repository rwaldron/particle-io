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

board.on("ready", function() {
  var rgb, rainbow, index;


  // Initialize the RGB LED
  rgb = new five.Led.RGB(["A5", "A6", "A7"]);
  rainbow = ["FF000", "FF7F00", "00FF00", "FFFF00", "0000FF", "4B0082", "8F00FF"];
  index = 0;

  setInterval(function() {
    if (index + 1 === rainbow.length) {
      index = 0;
    }
    rgb.color(rainbow[index++]);
  }, 1000);

});