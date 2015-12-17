# Particle-io

[![Build Status](https://travis-ci.org/rwaldron/particle-io.png?branch=master)](https://travis-ci.org/rwaldron/particle-io)

Particle-io is a Firmata-compatibility IO class for writing node programs that interact with [Particle devices](http://docs.particle.io/) (formerly Spark). Particle-io was built at [Bocoup](http://bocoup.com/)

### Getting Started

In order to use the particle-io library, you will need to load the special
[voodoospark](https://github.com/voodootikigod/voodoospark) firmware onto your
device. We recommend you review [VoodooSpark's Getting Started](https://github.com/voodootikigod/voodoospark#getting-started) before continuing.

We also recommend storing your Particle token and device ID in a dot file so they can be accessed as properties of `process.env`. Create a file in your home directory called `.particlerc` that contains: 

```sh
export PARTICLE_TOKEN="your particle token"
export PARTICLE_DEVICE_ID="your device id"
```

Then add the following to your dot-rc file of choice:

```sh
source ~/.particlerc
```

Ensure your host computer (where you're running your Node.js application) and the Particle are on the same local network.

### Blink an Led


The "Hello World" of microcontroller programming:

```js
var Particle = require("particle-io");
var board = new Particle({
  token: process.env.PARTICLE_TOKEN,
  deviceId: process.env.PARTICLE_DEVICE_ID
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

Particle-IO can be used as an [IO Plugin](https://github.com/rwaldron/johnny-five/wiki/IO-Plugins) for [Johnny-Five](https://github.com/rwaldron/johnny-five):

```js
var five = require("johnny-five");
var Particle = require("particle-io");
var board = new five.Board({
  io: new Particle({
    token: process.env.PARTICLE_TOKEN,
    deviceId: process.env.PARTICLE_DEVICE_ID
  })
});

board.on("ready", function() {
  var led = new five.Led("D7");
  led.blink();
});
```


### API
**Constructor**
The Particle component can be connected using one of three mechanisms: `deviceId`, `deviceName`, or `host`/`port`.  Both `deviceId` and `deviceName` require an additional `token` so that the host and port of the device can be retrieved from the Particle cloud.

Example:
```js
var Particle = require("particle-io");

var byId = new Particle({
  token: process.env.PARTICLE_TOKEN,
  deviceId: process.env.PARTICLE_DEVICE_ID
});

var byName = new Particle({
  token: process.env.PARTICLE_TOKEN,
  deviceName: process.env.PARTICLE_DEVICE_NAME || "crazy_pickle"
});

var byIp = new Particle({
  host: '192.168.0.111',
  port: 48879
});
```

**device properties**
You can get the information that the component knows about the chip with some read-only device properties.  This is useful for retrieving the IP address of the Particle so that you can swith over to `host`/`port` mode if necessary.

The available properties are:
- `deviceId`: The ID of the device
- `deviceName`: The name of the device
- `deviceIp`: The IP address of the device on the local network
- `devicePort`: The port the device is listening on for connections

Example:
```js
var Particle = require("particle-io");

var board = new Particle({
  token: process.env.PARTICLE_TOKEN,
  deviceName: process.env.PARTICLE_DEVICE_Name || "crazy_pickle"
});

board.on("ready", function() {
  console.log(
    "Connected to " + board.deviceName + 
    " (" + board.deviceId + ") " +
    "at " + board.deviceIp + ":" + board.devicePort
  );
});
```

**MODES**

> The `MODES` property is available as a Particle instance property:

```js
var board = new Particle(...);
board.MODES;
```
- INPUT: 0
- OUTPUT: 1
- ANALOG: 2
- PWM: 3
- SERVO: 4



**pinMode(pin, MODE)**

> Set a pin's mode to any one of the MODES. 

Example:
```js
var board = new Particle(...);

board.on("ready", function() {

  // Set digital pin 7 to OUTPUT:
  this.pinMode("D7", this.MODES.OUTPUT);

  // or just use the integer:
  this.pinMode("D7", 1);

});
```

PWM Support (Servo support is also limited to these pins): 
- Core pins: A0, A1, A4, A5, A6, A7, D0, D1.
- Photon pins: A4, A5, D0, D1, D2, D3
- P1 pins: A4, A5, D0, D1, D2, D3


**digitalWrite(pin, value)**

> Sets the pin to `1` or `0`, which either connects it to 3.3V (the maximum voltage of the system) or to GND (ground).

Example:
```js
var board = new Particle(...);

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
var board = new Particle(...);

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
var board = new Particle(...);

board.on("ready", function() {

  // Move a servo to 90 degrees
  this.servoWrite("D0", 90);

});
```


**digitalRead(pin, handler)** Setup a continuous read handler for specific digital pin (D0-D7).

> This will read the digital value of a pin, which can be read as either HIGH or LOW. If you were to connect the pin to a 3.3V source, it would read HIGH (1); if you connect it to GND, it would read LOW (0).

Example:
```js
var board = new Particle(...);

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
var board = new Particle(...);

board.on("ready", function() {

  // Log all the readings for A1
  this.analogRead("A1", function(data) {
    console.log(data);
  });

});
```


## License
See LICENSE file.
