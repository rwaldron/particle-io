TCPClient client;

void ipArrayFromString(byte ipArray[], String ipString) {
  int dot1 = ipString.indexOf('.');
  ipArray[0] = ipString.substring(0, dot1).toInt();
  int dot2 = ipString.indexOf('.', dot1 + 1);
  ipArray[1] = ipString.substring(dot1 + 1, dot2).toInt();
  dot1 = ipString.indexOf('.', dot2 + 1);
  ipArray[2] = ipString.substring(dot2 + 1, dot1).toInt();
  ipArray[3] = ipString.substring(dot1 + 1).toInt();
}

int connectToMyServer(String params) {
  //parse data
  int colonIndex = params.indexOf(":");
  String ip = params.substring(0, colonIndex);
  String port = params.substring(colonIndex+1, params.length());

  byte serverAddress[4];
  ipArrayFromString(serverAddress, ip);
  int serverPort = port.toInt();
  if (client.connect(serverAddress, serverPort)) {
    return 1; // successfully connected
  } else {
    return -1; // failed to connect
  }
}

void setup() {
  Spark.function("connect", connectToMyServer);


}

void loop() {
  if (client.connected()) {
    if (client.available()) {
      // parse and execute commands

      int action = client.read();


      if (action == 0x00) {
        // TODO: pinMode
        int pin = client.read();
        int mode = client.read();

        if (mode == 0x00) {
          pinMode(pin, INPUT);
        } else if (mode == 0x01) {
          pinMode(pin, INPUT_PULLUP);
        } else if (mode == 0x02) {
          pinMode(pin, INPUT_PULLDOWN);
        } else if (mode == 0x03) {
          pinMode(pin, OUTPUT);
        }
      } else if (action == 0x01) {
        // digitalWrite
        int pin = client.read();
        int value = client.read();
        digitalWrite(pin, value);
      } else if (action == 0x02) {
        // analogWrite
        int pin = client.read();
        int value = client.read();
        analogWrite(pin, value);
      } else if (action == 0x03) {
        // digitalRead
        int pin = client.read();
        int val = digitalRead(pin);
        client.write(0x03);
        client.write(pin);
        client.write(val);
      } else if (action == 0x04) {
        // analogRead
        int pin = client.read();
        int val = analogRead(pin);
        client.write(0x04);
        client.write(pin);
        client.write(val);
      }
    }
  }
}