// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

const app = {
    todaysSales: [],
    salesHistory: [],

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
        this.displayDate();
        this.displayHistory();
    },

    setupEventListeners() {
        document.getElementById('itemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addItem();
        });

        document.getElementById('clearDayBtn').addEventListener('click', () => {
            this.clearDay();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportAsCSV();
        });
    },

    addItem() {
        const itemName = document.getElementById('itemName').value.trim();
        const quantity = parseInt(document.getElementById('quantity').value);
        const price = parseFloat(document.getElementById('price').value);

        if (!itemName || quantity <= 0 || price < 0) {
            alert('Please enter valid information');
            return;
        }

        const item = {
            id: Date.now(),
            name: itemName,
            quantity: quantity,
            price: price,
            total: quantity * price,
            timestamp: new Date().toLocaleTimeString()
        };

        this.todaysSales.push(item);
        this.saveData();
        this.updateDisplay();
        this.resetForm();
    },

    removeItem(id) {
        this.todaysSales = this.todaysSales.filter(item => item.id !== id);
        this.saveData();
        this.updateDisplay();
    },

    updateDisplay() {
        this.updateStats();
        this.displayItems();
    },

    updateStats() {
        const totalItems = this.todaysSales.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = this.todaysSales.reduce((sum, item) => sum + item.total, 0);

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toFixed(2);
    },

    displayItems() {
        const itemsList = document.getElementById('itemsList');
        const emptyState = '<tr class="empty-state"><td colspan="5">No items added yet. Add your first sale above!</td></tr>';

        if (this.todaysSales.length === 0) {
            itemsList.innerHTML = emptyState;
            return;
        }

        itemsList.innerHTML = this.todaysSales.map(item => `
            <tr>
                <td>${this.escapeHtml(item.name)}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${item.total.toFixed(2)}</td>
                <td>
                    <button class="btn btn-danger" onclick="app.removeItem(${item.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    },

    clearDay() {
        if (this.todaysSales.length === 0) {
            alert('No items to clear!');
            return;
        }

        if (confirm('Are you sure you want to clear all sales for today? This will save them to history.')) {
            // Save to history before clearing
            const dailySummary = {
                date: new Date().toLocaleDateString(),
                items: [...this.todaysSales],
                totalItems: this.todaysSales.reduce((sum, item) => sum + item.quantity, 0),
                totalRevenue: this.todaysSales.reduce((sum, item) => sum + item.total, 0)
            };
            this.salesHistory.push(dailySummary);

            // Clear today's sales
            this.todaysSales = [];
            this.saveData();
            this.updateDisplay();
            this.displayHistory();
            alert('Daily sales cleared and saved to history!');
        }
    },

    displayDate() {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = today.toLocaleDateString('en-US', options);
        document.getElementById('dateDisplay').textContent = dateString;
    },

    displayHistory() {
        const historyContainer = document.getElementById('historyContainer');

        if (this.salesHistory.length === 0) {
            historyContainer.innerHTML = '<p class="empty-state">No previous sales records yet.</p>';
            return;
        }

        historyContainer.innerHTML = this.salesHistory.map((day, index) => `
            <div class="history-card">
                <div class="history-date">📅 ${day.date}</div>
                <div class="history-details">
                    <strong>Items Sold:</strong> ${day.totalItems} | 
                    <strong>Total Revenue:</strong> $${day.totalRevenue.toFixed(2)}
                </div>
            </div>
        `).join('');
    },

    exportAsCSV() {
        if (this.todaysSales.length === 0) {
            alert('No items to export!');
            return;
        }

        const today = new Date().toLocaleDateString();
        let csv = 'Shop Sales Report - ' + today + '\n\n';
        csv += 'Item,Quantity,Price per Item,Total\n';

        this.todaysSales.forEach(item => {
            csv += `"${item.name}",${item.quantity},${item.price.toFixed(2)},${item.total.toFixed(2)}\n`;
        });

        const totalItems = this.todaysSales.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = this.todaysSales.reduce((sum, item) => sum + item.total, 0);

        csv += '\nTOTAL,' + totalItems + ',,' + totalRevenue.toFixed(2) + '\n';

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales_${today}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    },

    resetForm() {
        document.getElementById('itemForm').reset();
        document.getElementById('quantity').value = '1';
        document.getElementById('itemName').focus();
    },

    saveData() {
        const data = {
            todaysSales: this.todaysSales,
            salesHistory: this.salesHistory,
            lastSaveDate: new Date().toLocaleDateString()
        };
        localStorage.setItem('shopSalesData', JSON.stringify(data));
    },

    loadData() {
        const savedData = localStorage.getItem('shopSalesData');
        if (savedData) {
            const data = JSON.parse(savedData);
            const today = new Date().toLocaleDateString();

            // Reset today's sales if it's a new day
            if (data.lastSaveDate !== today) {
                // If there were items from yesterday, save them to history
                if (data.todaysSales && data.todaysSales.length > 0) {
                    const dailySummary = {
                        date: data.lastSaveDate,
                        items: data.todaysSales,
                        totalItems: data.todaysSales.reduce((sum, item) => sum + item.quantity, 0),
                        totalRevenue: data.todaysSales.reduce((sum, item) => sum + item.total, 0)
                    };
                    this.salesHistory = data.salesHistory || [];
                    this.salesHistory.push(dailySummary);
                }
                this.todaysSales = [];
            } else {
                this.todaysSales = data.todaysSales || [];
                this.salesHistory = data.salesHistory || [];
            }
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

function initializeApp() {
    app.init();
}
