// Shop Sales Tracker - Main Application Script

// ==================== Authentication ====================
let currentUser = null;

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showAppScreen();
    }
    setupEventListeners();
    displayDate();
    loadAndDisplayItems();
    loadAndDisplayHistory();
});

// Setup all event listeners
function setupEventListeners() {
    // Login/Signup switches
    const switchToSignupLink = document.getElementById('switchToSignup');
    const switchToLoginLink = document.getElementById('switchToLogin');
    
    if (switchToSignupLink) {
        switchToSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginScreen').classList.remove('active');
            document.getElementById('signupScreen').classList.add('active');
        });
    }
    
    if (switchToLoginLink) {
        switchToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signupScreen').classList.remove('active');
            document.getElementById('loginScreen').classList.add('active');
        });
    }
    
    // Form submissions
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const itemForm = document.getElementById('itemForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const clearDayBtn = document.getElementById('clearDayBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    if (itemForm) itemForm.addEventListener('submit', handleAddItem);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (clearDayBtn) clearDayBtn.addEventListener('click', handleClearDay);
    if (exportBtn) exportBtn.addEventListener('click', handleExportCSV);
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = { username: user.username, id: user.id };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        document.getElementById('loginForm').reset();
        showAppScreen();
        displayDate();
        loadAndDisplayItems();
        loadAndDisplayHistory();
    } else {
        alert('Invalid username or password!');
    }
}

// Handle Signup
function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (username.length < 3) {
        alert('Username must be at least 3 characters long!');
        return;
    }
    
    if (password.length < 4) {
        alert('Password must be at least 4 characters long!');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.some(u => u.username === username)) {
        alert('Username already exists!');
        return;
    }
    
    users.push({ id: Date.now(), username, password });
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Account created successfully! You can now log in.');
    document.getElementById('signupForm').reset();
    document.getElementById('signupScreen').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
}

// Handle Logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('appScreen').classList.remove('active');
        document.getElementById('loginForm').reset();
        document.getElementById('itemForm').reset();
    }
}

// Show app screen
function showAppScreen() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('signupScreen').classList.remove('active');
    document.getElementById('appScreen').classList.add('active');
    
    const welcomeUser = document.getElementById('welcomeUser');
    if (welcomeUser && currentUser) {
        welcomeUser.textContent = `Welcome, ${currentUser.username}!`;
    }
}

// ==================== Sales Management ====================

// Handle adding item
function handleAddItem(e) {
    e.preventDefault();
    
    const itemName = document.getElementById('itemName').value;
    const quantity = parseFloat(document.getElementById('quantity').value);
    const price = parseFloat(document.getElementById('price').value);
    
    const item = {
        id: Date.now(),
        name: itemName,
        quantity: quantity,
        price: price,
        total: quantity * price,
        timestamp: new Date().toISOString()
    };
    
    // Get today's items
    const today = new Date().toISOString().split('T')[0];
    let allItems = JSON.parse(localStorage.getItem(`items_${currentUser.id}`)) || {};
    
    if (!allItems[today]) {
        allItems[today] = [];
    }
    
    allItems[today].push(item);
    localStorage.setItem(`items_${currentUser.id}`, JSON.stringify(allItems));
    
    // Reset form
    document.getElementById('itemForm').reset();
    document.getElementById('quantity').value = '1';
    
    loadAndDisplayItems();
    showNotification('Item added successfully!');
}

// Display current date
function displayDate() {
    const dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = today.toLocaleDateString('en-US', options);
    }
}

// Load and display today's items
function loadAndDisplayItems() {
    const itemsList = document.getElementById('itemsList');
    const totalItemsDisplay = document.getElementById('totalItems');
    
    if (!itemsList || !currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    const allItems = JSON.parse(localStorage.getItem(`items_${currentUser.id}`)) || {};
    const todayItems = allItems[today] || [];
    
    if (todayItems.length === 0) {
        itemsList.innerHTML = '<tr class="empty-state"><td colspan="5">No items added yet. Add your first sale above!</td></tr>';
        if (totalItemsDisplay) totalItemsDisplay.textContent = '0';
        return;
    }
    
    let totalQuantity = 0;
    let totalRevenue = 0;
    let html = '';
    
    todayItems.forEach(item => {
        totalQuantity += item.quantity;
        totalRevenue += item.total;
        
        html += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>TSh ${item.price.toFixed(2)}</td>
                <td>TSh ${item.total.toFixed(2)}</td>
                <td><button class="btn btn-danger" onclick="deleteItem(${item.id})">Delete</button></td>
            </tr>
        `;
    });
    
    itemsList.innerHTML = html;
    if (totalItemsDisplay) totalItemsDisplay.textContent = totalQuantity;
}

// Delete item
function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        const today = new Date().toISOString().split('T')[0];
        const allItems = JSON.parse(localStorage.getItem(`items_${currentUser.id}`)) || {};
        
        if (allItems[today]) {
            allItems[today] = allItems[today].filter(item => item.id !== itemId);
            localStorage.setItem(`items_${currentUser.id}`, JSON.stringify(allItems));
            loadAndDisplayItems();
            loadAndDisplayHistory();
            showNotification('Item deleted successfully!');
        }
    }
}

// Clear all items for the day
function handleClearDay() {
    if (confirm('Are you sure you want to clear all sales for today? This action cannot be undone.')) {
        const today = new Date().toISOString().split('T')[0];
        const allItems = JSON.parse(localStorage.getItem(`items_${currentUser.id}`)) || {};
        
        delete allItems[today];
        localStorage.setItem(`items_${currentUser.id}`, JSON.stringify(allItems));
        loadAndDisplayItems();
        loadAndDisplayHistory();
        showNotification('All sales cleared!');
    }
}

// ==================== Sales History ====================

// Load and display sales history
function loadAndDisplayHistory() {
    const historyContainer = document.getElementById('historyContainer');
    if (!historyContainer || !currentUser) return;
    
    const allItems = JSON.parse(localStorage.getItem(`items_${currentUser.id}`)) || {};
    const dates = Object.keys(allItems).sort().reverse();
    
    if (dates.length === 0) {
        historyContainer.innerHTML = '<p class="empty-state">No previous sales records yet.</p>';
        return;
    }
    
    let html = '';
    
    dates.forEach(date => {
        const items = allItems[date];
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        
        const totalRevenue = items.reduce((sum, item) => sum + item.total, 0);
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        
        html += `
            <div class="history-card">
                <div class="history-header" onclick="toggleHistoryDetails(this)">
                    <div class="history-date">${dateStr}</div>
                    <div class="history-summary">${items.length} items | ${totalItems} units | TSh ${totalRevenue.toFixed(2)} total</div>
                    <div class="history-toggle">▼</div>
                </div>
                <div class="history-details-list">
                    <table class="history-items-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        items.forEach(item => {
            html += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>TSh ${item.price.toFixed(2)}</td>
                    <td>TSh ${item.total.toFixed(2)}</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    historyContainer.innerHTML = html;
}

// Toggle history details
function toggleHistoryDetails(element) {
    const detailsList = element.nextElementSibling;
    detailsList.classList.toggle('visible');
    
    const toggle = element.querySelector('.history-toggle');
    if (toggle) {
        toggle.style.transform = detailsList.classList.contains('visible') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
}

// ==================== Export ====================

// Export as CSV
function handleExportCSV() {
    if (!currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    const allItems = JSON.parse(localStorage.getItem(`items_${currentUser.id}`)) || {};
    const todayItems = allItems[today] || [];
    
    if (todayItems.length === 0) {
        alert('No items to export!');
        return;
    }
    
    let csv = 'Item Name,Quantity,Price (TSh),Total (TSh)\n';
    
    todayItems.forEach(item => {
        csv += `"${item.name}",${item.quantity},${item.price.toFixed(2)},${item.total.toFixed(2)}\n`;
    });
    
    const totalRevenue = todayItems.reduce((sum, item) => sum + item.total, 0);
    csv += `\nTOTAL REVENUE (TSh),${totalRevenue.toFixed(2)}\n`;
    
    // Create and trigger download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `sales_${today}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    showNotification('Sales exported as CSV!');
}

// ==================== Notifications ====================

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
