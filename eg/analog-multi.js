var Spark = require("../lib/spark");
var board = new Spark({
  token: process.env.SPARK_TOKEN,
  deviceId: process.env.SPARK_DEVICE_BLACK
});

board.on("ready", function() {
  console.log("CONNECTED");

  var pins = [
    "A0",
    "A1"
  ];

  pins.forEach(function(pin) {
    this.pinMode(pin, this.MODES.INPUT);
    this.analogRead(pin, function(data) {
      console.log(pin,  data);
    });
  }, this);
});
