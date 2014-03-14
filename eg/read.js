var Spark = require("../lib/spark");
var board = new Spark({
  token: process.env.SPARK_TOKEN,
  deviceId: process.env.SPARK_DEVICE_ID
});

board.on("ready", function() {
  console.log("CONNECTED");

  this.analogRead("A0", function(data) {
    console.log( "A0",  data );
  });

});
