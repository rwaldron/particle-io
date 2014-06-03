var five = require("johnny-five"),
  Spark = require("../lib/spark"),
  keypress = require('keypress'),
  board;


// Create Johnny-Five board connected via Spark
board = new five.Board({
  io: new Spark({
    token: process.env.SPARK_TOKEN,
    deviceId: process.env.SPARK_DEVICE_ID
  })
});

// The board's pins will not be accessible until
// the board has reported that it is ready
board.on("ready", function() {
  console.log("CONNECTED");
  //var a = new five.Led.RGB(["A5","A6","A7"]);

  var a = new five.Led.RGB({
    pins: {
      red: "A5",
      green: "A6",
      blue: "A7"
    }
  });

  a.on();
  a.color("#FF0000");

  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.setRawMode(true);

  process.stdin.on('keypress', function (ch, key) {
    
    if ( !key ) {
      return;
    }

    if ( key.name === 'r' ) {
      a.color("#FF0000");
    }else if ( key.name === 'g' ) {
      a.color("#00FF00");
    }else if ( key.name === 'b' ) {
      a.color("#0000FF");
    }else if ( key.name === 'w' ) {
      a.color("#FFFFFF");
    }else if ( key.name === 'o' ) {
      a.color("#000000");
    }

  });

});

board.on("error", function(error) {
  console.log(error);
});
