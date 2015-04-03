var Spark = require("../lib/spark.js");
var board = new Spark({
    token: process.env.SPARK_TOKEN,
    deviceId: process.env.SPARK_DEVICE_ID  
});

board.on("ready", function() {
  var rainbow = ["FF0000", "FF7F00", "00FF00", "FFFF00", "0000FF", "4B0082", "8F00FF"];
  var index = 0;

  setInterval(function() {
    if (index + 1 === rainbow.length) {
      index = 0;
    }
    board.internalRGB(rainbow[index++]);
  }.bind(this), 500);
});
