// ===================================
// MENU DATA WITH EXACT PRICES
// ===================================
console.log('🍽️ Kitchen Alert Script Loading...');

const menuItems = {
    "Tea": 10,
    "Coffee": 15,
    "Horlicks": 20,
    "Boost": 20,
    "Vada": 10,
    "Idly (Plate)": 40,
    "Poori (Plate)": 40,
    "Dosa": 40,
    "Masal Dosa": 50,
    "Paper Roast": 55,
    "Ghee Roast": 60,
    "Onion Dosa": 50,
    "Uthappam": 40,
    "Onion Uthappam": 50,
    "Chapathi": 30,
    "Porota (Plate)": 40,
    "Meals": 70
};

// ===================================
// INVENTORY MANAGEMENT SYSTEM
// ===================================

/**
 * Default inventory settings for each menu item
 */
const defaultInventory = {
    "Tea": { currentStock: 100, unit: "cups", lowThreshold: 20, criticalThreshold: 5, category: "Beverages" },
    "Coffee": { currentStock: 100, unit: "cups", lowThreshold: 20, criticalThreshold: 5, category: "Beverages" },
    "Horlicks": { currentStock: 50, unit: "cups", lowThreshold: 15, criticalThreshold: 5, category: "Beverages" },
    "Boost": { currentStock: 50, unit: "cups", lowThreshold: 15, criticalThreshold: 5, category: "Beverages" },
    "Vada": { currentStock: 80, unit: "pieces", lowThreshold: 15, criticalThreshold: 5, category: "Snacks" },
    "Idly (Plate)": { currentStock: 50, unit: "plates", lowThreshold: 10, criticalThreshold: 3, category: "Tiffin/Meals" },
    "Poori (Plate)": { currentStock: 40, unit: "plates", lowThreshold: 10, criticalThreshold: 3, category: "Tiffin/Meals" },
    "Dosa": { currentStock: 60, unit: "pieces", lowThreshold: 15, criticalThreshold: 5, category: "Tiffin/Meals" },
    "Masal Dosa": { currentStock: 50, unit: "pieces", lowThreshold: 12, criticalThreshold: 4, category: "Tiffin/Meals" },
    "Paper Roast": { currentStock: 40, unit: "pieces", lowThreshold: 10, criticalThreshold: 3, category: "Tiffin/Meals" },
    "Ghee Roast": { currentStock: 40, unit: "pieces", lowThreshold: 10, criticalThreshold: 3, category: "Tiffin/Meals" },
    "Onion Dosa": { currentStock: 45, unit: "pieces", lowThreshold: 12, criticalThreshold: 4, category: "Tiffin/Meals" },
    "Uthappam": { currentStock: 35, unit: "pieces", lowThreshold: 10, criticalThreshold: 3, category: "Tiffin/Meals" },
    "Onion Uthappam": { currentStock: 35, unit: "pieces", lowThreshold: 10, criticalThreshold: 3, category: "Tiffin/Meals" },
    "Chapathi": { currentStock: 50, unit: "pieces", lowThreshold: 15, criticalThreshold: 5, category: "Tiffin/Meals" },
    "Porota (Plate)": { currentStock: 40, unit: "plates", lowThreshold: 10, criticalThreshold: 3, category: "Tiffin/Meals" },
    "Meals": { currentStock: 30, unit: "plates", lowThreshold: 8, criticalThreshold: 2, category: "Tiffin/Meals" }
};

/**
 * Initialize or load inventory from localStorage
 */
let inventory = {};

function initializeInventory() {
    const savedInventory = localStorage.getItem('restaurantInventory');
    
    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
        
        // Add any new items from defaultInventory that don't exist
        for (const itemName in defaultInventory) {
            if (!inventory[itemName]) {
                inventory[itemName] = { ...defaultInventory[itemName], lastRestocked: new Date().toISOString() };
            }
        }
    } else {
        // First time - use default inventory
        inventory = {};
        for (const itemName in defaultInventory) {
            inventory[itemName] = { ...defaultInventory[itemName], lastRestocked: new Date().toISOString() };
        }
    }
    
    saveInventory();
}

/**
 * Save inventory to localStorage
 */
function saveInventory() {
    localStorage.setItem('restaurantInventory', JSON.stringify(inventory));
}

/**
 * Get stock status for an item
 * @param {string} itemName - Name of the item
 * @returns {string} - 'ok', 'low', 'critical', or 'out'
 */
function getStockStatus(itemName) {
    const item = inventory[itemName];
    if (!item) return 'ok';
    
    if (item.currentStock <= 0) return 'out';
    if (item.currentStock <= item.criticalThreshold) return 'critical';
    if (item.currentStock <= item.lowThreshold) return 'low';
    return 'ok';
}

/**
 * Check if item is available for ordering
 * @param {string} itemName - Name of the item
 * @param {number} quantity - Quantity to order
 * @returns {boolean} - true if available
 */
function isItemAvailable(itemName, quantity) {
    const item = inventory[itemName];
    if (!item) return true; // If no inventory tracking, allow order
    return item.currentStock >= quantity;
}

/**
 * Deduct stock when order is placed
 * @param {object} cart - Cart object with items
 */
function deductStock(cart) {
    for (const itemName in cart) {
        if (inventory[itemName]) {
            inventory[itemName].currentStock -= cart[itemName].quantity;
            
            // Ensure stock doesn't go negative
            if (inventory[itemName].currentStock < 0) {
                inventory[itemName].currentStock = 0;
            }
        }
    }
    saveInventory();
    updateAllStockIndicators();
}

/**
 * Add stock to an item
 * @param {string} itemName - Name of the item
 * @param {number} quantity - Quantity to add
 */
function addStock(itemName, quantity) {
    if (inventory[itemName]) {
        inventory[itemName].currentStock += quantity;
        inventory[itemName].lastRestocked = new Date().toISOString();
        saveInventory();
        updateAllStockIndicators();
        updateInventoryDashboard();
    }
}

/**
 * Set stock for an item
 * @param {string} itemName - Name of the item
 * @param {number} quantity - New quantity
 */
function setStock(itemName, quantity) {
    if (inventory[itemName]) {
        inventory[itemName].currentStock = quantity;
        inventory[itemName].lastRestocked = new Date().toISOString();
        saveInventory();
        updateAllStockIndicators();
        updateInventoryDashboard();
    }
}

/**
 * Get items that need restocking
 * @returns {Array} - Array of items with low or critical stock
 */
function getRestockList() {
    const restockItems = [];
    
    for (const itemName in inventory) {
        const status = getStockStatus(itemName);
        if (status === 'low' || status === 'critical' || status === 'out') {
            restockItems.push({
                name: itemName,
                currentStock: inventory[itemName].currentStock,
                status: status,
                unit: inventory[itemName].unit
            });
        }
    }
    
    return restockItems;
}

/**
 * Update stock indicator for a specific item
 * @param {string} itemName - Name of the item
 */
function updateStockIndicator(itemName) {
    const menuItemElement = document.querySelector(`.menu-item[data-name="${itemName}"]`);
    if (!menuItemElement) return;
    
    // Remove existing stock badge
    const existingBadge = menuItemElement.querySelector('.stock-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    const status = getStockStatus(itemName);
    const item = inventory[itemName];
    
    if (status !== 'ok') {
        const badge = document.createElement('div');
        badge.className = `stock-badge stock-${status}`;
        
        if (status === 'out') {
            badge.textContent = 'OUT OF STOCK';
            // Disable the item
            const plusBtn = menuItemElement.querySelector('.btn-plus');
            if (plusBtn) plusBtn.disabled = true;
        } else if (status === 'critical') {
            badge.textContent = `Only ${item.currentStock} ${item.unit} left!`;
        } else if (status === 'low') {
            badge.textContent = `Low Stock: ${item.currentStock} ${item.unit}`;
        }
        
        menuItemElement.querySelector('.item-info').appendChild(badge);
    } else {
        // Re-enable the item if it was disabled
        const plusBtn = menuItemElement.querySelector('.btn-plus');
        if (plusBtn) plusBtn.disabled = false;
    }
    
    // Add stock count display
    let stockDisplay = menuItemElement.querySelector('.stock-display');
    if (!stockDisplay) {
        stockDisplay = document.createElement('div');
        stockDisplay.className = 'stock-display';
        menuItemElement.querySelector('.item-info').appendChild(stockDisplay);
    }
    stockDisplay.textContent = `Stock: ${item.currentStock} ${item.unit}`;
}

/**
 * Update all stock indicators
 */
function updateAllStockIndicators() {
    for (const itemName in inventory) {
        updateStockIndicator(itemName);
    }
    
    // Update restock alerts
    updateRestockAlerts();
}

/**
 * Update restock alerts in header
 */
function updateRestockAlerts() {
    const restockList = getRestockList();
    let alertElement = document.getElementById('restock-alert');
    
    if (!alertElement) {
        alertElement = document.createElement('div');
        alertElement.id = 'restock-alert';
        alertElement.className = 'restock-alert';
        document.querySelector('.container').insertBefore(alertElement, document.querySelector('.menu-container'));
    }
    
    if (restockList.length > 0) {
        const criticalItems = restockList.filter(item => item.status === 'critical' || item.status === 'out');
        const lowItems = restockList.filter(item => item.status === 'low');
        
        let alertHTML = '<div class="alert-content">';
        alertHTML += '<h3>⚠️ Inventory Alerts</h3>';
        
        if (criticalItems.length > 0) {
            alertHTML += '<div class="alert-section alert-critical">';
            alertHTML += '<strong>Critical/Out of Stock:</strong> ';
            alertHTML += criticalItems.map(item => `${item.name} (${item.currentStock} ${item.unit})`).join(', ');
            alertHTML += '</div>';
        }
        
        if (lowItems.length > 0) {
            alertHTML += '<div class="alert-section alert-low">';
            alertHTML += '<strong>Low Stock:</strong> ';
            alertHTML += lowItems.map(item => `${item.name} (${item.currentStock} ${item.unit})`).join(', ');
            alertHTML += '</div>';
        }
        
        alertHTML += '<button class="btn-view-inventory" onclick="openInventoryDashboard()">Manage Inventory</button>';
        alertHTML += '</div>';
        
        alertElement.innerHTML = alertHTML;
        alertElement.style.display = 'block';
    } else {
        alertElement.style.display = 'none';
    }
}

// ===================================
// CART MANAGEMENT
// ===================================
let cart = {};

/**
 * Update quantity for a menu item
 * @param {string} itemName - Name of the item
 * @param {number} change - Change in quantity (+1 or -1)
 */
function updateQuantity(itemName, change) {
    // Initialize cart item if it doesn't exist
    if (!cart[itemName]) {
        cart[itemName] = {
            quantity: 0,
            price: menuItems[itemName]
        };
    }

    // Calculate new quantity
    const newQuantity = cart[itemName].quantity + change;

    // Check stock availability when increasing quantity
    if (change > 0) {
        if (!isItemAvailable(itemName, newQuantity)) {
            const currentStock = inventory[itemName]?.currentStock || 0;
            alert(`Sorry! Only ${currentStock} ${inventory[itemName]?.unit || 'items'} of ${itemName} available in stock.`);
            return;
        }
    }

    // Update quantity
    cart[itemName].quantity = newQuantity;

    // Remove item if quantity is 0 or less
    if (cart[itemName].quantity <= 0) {
        cart[itemName].quantity = 0;
        delete cart[itemName];
    }

    // Update UI
    updateQuantityDisplay(itemName);
    updateCartBar();
}

/**
 * Update quantity display for specific item
 * @param {string} itemName - Name of the item
 */
function updateQuantityDisplay(itemName) {
    const qtyElement = document.getElementById(`qty-${itemName}`);
    if (qtyElement) {
        const quantity = cart[itemName] ? cart[itemName].quantity : 0;
        qtyElement.textContent = quantity;
    }
}

/**
 * Update the sticky cart bar with total items and amount
 */
function updateCartBar() {
    let totalItems = 0;
    let totalAmount = 0;

    for (const itemName in cart) {
        totalItems += cart[itemName].quantity;
        totalAmount += cart[itemName].quantity * cart[itemName].price;
    }

    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('total-amount').textContent = totalAmount;
}

// ===================================
// CHECKOUT FUNCTIONALITY
// ===================================

/**
 * Open checkout modal and display cart items
 */
function openCheckout() {
    // Check if cart is empty
    const totalItems = Object.keys(cart).length;
    if (totalItems === 0) {
        alert('Your cart is empty! Please add items to your order.');
        return;
    }

    // Populate cart items
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';

    let totalQuantity = 0;
    let grandTotal = 0;

    for (const itemName in cart) {
        const item = cart[itemName];
        const itemTotal = item.quantity * item.price;
        totalQuantity += item.quantity;
        grandTotal += itemTotal;

        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${itemName}</div>
                <div class="cart-item-details">${item.quantity} × ₹${item.price} = ₹${itemTotal}</div>
            </div>
            <div class="cart-item-total">₹${itemTotal}</div>
        `;
        cartItemsContainer.appendChild(cartItemElement);
    }

    // Update summary
    document.getElementById('checkout-total-items').textContent = totalQuantity;
    document.getElementById('checkout-total-amount').textContent = grandTotal;

    // Show modal
    document.getElementById('checkout-modal').classList.add('active');
}

/**
 * Close checkout modal
 */
function closeCheckout() {
    document.getElementById('checkout-modal').classList.remove('active');
}

// ===================================
// ORDER CONFIRMATION & IoT COMMUNICATION
// ===================================

/**
 * Confirm order and send to ESP32
 */
async function confirmOrder() {
    const esp32IP = document.getElementById('esp32-ip').value.trim();
    const tableNumber = document.getElementById('table-number').value;

    // Validate inputs
    if (!esp32IP) {
        alert('Please enter ESP32 IP address!');
        return;
    }

    if (!tableNumber || tableNumber < 1) {
        alert('Please enter a valid table number!');
        return;
    }

    // Prepare order data
    const orderData = prepareOrderData(tableNumber);

    // Close checkout modal
    closeCheckout();

    // Send to ESP32
    try {
        const success = await sendOrderToESP32(esp32IP, orderData);
        
        if (success) {
            processOrder(orderData);
            showConfirmation(orderData);
            clearCart();
        } else {
            alert('Failed to send order to kitchen display. Please check ESP32 connection and try again.');
        }
    } catch (error) {
        console.error('Order sending error:', error);
        alert('Error sending order: ' + error.message);
    }
}

/**
 * Process order and deduct stock
 * @param {object} orderData - Order data object
 */
function processOrder(orderData) {
    // Deduct stock for ordered items
    deductStock(cart);
    
    // Save order to history
    saveOrderToHistory(orderData);
    
    // Log the transaction
    logInventoryTransaction(cart, 'order');
}

/**
 * Prepare order data in JSON format for ESP32
 * @param {string} tableNumber - Table number
 * @returns {object} Order data object
 */
function prepareOrderData(tableNumber) {
    const items = [];
    let total = 0;

    for (const itemName in cart) {
        const item = cart[itemName];
        items.push({
            name: itemName,
            qty: item.quantity
        });
        total += item.quantity * item.price;
    }

    // Get current time
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });

    return {
        table: tableNumber.toString(),
        items: items,
        total: total,
        time: time
    };
}

/**
 * Send order data to ESP32 via HTTP POST
 * @param {string} esp32IP - ESP32 IP address
 * @param {object} orderData - Order data object
 * @returns {Promise<boolean>} Success status
 */
async function sendOrderToESP32(esp32IP, orderData) {
    try {
        const url = `http://${esp32IP}/order`;
        
        console.log('Sending order to:', url);
        console.log('Order data:', JSON.stringify(orderData, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
            timeout: 5000
        });

        if (!response.ok) {
            console.error('Response status:', response.status);
            console.error('Response text:', await response.text());
            return false;
        }

        const responseData = await response.json();
        console.log('Order sent successfully to ESP32:', responseData);
        return true;

    } catch (error) {
        console.error('Error sending order to ESP32:', error);
        console.error('Error details:', error.message);
        return false;
    }
}

/**
 * Test connection to ESP32
 */
async function testConnection() {
    const esp32IP = document.getElementById('esp32-ip').value.trim();
    const statusElement = document.getElementById('connection-status');

    if (!esp32IP) {
        statusElement.textContent = '❌ Please enter IP address';
        statusElement.className = 'error';
        return;
    }

    statusElement.textContent = '🔄 Testing connection...';
    statusElement.className = '';

    try {
        const url = `http://${esp32IP}/test`;
        
        console.log('Testing connection to:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            timeout: 5000
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Connection successful:', data);
        
        statusElement.textContent = '✅ Connection successful!';
        statusElement.className = 'success';
        
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = '';
        }, 3000);

    } catch (error) {
        console.error('Connection test failed:', error);
        statusElement.textContent = `❌ Failed: ${error.message}`;
        statusElement.className = 'error';
    }
}

/**
 * Show order confirmation modal
 * @param {object} orderData - Order data object
 */
function showConfirmation(orderData) {
    const detailsElement = document.getElementById('order-confirmation-details');
    
    // Format order details for display
    let itemsList = '';
    orderData.items.forEach(item => {
        itemsList += `${item.name} × ${item.qty}\n`;
    });

    detailsElement.textContent = `
Table: ${orderData.table}
Time: ${orderData.time}

Items:
${itemsList}
Total: ₹${orderData.total}

✓ Order sent to kitchen display!
    `.trim();

    // Show confirmation modal
    document.getElementById('confirmation-modal').classList.add('active');
}

/**
 * Close confirmation modal and reset for new order
 */
function closeConfirmation() {
    document.getElementById('confirmation-modal').classList.remove('active');
}

/**
 * Clear cart and reset UI
 */
function clearCart() {
    cart = {};
    
    // Reset all quantity displays
    for (const itemName in menuItems) {
        updateQuantityDisplay(itemName);
    }
    
    updateCartBar();
}

// ===================================
// INITIALIZATION
// ===================================

/**
 * Initialize the application
 */
function init() {
    console.log('🍽️ Smart Restaurant Ordering System Initialized');
    console.log('📱 Ready to take orders!');
    
    // Load custom menu items first
    loadCustomMenuItems();
    
    // Initialize inventory system
    initializeInventory();
    applyRemovedMenuItems();
    
    // Load saved ESP32 IP from localStorage if available
    const savedIP = localStorage.getItem('esp32-ip');
    if (savedIP) {
        document.getElementById('esp32-ip').value = savedIP;
    }
    
    // Save ESP32 IP when it changes
    document.getElementById('esp32-ip').addEventListener('change', function() {
        localStorage.setItem('esp32-ip', this.value);
    });
    
    updateCartBar();
    updateAllStockIndicators();
    
    console.log('✅ Initialization Complete - All Functions Ready');
}

// ===================================
// INVENTORY DASHBOARD
// ===================================

/**
 * Open inventory management dashboard
 */
function openInventoryDashboard() {
    updateInventoryDashboard();
    document.getElementById('inventory-modal').classList.add('active');
}

/**
 * Close inventory dashboard
 */
function closeInventoryDashboard() {
    document.getElementById('inventory-modal').classList.remove('active');
}

/**
 * Update inventory dashboard display
 */
function updateInventoryDashboard() {
    const inventoryListElement = document.getElementById('inventory-list');
    if (!inventoryListElement) return;
    
    inventoryListElement.innerHTML = '';
    
    // Group by category
    const categories = {
        'Beverages': [],
        'Snacks': [],
        'Tiffin/Meals': []
    };
    
    for (const itemName in inventory) {
        const item = inventory[itemName];
        const category = item.category || 'Other';
        if (!categories[category]) categories[category] = [];
        categories[category].push({ name: itemName, ...item });
    }
    
    // Render each category
    for (const categoryName in categories) {
        if (categories[categoryName].length === 0) continue;
        
        const categorySection = document.createElement('div');
        categorySection.className = 'inventory-category';
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.className = 'inventory-category-title';
        categoryTitle.textContent = categoryName;
        categorySection.appendChild(categoryTitle);
        
        categories[categoryName].forEach(item => {
            const status = getStockStatus(item.name);
            
            const itemRow = document.createElement('div');
            itemRow.className = `inventory-item inventory-status-${status}`;
            
            itemRow.innerHTML = `
                <div class="inventory-item-info">
                    <div class="inventory-item-name">${item.name}</div>
                    <div class="inventory-item-stock">
                        <span class="stock-count">${item.currentStock} ${item.unit}</span>
                        <span class="stock-status-badge status-${status}">${status.toUpperCase()}</span>
                    </div>
                </div>
                <div class="inventory-item-controls">
                    <button class="btn-stock-adjust" onclick="openStockAdjust('${item.name}')">Adjust Stock</button>
                    <button class="btn-stock-quick" onclick="quickAddStock('${item.name}', 10)">+10</button>
                    <button class="btn-stock-remove" onclick="quickRemoveStock('${item.name}', 10)">-10</button>
                    <button class="btn-stock-delete" onclick="removeMenuItem('${item.name}')">Remove Item</button>
                </div>
            `;
            
            categorySection.appendChild(itemRow);
        });
        
        inventoryListElement.appendChild(categorySection);
    }
    
    // Update statistics
    updateInventoryStats();
}

/**
 * Update inventory statistics
 */
function updateInventoryStats() {
    const stats = {
        total: 0,
        ok: 0,
        low: 0,
        critical: 0,
        out: 0
    };
    
    for (const itemName in inventory) {
        stats.total++;
        const status = getStockStatus(itemName);
        stats[status]++;
    }
    
    document.getElementById('stat-total-items').textContent = stats.total;
    document.getElementById('stat-ok-stock').textContent = stats.ok;
    document.getElementById('stat-low-stock').textContent = stats.low;
    document.getElementById('stat-critical-stock').textContent = stats.critical + stats.out;
}

/**
 * Open stock adjustment modal
 * @param {string} itemName - Name of the item
 */
function openStockAdjust(itemName) {
    const item = inventory[itemName];
    document.getElementById('adjust-item-name').textContent = itemName;
    document.getElementById('adjust-current-stock').textContent = `Current: ${item.currentStock} ${item.unit}`;
    document.getElementById('adjust-quantity').value = '';
    document.getElementById('adjust-modal').setAttribute('data-item', itemName);
    document.getElementById('adjust-modal').classList.add('active');
}

/**
 * Close stock adjustment modal
 */
function closeStockAdjust() {
    document.getElementById('adjust-modal').classList.remove('active');
}

/**
 * Apply stock adjustment
 */
function applyStockAdjustment() {
    const itemName = document.getElementById('adjust-modal').getAttribute('data-item');
    const action = document.querySelector('input[name="adjust-action"]:checked').value;
    const quantity = parseInt(document.getElementById('adjust-quantity').value);
    
    if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
    }
    
    if (action === 'add') {
        addStock(itemName, quantity);
    } else if (action === 'set') {
        setStock(itemName, quantity);
    } else if (action === 'remove') {
        const currentStock = inventory[itemName].currentStock;
        const newStock = Math.max(0, currentStock - quantity);
        setStock(itemName, newStock);
    }
    
    closeStockAdjust();
}

/**
 * Quick add stock
 * @param {string} itemName - Name of the item
 * @param {number} quantity - Quantity to add
 */
function quickAddStock(itemName, quantity) {
    addStock(itemName, quantity);
}

/**
 * Quick remove stock
 * @param {string} itemName - Name of the item
 * @param {number} quantity - Quantity to remove
 */
function quickRemoveStock(itemName, quantity) {
    const item = inventory[itemName];
    if (!item) return;
    const newStock = Math.max(0, item.currentStock - quantity);
    setStock(itemName, newStock);
}

/**
 * Load removed menu items list
 * @returns {string[]} - Removed menu item names
 */
function getRemovedMenuItems() {
    const removed = localStorage.getItem('removedMenuItems');
    if (!removed) return [];
    try {
        const list = JSON.parse(removed);
        return Array.isArray(list) ? list : [];
    } catch (error) {
        return [];
    }
}

/**
 * Save removed menu items list
 * @param {string[]} list - Removed menu item names
 */
function saveRemovedMenuItems(list) {
    localStorage.setItem('removedMenuItems', JSON.stringify(list));
}

/**
 * Remove a menu item entirely from menu and inventory
 * @param {string} itemName - Name of the item
 * @param {object} options - Removal options
 */
function removeMenuItem(itemName, options) {
    const settings = options || {};
    const skipConfirm = settings.skipConfirm === true;
    const persist = settings.persist !== false;

    if (!skipConfirm) {
        const ok = confirm(`Remove ${itemName} from menu and inventory? This cannot be undone.`);
        if (!ok) return;
    }

    delete menuItems[itemName];
    if (inventory[itemName]) {
        delete inventory[itemName];
        saveInventory();
    }

    if (cart[itemName]) {
        delete cart[itemName];
        updateCartBar();
    }

    document.querySelectorAll('.menu-item').forEach((element) => {
        if (element.getAttribute('data-name') === itemName) {
            element.remove();
        }
    });

    if (persist) {
        const removedItems = getRemovedMenuItems();
        if (!removedItems.includes(itemName)) {
            removedItems.push(itemName);
            saveRemovedMenuItems(removedItems);
        }
        localStorage.setItem('customMenuItems', JSON.stringify(menuItems));
    }

    updateAllStockIndicators();
    updateInventoryDashboard();
}

/**
 * Apply persisted removals on startup
 */
function applyRemovedMenuItems() {
    const removedItems = getRemovedMenuItems();
    if (removedItems.length === 0) return;
    removedItems.forEach((itemName) => {
        removeMenuItem(itemName, { skipConfirm: true, persist: false });
    });
}

/**
 * Reset all inventory to default
 */
function resetInventory() {
    if (confirm('Are you sure you want to reset all inventory to default values? This cannot be undone.')) {
        inventory = {};
        for (const itemName in defaultInventory) {
            inventory[itemName] = { ...defaultInventory[itemName], lastRestocked: new Date().toISOString() };
        }
        saveInventory();
        updateAllStockIndicators();
        updateInventoryDashboard();
        alert('Inventory reset successfully!');
    }
}

/**
 * Export inventory data
 */
function exportInventory() {
    const headers = [
        'item',
        'currentStock',
        'unit',
        'lowThreshold',
        'criticalThreshold',
        'category',
        'lastRestocked'
    ];

    const rows = [headers.join(',')];

    for (const itemName in inventory) {
        const item = inventory[itemName] || {};
        const values = [
            itemName,
            item.currentStock ?? '',
            item.unit ?? '',
            item.lowThreshold ?? '',
            item.criticalThreshold ?? '',
            item.category ?? '',
            item.lastRestocked ?? ''
        ].map((value) => {
            const text = String(value);
            return `"${text.replace(/"/g, '""')}"`;
        });
        rows.push(values.join(','));
    }

    const dataStr = rows.join('\n');
    const dataBlob = new Blob([dataStr], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Log inventory transaction
 * @param {object} items - Items involved in transaction
 * @param {string} type - Type of transaction ('order', 'restock', 'adjustment')
 */
function logInventoryTransaction(items, type) {
    const transactions = JSON.parse(localStorage.getItem('inventoryTransactions') || '[]');
    
    const transaction = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: type,
        items: []
    };
    
    for (const itemName in items) {
        transaction.items.push({
            name: itemName,
            quantity: items[itemName].quantity || items[itemName],
            stockAfter: inventory[itemName]?.currentStock || 0
        });
    }
    
    transactions.push(transaction);
    
    // Keep only last 100 transactions
    if (transactions.length > 100) {
        transactions.splice(0, transactions.length - 100);
    }
    
    localStorage.setItem('inventoryTransactions', JSON.stringify(transactions));
}

// ===================================
// DYNAMIC MENU MANAGEMENT
// ===================================

/**
 * Open add new item modal
 */
function openAddNewItem() {
    document.getElementById('add-item-modal').classList.add('active');
    document.getElementById('new-item-form').reset();
}

/**
 * Close add new item modal
 */
function closeAddNewItem() {
    document.getElementById('add-item-modal').classList.remove('active');
}

/**
 * Add new menu item
 */
function addNewMenuItem() {
    const name = document.getElementById('new-item-name').value.trim();
    const price = parseFloat(document.getElementById('new-item-price').value);
    const category = document.getElementById('new-item-category').value;
    const stock = parseInt(document.getElementById('new-item-stock').value);
    const unit = document.getElementById('new-item-unit').value.trim();
    const lowThreshold = parseInt(document.getElementById('new-item-low-threshold').value);
    const criticalThreshold = parseInt(document.getElementById('new-item-critical-threshold').value);
    
    // Validation
    if (!name || !price || !stock || !unit || !lowThreshold || !criticalThreshold) {
        alert('Please fill in all fields');
        return;
    }
    
    if (menuItems[name]) {
        alert('An item with this name already exists!');
        return;
    }
    
    if (price <= 0 || stock < 0 || lowThreshold < 0 || criticalThreshold < 0) {
        alert('Please enter valid positive numbers');
        return;
    }
    
    // Add to menu items
    menuItems[name] = price;
    
    // Add to inventory
    inventory[name] = {
        currentStock: stock,
        unit: unit,
        lowThreshold: lowThreshold,
        criticalThreshold: criticalThreshold,
        category: category,
        lastRestocked: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('customMenuItems', JSON.stringify(menuItems));
    saveInventory();
    
    // Refresh UI
    alert(`${name} added successfully!`);
    closeAddNewItem();
    
    // Note: User will need to refresh page to see new item in menu
    // Or we can dynamically add it to the menu
    location.reload();
}

/**
 * Load custom menu items from localStorage
 */
function loadCustomMenuItems() {
    const customItems = localStorage.getItem('customMenuItems');
    if (customItems) {
        const items = JSON.parse(customItems);
        Object.assign(menuItems, items);
    }
}

// ===================================
// ORDER HISTORY & BILLING SYSTEM
// ===================================

/**
 * Save order to history
 * @param {object} orderData - Order data object
 */
function saveOrderToHistory(orderData) {
    const orders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    
    const order = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        table: orderData.table,
        items: orderData.items,
        total: orderData.total,
        time: orderData.time,
        date: new Date().toLocaleDateString(),
        hour: new Date().getHours()
    };
    
    orders.push(order);
    localStorage.setItem('orderHistory', JSON.stringify(orders));
}

/**
 * Get all orders
 * @returns {Array} - Array of all orders
 */
function getAllOrders() {
    return JSON.parse(localStorage.getItem('orderHistory') || '[]');
}

/**
 * Get orders by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Filtered orders
 */
function getOrdersByDateRange(startDate, endDate) {
    const orders = getAllOrders();
    return orders.filter(order => {
        const orderDate = new Date(order.timestamp);
        return orderDate >= startDate && orderDate <= endDate;
    });
}

/**
 * Get today's orders
 * @returns {Array} - Today's orders
 */
function getTodayOrders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return getOrdersByDateRange(today, tomorrow);
}

/**
 * Get this month's orders
 * @returns {Array} - This month's orders
 */
function getMonthOrders() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    return getOrdersByDateRange(firstDay, lastDay);
}

/**
 * Get this year's orders
 * @returns {Array} - This year's orders
 */
function getYearOrders() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const lastDay = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    
    return getOrdersByDateRange(firstDay, lastDay);
}

/**
 * Calculate revenue from orders
 * @param {Array} orders - Array of orders
 * @returns {number} - Total revenue
 */
function calculateRevenue(orders) {
    return orders.reduce((sum, order) => sum + order.total, 0);
}

/**
 * Get hourly traffic data
 * @param {Array} orders - Array of orders
 * @returns {Object} - Hour-wise order count and revenue
 */
function getHourlyTraffic(orders) {
    const hourlyData = {};
    
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
        hourlyData[i] = { count: 0, revenue: 0 };
    }
    
    // Populate with order data
    orders.forEach(order => {
        const hour = order.hour;
        hourlyData[hour].count++;
        hourlyData[hour].revenue += order.total;
    });
    
    return hourlyData;
}

/**
 * Get top selling items
 * @param {Array} orders - Array of orders
 * @returns {Array} - Top selling items with quantities
 */
function getTopSellingItems(orders) {
    const itemCounts = {};
    
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!itemCounts[item.name]) {
                itemCounts[item.name] = { count: 0, revenue: 0 };
            }
            itemCounts[item.name].count += item.qty;
            itemCounts[item.name].revenue += item.qty * (menuItems[item.name] || 0);
        });
    });
    
    // Convert to array and sort
    const items = Object.keys(itemCounts).map(name => ({
        name: name,
        count: itemCounts[name].count,
        revenue: itemCounts[name].revenue
    }));
    
    return items.sort((a, b) => b.count - a.count);
}

/**
 * Get daily revenue for a month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Object} - Day-wise revenue
 */
function getDailyRevenueForMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const orders = getOrdersByDateRange(firstDay, lastDay);
    
    const dailyRevenue = {};
    
    orders.forEach(order => {
        const date = new Date(order.timestamp).getDate();
        if (!dailyRevenue[date]) {
            dailyRevenue[date] = 0;
        }
        dailyRevenue[date] += order.total;
    });
    
    return dailyRevenue;
}

/**
 * Open analytics dashboard
 */
function openAnalyticsDashboard() {
    try {
        updateAnalyticsDashboard('today');
        const modal = document.getElementById('analytics-modal');
        if (modal) {
            modal.classList.add('active');
        } else {
            console.error('Analytics modal not found');
        }
    } catch (error) {
        console.error('Error opening analytics dashboard:', error);
        alert('Error opening analytics dashboard. Please check the console for details.');
    }
}

/**
 * Close analytics dashboard
 */
function closeAnalyticsDashboard() {
    document.getElementById('analytics-modal').classList.remove('active');
}

/**
 * Update analytics dashboard
 * @param {string} period - 'today', 'month', 'year', or 'custom'
 */
function updateAnalyticsDashboard(period) {
    try {
        let orders = [];
        let periodLabel = '';
        
        if (period === 'today') {
            orders = getTodayOrders();
            periodLabel = 'Today';
        } else if (period === 'month') {
            orders = getMonthOrders();
            periodLabel = 'This Month';
        } else if (period === 'year') {
            orders = getYearOrders();
            periodLabel = 'This Year';
        } else if (period === 'custom') {
            const startDate = new Date(document.getElementById('analytics-start-date').value);
            const endDate = new Date(document.getElementById('analytics-end-date').value);
            endDate.setHours(23, 59, 59);
            orders = getOrdersByDateRange(startDate, endDate);
            periodLabel = 'Custom Range';
        }
        
        // Update period label
        const periodLabelElement = document.getElementById('analytics-period-label');
        if (periodLabelElement) {
            periodLabelElement.textContent = periodLabel;
        }
        
        // Calculate statistics
        const totalOrders = orders.length;
        const totalRevenue = calculateRevenue(orders);
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;
        
        // Update statistics
        const statTotalOrders = document.getElementById('stat-total-orders');
        const statTotalRevenue = document.getElementById('stat-total-revenue');
        const statAvgOrder = document.getElementById('stat-avg-order');
        
        if (statTotalOrders) statTotalOrders.textContent = totalOrders;
        if (statTotalRevenue) statTotalRevenue.textContent = `₹${totalRevenue}`;
        if (statAvgOrder) statAvgOrder.textContent = `₹${avgOrderValue}`;
        
        // Hourly traffic
        const hourlyData = getHourlyTraffic(orders);
        displayHourlyTraffic(hourlyData);
        
        // Top selling items
        const topItems = getTopSellingItems(orders);
        displayTopSellingItems(topItems);
        
        // Order list
        displayOrderList(orders);
    if (!container) {
        console.error('Hourly traffic chart container not found');
        return;
    }
    } catch (error) {
        console.error('Error updating analytics dashboard:', error);
    }
}

/**
 * Display hourly traffic chart
 * @param {Object} hourlyData - Hour-wise data
 */
function displayHourlyTraffic(hourlyData) {
    const container = document.getElementById('hourly-traffic-chart');
    container.innerHTML = '';
    
    // Find peak hour
    let peakHour = 0;
    let peakCount = 0;
    
    for (let hour in hourlyData) {
        if (hourlyData[hour].count > peakCount) {
            peakCount = hourlyData[hour].count;
            peakHour = hour;
        }
    }
    
    // Create bar chart
    for (let hour = 0; hour < 24; hour++) {
        const data = hourlyData[hour];
        const barContainer = document.createElement('div');
        barContainer.className = 'traffic-bar-container';
        
        const percentage = peakCount > 0 ? (data.count / peakCount) * 100 : 0;
        const isPeak = hour == peakHour && data.count > 0;
        
        barContainer.innerHTML = `
            <div class="traffic-hour">${hour}:00</div>
            <div class="traffic-bar-wrapper">
                <div class="traffic-bar ${isPeak ? 'peak' : ''}" style="height: ${percentage}%">
                    <span class="traffic-count">${data.count}</span>
                </div>
            </div>
            <div class="traffic-revenue">₹${data.revenue}</div>
        `;
        
        container.appendChild(barContainer);
    }
    
    // Display peak hour info
    const peakHourInfo = document.getElementById('peak-hour-info');
    if (peakHourInfo) {
        peakHourInfo.textContent = peakCount > 0 ? `Peak Hour: ${peakHour}:00 - ${parseInt(peakHour) + 1}:00 (${peakCount} orders, ₹${hourlyData[peakHour].revenue})` : 'No orders yet';
    }
}

/**
 * Display top selling items
 * @param {Array} items - Top items array
 */
function displayTopSellingItems(items) {
    const container = document.getElementById('top-items-list');
    if (!container) {
        console.error('Top items list container not found');
        return;
    }
    container.innerHTML = '';
    
    const topFive = items.slice(0, 10);
    
    if (topFive.length === 0) {
        container.innerHTML = '<p class="no-data">No sales data available</p>';
        return;
    }
    
    topFive.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'top-item';
        
        itemElement.innerHTML = `
            <div class="top-item-rank">#${index + 1}</div>
            <div class="top-item-info">
                <div class="top-item-name">${item.name}</div>
                <div class="top-item-stats">Sold: ${item.count} | Revenue: ₹${item.revenue}</div>
            </div>
        `;
        
        container.appendChild(itemElement);
    });
}if (!container) {
        console.error('Order list container not found');
        return;
    }
    

/**
 * Display order list
 * @param {Array} orders - Orders array
 */
function displayOrderList(orders) {
    const container = document.getElementById('order-list');
    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="no-data">No orders found</p>';
        return;
    }
    
    // Sort by timestamp (newest first)
    const sortedOrders = [...orders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-record';
        
        const timestamp = new Date(order.timestamp);
        const dateStr = timestamp.toLocaleDateString();
        const timeStr = timestamp.toLocaleTimeString();
        
        const itemsList = order.items.map(item => `${item.name} x${item.qty}`).join(', ');
        
        orderElement.innerHTML = `
            <div class="order-record-header">
                <span class="order-id">Order #${order.id}</span>
                <span class="order-total">₹${order.total}</span>
            </div>
            <div class="order-record-details">
                <div><strong>Table:</strong> ${order.table}</div>
                <div><strong>Date:</strong> ${dateStr}</div>
                <div><strong>Time:</strong> ${timeStr}</div>
                <div><strong>Items:</strong> ${itemsList}</div>
            </div>
        `;
        
        container.appendChild(orderElement);
    });
}

/**
 * Export analytics report
 */
function exportAnalyticsReport() {
    const period = document.querySelector('.analytics-filter-btn.active')?.getAttribute('data-period') || 'today';
    let orders = [];
    
    if (period === 'today') {
        orders = getTodayOrders();
    } else if (period === 'month') {
        orders = getMonthOrders();
    } else if (period === 'year') {
        orders = getYearOrders();
    }

    const generatedAt = new Date().toISOString();
    const headers = [
        'period',
        'generatedAt',
        'orderId',
        'table',
        'timestamp',
        'time',
        'total',
        'items'
    ];

    const rows = [headers.join(',')];

    orders.forEach((order) => {
        const itemsList = order.items.map((item) => `${item.name} x${item.qty}`).join('; ');
        const values = [
            period,
            generatedAt,
            order.id,
            order.table,
            order.timestamp,
            order.time || '',
            order.total,
            itemsList
        ].map((value) => {
            const text = String(value ?? '');
            return `"${text.replace(/"/g, '""')}"`;
        });
        rows.push(values.join(','));
    });

    const dataStr = rows.join('\n');
    const dataBlob = new Blob([dataStr], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Clear all order history
 */
function clearOrderHistory() {
    if (confirm('Are you sure you want to delete ALL order history? This cannot be undone!')) {
        localStorage.removeItem('orderHistory');
        alert('Order history cleared successfully!');
        updateAnalyticsDashboard('today');
    }
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('✅ Kitchen Alert Script Loaded Successfully!');

// ===================================
// KEYBOARD SHORTCUTS (OPTIONAL)
// ===================================
document.addEventListener('keydown', function(event) {
    // Press 'C' to open cart
    if (event.key === 'c' || event.key === 'C') {
        if (!document.getElementById('checkout-modal').classList.contains('active') &&
            !document.getElementById('confirmation-modal').classList.contains('active')) {
            openCheckout();
        }
    }
    
    // Press 'Escape' to close modals
    if (event.key === 'Escape') {
        closeCheckout();
        closeConfirmation();
        closeInventoryDashboard();
        closeAnalyticsDashboard();
        closeAddNewItem();
        closeStockAdjust();
    }
});

// ===================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ===================================
// Attach all functions to window object so onclick handlers work
window.updateQuantity = updateQuantity;
window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
window.confirmOrder = confirmOrder;
window.closeConfirmation = closeConfirmation;
window.testConnection = testConnection;
window.openInventoryDashboard = openInventoryDashboard;
window.closeInventoryDashboard = closeInventoryDashboard;
window.openAnalyticsDashboard = openAnalyticsDashboard;
window.closeAnalyticsDashboard = closeAnalyticsDashboard;
window.openAddNewItem = openAddNewItem;
window.closeAddNewItem = closeAddNewItem;
window.addNewMenuItem = addNewMenuItem;
window.openStockAdjust = openStockAdjust;
window.closeStockAdjust = closeStockAdjust;
window.applyStockAdjustment = applyStockAdjustment;
window.quickAddStock = quickAddStock;
window.quickRemoveStock = quickRemoveStock;
window.removeMenuItem = removeMenuItem;
window.resetInventory = resetInventory;
window.exportInventory = exportInventory;
window.updateAnalyticsDashboard = updateAnalyticsDashboard;
window.exportAnalyticsReport = exportAnalyticsReport;
window.clearOrderHistory = clearOrderHistory;

console.log('🎯 All functions registered globally - Buttons ready!');
