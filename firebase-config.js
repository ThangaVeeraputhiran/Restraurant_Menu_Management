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
        console.warn('⚠️ Firebase not ready');
        return [];
    }
    
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
    
    return orders;
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
// EXPORT FUNCTIONS
// ============================================
window.initFirebaseSync = initFirebaseSync;
window.syncInventoryToFirebase = syncInventoryToFirebase;
window.saveOrderToFirebase = saveOrderToFirebase;
window.getOrdersFromFirebase = getOrdersFromFirebase;
window.getTodayOrdersFromFirebase = getTodayOrdersFromFirebase;
window.getAnalyticsFromFirebase = getAnalyticsFromFirebase;
window.loginWithEmail = loginWithEmail;
window.logout = logout;
window.createUserAccount = createUserAccount;
