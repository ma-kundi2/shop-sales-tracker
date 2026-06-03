// Sales and Purchases Tracker Application

// Initialize data from localStorage
function initializeApp() {
    // Set today's date as default in date inputs
    const today = new Date().toISOString().split('T')[0];
    
    const saleDate = document.getElementById('saleDate');
    const purchaseDate = document.getElementById('purchaseDate');
    
    if (saleDate) saleDate.value = today;
    if (purchaseDate) purchaseDate.value = today;
    
    // Load and display records
    displaySalesRecords();
    displayPurchaseRecords();
    
    // Add event listeners
    const salesForm = document.getElementById('salesForm');
    const purchaseForm = document.getElementById('purchaseForm');
    
    if (salesForm) {
        salesForm.addEventListener('submit', handleAddSale);
    }
    
    if (purchaseForm) {
        purchaseForm.addEventListener('submit', handleAddPurchase);
    }
}

// Handle adding a sale
function handleAddSale(e) {
    e.preventDefault();
    
    const saleDate = document.getElementById('saleDate').value;
    const productName = document.getElementById('productName').value;
    const quantity = parseFloat(document.getElementById('quantity').value);
    const unitPrice = parseFloat(document.getElementById('unitPrice').value);
    const notes = document.getElementById('notes').value;
    
    const sale = {
        id: Date.now(),
        date: saleDate,
        productName: productName,
        quantity: quantity,
        unitPrice: unitPrice,
        totalAmount: quantity * unitPrice,
        notes: notes,
        timestamp: new Date().toISOString()
    };
    
    // Get existing sales from localStorage
    let sales = JSON.parse(localStorage.getItem('sales')) || [];
    sales.push(sale);
    localStorage.setItem('sales', JSON.stringify(sales));
    
    // Reset form
    document.getElementById('salesForm').reset();
    document.getElementById('saleDate').value = new Date().toISOString().split('T')[0];
    
    // Refresh display
    displaySalesRecords();
    
    // Show success message
    showNotification('Sale added successfully!', 'success');
}

// Handle adding a purchase
function handleAddPurchase(e) {
    e.preventDefault();
    
    const purchaseDate = document.getElementById('purchaseDate').value;
    const productName = document.getElementById('productName').value;
    const supplier = document.getElementById('supplier').value;
    const quantity = parseFloat(document.getElementById('quantity').value);
    const unitCost = parseFloat(document.getElementById('unitCost').value);
    const notes = document.getElementById('notes').value;
    
    const purchase = {
        id: Date.now(),
        date: purchaseDate,
        productName: productName,
        supplier: supplier,
        quantity: quantity,
        unitCost: unitCost,
        totalCost: quantity * unitCost,
        notes: notes,
        timestamp: new Date().toISOString()
    };
    
    // Get existing purchases from localStorage
    let purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    purchases.push(purchase);
    localStorage.setItem('purchases', JSON.stringify(purchases));
    
    // Reset form
    document.getElementById('purchaseForm').reset();
    document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0];
    
    // Refresh display
    displayPurchaseRecords();
    
    // Show success message
    showNotification('Purchase added successfully!', 'success');
}

// Display sales records
function displaySalesRecords() {
    const salesList = document.getElementById('salesList');
    if (!salesList) return;
    
    let sales = JSON.parse(localStorage.getItem('sales')) || [];
    
    // Sort by date descending
    sales.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sales.length === 0) {
        salesList.innerHTML = '<p class="empty-message">No sales records yet. Add your first sale above!</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Amount</th>
                    <th>Notes</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sales.forEach(sale => {
        const formattedDate = new Date(sale.date).toLocaleDateString();
        const totalAmount = (sale.totalAmount).toFixed(2);
        const unitPrice = (sale.unitPrice).toFixed(2);
        
        html += `
            <tr>
                <td>${formattedDate}</td>
                <td>${sale.productName}</td>
                <td>${sale.quantity}</td>
                <td>$${unitPrice}</td>
                <td><strong>$${totalAmount}</strong></td>
                <td>${sale.notes || '-'}</td>
                <td>
                    <div class="record-actions">
                        <button class="btn btn-danger" onclick="deleteSale(${sale.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    salesList.innerHTML = html;
}

// Display purchase records
function displayPurchaseRecords() {
    const purchasesList = document.getElementById('purchasesList');
    if (!purchasesList) return;
    
    let purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    
    // Sort by date descending
    purchases.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (purchases.length === 0) {
        purchasesList.innerHTML = '<p class="empty-message">No purchase records yet. Add your first purchase above!</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Product Name</th>
                    <th>Supplier</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Total Cost</th>
                    <th>Notes</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    purchases.forEach(purchase => {
        const formattedDate = new Date(purchase.date).toLocaleDateString();
        const totalCost = (purchase.totalCost).toFixed(2);
        const unitCost = (purchase.unitCost).toFixed(2);
        
        html += `
            <tr>
                <td>${formattedDate}</td>
                <td>${purchase.productName}</td>
                <td>${purchase.supplier || '-'}</td>
                <td>${purchase.quantity}</td>
                <td>$${unitCost}</td>
                <td><strong>$${totalCost}</strong></td>
                <td>${purchase.notes || '-'}</td>
                <td>
                    <div class="record-actions">
                        <button class="btn btn-danger" onclick="deletePurchase(${purchase.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    purchasesList.innerHTML = html;
}

// Delete sale record
function deleteSale(id) {
    if (confirm('Are you sure you want to delete this sale record?')) {
        let sales = JSON.parse(localStorage.getItem('sales')) || [];
        sales = sales.filter(sale => sale.id !== id);
        localStorage.setItem('sales', JSON.stringify(sales));
        displaySalesRecords();
        showNotification('Sale deleted successfully!', 'success');
    }
}

// Delete purchase record
function deletePurchase(id) {
    if (confirm('Are you sure you want to delete this purchase record?')) {
        let purchases = JSON.parse(localStorage.getItem('purchases')) || [];
        purchases = purchases.filter(purchase => purchase.id !== id);
        localStorage.setItem('purchases', JSON.stringify(purchases));
        displayPurchaseRecords();
        showNotification('Purchase deleted successfully!', 'success');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
