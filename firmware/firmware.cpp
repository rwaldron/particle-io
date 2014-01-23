int DEBUG=1;


TCPClient client;
long SerialSpeed[] = {600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 57600, 115200};

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
  if(DEBUG)
    Serial.println("Attempting to connect to server: "+ip+":"+port);

  byte serverAddress[4];
  ipArrayFromString(serverAddress, ip);
  int serverPort = port.toInt();
  if (client.connect(serverAddress, serverPort)) {
    if (DEBUG)
      Serial.println("Connected to server: "+ip+":"+port);
    return 1; // successfully connected

  } else {
    if(DEBUG)
      Serial.println("Unable to connect to server: "+ip+":"+port);
    return -1; // failed to connect
  }
}

void setup() {
  Spark.function("connect", connectToMyServer);
  if(DEBUG)
    Serial.begin(115200);

}

void loop() {
  if (client.connected()) {
    if (client.available()) {
      // parse and execute commands

      int action = client.read();
      if(DEBUG)
        Serial.println("Action received: "+('0'+action));

      int pin, mode, val, type, speed;
      switch (action) {
        case 0x00:  // pinMode
           pin = client.read();
           mode = client.read();
          if (mode == 0x00) {
            pinMode(pin, INPUT);
          } else if (mode == 0x01) {
            pinMode(pin, INPUT_PULLUP);
          } else if (mode == 0x02) {
            pinMode(pin, INPUT_PULLDOWN);
          } else if (mode == 0x03) {
            pinMode(pin, OUTPUT);
          }
          break;
        case 0x01:  // digitalWrite
           pin = client.read();
           val = client.read();
          digitalWrite(pin, val);
          break;
        case 0x02:  // analogWrite
           pin = client.read();
           val = client.read();
          analogWrite(pin, val);
          break;
        case 0x03:  // digitalRead
           pin = client.read();
           val = digitalRead(pin);
          client.write(0x03);
          client.write(pin);
          client.write(val);
          break;
        case 0x04:  // analogRead
           pin = client.read();
           val = analogRead(pin);
          client.write(0x04);
          client.write(pin);
          client.write(val);
          break;
        case 0x05:  // serial.begin
           type = client.read();
           speed = client.read();
          if (type == 0) {
            Serial.begin(SerialSpeed[speed]);
          } else {
            Serial1.begin(SerialSpeed[speed]);
          }
          break;
        case 0x06:  // serial.end
          type = client.read();
          if (type == 0) {
            Serial.end();
          } else {
            Serial1.end();
          }
          break;
        case 0x07:  // serial.peek
          type = client.read();
          if (type == 0) {
            val = Serial.peek();
          } else {
            val = Serial1.peek();
          }
          client.write(0x07);
          client.write(type);
          client.write(val);
          break;

        default:
          break;
      }
    }
  }
}