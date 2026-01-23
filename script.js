// ===================================
// MENU DATA WITH EXACT PRICES
// ===================================
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

    // Update quantity
    cart[itemName].quantity += change;

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
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

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
    }
});
