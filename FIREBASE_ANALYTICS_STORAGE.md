# 📊 Firebase Real-time Analytics Storage

## Overview

All order data and analytics reports are now **automatically saved to Firebase Firestore** in real-time. This provides:

- ✅ Persistent order history (queryable by date, time, items)
- ✅ Automatic daily analytics aggregation
- ✅ Real-time analytics snapshots
- ✅ Multi-level data redundancy (Firebase + localStorage)

---

## Data Storage Structure

### Firestore Collections

#### 1. **`restaurants/main/orders`** - Individual Orders
```javascript
{
    orderId: "ORD-1708964234",
    timestamp: "2026-02-14T15:30:45.123Z",
    date: "02/14/2026",
    time: "3:30:45 PM",
    hour: 15,
    dayOfWeek: "Saturday",
    table: "5",
    items: [
        { name: "Coffee", qty: 2 },
        { name: "Tea", qty: 1 }
    ],
    itemsCount: 3,
    total: 50,
    duration: "3:30 PM",
    paymentMethod: "cash",
    status: "completed",
    staffName: "online-system"
}
```

#### 2. **`restaurants/main/dailyAnalytics`** - Daily Summaries
```javascript
// Document ID: "02/14/2026"
{
    date: "02/14/2026",
    totalOrders: 45,
    totalRevenue: 2350,
    itemsSold: 127,
    createdAt: "2026-02-14T00:00:00Z",
    lastUpdated: "2026-02-14T23:59:59Z"
}
```

#### 3. **`restaurants/main/analytics`** - Analytics Snapshots
```javascript
{
    timestamp: "2026-02-14T15:32:12.456Z",
    date: "02/14/2026",
    totalOrders: 45,
    totalRevenue: 2350,
    avgOrderValue: 52.22,
    topItems: [
        { name: "Coffee", count: 78, revenue: 1170 },
        { name: "Tea", count: 65, revenue: 650 }
    ],
    hourlyTraffic: {
        "7": { count: 5, revenue: 250 },
        "8": { count: 12, revenue: 580 },
        // ... etc
    },
    period: "daily"
}
```

---

## New Firebase Functions

### Order Storage

#### `saveDetailedOrderToFirebase(orderData, metadata)`
Saves a complete order with metadata to Firestore and updates daily analytics.

**Parameters:**
- `orderData` (object): Order details with `table`, `items`, `total`, `time`
- `metadata` (object, optional): `paymentMethod`, `status`, `staffName`, etc.

**Example:**
```javascript
const orderData = {
    table: "5",
    items: [{ name: "Coffee", qty: 2 }],
    total: 50,
    time: "3:30 PM"
};

const metadata = {
    paymentMethod: "card",
    status: "completed",
    staffName: "John"
};

await saveDetailedOrderToFirebase(orderData, metadata);
```

---

### Analytics Storage

#### `saveAnalyticsSnapshot(analyticData)`
Saves a complete analytics report snapshot to Firebase.

**Parameters:**
- `analyticData` (object): Contains `totalOrders`, `totalRevenue`, `avgOrderValue`, `topItems`, `hourlyTraffic`, `period`

**Auto-called:** When you open Analytics Dashboard and select a period

---

#### `getAnalyticsSnapshots(period = 'today', limit = 100)`
Retrieves saved analytics snapshots from Firebase.

**Returns:** Array of analytics snapshot documents

**Example:**
```javascript
const todaySnapshots = await getAnalyticsSnapshots('today', 50);
console.log(todaySnapshots[0]); // Latest snapshot
```

---

#### `updateDailyAnalytics(order)`
Automatically updates the daily analytics document when an order is placed.

**Called:** Automatically after every order

---

#### `getDashboardAnalytics(days = 30)`
Retrieves summarized analytics for the last N days.

**Returns:**
```javascript
{
    totalOrders: 1250,
    totalRevenue: 65000,
    totalItemsSold: 3400,
    avgOrderValue: 52.00,
    daysAnalyzed: 30,
    dailyRecords: [ /* array of daily summaries */ ]
}
```

**Example:**
```javascript
const monthStats = await getDashboardAnalytics(30);
console.log(`Revenue this month: ₹${monthStats.totalRevenue}`);
```

---

## How It Works

### When an Order is Placed:
1. User confirms order → `confirmOrder()` called
2. `processOrder()` executes → calls `saveDetailedOrderToFirebase()`
3. Order document created in `restaurants/main/orders`
4. `updateDailyAnalytics()` runs automatically
5. Daily summary document updated (or created)

```
User confirms order
    ↓
processOrder() → saveDetailedOrderToFirebase()
    ↓
Order saved to Firestore + localStorage
    ↓
updateDailyAnalytics() runs
    ↓
Daily record updated with new totals
```

### When Analytics Dashboard Opens:
1. User clicks "Analytics & Reports"
2. `updateAnalyticsDashboard(period)` called with selected period
3. Orders fetched from Firebase (or localStorage fallback)
4. Calculations performed (revenue, avg, top items, hourly traffic)
5. `saveAnalyticsSnapshot()` stores complete snapshot
6. Dashboard displays results
7. All data persisted for future viewing

```
Analytics Dashboard opened
    ↓
updateAnalyticsDashboard() fetches orders
    ↓
Calculate totals, trends, top items
    ↓
saveAnalyticsSnapshot() stores results
    ↓
Display dashboard to user
    ↓
Snapshot saved forever in Firestore
```

---

## Querying Data Later

### Via Firebase Console:

1. Go to **Firestore Database**
2. Navigate to **Collections**:
   - `restaurants` → `main` → `orders`: View all individual orders
   - `restaurants` → `main` → `dailyAnalytics`: View daily summaries
   - `restaurants` → `main` → `analytics`: View analytics snapshots

### Via JavaScript (in your system):

```javascript
// Get all orders for today
const todayOrders = await getOrdersFromFirebase(
    new Date(new Date().setHours(0,0,0,0)),
    new Date()
);

// Get dashboard stats for last 30 days
const stats = await getDashboardAnalytics(30);
console.log(`Monthly revenue: ₹${stats.totalRevenue}`);
console.log(`Total orders: ${stats.totalOrders}`);

// Get analytics snapshots from today
const snapshots = await getAnalyticsSnapshots('today', 50);
snapshots.forEach(snap => {
    console.log(`${snap.timestamp}: ₹${snap.totalRevenue}`);
});
```

---

## Data Redundancy

Every piece of data is saved in **two places**:

1. **Firebase Firestore** ✅ - Cloud storage, accessible anywhere, real-time sync
2. **Browser localStorage** ✅ - Local fallback, offline access

**If Firebase is down:**
- Orders still save to localStorage
- Analytics still calculated from localStorage
- Data syncs to Firebase when connection restored

---

## Firestore Rules Required

To control who can access analytics data, deploy these rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /restaurants/main/{document=**} {
      allow read, write: if request.auth != null && 
        (request.auth.token.email == 'sharunandha21@gmail.com' || 
         request.auth.token.email == 'admin321@restaurant.com');
    }
  }
}
```

---

## Storage Optimization

### Data Collection Strategy:

| Data Type | Saved To | Frequency | Retention |
|-----------|----------|-----------|-----------|
| Orders | Firestore + localStorage | Per order | Forever |
| Daily Analytics | Firestore | Per day | Forever |
| Analytics Snapshots | Firestore | Per dashboard view | Forever |
| Hourly Traffic | Analytics Snapshot | Per snapshot | Forever |

### Recommended Cleanup (Optional):

After 1+ years, you can archive old analytics to reduce storage costs. See Firebase Storage documentation.

---

## Testing Analytics Storage

### Test 1: Place an Order
1. Select menu items → Confirm order
2. Open Firebase Console → Firestore → Collections
3. Navigate to `restaurants/main/orders`
4. ✅ **Verify:** New order document created with all details

### Test 2: Check Daily Analytics
1. Open Firebase Console → `restaurants/main/dailyAnalytics`
2. Look for today's document (ID: MM/DD/YYYY)
3. ✅ **Verify:** `totalOrders` and `totalRevenue` updated

### Test 3: View Analytics Report
1. Place 3-5 orders at different times
2. Click "Analytics & Reports" button
3. Select "Today"
4. ✅ **Verify:** Dashboard shows correct totals
5. Open Firebase Console → `restaurants/main/analytics`
6. ✅ **Verify:** Snapshot created with matching data

### Test 4: Query Historical Data
1. Open Firebase Console
2. Filter `restaurants/main/orders` by date range
3. ✅ **Verify:** Orders appear with correct timestamps and details

---

## Troubleshooting

### "Analytics not appearing in dashboard"
- Check if Firebase is initialized (look for ✅ in browser console)
- Verify orders exist in `restaurants/main/orders`
- Try refreshing the page

### "Firebase storage reaching quota"
- Check Firebase Project Settings → Usage
- Consider archiving old data or upgrading plan
- See Firebase documentation for cleanup strategies

### "No data showing in analytics despite orders"
- Verify `saveAnalyticsSnapshot()` is being called (check console logs)
- Check browser localStorage for `orderHistory` key
- Ensure Firestore rules allow your email to read/write

---

## Next Steps

1. ✅ Deploy Firestore rules in Firebase Console
2. ✅ Test by placing orders and viewing analytics
3. ✅ Monitor Firebase storage usage
4. ✅ Set up regular backups (optional, Firebase has built-in)
5. ✅ Consider enabling Firestore backups for disaster recovery

