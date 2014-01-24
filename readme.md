# Spark-io

Spark-io is a Firmata-compatibility IO class for writing node programs that interact with [Spark devices](http://docs.spark.io/).

### Getting Started

With your Spark device connected to the correct Wifi network:

1. Open the [Spark.io Editor](https://www.spark.io/build). (Be sure to "claim" your Spark core device).
2. Copy and paste the entire contents of `firmware/voodoospark.cpp` into the editor window.
3. Click "Verify"
4. Click "Flash"

Once the flashing process is complete, close the Spark.io Editor.

### Usage

This module can be used a substitute IO layer with [Johnny-Five](https://github.com/rwaldron/johnny-five).

### Blink an Led

The "Hello World" of microcontroller programming:

```js
var Spark = require("spark-io");
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
```

### API

This is copied directly from [The Tinker API](http://docs.spark.io/#/start/tinkering-with-tinker-the-tinker-api).


**digitalWrite(pin, value)**

> Sets the pin to 1 or 0, which either connects it to 3.3V (the maximum voltage of the system) or to GND (ground). Pin D7 is connected to an on-board LED; if you set pin D7 to HIGH, the LED will turn on, and if you set it to LOW, it will turn off.

> The parameters must be the pin (A0 to A7, D0 to D7), followed by either HIGH or LOW, separated by a comma. The return value will be 1 if the write succeeds, and -1 if it fails.

> [Tinker API: digitalWrite](http://docs.spark.io/#/start/the-tinker-api-digitalwrite)

Example:
```js
// This will turn on the on-board LED
board.digitalWrite("D7", 1);
```



**analogWrite(pin, value)**

> Sets the pin to a value between 0 and 255, where 0 is the same as LOW and 255 is the same as HIGH. This is sort of like sending a voltage between 0 and 3.3V, but since this is a digital system, it uses a mechanism called Pulse Width Modulation, or PWM. You could use analogWrite to dim an LED, as an example.

> The parameters must be the pin (A0 to A7, D0 to D7), followed by an integer value from 0 to 255, separated by a comma. The return value will be 1 if the write succeeds, and -1 if it fails.

> [Tinker API: analogWrite](http://docs.spark.io/#/start/the-tinker-api-analogwrite)

Example:
```js
// Crank an LED to full brightness
board.analogWrite("A7", 255);
```

**servoWrite(pin, value)** This is an alias to `analogWrite`


**digitalRead(pin, handler)** Setup a continuous read handler for specific digital pin.

> This will read the digital value of a pin, which can be read as either HIGH or LOW. If you were to connect the pin to 3.3V, it would read HIGH; if you connect it to GND, it would read LOW. Anywhere in between, it’ll probably read whichever one it’s closer to, but it gets dicey in the middle.

> The parameters must be the pin (A0 to A7, D0 to D7). The return value will be between 0 and 4095 if the read succeeds, and -1 if it fails.

> [Tinker API: digitalRead](http://docs.spark.io/#/start/the-tinker-api-digitalread)

Example:
```js
// Log all the readings for D1
board.digitalRead("D1", function(data) {
  console.log(data);
});
```


**analogRead(pin, handler)** Setup a continuous read handler for specific analog pin.

> This will read the analog value of a pin, which is a value from 0 to 4095, where 0 is LOW (GND) and 4095 is HIGH (3.3V). All of the analog pins (A0 to A7) can handle this. analogRead is great for reading data from sensors.

> The parameters must be the pin (A0 to A7, D0 to D7). The return value will be between 0 and 4095 if the read succeeds, and -1 if it fails.

> [Tinker API: analogRead](http://docs.spark.io/#/start/the-tinker-api-analogread)

Example:
```js
// Log all the readings for A1
board.analogRead("A1", function(data) {
  console.log(data);
});

```

## License
See LICENSE file.

