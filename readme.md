# Spark-io

[![Build Status](https://travis-ci.org/rwaldron/spark-io.png?branch=master)](https://travis-ci.org/rwaldron/spark-io)

Spark-io is a Firmata-compatibility IO class for writing node programs that interact with [Spark devices](http://docs.spark.io/). Spark-io was built at [Bocoup](http://bocoup.com/)

### Getting Started

In order to use the spark-io library, you will need to load the special
[voodoospark](https://github.com/voodootikigod/voodoospark) firmware onto your
device. We recommend you review [VoodooSpark's Getting Started](https://github.com/voodootikigod/voodoospark#getting-started) before continuing.

We recommend storing the token and device id in a dot file containing these: 

```bash
export SPARK_TOKEN = "...your token..."
export SPARK_DEVICE_ID = "...your device id..."
```



### Blink an Led


The "Hello World" of microcontroller programming:

```js
var Spark = require("spark-io");
var board = new Spark({
  token: process.env.SPARK_TOKEN,
  deviceId: process.env.SPARK_DEVICE_ID
});

board.on("ready", function() {
  console.log("CONNECTED");
  this.pinMode("D7", this.MODES.OUTPUT);

  var byte = 0;

  // This will "blink" the on board led
  setInterval(function() {
    this.digitalWrite("D7", (byte ^= 1));
  }.bind(this), 500);
});
```

### Johnny-Five IO Plugin

Spark-IO can be used as an [IO Plugin](https://github.com/rwaldron/johnny-five/wiki/IO-Plugins) for [Johnny-Five](https://github.com/rwaldron/johnny-five):

```js
var five = require("johnny-five");
var Spark = require("spark-io");
var board = new five.Board({
  io: new Spark({
    token: process.env.SPARK_TOKEN,
    deviceId: process.env.SPARK_DEVICE_ID
  })
});

board.on("ready", function() {
  var led = new five.Led("D7");
  led.blink();
});
```


### API

**MODES**

> The `MODES` property is available as a Spark instance property:

```js
var board = new Spark(...);
board.MODES;
```
- INPUT: 0
- OUTPUT: 1
- ANALOG: 2
- PWM: 3
- SERVO: 4


**pinMode(pin, MODE)**

> Set a pin's mode to any one of the MODES

Example:
```js
var board = new Spark(...);

board.on("ready", function() {

  // Set digital pin 7 to OUTPUT:
  this.pinMode("D7", this.MODES.OUTPUT);

  // or just use the integer:
  this.pinMode("D7", 1);

});
```



**digitalWrite(pin, value)**

> Sets the pin to `1` or `0`, which either connects it to 3.3V (the maximum voltage of the system) or to GND (ground).

Example:
```js
var board = new Spark(...);

board.on("ready", function() {

  // This will turn ON the on-board LED
  this.digitalWrite("D7", 1);

  // OR...

  // This will turn OFF the on-board LED
  this.digitalWrite("D7", 0);

});
```

**analogWrite(pin, value)**

> Sets the pin to an 8-bit value between 0 and 255, where 0 is the same as LOW and 255 is the same as HIGH. This is sort of like sending a voltage between 0 and 3.3V, but since this is a digital system, it uses a mechanism called Pulse Width Modulation, or PWM. You could use analogWrite to dim an LED, as an example. PWM is available on D0, D1, A0, A1, A4, A5, A6 and A7.


Example:
```js
var board = new Spark(...);

board.on("ready", function() {

  // Set an LED to full brightness
  this.analogWrite("A7", 255);

  // OR...

  // Set an LED to half brightness
  this.analogWrite("A7", 128);

});
```

**servoWrite(pin, value)**

> Sets the pin to a value between 0 and 180, where the value represents degrees of the servo horn. The value is converted to a PWM signal. PWM is available on D0, D1, A0, A1, A4, A5, A6 and A7.

Example:
```js
var board = new Spark(...);

board.on("ready", function() {

  // Move a servo to 90 degrees
  this.servoWrite("D0", 90);

});
```


**digitalRead(pin, handler)** Setup a continuous read handler for specific digital pin (D0-D7).

> This will read the digital value of a pin, which can be read as either HIGH or LOW. If you were to connect the pin to a 3.3V source, it would read HIGH (1); if you connect it to GND, it would read LOW (0).

Example:
```js
var board = new Spark(...);

board.on("ready", function() {

  // Log all the readings for D1
  this.digitalRead("D1", function(data) {
    console.log(data);
  });

});
```


**analogRead(pin, handler)** Setup a continuous read handler for specific analog pin (A0-A7). Use with all analog sensors


Example:
```js
var board = new Spark(...);

board.on("ready", function() {

  // Log all the readings for A1
  this.analogRead("A1", function(data) {
    console.log(data);
  });

});
```



### Notes

- The Spark Core docs state that PWM is available on A0, A1, A4, A5, A6, A7, D0 and D1. These pins have now all been confirmed and are supported as of v0.4.0.

## License
See LICENSE file.
