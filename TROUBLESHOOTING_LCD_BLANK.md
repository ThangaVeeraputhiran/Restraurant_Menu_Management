# LCD Display Not Showing Orders - Troubleshooting Guide

## Problem Summary
- Menu items are selected and sent to ESP8266 ✓
- ESP8266 connection test passes ✓
- BUT: LCD display remains blank ✗
- Orders not appearing on LCD ✗

---

## Step-by-Step Troubleshooting

### Step 1: Check Serial Monitor Output
**What to do:**
1. Connect ESP8266 to USB
2. Open Arduino IDE Serial Monitor (Tools → Serial Monitor)
3. Set baud rate to **115200**
4. Note the IP address displayed
5. Send an order from the web interface
6. Look for the order parsing information in Serial Monitor

**Expected Output:**
```
╔════════════════════════════════╗
║   NEW ORDER RECEIVED (RAW)     ║
╚════════════════════════════════╝
{"table":"1","items":[{"name":"Tea","qty":1}],"total":10,"time":"02:30 PM"}

╔════════════════════════════════╗
║   PARSED ORDER DATA            ║
╚════════════════════════════════╝
Table: 1
Time: 02:30 PM
Item Count: 1
Items:
  [0] Tea x1
Total: ₹10
════════════════════════════════

>>> LCD DISPLAY DEBUG <<<
Current itemCount: 1
Line 1: Table 1
Line 2: Tea x1
>>> END DEBUG <<<
```

**If you see this output:**
- ✓ Order is reaching ESP8266 correctly
- ✓ JSON parsing is working
- ✓ Problem is likely with LCD hardware/connection

**If you DON'T see this output:**
- ✗ Order is not reaching ESP8266
- → Check the ESP8266 IP address in web interface
- → Check the table number and WiFi connection

---

### Step 2: Check I2C Connection
The updated code now auto-detects the LCD I2C address during startup.

**Look for this at startup:**
```
Scanning for LCD I2C device...
✓ LCD found at address: 0x27
LCD initialized at address: 0x27
```

**Troubleshooting:**
- If you see: `✗ LCD not found at any address`
  - **Check Physical Connections:**
    - LCD SDA pin → ESP8266 D2 (GPIO4)
    - LCD SCL pin → ESP8266 D1 (GPIO5)
    - LCD VCC → 5V (VIN)
    - LCD GND → GND
    - Use proper jumper wires and check for loose connections

  - **Check LCD Compatibility:**
    - The code scans addresses: 0x27, 0x3F, 0x20, 0x21
    - If LCD has a different address, it won't be found
    - Use I2C Scanner sketch to find the actual address:
      ```cpp
      #include <Wire.h>
      void setup() {
        Serial.begin(115200);
        Wire.begin(D2, D1);
      }
      void loop() {
        for (int i = 0; i < 128; i++) {
          Wire.beginTransmission(i);
          if (Wire.endTransmission() == 0) {
            Serial.print("Found address: 0x");
            Serial.println(i, HEX);
          }
        }
        delay(5000);
      }
      ```

---

### Step 3: Verify LCD Display Directly
**Test if LCD can display at all:**

1. After connecting (you should see "Kitchen Display" and "Initializing..." on startup)
2. Once "Ready for Orders!" appears, the LCD is working
3. Send an order
4. Check if the display updates

**If LCD still blank:**
- **Check LCD Power:**
  - Does the backlight come on? (Check for blue glow)
  - If no backlight: LCD not receiving power
  - Check VCC and GND connections
  
- **Check Contrast:**
  - Some LCDs have a contrast adjustment potentiometer
  - Adjust it slowly while watching the display
  - You should see characters appear

- **Check Library Compatibility:**
  - This code uses `LiquidCrystal_I2C` by Frank de Brabander
  - Install it via Arduino IDE: Sketch → Include Library → Manage Libraries
  - Search for "LiquidCrystal_I2C" and install the one by Frank de Brabander

---

### Step 4: Verify Order Data Format
The web interface must send orders in this exact format:
```json
{
  "table": "1",
  "items": [
    {"name": "Tea", "qty": 1},
    {"name": "Coffee", "qty": 2}
  ],
  "total": 40,
  "time": "02:30 PM"
}
```

**Check this in browser console:**
1. Open web interface
2. Press F12 (open Developer Tools)
3. Go to Console tab
4. Select items and click "Send Order"
5. Look for log: `Sending order to: http://192.168.x.x/order`
6. Check that the JSON format is correct

---

### Step 5: Test with Manual Serial Command
Once LCD is detected, you can test display function manually by sending serial commands.

Add this test code after the order display functions:

```cpp
// Test function - call this from serial command
void testDisplayOrder() {
  currentOrder.table = "5";
  currentOrder.itemCount = 2;
  currentOrder.items[0] = "Tea";
  currentOrder.quantities[0] = 2;
  currentOrder.items[1] = "Coffee";
  currentOrder.quantities[1] = 1;
  currentOrder.total = 35;
  currentOrder.time = "03:45 PM";
  currentOrder.hasData = true;
  
  displayOrder();
}
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| LCD backlight on but no text | Contrast too low | Adjust LCD potentiometer |
| "LCD not found" message | I2C connection error | Check SDA/SCL wiring |
| Display shows gibberish | Wrong I2C address | Verify with I2C scanner |
| Order received but LCD blank | Library not installed | Install LiquidCrystal_I2C |
| "No data received" error | WiFi/connection issue | Check ESP8266 IP in web interface |
| LCD showing "Kitchen Display Initializing..." forever | LCD initialization stuck | Restart ESP8266 |

---

## Quick Checklist

- [ ] Serial Monitor shows order being received
- [ ] Serial Monitor shows "LCD found at address: 0x27" (or 0x3F)
- [ ] LCD powers on (backlight visible)
- [ ] "Kitchen Display" appears on startup
- [ ] "Ready for Orders!" appears after WiFi connects
- [ ] Order details appear on LCD when order is sent
- [ ] Serial Monitor shows ">>> LCD DISPLAY DEBUG <<<" section

---

## Still Not Working?

**Share these logs with debugging info:**
1. Full Serial Monitor output on startup
2. Order data shown in Serial Monitor
3. The LCD I2C address detected
4. Photos of wiring connections
5. ESP8266 model (NodeMCU, Wemos D1, etc.)
6. LCD model/brand (should be 16x2 I2C)

---

## Reference: Expected Startup Sequence

```
=================================
Smart Restaurant Kitchen Display
ESP8266 Version
=================================

LCD initialized

Scanning for LCD I2C device...
✓ LCD found at address: 0x27
LCD initialized at address: 0x27
Buzzer initialized

Connecting to WiFi: Rika
.........
✓ WiFi Connected!
IP Address: 192.168.x.x
Access URL: http://192.168.x.x
HTTP Server started!
=================================
```

After this, you should see "Kitchen Display" then "Ready for Orders!" on the LCD.
