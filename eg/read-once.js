var Spark = require("../lib/spark");
var board = new Spark({
  token: process.env.SPARK_TOKEN,
  deviceId: process.env.SPARK_DEVICE_2
});

board.on("ready", function() {

  console.log("Ready...");

  this.pinMode("A0", this.MODES.ANALOG);
  this.pinMode("D0", this.MODES.INPUT);

  this.analogReadOnce("A0", function(data) {
    console.log("analogReadOnce", data);
  });

  this.digitalReadOnce("D0", function(data) {
    console.log("digitalReadOnce", data);
  });
});
