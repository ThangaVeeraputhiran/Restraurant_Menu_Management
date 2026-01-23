#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

/* ================= GPIO PIN DEFINITIONS ================= */
#define SDA_PIN 4    // GPIO4  (D2)
#define SCL_PIN 5    // GPIO5  (D1)

/* ================= LCD ================= */
LiquidCrystal_I2C lcd(0x27, 16, 2);

/* ================= WIFI ================= */
const char* ssid = "Rika";
const char* password = "230605@S";

/* ================= SERVER ================= */
ESP8266WebServer server(80);

/* ================= ORDER DATA ================= */
String tableNo = "";
String orderItems = "";
int totalAmount = 0;

/* ================= HTML ================= */
const char webpage[] = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Restaurant Order - Bill</title>
<style>
  body { font-family: Arial; background: #f0f0f0; padding: 20px; }
  .container { background: white; max-width: 500px; margin: 0 auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  h2 { color: #333; text-align: center; }
  .form-group { margin: 15px 0; }
  label { display: block; font-weight: bold; margin-bottom: 5px; color: #555; }
  input, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
  textarea { resize: vertical; min-height: 80px; }
  button { width: 100%; padding: 12px; background: #ff6b35; color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px; }
  button:hover { background: #e55a2b; }
  .status { margin-top: 15px; padding: 10px; border-radius: 4px; text-align: center; font-weight: bold; }
  .status.success { background: #d4edda; color: #155724; }
  .status.error { background: #f8d7da; color: #721c24; }
</style>
</head>
<body>
<div class="container">
  <h2>🍽️ Send Bill to Kitchen</h2>
  
  <div class="form-group">
    <label for="table">Table Number:</label>
    <input type="number" id="table" placeholder="Enter table number" min="1" required>
  </div>
  
  <div class="form-group">
    <label for="items">Order Items:</label>
    <textarea id="items" placeholder="Enter items (e.g., Masal Dosa x2, Tea x1)"></textarea>
  </div>
  
  <div class="form-group">
    <label for="total">Total Amount (₹):</label>
    <input type="number" id="total" placeholder="Enter total amount" min="0" required>
  </div>
  
  <button onclick="sendBill()">📤 Send Bill to Kitchen Display</button>
  <div id="status"></div>
</div>

<script>
function sendBill() {
  const table = document.getElementById("table").value;
  const items = document.getElementById("items").value;
  const total = document.getElementById("total").value;
  const statusDiv = document.getElementById("status");
  
  if (!table || !items || !total) {
    statusDiv.innerHTML = '<div class="status error">❌ Please fill all fields!</div>';
    return;
  }
  
  statusDiv.innerHTML = '<div class="status">⏳ Sending...</div>';
  
  fetch("/order", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      table: table,
      items: items,
      total: parseInt(total),
      time: new Date().toLocaleTimeString()
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === "success") {
      statusDiv.innerHTML = '<div class="status success">✅ Bill sent to kitchen display!</div>';
      document.getElementById("table").value = "";
      document.getElementById("items").value = "";
      document.getElementById("total").value = "";
    } else {
      statusDiv.innerHTML = '<div class="status error">❌ Error: ' + data.message + '</div>';
    }
  })
  .catch(error => {
    statusDiv.innerHTML = '<div class="status error">❌ Connection failed! Check ESP8266 IP.</div>';
    console.error("Error:", error);
  });
}
</script>
</body>
</html>
)rawliteral";

/* ================= HANDLERS ================= */
void handleRoot() {
  server.send(200, "text/html", webpage);
}

void handleOrder() {
  // Parse JSON
  DynamicJsonDocument doc(512);
  deserializeJson(doc, server.arg("plain"));

  tableNo = doc["table"].as<String>();
  orderItems = doc["items"].as<String>();
  totalAmount = doc["total"].as<int>();

  // Display on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Table: " + tableNo);
  lcd.setCursor(0, 1);
  lcd.print("Bill: Rs " + String(totalAmount));
  
  delay(2000);
  
  // Show items
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Items:");
  lcd.setCursor(0, 1);
  lcd.print(orderItems.substring(0, 16)); // First 16 chars

  Serial.println("=== ORDER RECEIVED ===");
  Serial.println("Table: " + tableNo);
  Serial.println("Items: " + orderItems);
  Serial.println("Total: Rs " + String(totalAmount));
  Serial.println("====================");

  // Send success response
  server.send(200, "application/json", "{\"status\":\"success\",\"message\":\"Bill received\"}");
}

/* ================= SETUP ================= */
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================");
  Serial.println("Kitchen Display - Bill System");
  Serial.println("=================================\n");

  // Initialize I2C
  Wire.begin(SDA_PIN, SCL_PIN);
  delay(500);
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("Kitchen Ready");

  // Connect to WiFi
  WiFi.begin(ssid, password);
  lcd.setCursor(0, 1);
  lcd.print("Connecting WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    delay(3000);
  } else {
    Serial.println("\n✗ WiFi Failed!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed!");
    lcd.setCursor(0, 1);
    lcd.print("Check Credentials");
  }

  // Setup server routes
  server.on("/", handleRoot);
  server.on("/order", HTTP_POST, handleOrder);
  server.begin();
  
  Serial.println("Web Server started!");
  Serial.println("=================================\n");
  
  lcd.clear();
  lcd.print("Ready for Bills");
}

/* ================= LOOP ================= */
void loop() {
  server.handleClient();
}
