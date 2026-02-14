# Kitchen Alert - Smart Restaurant Ordering and Kitchen Display

A complete IoT-enabled restaurant system with a responsive web app, real-time inventory management, and Firebase-backed order history and analytics. Orders can be sent to an ESP32 kitchen display over WiFi, while inventory and analytics sync across devices using Firestore.

## Features

### Ordering and Menu
- Category-based menu with fast +/- quantity controls
- Sticky cart bar with live totals
- Checkout flow with order confirmation
- Table number and ESP32 IP configuration

### Inventory Management
- Stock tracking with low/critical/out-of-stock states
- Inventory dashboard with quick add/remove/adjust actions
- Restock alerts and stock visibility per item
- Persistent inventory in localStorage and Firebase

### Analytics and Reports
- Daily, monthly, yearly, and custom date range reports
- Top-selling items and hourly traffic chart
- Order history list with details and totals
- Firebase-backed history for long-term analytics

### Firebase Integration
- Real-time inventory sync between devices
- Persistent order history in Firestore
- Menu updates synced across devices
- Offline fallback to localStorage

### Mobile Ready
- Responsive layout for phones and tablets
- Touch-friendly controls and modal layouts
- Optimized spacing and typography for small screens

## Project Structure

- [index.html](index.html) - UI, layout, and core logic
- [styles.css](styles.css) - UI styling and responsive layout
- [firebase-config.js](firebase-config.js) - Firebase integration
- [esp8266_kitchen_display.ino](esp8266_kitchen_display.ino) - ESP32 kitchen display code

## Quick Setup

1. Open [index.html](index.html) in a browser.
2. Set the ESP32 IP and table number.
3. Use Manage Inventory to edit stock and add items.
4. Place orders to send to the kitchen display.

## Firebase Setup (Short)

1. Create a Firebase project.
2. Enable Firestore Database.
3. Add your Firebase config values to [firebase-config.js](firebase-config.js).
4. Refresh the site and confirm Firebase logs in the browser console.

## Hosting: Netlify, Vercel, or Firebase Hosting?

### Will it work on Netlify or Vercel?
Yes, the web app and Firebase features work on any static host, including Netlify and Vercel. Firebase will still connect as long as:
- The Firebase config is correct.
- Firestore rules allow access.
- The site loads over HTTPS (default on Netlify/Vercel).

### Important note about ESP32 orders
If your site is hosted on HTTPS (Netlify/Vercel), the browser will block HTTP requests to `http://192.168.x.x/order` due to mixed-content security rules. That means:
- The Firebase features will still work.
- The ESP32 order POST will likely fail unless you use:
  - A local HTTP host on the same network (recommended for ESP32), or
  - A secure proxy/bridge that converts HTTPS to HTTP inside your LAN.

### Best hosting choice
- **For full IoT + ESP32 on local WiFi:** Use a local HTTP server (recommended).
- **For cloud-only (Firebase + analytics) without ESP32:** Netlify or Vercel is perfect.
- **For Firebase-first deployment:** Firebase Hosting is also a great option.

## Notes
- Inventory and orders persist across days via Firebase.
- Analytics uses Firebase data and falls back to localStorage if needed.
- If you use Firebase Authentication, add your domain in Firebase Authorized Domains.

## Troubleshooting

- If Firebase does not connect, open DevTools Console and check for errors.
- If ESP32 orders fail on HTTPS hosting, use local hosting or a proxy.
- If analytics is blank, ensure Firestore has order documents for the selected date range.
