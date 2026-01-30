/* 
  WealthFlow - Core JavaScript
  Handles Mock Data, State Management, and UI Updates
*/

// --- MOCK DATA ---
const DATA = {
    user: {
        name: "Alex M.",
        level: 5,
        xp: 3400,
        nextLevelXp: 5000,
        avatar: "https://ui-avatars.com/api/?name=Alex+M&background=6366f1&color=fff",
        friends: [
           { name: "Sarah", xp: 4100, avatar: "https://ui-avatars.com/api/?name=Sarah&background=random" },
           { name: "Mike", xp: 3200, avatar: "https://ui-avatars.com/api/?name=Mike&background=random" },
           { name: "Jessica", xp: 5500, avatar: "https://ui-avatars.com/api/?name=Jessica&background=random" }
        ],
        badges: [
            { icon: "fa-fire", name: "7 Day Streak" },
            { icon: "fa-piggy-bank", name: "Saver I" },
            { icon: "fa-star", name: "Challenge Winner" }
        ]
    },
    transactions: [
        { id: 1, title: "Whole Foods Market", amount: 124.50, type: "expense", category: "food", date: "2023-10-24" },
        { id: 2, title: "Freelance Project A", amount: 1500.00, type: "income", category: "freelance", date: "2023-10-23" },
        { id: 3, title: "Uber Ride", amount: 24.00, type: "expense", category: "transport", date: "2023-10-22" },
        { id: 4, title: "Netflix Subscription", amount: 15.00, type: "expense", category: "entertainment", date: "2023-10-20" }
    ],
    challenges: [
        { id: 1, title: "No Eating Out Week", participants: 14, reward: "500 XP", active: true },
        { id: 2, title: "Save $500 this Month", participants: 320, reward: "Badge", active: true },
        { id: 3, title: "Zero Spend Weekend", participants: 45, reward: "200 XP", active: false }
    ]
};

// --- STATE MANAGEMENT ---
const App = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.render();
    },

    cacheDOM() {
        this.navLinks = document.querySelectorAll('.nav-links li');
        this.views = document.querySelectorAll('.view');
        this.pageTitle = document.getElementById('page-title');
        
        // Modal
        this.modalOverlay = document.getElementById('modal-overlay');
        this.btnAdd = document.getElementById('btn-add-transaction');
        this.btnClose = document.querySelector('.close-modal');
        this.formAdd = document.getElementById('add-transaction-form');

        // Dashboard Elements
        this.elLeftToBudget = document.getElementById('left-to-budget');
        this.elTotalIncome = document.getElementById('total-income');
        this.elTotalExpense = document.getElementById('total-expenses');
        this.listTransactions = document.getElementById('transaction-list');
        this.ring = document.querySelector('.budget-ring');
    },

    bindEvents() {
        // Navigation
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const targetView = link.dataset.view;
                this.switchView(targetView);
                
                // Active Class
                this.navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Modal interactions
        this.btnAdd.addEventListener('click', () => this.toggleModal(true));
        this.btnClose.addEventListener('click', () => this.toggleModal(false));
        this.modalOverlay.addEventListener('click', (e) => {
            if(e.target === this.modalOverlay) this.toggleModal(false);
        });

        // Add Transaction
        this.formAdd.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewTransaction();
        });
    },

    switchView(viewId) {
        // Hide all
        this.views.forEach(v => {
            v.classList.remove('active-view');
            v.classList.remove('slide-in');
        });

        // Title Map
        const titles = {
            'dashboard': 'Dashboard',
            'social': 'Social Hub',
            'challenges': 'Challenges',
            'profile': 'My Profile'
        };
        this.pageTitle.textContent = titles[viewId];

        // Show Target
        const target = document.getElementById(`view-${viewId}`);
        target.classList.add('active-view');
        target.classList.add('slide-in');
        
        // Render specific view data if needed
        if(viewId === 'social') this.renderSocial();
        if(viewId === 'challenges') this.renderChallenges();
        if(viewId === 'profile') this.renderProfile();
    },

    toggleModal(show) {
        if(show) {
            this.modalOverlay.classList.remove('hidden');
        } else {
            this.modalOverlay.classList.add('hidden');
        }
    },

    handleNewTransaction() {
        // Mock getting form data
        const type = document.querySelector('input[name="type"]:checked').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const categoryMap = {
            'food': 'Whole Foods Market',
            'transport': 'Uber Ride', 
            'housing': 'Rent Payment',
            'entertainment': 'Netflix',
            'salary': 'Monthly Salary',
            'freelance': 'Freelance Client'
        };

        const newTx = {
            id: Date.now(),
            title: categoryMap[category] || 'New Transaction',
            amount: amount,
            type: type,
            category: category,
            date: new Date().toISOString().split('T')[0]
        };

        // Update Data
        DATA.transactions.unshift(newTx);
        
        // Reset & Close
        this.formAdd.reset();
        this.toggleModal(false);
        
        // Re-render
        this.renderDashboard();
    },

    render() {
        this.renderDashboard();
        this.renderSocial();
        this.renderChallenges();
        this.renderProfile();
    },

    renderDashboard() {
        // 1. Calculate Finances
        let income = 0;
        let expenses = 0;

        DATA.transactions.forEach(t => {
            if(t.type === 'income') income += t.amount;
            else expenses += t.amount;
        });

        const leftToBudget = income - expenses;
        const percentage = income > 0 ? Math.max(0, (leftToBudget / income) * 100) : 0;

        // 2. DOM Updates
        this.elTotalIncome.textContent = `$${income.toFixed(2)}`;
        this.elTotalExpense.textContent = `$${expenses.toFixed(2)}`;
        this.elLeftToBudget.textContent = `$${leftToBudget.toFixed(2)}`;

        // Ring Color update
        let ringColor = 'var(--accent-primary)';
        if(leftToBudget < 0) ringColor = 'var(--danger)';
        else if(percentage < 20) ringColor = 'var(--accent-secondary)';
        
        this.ring.style.setProperty('--p', percentage);
        this.ring.style.setProperty('--c', ringColor);

        // 3. Transactions List
        this.listTransactions.innerHTML = DATA.transactions.map(t => `
            <li class="transaction-item">
                <div class="t-info">
                    <div class="t-icon">
                        <i class="fa-solid ${this.getCategoryIcon(t.category)}"></i>
                    </div>
                    <div class="t-details">
                        <h4>${t.title}</h4>
                        <span>${t.date} • ${t.category}</span>
                    </div>
                </div>
                <div class="t-amount ${t.type}">
                    ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
                </div>
            </li>
        `).join('');
    },

    getCategoryIcon(cat) {
        const map = {
            'food': 'fa-utensils',
            'transport': 'fa-car',
            'housing': 'fa-house',
            'entertainment': 'fa-film',
            'salary': 'fa-sack-dollar',
            'freelance': 'fa-laptop-code'
        };
        return map[cat] || 'fa-tag';
    },

    renderSocial() {
        const list = document.getElementById('leaderboard-list');
        if(!list) return;

        // Sort friends + me by XP
        const allUsers = [...DATA.user.friends, { name: "You", xp: DATA.user.xp, avatar: DATA.user.avatar }];
        allUsers.sort((a, b) => b.xp - a.xp);

        list.innerHTML = allUsers.map((u, index) => `
            <li class="leaderboard-item">
                <div class="t-info">
                    <span class="rank">#${index + 1}</span>
                    <div class="avatar-circle" style="width:35px;height:35px;">
                        <img src="${u.avatar}" style="width:100%;height:100%;">
                    </div>
                    <span>${u.name}</span>
                </div>
                <span style="font-weight:bold; color:var(--accent-secondary)">${u.xp} XP</span>
            </li>
        `).join('');

        const feed = document.getElementById('activity-feed');
        feed.innerHTML = `
            <div class="transaction-item">
                <div class="t-info">
                    <div class="t-icon"><i class="fa-solid fa-trophy"></i></div>
                    <div class="t-details">
                        <h4>Jessica won "No Spend Weekend"</h4>
                        <span>2 hours ago</span>
                    </div>
                </div>
            </div>
            <div class="transaction-item">
                <div class="t-info">
                    <div class="t-icon"><i class="fa-solid fa-check-circle"></i></div>
                    <div class="t-details">
                        <h4>Mike completed a goal</h4>
                        <span>5 hours ago</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderChallenges() {
        const activeContainer = document.getElementById('active-challenges-list');
        const exploreContainer = document.getElementById('explore-challenges-list');
        if(!activeContainer) return;

        const activeHTML = DATA.challenges.filter(c => c.active).map(c => `
            <div class="badge-item" style="flex-direction:row;justify-content:space-between;width:100%;margin-bottom:10px;">
                <div style="text-align:left;">
                    <div style="font-weight:600;">${c.title}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);">${c.participants} Participants</div>
                </div>
                <div style="background:var(--primary);padding:5px 10px;border-radius:8px;font-size:0.8rem;">Active</div>
            </div>
        `).join('');

        const exploreHTML = DATA.challenges.filter(c => !c.active).map(c => `
             <div class="badge-item" style="flex-direction:row;justify-content:space-between;width:100%;margin-bottom:10px;opacity:0.7;">
                <div style="text-align:left;">
                    <div style="font-weight:600;">${c.title}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);">${c.participants} Participants</div>
                </div>
                <button style="background:transparent;border:1px solid var(--primary);color:var(--primary);padding:5px 10px;border-radius:8px;cursor:pointer;">Join</button>
            </div>
        `).join('');

        activeContainer.innerHTML = activeHTML;
        exploreContainer.innerHTML = exploreHTML;
    },

    renderProfile() {
        const grid = document.getElementById('badges-grid');
        if(!grid) return;

        grid.innerHTML = DATA.user.badges.map(b => `
            <div class="badge-item">
                <i class="fa-solid ${b.icon} badge-icon"></i>
                <span class="badge-name">${b.name}</span>
            </div>
        `).join('');
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
