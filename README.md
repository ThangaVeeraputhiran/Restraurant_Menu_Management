# 🍽️ IoT-Based Smart Restaurant Ordering and Kitchen Display System

A complete IoT solution that connects a responsive web-based restaurant ordering interface with an ESP32-powered kitchen display system. Orders placed on the web application are instantly transmitted to the ESP32, which displays them on an LCD screen in real-time.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Hardware Requirements](#hardware-requirements)
- [Software Requirements](#software-requirements)
- [Installation Guide](#installation-guide)
- [Usage Instructions](#usage-instructions)
- [Menu Items & Pricing](#menu-items--pricing)
- [IoT Communication Protocol](#iot-communication-protocol)
- [Troubleshooting](#troubleshooting)
- [Project Justification](#project-justification)

---

## 🎯 Project Overview

This project demonstrates a practical IoT implementation for the restaurant industry. Customers place orders through a mobile-responsive web interface, and the order details are immediately transmitted over WiFi to an ESP32 microcontroller in the kitchen. The ESP32 processes the data and displays order information on a 16x2 LCD display, with an optional buzzer alert for kitchen staff.

**Core Technologies:**
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **IoT Device**: ESP32 with WiFi
- **Display**: 16x2 I2C LCD
- **Communication**: HTTP REST API (JSON)
- **Network**: Local WiFi

---

## 🏗️ System Architecture

```
┌─────────────────┐
│  Customer       │
│  Mobile/Tablet  │
└────────┬────────┘
         │
         │ WiFi
         ▼
┌─────────────────┐
│  Web Browser    │
│  (Restaurant    │
│   Website)      │
└────────┬────────┘
         │
         │ HTTP POST
         │ (JSON Data)
         │
         ▼
┌─────────────────┐       ┌──────────────┐
│     ESP32       │◄─────►│  16x2 LCD    │
│  (WiFi Enabled) │       │   Display    │
└────────┬────────┘       └──────────────┘
         │
         ▼
     ┌───────┐
     │Buzzer │
     │(Alert)│
     └───────┘
```

---

## ✨ Features

### Web Application
- ✅ **Responsive Design**: Mobile-first UI, works on all devices
- ✅ **Category-Based Menu**: Beverages, Snacks, Tiffin/Meals
- ✅ **Real-time Cart Management**: Live updates as items are added/removed
- ✅ **Quantity Controls**: Easy +/- buttons for each item
- ✅ **Sticky Cart Bar**: Always visible cart summary
- ✅ **Order Checkout**: Review before sending to kitchen
- ✅ **ESP32 Configuration**: Built-in IP address and table number settings
- ✅ **Connection Testing**: Test ESP32 connectivity before ordering

### ESP32 Kitchen Display
- ✅ **WiFi Connectivity**: Connects to local network
- ✅ **HTTP Server**: Receives orders via REST API
- ✅ **LCD Display**: Shows table number and ordered items
- ✅ **Scrolling Display**: Automatically scrolls through multiple items
- ✅ **Buzzer Alert**: Audio notification for new orders
- ✅ **Order Parsing**: Processes JSON data from web app
- ✅ **Status Webpage**: View current order via browser

---

## 🛠️ Hardware Requirements

| Component | Specification | Quantity |
|-----------|---------------|----------|
| ESP32 Development Board | Any variant (NodeMCU, DevKit) | 1 |
| 16x2 LCD Display | I2C Interface (or OLED alternative) | 1 |
| I2C Module | PCF8574 (if LCD doesn't have built-in I2C) | 1 |
| Buzzer | 5V Active/Passive | 1 (Optional) |
| Jumper Wires | Male-to-Female | ~10 |
| Breadboard | Standard | 1 |
| USB Cable | Micro-USB or USB-C (for ESP32) | 1 |
| Power Supply | 5V 2A | 1 |

### Wiring Diagram

**I2C LCD Connection:**
```
LCD Display        ESP32
---------------------------------
VCC       ────────► 5V (VIN)
GND       ────────► GND
SDA       ────────► GPIO 21
SCL       ────────► GPIO 22
```

**Buzzer Connection (Optional):**
```
Buzzer            ESP32
---------------------------------
Positive (+) ────► GPIO 25
Negative (-) ────► GND
```

---

## 💻 Software Requirements

### For Web Application
- Any modern web browser (Chrome, Firefox, Edge, Safari)
- No server required (can run directly from files)

### For ESP32 Programming
- **Arduino IDE** (v1.8.19 or higher) or **PlatformIO**
- **ESP32 Board Support**
- **Required Libraries:**
  - `WiFi.h` (built-in)
  - `WebServer.h` (built-in)
  - `ArduinoJson` (v6.x)
  - `LiquidCrystal_I2C`

---

## 📥 Installation Guide

### Part 1: Web Application Setup

1. **Download the project files:**
   - `index.html`
   - `styles.css`
   - `script.js`

2. **Place all files in the same folder**

3. **Open `index.html` in a web browser**
   - Double-click the file, or
   - Right-click → Open with → Browser

4. **No web server needed!** The application runs entirely client-side.

---

### Part 2: ESP32 Setup

#### Step 1: Install Arduino IDE

1. Download from: https://www.arduino.cc/en/software
2. Install and open Arduino IDE

#### Step 2: Install ESP32 Board Support

1. Go to **File → Preferences**
2. In "Additional Boards Manager URLs", add:
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
3. Go to **Tools → Board → Boards Manager**
4. Search for "ESP32"
5. Install "ESP32 by Espressif Systems"

#### Step 3: Install Required Libraries

1. Go to **Sketch → Include Library → Manage Libraries**
2. Install the following:
   - **ArduinoJson** (by Benoit Blanchon) - Version 6.x
   - **LiquidCrystal I2C** (by Frank de Brabander)

#### Step 4: Configure the Code

1. Open `esp32_kitchen_display.ino` in Arduino IDE

2. **Modify WiFi credentials** (Lines 41-42):
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";        // Your WiFi name
   const char* password = "YOUR_WIFI_PASSWORD"; // Your WiFi password
   ```

3. **Check I2C address** (Line 45):
   ```cpp
   #define LCD_I2C_ADDRESS 0x27  // Try 0x3F if 0x27 doesn't work
   ```
   
   > **Finding I2C Address:**
   > - Most I2C LCDs use `0x27` or `0x3F`
   > - Use an I2C scanner sketch to find your exact address

4. **Optional: Disable buzzer** (Line 49):
   ```cpp
   #define USE_BUZZER false  // Set to false if no buzzer
   ```

#### Step 5: Upload to ESP32

1. Connect ESP32 to computer via USB
2. Select your board:
   - **Tools → Board → ESP32 Arduino → ESP32 Dev Module**
3. Select the correct COM port:
   - **Tools → Port → COM3** (or your ESP32's port)
4. Click **Upload** button (→)
5. Wait for "Done uploading" message

#### Step 6: Get ESP32 IP Address

1. Open **Serial Monitor** (Tools → Serial Monitor)
2. Set baud rate to **115200**
3. Press **Reset** button on ESP32
4. Note the IP address displayed (e.g., `192.168.1.100`)

---

## 🚀 Usage Instructions

### First-Time Setup

1. **Power on the ESP32**
   - LCD should display "Kitchen Display" → "Initializing..."
   - Then "WiFi Connected!" with IP address
   - Finally "Ready for Orders!"

2. **Open the web application** on your phone/tablet/computer

3. **Configure ESP32 connection:**
   - Enter the ESP32 IP address (from Serial Monitor)
   - Set table number
   - Click "Test Connection" to verify

4. **You're ready to take orders!**

---

### Placing an Order

1. **Browse the menu** (categories: Beverages, Snacks, Meals)

2. **Add items to cart:**
   - Click **+** button to increase quantity
   - Click **−** button to decrease quantity
   - Quantity updates in real-time

3. **Review cart:**
   - Cart bar shows total items and amount
   - Click "View Cart" to review order

4. **Confirm and send:**
   - Click "📤 Send to Kitchen"
   - Order is sent to ESP32
   - Confirmation message appears

5. **Kitchen receives order:**
   - Buzzer beeps 3 times (alert)
   - LCD displays table number and items
   - Multiple items scroll automatically

---

### Kitchen Display Behavior

**Single Item Order:**
```
┌────────────────┐
│ Table 5        │
│ Masal Dosa x2  │
└────────────────┘
```

**Multiple Items (Scrolling):**
```
┌────────────────┐
│ Table 5 (1/3)  │
│ Masal Dosa x2  │
└────────────────┘
    ↓ (scrolls every 500ms)
┌────────────────┐
│ Table 5 (2/3)  │
│ Tea x1         │
└────────────────┘
    ↓
┌────────────────┐
│ Table 5 (3/3)  │
│ Coffee x1      │
└────────────────┘
```

---

## 🍛 Menu Items & Pricing

All prices are in Indian Rupees (₹)

### ☕ Beverages
- Tea – ₹10
- Coffee – ₹15
- Horlicks – ₹20
- Boost – ₹20

### 🍪 Snacks
- Vada – ₹10

### 🍛 Tiffin / Meals
- Idly (Plate) – ₹40
- Poori (Plate) – ₹40
- Dosa – ₹40
- Masal Dosa – ₹50
- Paper Roast – ₹55
- Ghee Roast – ₹60
- Onion Dosa – ₹50
- Uthappam – ₹40
- Onion Uthappam – ₹50
- Chapathi – ₹30
- Porota (Plate) – ₹40
- Meals – ₹70

---

## 🔄 IoT Communication Protocol

### Data Flow

```
Web App → HTTP POST → ESP32 → Parse JSON → Display on LCD
```

### JSON Format

**Request Endpoint:**
```
POST http://<ESP32_IP>/order
Content-Type: application/json
```

**JSON Payload Example:**
```json
{
  "table": "5",
  "items": [
    { "name": "Masal Dosa", "qty": 2 },
    { "name": "Tea", "qty": 1 },
    { "name": "Coffee", "qty": 1 }
  ],
  "total": 125,
  "time": "10:45 AM"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Order received"
}
```

### Additional Endpoints

**Test Connection:**
```
GET http://<ESP32_IP>/ping
```

**View Status Page:**
```
GET http://<ESP32_IP>/
```

---

## 🔧 Troubleshooting

### Common Issues

#### ❌ "Connection failed" error

**Solutions:**
1. Verify ESP32 and computer/phone are on **same WiFi network**
2. Check ESP32 IP address in Serial Monitor
3. Ping ESP32: `ping <ESP32_IP>` in terminal
4. Disable firewall temporarily
5. Ensure ESP32 is powered on and WiFi connected

---

#### ❌ LCD shows garbage characters

**Solutions:**
1. Check I2C wiring (SDA to GPIO21, SCL to GPIO22)
2. Try different I2C address (`0x3F` instead of `0x27`)
3. Adjust contrast potentiometer on I2C module
4. Test with I2C scanner sketch

---

#### ❌ ESP32 won't connect to WiFi

**Solutions:**
1. Double-check SSID and password (case-sensitive!)
2. Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
3. Move ESP32 closer to router
4. Check Serial Monitor for error messages
5. Try a different WiFi network

---

#### ❌ Order not displaying on LCD

**Solutions:**
1. Check Serial Monitor - does ESP32 receive the order?
2. Verify JSON format in browser console
3. Test with `/ping` endpoint first
4. Check CORS settings (should be allowed)
5. Ensure order has at least one item

---

#### ❌ Buzzer not working

**Solutions:**
1. Check wiring (+ to GPIO25, - to GND)
2. Verify buzzer type (active vs passive)
3. Set `USE_BUZZER` to `true` in code
4. Test buzzer directly with 5V
5. Try different GPIO pin

---

### Finding I2C LCD Address

Upload this sketch to find your LCD's I2C address:

```cpp
#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  Serial.println("I2C Scanner");
}

void loop() {
  byte error, address;
  int devices = 0;
  
  for(address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    
    if (error == 0) {
      Serial.print("Found device at 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
      devices++;
    }
  }
  
  if (devices == 0) Serial.println("No I2C devices found");
  delay(5000);
}
```

---

## 📡 IoT Domain Justification

This project demonstrates **core IoT principles**:

1. **Smart Device Integration**: ESP32 acts as an intelligent edge device processing real-time data

2. **Wireless Connectivity**: WiFi enables seamless communication between web application and hardware

3. **Real-time Data Processing**: JSON parsing and immediate display updates

4. **Physical Output Control**: Automated LCD display and buzzer activation

5. **Remote Monitoring**: Web-based status page for system health checks

6. **Scalability**: Architecture supports multiple ESP32 devices for different kitchen stations

7. **Industry Application**: Solves real-world restaurant efficiency problems

**Use Case Scenario:**
- Reduces order communication errors
- Eliminates paper-based order systems
- Provides instant kitchen notifications
- Improves service speed and accuracy
- Enables digital record-keeping

This system bridges the **digital and physical worlds**, exemplifying modern IoT implementation in the hospitality industry.

---

## 🎓 Educational Value

### Concepts Demonstrated

- **Web Development**: Responsive design, JavaScript DOM manipulation, Fetch API
- **IoT Programming**: ESP32 firmware development, sensor/display control
- **Network Communication**: HTTP REST APIs, JSON data exchange, CORS handling
- **Hardware Interfacing**: I2C protocol, GPIO control, LCD addressing
- **System Integration**: End-to-end solution connecting multiple technologies

---

## 📝 Code Structure

```
kitchen-alert/
│
├── index.html              # Main web interface
├── styles.css              # Responsive styling
├── script.js               # Cart logic & IoT communication
├── esp32_kitchen_display.ino  # ESP32 firmware
└── README.md              # This file
```

---

## 🔐 Security Considerations

**Current Implementation:**
- Local network only (not internet-exposed)
- No authentication required
- CORS enabled for development

**Production Recommendations:**
- Add API key authentication
- Use HTTPS (requires SSL certificate)
- Implement rate limiting
- Add input validation
- Use encrypted WiFi (WPA2/WPA3)

---

## 🚀 Future Enhancements

### Potential Features
- ✨ Multiple ESP32 displays for different stations
- ✨ Order completion button on ESP32
- ✨ Order queue management
- ✨ Database integration for order history
- ✨ QR code table number scanning
- ✨ Kitchen staff notification app
- ✨ Analytics dashboard
- ✨ Multi-language support
- ✨ OLED display with graphics
- ✨ MQTT protocol for better scalability

---

## 📞 Support

### Debugging Tips

1. **Always check Serial Monitor** - Most issues show up here
2. **Test each component separately** - WiFi → Server → Display
3. **Use browser console** - Check for JavaScript errors
4. **Verify network connectivity** - Same WiFi for all devices
5. **Start simple** - Test ping endpoint before full orders

### Serial Monitor Output

**Successful startup:**
```
=================================
Smart Restaurant Kitchen Display
=================================

Connecting to WiFi: YourWiFi
..........
✓ WiFi Connected!
IP Address: 192.168.1.100
Access URL: http://192.168.1.100
HTTP Server started!
=================================
```

**Order received:**
```
--- NEW ORDER RECEIVED ---
{"table":"5","items":[{"name":"Masal Dosa","qty":2}],"total":100,"time":"10:45 AM"}
Table: 5
Time: 10:45 AM
Items:
  - Masal Dosa x2
Total: ₹100
-------------------------

🔔 KITCHEN ALERT: New order received!
```

---

## 📄 License

This project is provided as-is for educational purposes. Feel free to modify and use for personal or commercial projects.

---

## 🙏 Credits

**Technologies Used:**
- ESP32 by Espressif Systems
- Arduino IDE
- ArduinoJson by Benoit Blanchon
- LiquidCrystal I2C by Frank de Brabander

**Designed & Developed for IoT Learning**

---

## 🎯 Quick Start Checklist

- [ ] Hardware assembled and wired correctly
- [ ] Arduino IDE installed with ESP32 support
- [ ] Libraries installed (ArduinoJson, LiquidCrystal_I2C)
- [ ] WiFi credentials configured in code
- [ ] Code uploaded to ESP32 successfully
- [ ] ESP32 IP address obtained from Serial Monitor
- [ ] Web application opened in browser
- [ ] ESP32 IP entered in web app settings
- [ ] Connection test successful
- [ ] Test order placed and displayed on LCD

---

**Ready to revolutionize your restaurant with IoT! 🎉**
