#define DEBUG false;


TCPClient client;
long[] SerialSpeed = [600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 57600, 115200];
bool console = false;
int consoleType = 0;

void log(string) {
  if (console) {
    (consoleType ? Serial1.println(string) : Serial.println(string));
  }
}

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
  (DEBUG && Serial.println("Attempting to connect to server: "+ip+":"+port));
  byte serverAddress[4];
  ipArrayFromString(serverAddress, ip);
  int serverPort = port.toInt();
  if (client.connect(serverAddress, serverPort)) {
    DEBUG && Serial.println("Connected to server: "+ip+":"+port);
    return 1; // successfully connected

  } else {
    DEBUG && Serial.println("Unable to connect to server: "+ip+":"+port);
    return -1; // failed to connect
  }
}

void setup() {
  Spark.function("connect", connectToMyServer);
  DEBUG && Serial.begin(115200);

}

void loop() {
  if (client.connected()) {
    if (client.available()) {
      // parse and execute commands

      int action = client.read();
      DEBUG && Serial.println("Action received: "+('0'+action));
      switch (action) {
        case 0x00:  // pinMode
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
          break;
        case 0x01:  // digitalWrite
          int pin = client.read();
          int value = client.read();
          digitalWrite(pin, value);
          break;
        case 0x02:  // analogWrite
          int pin = client.read();
          int value = client.read();
          analogWrite(pin, value);
          break;
        case 0x03:  // digitalRead
          int pin = client.read();
          int val = digitalRead(pin);
          client.write(0x03);
          client.write(pin);
          client.write(val);
          break;
        case 0x04:  // analogRead
          int pin = client.read();
          int val = analogRead(pin);
          client.write(0x04);
          client.write(pin);
          client.write(val);
          break;
        case 0x05:  // serial.begin
          int type = client.read();
          int speed = client.read();
          if (type == 0) {
            Serial.begin(SerialSpeed[speed]);
          } else {
            Serial1.begin(SerialSpeed[speed]);
          }
          console = true;
          break;
        case 0x06:  // serial.end
          int type = client.read();
          if (type == 0) {
            Serial.end();
          } else {
            Serial1.end();
          }
          console = false;
          break;
        case 0x07:  // serial.peek
          int type = client.read();
          int val;
          if (type == 0) {
            val = Serial.peek();
          } else {
            val = Serial1.peek();
          }
          client.write(0x07);
          client.write(type);
          client.write(val);
          break;

        case 0x07:  // serial.peek
          int type = client.read();
          int val;
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