/*
 * =====================================================
 * IoT-Based Smart Restaurant Kitchen Display System
 * ESP8266 Version (NodeMCU / Wemos D1)
 * =====================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

/* ================= CONFIGURATION ================= */

// WiFi
const char* ssid = "Rika";
const char* password = "230605SS";

// LCD
#define LCD_COLUMNS 16
#define LCD_ROWS 2
#define LCD_I2C_ADDRESS 0x27

// I2C Pins
#define SDA_PIN 4   // D2
#define SCL_PIN 5   // D1

// Buzzer
#define BUZZER_PIN 12  // D6
#define USE_BUZZER true

// LED (Built-in)
#define LED_PIN 2   // D4 (ACTIVE LOW)
#define USE_LED true

/* ================= GLOBAL OBJECTS ================= */

LiquidCrystal_I2C* lcd = nullptr;
ESP8266WebServer server(80);

/* ================= ORDER STRUCT ================= */

struct Order {
  String table;
  String items[20];
  int quantities[20];
  int itemCount;
  int total;
  String time;
  bool hasData;
} currentOrder;

/* ================= SCROLL ================= */

int scrollPosition = 0;
unsigned long lastScrollTime = 0;
const int scrollDelay = 500;
bool isScrolling = false;

/* ================= LCD SCAN ================= */

uint8_t detectLCDAddress() {
  uint8_t addresses[] = {0x27, 0x3F};
  for (uint8_t i = 0; i < 2; i++) {
    Wire.beginTransmission(addresses[i]);
    if (Wire.endTransmission() == 0) return addresses[i];
  }
  return 0xFF;
}

/* ================= LED HELPERS ================= */

void ledOn() {
  digitalWrite(LED_PIN, LOW);   // ON
}

void ledOff() {
  digitalWrite(LED_PIN, HIGH);  // OFF
}

/* ================= CORS HEADERS ================= */

void sendCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Access-Control-Max-Age", "86400");
}

/* ================= SETUP ================= */

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== ESP8266 KITCHEN DISPLAY ===");
  Serial.println("Starting setup...");

  Wire.begin(SDA_PIN, SCL_PIN);
  delay(500);S

  uint8_t lcdAddr = detectLCDAddress();
  lcd = new LiquidCrystal_I2C(lcdAddr, LCD_COLUMNS, LCD_ROWS);
  lcd->begin(16, 2);
  lcd->backlight();

  pinMode(LED_PIN, OUTPUT);
  ledOff();

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  lcd->clear();
  lcd->print("Kitchen Display");

  connectToWiFi();
  setupServerRoutes();
  server.begin();
  
  Serial.println("Web server started!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.println("Ready to receive orders!");
  Serial.println("================================\n");

  displayReadyMessage();
}

/* ================= LOOP ================= */

void loop() {
  server.handleClient();
  if (currentOrder.hasData && isScrolling) handleScrolling();
}

/* ================= WIFI ================= */

void connectToWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  lcd->clear();
  lcd->print("Connecting WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    lcd->print(".");
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  lcd->clear();
  lcd->print("IP:");
  lcd->setCursor(0, 1);
  lcd->print(WiFi.localIP());
  delay(3000);
}

/* ================= SERVER ================= */

void setupServerRoutes() {
  // Handle OPTIONS requests for CORS preflight on all routes
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      sendCORSHeaders();
      server.send(200);
    } else {
      server.send(404);
    }
  });
  
  server.on("/order", HTTP_POST, handleOrderRequest);
  server.on("/order", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(200);
  });
  
  server.on("/", HTTP_GET, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "Kitchen Display Online");
  });
  
  server.on("/ping", HTTP_GET, []() {
    sendCORSHeaders();
    server.send(200, "text/plain", "Pong");
  });
  
  server.on("/test", HTTP_GET, []() {
    Serial.println("Test endpoint called!");
    sendCORSHeaders();
    server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"ESP8266 is online\"}");
  });
}

/* ================= ORDER ================= */

void handleOrderRequest() {
  // Send CORS headers
  sendCORSHeaders();
  
  // Read the request body
  String body = server.arg("plain");

  Serial.println("\n=== ORDER REQUEST RECEIVED ===");
  Serial.println("Received body: " + body);
  Serial.println("Body length: " + String(body.length()));

  if (body.length() == 0) {
    Serial.println("ERROR: Empty request body");
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Empty body\"}");
    return;
  }

  DynamicJsonDocument doc(2048);
  DeserializationError error = deserializeJson(doc, body);

  // Check for JSON parsing errors
  if (error) {
    Serial.print("JSON parsing error: ");
    Serial.println(error.c_str());
    server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Invalid JSON\"}");
    return;
  }

  currentOrder.table = doc["table"].as<String>();
  currentOrder.itemCount = 0;

  JsonArray items = doc["items"].as<JsonArray>();
  for (JsonObject item : items) {
    currentOrder.items[currentOrder.itemCount] = item["name"].as<String>();
    currentOrder.quantities[currentOrder.itemCount] = item["qty"].as<int>();
    currentOrder.itemCount++;
  }

  currentOrder.hasData = true;
  currentOrder.total = doc["total"] | 0;

  Serial.print("Order received for Table: ");
  Serial.println(currentOrder.table);
  Serial.print("Items: ");
  Serial.println(currentOrder.itemCount);
  Serial.println("===========================\n");

  ledOn();          // 🔥 LED stays ON
  displayOrder();
  alertKitchen();

  server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Order received\"}");
}

/* ================= LCD ================= */

void displayReadyMessage() {
  lcd->clear();
  lcd->print("Ready for");
  lcd->setCursor(0, 1);
  lcd->print("Orders!");
  isScrolling = false;
}

void displayOrder() {
  lcd->clear();
  scrollPosition = 0;

  if (currentOrder.itemCount == 1) {
    lcd->setCursor(0, 0);
    lcd->print("Table ");
    lcd->print(currentOrder.table);

    lcd->setCursor(0, 1);
    lcd->print(currentOrder.items[0]);
  } else {
    isScrolling = true;
    displayCurrentScrollItem();
  }
}

void displayCurrentScrollItem() {
  lcd->clear();
  lcd->setCursor(0, 0);
  lcd->print("Tbl ");
  lcd->print(currentOrder.table);
  lcd->print(" ");
  lcd->print(scrollPosition + 1);
  lcd->print("/");
  lcd->print(currentOrder.itemCount);

  lcd->setCursor(0, 1);
  lcd->print(currentOrder.items[scrollPosition]);
}

void handleScrolling() {
  if (millis() - lastScrollTime > scrollDelay) {
    scrollPosition = (scrollPosition + 1) % currentOrder.itemCount;
    displayCurrentScrollItem();
    lastScrollTime = millis();
  }
}

/* ================= ALERT ================= */

void alertKitchen() {
  if (USE_LED) {
    for (int i = 0; i < 3; i++) {
      ledOff();
      delay(150);
      ledOn();
      delay(150);
    }
  }

  if (USE_BUZZER) {
    for (int i = 0; i < 3; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(100);
      digitalWrite(BUZZER_PIN, LOW);
      delay(100);
    }
  }
}
