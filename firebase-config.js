// ============================================
// FIREBASE CONFIGURATION & SETUP
// ============================================
// Complete Firebase setup for Kitchen Alert System

// Step 1: Go to https://console.firebase.google.com/
// Create a new project or use existing one
// Enable Firestore Database and Realtime Database

// Step 2: Get your Firebase config from Project Settings
// Replace the config below with your actual credentials

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBlAfnMhMLglh-Rv8_9JZC3yrt3vOPHU-8",
  authDomain: "kitchen-alert.firebaseapp.com",
  projectId: "kitchen-alert",
  storageBucket: "kitchen-alert.firebasestorage.app",
  messagingSenderId: "642588344998",
  appId: "1:642588344998:web:043bc73c6552c376c5ea67",
  measurementId: "G-0SY9GPE8R7"
};

// Initialize Firebase - wait for SDK to load
let db, rtdb, inventoryRef, menuRef, ordersRef, analyticsRef;

function waitForFirebase() {
    return new Promise((resolve) => {
        if (typeof firebase !== 'undefined' && firebase.initializeApp) {
            try {
                firebase.initializeApp(firebaseConfig);
                db = firebase.firestore();
                rtdb = firebase.database();
                console.log('✅ Firebase initialized successfully');
                resolve(true);
            } catch (error) {
                console.warn('⚠️ Firebase already initialized:', error.message);
                db = firebase.firestore();
                rtdb = firebase.database();
                resolve(true);
            }
        } else {
            setTimeout(waitForFirebase, 100);
        }
    });
}

// Initialize when ready
waitForFirebase().then(() => {
    // Collections
    inventoryRef = db.collection('restaurants').doc('main').collection('inventory');
    menuRef = db.collection('restaurants').doc('main').collection('menu');
    ordersRef = db.collection('restaurants').doc('main').collection('orders');
    analyticsRef = db.collection('restaurants').doc('main').collection('analytics');
    console.log('✅ Firestore references created');
});

// ============================================
// SYNC INVENTORY TO FIREBASE
// ============================================

function syncInventoryToFirebase() {
    if (!db) {
        console.warn('⚠️ Firebase not ready yet, retrying...');
        setTimeout(syncInventoryToFirebase, 500);
        return;
    }
    
    const restaurantRef = db.collection('restaurants').doc('main');
    
    restaurantRef.set({
        name: 'Kitchen Alert Restaurant',
        lastUpdated: new Date().toISOString(),
        inventory: inventory,
        menuItems: menuItems
    }, { merge: true })
    .then(() => console.log('✅ Inventory synced to Firebase'))
    .catch(error => console.error('❌ Inventory sync failed:', error));
}

// Listen for real-time inventory changes from Firebase
function listenToFirebaseInventory() {
    if (!db) {
        console.warn('⚠️ Firebase not ready, listening delayed...');
        setTimeout(listenToFirebaseInventory, 500);
        return;
    }
    
    db.collection('restaurants').doc('main').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            
            // Update local inventory if Firebase has newer data
            if (data.inventory) {
                const remoteUpdated = data.lastUpdated ? Date.parse(data.lastUpdated) : 0;
                const localUpdated = typeof lastLocalInventoryUpdate === 'number' ? lastLocalInventoryUpdate : 0;

                if (!remoteUpdated || remoteUpdated >= localUpdated) {
                    inventory = { ...data.inventory };
                    saveInventory();
                    updateStockDisplay();
                    updateInventoryDashboard();
                    console.log('📡 Inventory updated from Firebase');
                }
            }
            
            // Update menu items if changed by another user
            if (data.menuItems) {
                const newItems = data.menuItems;
                for (const itemName in newItems) {
                    if (!menuItems[itemName]) {
                        menuItems[itemName] = newItems[itemName];
                        // Render the new item on the menu
                        if (inventory[itemName]) {
                            renderNewMenuItem(itemName, newItems[itemName], inventory[itemName].category);
                        }
                    }
                }
                console.log('📡 Menu items updated from Firebase');
            }
        }
    }, error => console.error('Error listening to Firebase:', error));
}

// ============================================
// SYNC ORDERS TO FIREBASE
// ============================================

function saveOrderToFirebase(orderData) {
    if (!db) {
        console.warn('⚠️ Firebase not ready, saving offline...');
        return;
    }
    
    const ordersRef = db.collection('restaurants').doc('main').collection('orders');
    
    const order = {
        id: orderData.id,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        hour: new Date().getHours(),
        table: orderData.table,
        items: orderData.items,
        total: orderData.total,
        duration: orderData.time
    };
    
    ordersRef.add(order)
    .then(docRef => {
        console.log('✅ Order saved to Firebase:', docRef.id);
        
        // Also save to localStorage for offline access
        const orders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        orders.push(order);
        localStorage.setItem('orderHistory', JSON.stringify(orders));
    })
    .catch(error => console.error('❌ Error saving order:', error));
}

// ============================================
// GET ORDERS FROM FIREBASE (WITH DATE RANGE)
// ============================================

async function getOrdersFromFirebase(startDate, endDate) {
    if (!db) {
        console.warn('⚠️ Firebase not ready, falling back to localStorage');
        return getOrdersFromLocalStorage(startDate, endDate);
    }
    
    try {
        const ordersRef = db.collection('restaurants').doc('main').collection('orders');
        
        const snapshot = await ordersRef
            .where('timestamp', '>=', startDate.toISOString())
            .where('timestamp', '<=', endDate.toISOString())
            .orderBy('timestamp', 'desc')
            .get();
        
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        
        // If no Firebase orders, check localStorage
        if (orders.length === 0) {
            console.log('No Firebase orders found, checking localStorage');
            return getOrdersFromLocalStorage(startDate, endDate);
        }
        
        return orders;
    } catch (error) {
        console.warn('Firebase error:', error, '- falling back to localStorage');
        return getOrdersFromLocalStorage(startDate, endDate);
    }
}

// Helper function to get orders from localStorage for date range
function getOrdersFromLocalStorage(startDate, endDate) {
    try {
        const orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        const filtered = orderHistory.filter(order => {
            const orderDate = new Date(order.timestamp);
            return orderDate >= startDate && orderDate <= endDate;
        });
        return filtered.reverse(); // Most recent first
    } catch (error) {
        console.warn('localStorage error:', error);
        return [];
    }
}

// ============================================
// GET TODAY'S ORDERS
// ============================================

async function getTodayOrdersFromFirebase() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await getOrdersFromFirebase(today, tomorrow);
}

// ============================================
// SYNC STOCK ADJUSTMENT TO FIREBASE
// ============================================

function syncStockToFirebase(itemName, newStock, action) {
    if (!db) return;
    
    const restaurantRef = db.collection('restaurants').doc('main');
    const logRef = db.collection('restaurants').doc('main').collection('stockLogs');
    
    // Update inventory in main doc with computed property name
    const updateObj = {
        lastUpdated: new Date().toISOString()
    };
    updateObj['inventory.' + itemName] = newStock;
    
    restaurantRef.update(updateObj).catch(err => console.error('Error updating inventory:', err));
    
    // Log the stock change
    logRef.add({
        itemName: itemName,
        action: action, // 'add', 'remove', 'set'
        newStock: newStock,
        timestamp: new Date().toISOString(),
        user: 'staff' // You can track user if you add authentication
    })
    .then(() => console.log('✅ Stock change logged to Firebase'))
    .catch(error => console.error('❌ Error logging stock change:', error));
}

// ============================================
// INITIALIZE FIREBASE SYNC
// ============================================

function initFirebaseSync() {
    if (!db) {
        console.log('🔥 Waiting for Firebase to initialize...');
        setTimeout(initFirebaseSync, 500);
        return;
    }
    
    console.log('🔥 Initializing Firebase sync...');
    
    // Listen for real-time changes
    listenToFirebaseInventory();
    
    // Sync inventory every time it changes (with debounce)
    let syncTimeout;
    const originalSaveInventory = window.saveInventory;
    window.saveInventory = function() {
        originalSaveInventory();
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
            syncInventoryToFirebase();
        }, 1000); // Debounce: wait 1 second before syncing
    };
    
    console.log('✅ Firebase sync initialized');
}

// ============================================
// AUTHENTICATION (Optional)
// ============================================

function loginWithEmail(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
        console.log('✅ Logged in:', userCredential.user.email);
        sessionStorage.setItem('currentUser', userCredential.user.uid);
    })
    .catch(error => {
        console.error('❌ Login failed:', error.message);
        alert('Login failed: ' + error.message);
    });
}

function logout() {
    firebase.auth().signOut()
    .then(() => {
        console.log('✅ Logged out');
        sessionStorage.removeItem('currentUser');
    })
    .catch(error => console.error('❌ Logout failed:', error));
}

function createUserAccount(email, password) {
    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
        console.log('✅ Account created:', userCredential.user.email);
    })
    .catch(error => {
        console.error('❌ Account creation failed:', error.message);
    });
}

// ============================================
// ANALYTICS HELPER
// ============================================

async function getAnalyticsFromFirebase(period = 'today') {
    let startDate = new Date();
    
    if (period === 'today') {
        startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
        startDate.setDate(startDate.getDate() - 30);
    } else if (period === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const endDate = new Date();
    const orders = await getOrdersFromFirebase(startDate, endDate);
    
    return {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
        averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
        orders: orders
    };
}

// ============================================
// SAVE ANALYTICS SNAPSHOTS TO FIREBASE
// ============================================

async function saveAnalyticsSnapshot(analyticData) {
    if (!db) {
        console.warn('⚠️ Firebase not ready, analytics not saved');
        return false;
    }
    
    try {
        const analyticsRef = db.collection('restaurants').doc('main').collection('analytics');
        
        const snapshot = {
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            totalOrders: analyticData.totalOrders || 0,
            totalRevenue: analyticData.totalRevenue || 0,
            avgOrderValue: analyticData.avgOrderValue || 0,
            topItems: analyticData.topItems || [],
            hourlyTraffic: analyticData.hourlyTraffic || {},
            period: analyticData.period || 'daily'
        };
        
        // Save with timestamp as document ID for easy retrieval
        const docRef = await analyticsRef.add(snapshot);
        console.log('✅ Analytics snapshot saved:', docRef.id);
        return true;
    } catch (error) {
        console.error('❌ Error saving analytics:', error);
        return false;
    }
}

// ============================================
// GET ANALYTICS SNAPSHOTS FROM FIREBASE
// ============================================

async function getAnalyticsSnapshots(period = 'today', limit = 100) {
    if (!db) {
        console.warn('⚠️ Firebase not ready');
        return [];
    }
    
    try {
        const analyticsRef = db.collection('restaurants').doc('main').collection('analytics');
        
        let query = analyticsRef.orderBy('timestamp', 'desc').limit(limit);
        
        // Filter by period if needed
        if (period === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query = query.where('timestamp', '>=', today.toISOString());
        } else if (period === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = query.where('timestamp', '>=', weekAgo.toISOString());
        }
        
        const snapshot = await query.get();
        const snapshots = [];
        
        snapshot.forEach(doc => {
            snapshots.push({ id: doc.id, ...doc.data() });
        });
        
        return snapshots;
    } catch (error) {
        console.error('Error retrieving analytics:', error);
        return [];
    }
}

// ============================================
// SAVE DETAILED ORDER WITH ALL METADATA
// ============================================

async function saveDetailedOrderToFirebase(orderData, metadata = {}) {
    if (!db) {
        console.warn('⚠️ Firebase not ready, saving offline...');
        return false;
    }
    
    try {
        const ordersRef = db.collection('restaurants').doc('main').collection('orders');
        
        const now = new Date();
        const detailedOrder = {
            orderId: orderData.id || `ORD-${Date.now()}`,
            timestamp: now.toISOString(),
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            hour: now.getHours(),
            dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
            table: orderData.table || 'N/A',
            items: orderData.items || [],
            itemsCount: orderData.items ? orderData.items.reduce((sum, item) => sum + item.qty, 0) : 0,
            total: orderData.total || 0,
            duration: orderData.time || 'N/A',
            // Metadata
            paymentMethod: metadata.paymentMethod || 'cash',
            status: metadata.status || 'completed',
            notes: metadata.notes || '',
            staffName: metadata.staffName || 'system',
            ipAddress: metadata.ipAddress || 'unknown'
        };
        
        // Add order to Firestore
        const docRef = await ordersRef.add(detailedOrder);
        console.log('✅ Detailed order saved to Firebase:', docRef.id);
        
        // Update daily analytics in real-time
        try {
            await updateDailyAnalytics(detailedOrder);
        } catch (error) {
            console.warn('Daily analytics update failed:', error);
        }
        
        // Also save to localStorage for offline access
        const orders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
        orders.push(detailedOrder);
        localStorage.setItem('orderHistory', JSON.stringify(orders));
        
        return true;
    } catch (error) {
        console.error('❌ Error saving detailed order:', error);
        return false;
    }
}

// ============================================
// UPDATE DAILY ANALYTICS DOCUMENT
// ============================================

async function updateDailyAnalytics(order) {
    if (!db) return;
    
    try {
        const today = new Date().toLocaleDateString();
        const dailyRef = db.collection('restaurants').doc('main').collection('dailyAnalytics').doc(today);
        
        const dailyDoc = await dailyRef.get();
        
        if (dailyDoc.exists) {
            // Update existing daily record
            const data = dailyDoc.data();
            await dailyRef.update({
                totalOrders: (data.totalOrders || 0) + 1,
                totalRevenue: (data.totalRevenue || 0) + (order.total || 0),
                itemsSold: (data.itemsSold || 0) + (order.itemsCount || 0),
                lastUpdated: new Date().toISOString()
            });
        } else {
            // Create new daily record
            await dailyRef.set({
                date: today,
                totalOrders: 1,
                totalRevenue: order.total || 0,
                itemsSold: order.itemsCount || 0,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error updating daily analytics:', error);
    }
}

// ============================================
// GET SUMMARY ANALYTICS FOR DASHBOARD
// ============================================

async function getDashboardAnalytics(days = 30) {
    if (!db) {
        console.warn('⚠️ Firebase not ready');
        return null;
    }
    
    try {
        const analyticsRef = db.collection('restaurants').doc('main').collection('dailyAnalytics');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const snapshot = await analyticsRef
            .where('createdAt', '>=', startDate.toISOString())
            .orderBy('createdAt', 'desc')
            .get();
        
        let summary = {
            totalOrders: 0,
            totalRevenue: 0,
            totalItemsSold: 0,
            avgOrderValue: 0,
            daysAnalyzed: 0,
            dailyRecords: []
        };
        
        snapshot.forEach(doc => {
            const data = doc.data();
            summary.totalOrders += data.totalOrders || 0;
            summary.totalRevenue += data.totalRevenue || 0;
            summary.totalItemsSold += data.itemsSold || 0;
            summary.daysAnalyzed++;
            summary.dailyRecords.push({ date: doc.id, ...data });
        });
        
        summary.avgOrderValue = summary.totalOrders > 0 ? 
            (summary.totalRevenue / summary.totalOrders).toFixed(2) : 0;
        
        return summary;
    } catch (error) {
        console.error('Error getting dashboard analytics:', error);
        return null;
    }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================
window.initFirebaseSync = initFirebaseSync;
window.syncInventoryToFirebase = syncInventoryToFirebase;
window.saveOrderToFirebase = saveOrderToFirebase;
window.saveDetailedOrderToFirebase = saveDetailedOrderToFirebase;
window.getOrdersFromFirebase = getOrdersFromFirebase;
window.getTodayOrdersFromFirebase = getTodayOrdersFromFirebase;
window.getAnalyticsFromFirebase = getAnalyticsFromFirebase;
window.saveAnalyticsSnapshot = saveAnalyticsSnapshot;
window.getAnalyticsSnapshots = getAnalyticsSnapshots;
window.updateDailyAnalytics = updateDailyAnalytics;
window.getDashboardAnalytics = getDashboardAnalytics;
window.loginWithEmail = loginWithEmail;
window.logout = logout;
window.createUserAccount = createUserAccount;
