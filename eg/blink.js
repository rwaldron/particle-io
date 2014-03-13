var Spark = require("../lib/spark");
var board = new Spark({
  token: process.env.SPARK_TOKEN,
  deviceId: process.env.SPARK_DEVICE_ID
});

board.on("ready", function() {
  console.log("CONNECTED");

  var byte = 0;

  this.pinMode("D7", this.MODES.OUTPUT);

  setInterval(function() {
    this.digitalWrite("D7", (byte ^= 1));
  }.bind(this), 500);
});

board.on("error", function(error) {
  console.log(error);
});

