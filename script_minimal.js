// Minimal test version
console.log('Minimal script loading...');

const menuItems = {
    "Tea": 10,
    "Coffee": 15
};

let cart = {};

function updateQuantity(itemName, change) {
    console.log('updateQuantity called:', itemName, change);
    
    if (!cart[itemName]) {
        cart[itemName] = {
            quantity: 0,
            price: menuItems[itemName]
        };
    }
    
    cart[itemName].quantity += change;
    
    if (cart[itemName].quantity <= 0) {
        cart[itemName].quantity = 0;
        delete cart[itemName];
    }
    
    updateQuantityDisplay(itemName);
    console.log('Cart:', cart);
}

function updateQuantityDisplay(itemName) {
    const qtyElement = document.getElementById(`qty-${itemName}`);
    if (qtyElement) {
        const quantity = cart[itemName] ? cart[itemName].quantity : 0;
        qtyElement.textContent = quantity;
    }
}

// Make function globally accessible
window.updateQuantity = updateQuantity;

console.log('Minimal script loaded successfully!');
console.log('updateQuantity function:', typeof updateQuantity);
console.log('window.updateQuantity:', typeof window.updateQuantity);
