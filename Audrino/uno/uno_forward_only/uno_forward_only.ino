// Nano demo: reads one line and prints the action. Baud 9600.
void setup() {
  Serial.begin(9600);
  Serial.println("Nano ready. 1=FWD,2=BACK,3=LEFT,4=RIGHT,0=STOP, 'S L R' set speed");
}
void loop() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line.length()==0) return;

  if (line=="1")        Serial.println("[ACTION] Move FORWARD");
  else if (line=="2")   Serial.println("[ACTION] Move BACKWARD");
  else if (line=="3")   Serial.println("[ACTION] Turn LEFT");
  else if (line=="4")   Serial.println("[ACTION] Turn RIGHT");
  else if (line=="0")   Serial.println("[ACTION] STOP");
  else if (line.startsWith("S")) {
    int l=0,r=0;
    int a=line.indexOf(' '), b=line.indexOf(' ', a+1);
    if (a>0 && b>a) { l=line.substring(a+1,b).toInt(); r=line.substring(b+1).toInt(); }
    Serial.print("[ACTION] Set speed -> L="); Serial.print(l); Serial.print(" R="); Serial.println(r);
  } else if (line.startsWith("U ")) {
    Serial.print("[INFO] Unknown op relayed: "); Serial.println(line.substring(2));
  } else {
    Serial.print("[WARN] Unrecognized code: "); Serial.println(line);
  }
}
