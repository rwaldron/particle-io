var Spark = require("../lib/spark");
var board = new Spark({
  token: "{{yours}}",
  deviceId: "{{yours}}"
});


board.on("ready", function(data) {
  console.log("CONNECTED", data);

  var byte = 0;

  setInterval(function() {
    console.log("message");
    this.digitalWrite("D7", (byte ^= 1));
  }.bind(this), 500);
});

board.on("error", function(error) {
  console.log(error);
});
