// Shop Purchases Tracker - Purchases Page Script

// ==================== Authentication ====================
let currentUser = null;

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showAppScreen();
    } else {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
    }
    setupEventListeners();
    displayDate();
    loadAndDisplayPurchases();
    loadAndDisplayPurchaseHistory();
});

// Setup all event listeners
function setupEventListeners() {
    // Form submissions
    const purchaseForm = document.getElementById('purchaseForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const clearDayBtn = document.getElementById('clearDayBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (purchaseForm) purchaseForm.addEventListener('submit', handleAddPurchase);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (clearDayBtn) clearDayBtn.addEventListener('click', handleClearDay);
    if (exportBtn) exportBtn.addEventListener('click', handleExportCSV);
}

// Handle Logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Show app screen
function showAppScreen() {
    document.getElementById('appScreen').classList.add('active');
    
    const welcomeUser = document.getElementById('welcomeUser');
    if (welcomeUser && currentUser) {
        welcomeUser.textContent = `Welcome, ${currentUser.username}!`;
    }
}

// ==================== Purchases Management ====================

// Handle adding purchase
function handleAddPurchase(e) {
    e.preventDefault();
    
    const productName = document.getElementById('productName').value;
    const supplier = document.getElementById('supplier').value;
    const purchaseDate = document.getElementById('purchaseDate').value;
    const quantity = parseFloat(document.getElementById('quantity').value);
    const unitCost = parseFloat(document.getElementById('unitCost').value);
    const notes = document.getElementById('notes').value;
    
    const purchase = {
        id: Date.now(),
        productName: productName,
        supplier: supplier || 'N/A',
        date: purchaseDate,
        quantity: quantity,
        unitCost: unitCost,
        totalCost: quantity * unitCost,
        notes: notes,
        timestamp: new Date().toISOString()
    };
    
    // Get today's purchases
    const today = new Date().toISOString().split('T')[0];
    let allPurchases = JSON.parse(localStorage.getItem(`purchases_${currentUser.id}`)) || {};
    
    if (!allPurchases[today]) {
        allPurchases[today] = [];
    }
    
    allPurchases[today].push(purchase);
    localStorage.setItem(`purchases_${currentUser.id}`, JSON.stringify(allPurchases));
    
    // Reset form
    document.getElementById('purchaseForm').reset();
    document.getElementById('purchaseDate').value = today;
    
    loadAndDisplayPurchases();
    loadAndDisplayPurchaseHistory();
    showNotification('Purchase added successfully!');
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

// Load and display today's purchases
function loadAndDisplayPurchases() {
    const purchasesList = document.getElementById('purchasesList');
    const totalProductsDisplay = document.getElementById('totalProducts');
    const totalQtyDisplay = document.getElementById('totalQty');
    const totalCostDisplay = document.getElementById('totalCost');
    
    if (!purchasesList || !currentUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    const allPurchases = JSON.parse(localStorage.getItem(`purchases_${currentUser.id}`)) || {};
    const todayPurchases = allPurchases[today] || [];
    
    if (todayPurchases.length === 0) {
        purchasesList.innerHTML = '<tr class="empty-state"><td colspan="6">No purchases added yet. Add your first purchase above!</td></tr>';
        if (totalProductsDisplay) totalProductsDisplay.textContent = '0';
        if (totalQtyDisplay) totalQtyDisplay.textContent = '0';
        if (totalCostDisplay) totalCostDisplay.textContent = '0.00';
        return;
    }
    
    let totalProducts = 0;
    let totalQuantity = 0;
    let totalCost = 0;
    let html = '';
    
    todayPurchases.forEach(purchase => {
        totalProducts += 1;
        totalQuantity += purchase.quantity;
        totalCost += purchase.totalCost;
        
        html += `
            <tr>
                <td>${purchase.productName}</td>
                <td>${purchase.supplier}</td>
                <td>${purchase.quantity}</td>
                <td>TSh ${purchase.unitCost.toFixed(2)}</td>
                <td>TSh ${purchase.totalCost.toFixed(2)}</td>
                <td><button class="btn btn-danger" onclick="deletePurchase(${purchase.id})">Delete</button></td>
            </tr>
        `;
    });
    
    purchasesList.innerHTML = html;
    if (totalProductsDisplay) totalProductsDisplay.textContent = totalProducts;
    if (totalQtyDisplay) totalQtyDisplay.textContent = totalQuantity;
    if (totalCostDisplay) totalCostDisplay.textContent = totalCost.toFixed(2);
}

// Delete purchase
function deletePurchase(purchaseId) {
    if (confirm('Are you sure you want to delete this purchase?')) {
        const today = new Date().toISOString().split('T')[0];
        const allPurchases = JSON.parse(localStorage.getItem(`purchases_${currentUser.id}`)) || {};
        
        if (allPurchases[today]) {
            allPurchases[today] = allPurchases[today].filter(purchase => purchase.id !== purchaseId);
            localStorage.setItem(`purchases_${currentUser.id}`, JSON.stringify(allPurchases));
            loadAndDisplayPurchases();
            loadAndDisplayPurchaseHistory();
            showNotification('Purchase deleted successfully!');
        }
    }
}

// Clear all purchases for the day
function handleClearDay() {
    if (confirm('Are you sure you want to clear all purchases for today? This action cannot be undone.')) {
        const today = new Date().toISOString().split('T')[0];
        const allPurchases = JSON.parse(localStorage.getItem(`purchases_${currentUser.id}`)) || {};
        
        delete allPurchases[today];
        localStorage.setItem(`purchases_${currentUser.id}`, JSON.stringify(allPurchases));
        loadAndDisplayPurchases();
        loadAndDisplayPurchaseHistory();
        showNotification('All purchases cleared!');
    }
}

// ==================== Purchase History ====================

// Load and display purchase history
function loadAndDisplayPurchaseHistory() {
    const historyContainer = document.getElementById('historyContainer');
    if (!historyContainer || !currentUser) return;
    
    const allPurchases = JSON.parse(localStorage.getItem(`purchases_${currentUser.id}`)) || {};
    const dates = Object.keys(allPurchases).sort().reverse();
    
    if (dates.length === 0) {
        historyContainer.innerHTML = '<p class="empty-state">No previous purchase records yet.</p>';
        return;
    }
    
    let html = '';
    
    dates.forEach(date => {
        const purchases = allPurchases[date];
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        
        const totalCost = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
        const totalItems = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
        
        html += `
            <div class="history-card">
                <div class="history-header" onclick="toggleHistoryDetails(this)">
                    <div class="history-date">${dateStr}</div>
                    <div class="history-summary">${purchases.length} products | ${totalItems} units | TSh ${totalCost.toFixed(2)} total</div>
                    <div class="history-toggle">▼</div>
                </div>
                <div class="history-details-list">
                    <table class="history-items-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Supplier</th>
                                <th>Qty</th>
                                <th>Unit Cost</th>
                                <th>Total Cost</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        purchases.forEach(purchase => {
            html += `
                <tr>
                    <td>${purchase.productName}</td>
                    <td>${purchase.supplier}</td>
                    <td>${purchase.quantity}</td>
                    <td>TSh ${purchase.unitCost.toFixed(2)}</td>
                    <td>TSh ${purchase.totalCost.toFixed(2)}</td>
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
    const allPurchases = JSON.parse(localStorage.getItem(`purchases_${currentUser.id}`)) || {};
    const todayPurchases = allPurchases[today] || [];
    
    if (todayPurchases.length === 0) {
        alert('No purchases to export!');
        return;
    }
    
    let csv = 'Product Name,Supplier,Quantity,Unit Cost (TSh),Total Cost (TSh)\n';
    
    todayPurchases.forEach(purchase => {
        csv += `"${purchase.productName}","${purchase.supplier}",${purchase.quantity},${purchase.unitCost.toFixed(2)},${purchase.totalCost.toFixed(2)}\n`;
    });
    
    const totalCost = todayPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
    csv += `\nTOTAL COST (TSh),${totalCost.toFixed(2)}\n`;
    
    // Create and trigger download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `purchases_${today}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    showNotification('Purchases exported as CSV!');
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
