var Spark = require("../lib/spark");
var board = new Spark({
  token: "{{ YOUR TOKEN }}",
  deviceId: "{{ YOUR DEVICE ID }}"
});

board.on("ready", function() {
  console.log("CONNECTED");

  this.analogRead("A0", function(data) {
    console.log( "A0",  data );
  });

});
