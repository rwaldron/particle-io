var Spark = require("../lib/spark");
var board = new Spark({
  token: "YOUR TOKEN HERE",
  deviceId: "YOUR TOKEN HERE"
});

board.on("ready", function() {
  console.log("CONNECTED");

  var byte = 0;

  this.pinMode("D7", this.MODES.OUTPUT);

  setInterval(function() {
    this.digitalWrite("D7", (byte ^= 1));
  }.bind(this), 100);
});

board.on("error", function(error) {
  console.log(error);
});

