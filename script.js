// Shop Sales Tracker - JavaScript Logic

// Data Management
class ShopTracker {
    constructor() {
        this.products = this.loadFromLocalStorage();
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.renderProducts();
        this.updateSummary();
        this.setTodayDate();
    }

    attachEventListeners() {
        document.getElementById('productForm').addEventListener('submit', (e) => this.addProduct(e));
        document.getElementById('searchBox').addEventListener('input', () => this.filterProducts());
        document.getElementById('filterStatus').addEventListener('change', () => this.filterProducts());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('printBtn').addEventListener('click', () => this.printInventory());
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('purchaseDate').value = today;
    }

    addProduct(event) {
        event.preventDefault();

        const product = {
            id: Date.now(),
            name: document.getElementById('productName').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            quantity: parseFloat(document.getElementById('productQuantity').value),
            unit: document.getElementById('productUnit').value.trim(),
            purchaseDate: document.getElementById('purchaseDate').value,
        };

        if (product.name && product.price > 0 && product.quantity > 0) {
            this.products.push(product);
            this.saveToLocalStorage();
            this.renderProducts();
            this.updateSummary();
            document.getElementById('productForm').reset();
            this.setTodayDate();
            this.showNotification('Product added successfully!', 'success');
        } else {
            this.showNotification('Please fill in all fields correctly', 'error');
        }
    }

    deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.products = this.products.filter(p => p.id !== id);
            this.saveToLocalStorage();
            this.renderProducts();
            this.updateSummary();
            this.showNotification('Product deleted successfully!', 'success');
        }
    }

    updateQuantity(id, newQuantity) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.quantity = Math.max(0, parseFloat(newQuantity));
            this.saveToLocalStorage();
            this.renderProducts();
            this.updateSummary();
        }
    }

    renderProducts() {
        const tableBody = document.getElementById('productsTableBody');
        
        if (this.products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="empty-message">No products added yet</td></tr>';
            return;
        }

        tableBody.innerHTML = this.products
            .map(product => this.createProductRow(product))
            .join('');

        // Attach event listeners to delete buttons
        document.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.deleteProduct(id);
            });
        });

        // Attach event listeners to quantity inputs
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.updateQuantity(id, e.target.value);
            });
        });
    }

    createProductRow(product) {
        const totalValue = product.price * product.quantity;
        const status = this.getProductStatus(product.quantity);
        const statusClass = this.getStatusClass(status);

        const formattedDate = new Date(product.purchaseDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <tr>
                <td><strong>${this.escapeHtml(product.name)}</strong></td>
                <td>$${product.price.toFixed(2)}</td>
                <td>
                    <input type="number" class="quantity-input" data-id="${product.id}" 
                           value="${product.quantity}" min="0" step="0.01" style="width: 80px;">
                </td>
                <td>${this.escapeHtml(product.unit)}</td>
                <td>${formattedDate}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td><strong>$${totalValue.toFixed(2)}</strong></td>
                <td>
                    <button class="btn btn-danger" data-id="${product.id}">Delete</button>
                </td>
            </tr>
        `;
    }

    getProductStatus(quantity) {
        if (quantity === 0) return 'Out of Stock';
        if (quantity < 5) return 'Low Stock';
        return 'In Stock';
    }

    getStatusClass(status) {
        switch(status) {
            case 'In Stock': return 'status-in-stock';
            case 'Low Stock': return 'status-low-stock';
            case 'Out of Stock': return 'status-out-stock';
            default: return '';
        }
    }

    filterProducts() {
        const searchTerm = document.getElementById('searchBox').value.toLowerCase();
        const filterStatus = document.getElementById('filterStatus').value;

        const filtered = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            const productStatus = this.getProductStatus(product.quantity);
            
            let matchesFilter = true;
            if (filterStatus === 'in-stock') matchesFilter = productStatus === 'In Stock';
            if (filterStatus === 'low-stock') matchesFilter = productStatus === 'Low Stock';
            if (filterStatus === 'out-stock') matchesFilter = productStatus === 'Out of Stock';

            return matchesSearch && matchesFilter;
        });

        this.renderFilteredProducts(filtered);
    }

    renderFilteredProducts(filtered) {
        const tableBody = document.getElementById('productsTableBody');
        
        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="empty-message">No products match your search</td></tr>';
            return;
        }

        tableBody.innerHTML = filtered
            .map(product => this.createProductRow(product))
            .join('');

        document.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.deleteProduct(id);
            });
        });

        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.updateQuantity(id, e.target.value);
            });
        });
    }

    updateSummary() {
        const totalProducts = this.products.length;
        const inStockCount = this.products.filter(p => this.getProductStatus(p.quantity) === 'In Stock').length;
        const outStockCount = this.products.filter(p => this.getProductStatus(p.quantity) === 'Out of Stock').length;
        const totalInvestment = this.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

        document.getElementById('totalProducts').textContent = totalProducts;
        document.getElementById('inStockCount').textContent = inStockCount;
        document.getElementById('outStockCount').textContent = outStockCount;
        document.getElementById('totalInvestment').textContent = `$${totalInvestment.toFixed(2)}`;
    }

    exportToCSV() {
        if (this.products.length === 0) {
            this.showNotification('No products to export', 'warning');
            return;
        }

        let csv = 'Product Name,Price,Quantity,Unit,Purchase Date,Status,Total Value\n';
        
        this.products.forEach(product => {
            const totalValue = product.price * product.quantity;
            const status = this.getProductStatus(product.quantity);
            csv += `"${product.name}","${product.price.toFixed(2)}","${product.quantity}","${product.unit}","${product.purchaseDate}","${status}","${totalValue.toFixed(2)}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `shop-inventory-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Inventory exported successfully!', 'success');
    }

    printInventory() {
        if (this.products.length === 0) {
            this.showNotification('No products to print', 'warning');
            return;
        }

        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Shop Inventory</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
        printWindow.document.write('h1 { text-align: center; color: #2563eb; }');
        printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
        printWindow.document.write('th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }');
        printWindow.document.write('th { background-color: #f3f4f6; font-weight: bold; }');
        printWindow.document.write('tr:nth-child(even) { background-color: #f9fafb; }');
        printWindow.document.write('.summary { margin-top: 20px; padding: 10px; background-color: #f3f4f6; }');
        printWindow.document.write('</style></head><body>');

        printWindow.document.write('<h1>Shop Inventory Report</h1>');
        printWindow.document.write(`<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>`);

        printWindow.document.write('<table>');
        printWindow.document.write('<thead><tr>');
        printWindow.document.write('<th>Product Name</th>');
        printWindow.document.write('<th>Price</th>');
        printWindow.document.write('<th>Quantity</th>');
        printWindow.document.write('<th>Unit</th>');
        printWindow.document.write('<th>Purchase Date</th>');
        printWindow.document.write('<th>Status</th>');
        printWindow.document.write('<th>Total Value</th>');
        printWindow.document.write('</tr></thead>');
        printWindow.document.write('<tbody>');

        const totalInvestment = this.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

        this.products.forEach(product => {
            const totalValue = product.price * product.quantity;
            const status = this.getProductStatus(product.quantity);
            printWindow.document.write('<tr>');
            printWindow.document.write(`<td>${product.name}</td>`);
            printWindow.document.write(`<td>$${product.price.toFixed(2)}</td>`);
            printWindow.document.write(`<td>${product.quantity}</td>`);
            printWindow.document.write(`<td>${product.unit}</td>`);
            printWindow.document.write(`<td>${product.purchaseDate}</td>`);
            printWindow.document.write(`<td>${status}</td>`);
            printWindow.document.write(`<td>$${totalValue.toFixed(2)}</td>`);
            printWindow.document.write('</tr>');
        });

        printWindow.document.write('</tbody></table>');
        printWindow.document.write(`<div class="summary"><strong>Total Investment: $${totalInvestment.toFixed(2)}</strong></div>`);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }

    saveToLocalStorage() {
        localStorage.setItem('shopTrackerProducts', JSON.stringify(this.products));
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('shopTrackerProducts');
        return data ? JSON.parse(data) : [];
    }

    showNotification(message, type) {
        // Create a simple notification (can be enhanced with a toast library)
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background-color: ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#ea580c'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            font-weight: 600;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ShopTracker();
});
