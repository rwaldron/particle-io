var Spark = require("../lib/spark");
var board = new Spark({
  token: "608fd30995205529ffc186d4018a651d253af9a9",
  deviceId: "53ff6f065067544840551187"
});

board.on("ready", function() {
  console.log("CONNECTED");

  this.analogRead("A0", function(data) {
    console.log( "A0",  data );
  });

});
