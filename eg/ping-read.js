var Photon = require("../lib/particle");
var board = new Photon({
  token: "f3fca6f7dcd7ece92843a471a804b5919bb3a4dd",
  // deviceId: "55ff72065075555327581687",
  deviceId: "31002e000347343337373739",
});

board.on("ready", function() {
  console.log("READY");

  var continuousRead = function() {
    this.pingRead({ pin: "D3" }, function(duration) {
      console.log(duration);

      setTimeout(continuousRead, 65);
    });
  }.bind(this);

  continuousRead();
});
