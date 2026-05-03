// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    authSystem.init();
});

// Authentication System with Cloud Sync
const authSystem = {
    currentUser: null,
    backendUrl: 'https://shop-sales-tracker-backend.glitch.me', // Cloud backend

    init() {
        this.setupAuthListeners();
        this.checkUserSession();
    },

    setupAuthListeners() {
        // Login Form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Signup Form
        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.signup();
        });

        // Switch to Signup
        document.getElementById('switchToSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToSignup();
        });

        // Switch to Login
        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToLogin();
        });

        // Logout Button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    },

    async login() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            alert('Please enter both username and password');
            return;
        }

        try {
            // First try cloud login
            const response = await fetch(`${this.backendUrl}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const userData = await response.json();
                this.currentUser = userData;
                localStorage.setItem('currentUser', JSON.stringify(userData));
                localStorage.setItem('authToken', userData.token);
                this.showAppScreen();
                this.displayWelcomeMessage();
                return;
            }
        } catch (error) {
            console.log('Cloud login unavailable, using local authentication');
        }

        // Fallback to local authentication
        const users = this.getUsers();
        const user = users.find(u => u.username === username);

        if (!user) {
            alert('Username not found. Please create an account first.');
            return;
        }

        if (user.password !== password) {
            alert('Incorrect password. Please try again.');
            return;
        }

        // Login successful
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.showAppScreen();
        this.displayWelcomeMessage();
    },

    async signup() {
        const username = document.getElementById('signupUsername').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (!username || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (username.length < 3) {
            alert('Username must be at least 3 characters long');
            return;
        }

        if (password.length < 4) {
            alert('Password must be at least 4 characters long');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            // Try cloud signup
            const response = await fetch(`${this.backendUrl}/api/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                alert('Account created successfully! You can now log in.');
                this.switchToLogin();
                document.getElementById('loginUsername').value = username;
                document.getElementById('loginPassword').value = '';
                return;
            } else {
                const error = await response.json();
                alert(error.message || 'Signup failed');
                return;
            }
        } catch (error) {
            console.log('Cloud signup unavailable, using local storage');
        }

        // Fallback to local signup
        const users = this.getUsers();
        if (users.find(u => u.username === username)) {
            alert('Username already exists. Please choose a different one.');
            return;
        }

        const newUser = {
            id: Date.now(),
            username: username,
            password: password,
            createdAt: new Date().toLocaleDateString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        alert('Account created successfully! You can now log in.');
        this.switchToLogin();
        document.getElementById('loginUsername').value = username;
        document.getElementById('loginPassword').value = '';
    },

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            this.showLoginScreen();
            document.getElementById('loginForm').reset();
            document.getElementById('signupForm').reset();
        }
    },

    checkUserSession() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showAppScreen();
            this.displayWelcomeMessage();
        } else {
            this.showLoginScreen();
        }
    },

    showLoginScreen() {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('signupScreen').classList.remove('active');
        document.getElementById('appScreen').classList.remove('active');
    },

    switchToSignup() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('signupScreen').classList.add('active');
    },

    switchToLogin() {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('signupScreen').classList.remove('active');
    },

    showAppScreen() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('signupScreen').classList.remove('active');
        document.getElementById('appScreen').classList.add('active');
        app.init();
    },

    displayWelcomeMessage() {
        const welcomeUser = document.getElementById('welcomeUser');
        if (this.currentUser) {
            welcomeUser.textContent = `Welcome, ${this.currentUser.username}! 👋`;
        }
    },

    getUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }
};

// Main App with Cloud Sync
const app = {
    todaysSales: [],
    salesHistory: [],
    syncInterval: null,

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateDisplay();
        this.displayDate();
        this.displayHistory();
        this.startAutoSync();
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
        this.syncToCloud();
    },

    removeItem(id) {
        this.todaysSales = this.todaysSales.filter(item => item.id !== id);
        this.saveData();
        this.updateDisplay();
        this.syncToCloud();
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
            const dailySummary = {
                date: new Date().toLocaleDateString(),
                items: [...this.todaysSales],
                totalItems: this.todaysSales.reduce((sum, item) => sum + item.quantity, 0),
                totalRevenue: this.todaysSales.reduce((sum, item) => sum + item.total, 0)
            };
            this.salesHistory.push(dailySummary);

            this.todaysSales = [];
            this.saveData();
            this.updateDisplay();
            this.displayHistory();
            this.syncToCloud();
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
        let csv = 'Shop Sales Report - ' + today + '\n';
        csv += 'User: ' + authSystem.currentUser.username + '\n\n';
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
        a.download = `sales_${authSystem.currentUser.username}_${today}.csv`;
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
            lastSaveDate: new Date().toLocaleDateString(),
            username: authSystem.currentUser.username,
            lastSync: new Date().toISOString()
        };
        localStorage.setItem(`shopSalesData_${authSystem.currentUser.id}`, JSON.stringify(data));
    },

    loadData() {
        const savedData = localStorage.getItem(`shopSalesData_${authSystem.currentUser.id}`);
        if (savedData) {
            const data = JSON.parse(savedData);
            const today = new Date().toLocaleDateString();

            if (data.lastSaveDate !== today) {
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

    startAutoSync() {
        // Auto-sync every 30 seconds
        this.syncInterval = setInterval(() => {
            this.syncToCloud();
        }, 30000);
    },

    async syncToCloud() {
        const token = localStorage.getItem('authToken');
        if (!token) return; // Only sync if using cloud auth

        try {
            const data = {
                todaysSales: this.todaysSales,
                salesHistory: this.salesHistory,
                lastSaveDate: new Date().toLocaleDateString()
            };

            await fetch(`${authSystem.backendUrl}/api/sync-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.log('Cloud sync unavailable, data saved locally');
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
