var five     = require("johnny-five");
var Spark    = require("../lib/spark");
var keypress = require('keypress');

keypress(process.stdin);

var board = new five.Board({
  io: new Spark({
    token: process.env.SPARK_TOKEN,
    deviceId: process.env.SPARK_DEVICE_ID
  })
});


board.on("ready", function() {

  console.log("Let's test a simple servo. Use Up and Down arrows for CW and CCW respectively. Space to stop.");

  var servo  = new five.Servo({
      pin  : "D0",
      type : 'continuous'
  }).stop();

  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.setRawMode(true);

  process.stdin.on('keypress', function (ch, key) {
    
    if ( !key ) {
      return;
    }

    if ( key.name === 'q' ) {

      console.log('Quitting');
      process.exit();

    } else if ( key.name === 'up' ) {

      console.log('CW');
      servo.cw();

    } else if ( key.name === 'down' ) {

      console.log('CCW');
      servo.ccw();

    } else if ( key.name === 'space' ) {

      console.log('Stopping');
      servo.stop();

    }

  });

});