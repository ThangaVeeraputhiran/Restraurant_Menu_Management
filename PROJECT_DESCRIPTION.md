# Kitchen Alert - Detailed Project Description

## 1. Project Purpose
Kitchen Alert is a complete smart restaurant system that connects a web-based ordering interface to a kitchen display and a real-time data backend. It allows staff or customers to place orders, manage menu items and inventory, and view analytics for daily operations. The system supports both local IoT delivery (ESP32 over WiFi) and cloud persistence (Firebase Firestore).

## 2. Key Goals
- Provide a fast, mobile-friendly ordering interface.
- Track inventory in real time and prevent out-of-stock orders.
- Persist order history for long-term analytics (monthly/yearly).
- Support multiple staff devices with real-time synchronization.
- Integrate with an ESP32 kitchen display over HTTP.

## 3. System Components

### 3.1 Web Application (Frontend)
- Files: [index.html](index.html), [styles.css](styles.css)
- UI includes:
  - Menu categories and item cards
  - Quantity controls (+/-)
  - Sticky cart bar
  - Checkout modal
  - Inventory dashboard modal
  - Analytics and reports modal
  - Add new item modal

### 3.2 IoT Kitchen Display (ESP32)
- File: [esp8266_kitchen_display.ino](esp8266_kitchen_display.ino)
- Receives order JSON via HTTP POST
- Displays order on LCD (16x2) with optional buzzer alert

### 3.3 Firebase Backend
- File: [firebase-config.js](firebase-config.js)
- Firestore is used for:
  - Inventory persistence
  - Menu item persistence
  - Order history persistence
  - Cross-device synchronization

## 4. Data Flow (Order to Kitchen)

1. User selects menu items and adjusts quantity.
2. Cart shows total count and price.
3. User clicks checkout and confirms order.
4. Order is:
   - Sent via HTTP POST to ESP32 (local WiFi)
   - Stored in Firestore (cloud)
   - Stored in localStorage (offline fallback)
5. Inventory is reduced and synced to Firebase.

## 5. Inventory Management

### 5.1 Inventory Structure
Each menu item has:
- currentStock
- unit
- lowThreshold
- criticalThreshold
- category
- lastRestocked

### 5.2 Inventory Behavior
- Stock reduces when an order is placed
- Stock cannot go below 0
- Stock statuses:
  - ok
  - low
  - critical
  - out
- Stock updates appear in the menu UI and inventory dashboard
- Updates are saved locally and synced to Firestore

## 6. Menu Management

### 6.1 Default Menu
Default menu items are hardcoded in HTML for fast load.

### 6.2 Custom Menu Items
- Added through the Add New Item modal
- Saved in localStorage and Firestore
- Rendered dynamically on page load

## 7. Analytics and Reports

### 7.1 Metrics Calculated
- Total Orders
- Total Revenue
- Average Order Value
- Hourly Traffic
- Top-Selling Items

### 7.2 Date Ranges
- Today
- This Month
- This Year
- Custom Date Range

### 7.3 Data Source
- Primary: Firestore (persistent across days)
- Fallback: localStorage (offline support)

## 8. Firebase Data Model

Firestore structure (single restaurant):

restaurants/
  main/
    inventory: { itemName: { currentStock, unit, ... } }
    menuItems: { itemName: price }
    orders/ (collection)
      orderDoc:
        id
        timestamp
        date
        time
        hour
        table
        items
        total
        duration

## 9. Offline Behavior
- If Firebase is unavailable, data is saved to localStorage
- When Firebase reconnects, inventory and orders continue syncing

## 10. Mobile Responsiveness
- Menu and cart optimized for small screens
- Buttons sized for touch
- Modals stack content vertically
- Inventory and analytics sections reflow for phones

## 11. Hosting Behavior

### 11.1 Static Hosts (Netlify/Vercel/Firebase Hosting)
- Works for all web and Firebase features
- HTTPS is enabled by default

### 11.2 ESP32 Network Constraints
- HTTPS pages cannot call HTTP endpoints due to mixed-content rules
- If hosted on Netlify/Vercel, ESP32 POST may fail
- Solutions:
  - Host locally on HTTP when using ESP32
  - Use a secure proxy to bridge HTTPS to local HTTP

## 12. Security Considerations
- Firestore rules must allow reads/writes for development
- For production, use Firebase Authentication and restrictive rules
- Add your domain to Firebase Authorized Domains (if Auth used)

## 13. Extensibility
- Add staff accounts with Firebase Auth
- Add multiple restaurant locations with a new document per site
- Add admin dashboard for global metrics
- Add printable receipts or QR code menus

## 14. Known Limitations
- ESP32 integration requires local network access
- HTTPS hosting blocks HTTP to ESP32 unless proxied
- Analytics depends on Firestore data availability

## 15. Summary
Kitchen Alert provides a full restaurant workflow with inventory, order tracking, real-time updates, and analytics. The system is mobile-ready, scalable, and designed to work both locally (IoT kitchen display) and in the cloud (Firebase).
