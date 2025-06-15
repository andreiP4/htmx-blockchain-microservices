import { baseTemplate } from './index';

export const transactionsPage = () => baseTemplate(/*html*/`
<div class="space-y-6" x-data="transactionsApp()">
    <!-- Header Section -->
    <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gold">Transactions</h1>
        <div x-show="!isAuthenticated" class="text-orange">
            <a href="/login" class="hover:text-gold">Please login to create transactions</a>
        </div>
    </div>

    <!-- Create Transaction Form -->
    <div x-show="isAuthenticated" class="bg-dark-gray/30 border border-gold/20 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gold mb-4">Create New Transaction</h2>        <form 
            @submit.prevent="createTransaction()"
            class="space-y-4">
            
            <!-- All three fields in one row -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <!-- Receiver Field -->
                <div>
                    <label class="block text-sm font-medium text-gold mb-1">Receiver</label>
                    <div class="relative" x-data="{ open: false, search: '', selected: null }">
                        <input type="text" 
                               x-model="search"
                               @click="open = true"
                               @input="open = true"
                               :placeholder="selected ? selected.username : 'Search receiver...'"
                               class="w-full px-3 py-2 bg-dark-gray border border-gold/30 rounded-lg text-white focus:border-gold focus:outline-none text-sm">
                        <input type="hidden" 
                               id="receiverId" 
                               name="receiverId"
                               :value="selected?.id || ''"
                               x-ref="receiverIdInput">
                        
                        <!-- Dropdown -->
                        <div x-show="open" 
                             @click.away="open = false"
                             x-transition
                             class="absolute z-10 w-full mt-1 bg-dark-gray border border-gold/30 rounded-lg max-h-40 overflow-y-auto">
                            <template x-for="user in Object.values(users).filter(u => u.username.toLowerCase().includes(search.toLowerCase()) && u.id !== currentUser?.id)" :key="user.id">
                                <div @click="selected = user; search = user.username; open = false; $refs.receiverIdInput.value = user.id"
                                     class="px-3 py-2 hover:bg-gold/20 cursor-pointer text-white border-b border-gold/10 last:border-b-0">
                                    <div class="font-medium text-sm" x-text="user.username"></div>
                                    <div class="text-xs text-gold/60 font-mono" x-text="user.id.substring(0, 12) + '...'"></div>
                                </div>
                            </template>
                            <div x-show="Object.values(users).filter(u => u.username.toLowerCase().includes(search.toLowerCase()) && u.id !== currentUser?.id).length === 0"
                                 class="px-3 py-2 text-gold/60 text-sm">
                                No users found
                            </div>
                        </div>
                    </div>
                </div>
                  <!-- Amount Field -->
                <div>
                    <label class="block text-sm font-medium text-gold mb-1">Amount</label>
                    <input type="number" id="amount" step="0.01" min="0.01" name="amount" required placeholder="0"
                           class="w-full px-3 py-2 bg-dark-gray border border-gold/30 rounded-lg text-white focus:border-gold focus:outline-none text-sm">
                </div>
                
                <!-- Currency Field -->
                <div>
                    <label class="block text-sm font-medium text-gold mb-1">Currency</label>
                    <select id="transactionCurrency" required name="currencyId"
                            class="w-full px-3 py-2 bg-dark-gray border border-gold/30 rounded-lg text-white focus:border-gold focus:outline-none text-sm">
                        <option value="">Select Currency</option>
                        <template x-for="currency in currencies" :key="currency.id">
                            <option :value="currency.id" x-text="currency.name + ' (' + currency.id.toUpperCase() + ')'"></option>
                        </template>
                    </select>
                </div>
            </div>
              <!-- Submit Button -->
            <div>
                <button type="submit" 
                        :disabled="creatingTransaction"
                        :class="creatingTransaction ? 'bg-gray-500 cursor-not-allowed' : 'bg-gold hover:bg-orange'"
                        class="text-dark-gray px-6 py-2 rounded-lg font-semibold transition-colors text-sm">
                    <span x-show="!creatingTransaction">Create Transaction</span>
                    <span x-show="creatingTransaction">Creating...</span>
                </button>
            </div>
        </form>
    </div>

    <!-- Filter Section -->
    <div class="bg-dark-gray/30 border border-gold/20 rounded-lg p-4">
        <div class="flex flex-wrap gap-4 items-end">
            <div>
                <label class="block text-sm font-medium text-gold mb-1">Filter by User ID</label>
                <input type="text" x-model="filterUserId" @input="loadTransactions()"
                       placeholder="Enter user ID"
                       class="px-3 py-2 bg-dark-gray border border-gold/30 rounded-lg text-white focus:border-gold focus:outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gold mb-1">Filter by Block</label>
                <input type="number" x-model="filterBlockId" @input="loadTransactions()"
                       placeholder="Enter block index"
                       class="px-3 py-2 bg-dark-gray border border-gold/30 rounded-lg text-white focus:border-gold focus:outline-none">
            </div>
            <button @click="clearFilters()" 
                    class="bg-orange/20 text-orange px-4 py-2 rounded-lg hover:bg-orange/30 transition-colors">
                Clear Filters
            </button>
        </div>
    </div>

    <!-- Transactions List -->
    <div>
        <h2 class="text-xl font-semibold text-gold mb-4">Recent Transactions</h2>
        
        <!-- Loading State -->
        <div x-show="loading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
            <p class="mt-2 text-gold/80">Loading transactions...</p>
        </div>        <!-- Transactions Table -->
        <div id="transactions-container" class="overflow-x-auto">
            <table class="w-full bg-dark-gray/30 border border-gold/20 rounded-lg overflow-hidden">
                <thead class="bg-gold/10">
                    <tr>
                        <th class="px-4 py-3 text-left text-gold">ID</th>
                        <th class="px-4 py-3 text-left text-gold">Sender</th>
                        <th class="px-4 py-3 text-left text-gold">Receiver</th>
                        <th class="px-4 py-3 text-left text-gold">Amount</th>
                        <th class="px-4 py-3 text-left text-gold">Currency</th>
                        <th class="px-4 py-3 text-left text-gold">Mined</th>
                        <th class="px-4 py-3 text-left text-gold">Date</th>
                    </tr>
                </thead>
                <tbody>
                    <template x-for="transaction in transactions" :key="transaction.id">
                        <tr class="border-t border-gold/10 hover:bg-gold/5">
                            <td class="px-4 py-3 font-mono text-xs" x-text="transaction.id.substring(0, 8) + '...'"></td>                            <td class="px-4 py-3">
                                <button 
                                    @click="filterByUser(transaction.senderId)"
                                    class="text-gold hover:text-orange font-mono text-xs underline"
                                    x-text="users[transaction.senderId]?.username || transaction.senderId.substring(0, 10) + '...'">
                                </button>
                            </td>
                            <td class="px-4 py-3">
                                <button 
                                    @click="filterByUser(transaction.receiverId)"
                                    class="text-gold hover:text-orange font-mono text-xs underline"
                                    x-text="users[transaction.receiverId]?.username || transaction.receiverId.substring(0, 10) + '...'">
                                </button>
                            </td>
                            <td class="px-4 py-3 font-semibold" x-text="transaction.amount"></td>
                            <td class="px-4 py-3 uppercase text-gold" x-text="transaction.currencyId"></td>
                            <td class="px-4 py-3">
                                <span :class="{
                                    'bg-green-500/20 text-green-400': transaction.blockId !==  null,
                                    'bg-yellow-500/20 text-yellow-400': transaction.blockId === null,
                                }" 
                                class="px-2 py-1 rounded-full text-xs font-semibold"
                                x-text="transaction.blockId || 'pending'"></span>
                            </td>
                            <td class="px-4 py-3 text-sm" x-text="new Date(transaction.timestamp).toLocaleDateString()"></td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <!-- Empty State -->
        <div x-show="!loading && transactions.length === 0" class="text-center py-12">
            <p class="text-gold/60">No transactions found. Create your first transaction to get started!</p>
        </div>
    </div>
</div>

<script>
function transactionsApp() {
    return {        
        transactions: [],
        currencies: [],
        users: {}, // Cache for user data
        currentUser: null, // Current logged-in user
        loading: true,
        selectedTransaction: null,
        filterUserId: '',
        filterBlockId: '',
        isAuthenticated: false,
        creatingTransaction: false,

        async createTransaction() {
            const receiverId = document.getElementById('receiverId').value;
            const amountStr = document.getElementById('amount').value;
            const amount = parseFloat(amountStr);
            const currencyId = document.getElementById('transactionCurrency').value;
            
            // Validation
            if (!receiverId) {
                alert('Please select a receiver');
                return;
            }
            if (!amountStr || amount <= 0 || isNaN(amount)) {
                alert('Please enter a valid amount greater than 0');
                return;
            }
            if (!currencyId) {
                alert('Please select a currency');
                return;
            }

            this.creatingTransaction = true;

            try {
                const data = await window.AuthHandler.graphqlRequest(\`
                    mutation CreateTransaction($receiverId: String!, $currencyId: String!, $amount: Float!) {
                        createTransaction(receiverId: $receiverId, currencyId: $currencyId, amount: $amount) {
                            id
                            senderId
                            receiverId
                            amount
                            currencyId
                            timestamp
                        }
                    }
                \`, {
                    receiverId: receiverId,
                    currencyId: currencyId,
                    amount: amount
                });

                if (data.errors) {
                    alert('Error: ' + data.errors[0].message);
                } else if (data.data?.createTransaction) {
                    alert('Transaction created successfully!');
                    
                    // Reset form
                    document.getElementById('amount').value = '';
                    document.getElementById('transactionCurrency').value = '';
                    
                    // Reload transactions
                    await this.loadTransactions();
                } else {
                    alert('Failed to create transaction');
                }
                
            } catch (error) {
                console.error('Error creating transaction:', error);
                alert('Network error occurred');
            } finally {
                this.creatingTransaction = false;
            }
        },

        async loadTransactions() {
            this.loading = true;
            try {                let query = \`
                    query {
                        getTransactions {
                            id
                            senderId
                            receiverId
                            amount
                            currencyId
                            timestamp
                            blockId
                        }
                    }
                \`;                // Add user filter if specified
                if (this.filterUserId) {
                    query = \`
                        query GetTransactionsUser($userId: String!) {
                            getTransactionsUser(userId: $userId) {
                                id
                                senderId
                                receiverId
                                amount
                                currencyId
                                timestamp
                                blockId
                            }
                        }
                    \`;
                }                // Add block filter if specified
                if (this.filterBlockId) {
                    query = \`
                        query GetTransactionsBlock($blockId: String!) {
                            getTransactionsBlock(blockId: $blockId) {
                                id
                                senderId
                                receiverId
                                amount
                                currencyId
                                timestamp
                                blockId
                            }
                        }
                    \`;
                }
                const variables = {};
                if (this.filterUserId) variables.userId = this.filterUserId;
                if (this.filterBlockId) variables.blockId = this.filterBlockId;                
                const data = await window.AuthHandler.graphqlRequest(query, variables);
                if (data.errors) {
                    console.error('GraphQL errors:', data.errors);                
                } else {
                    const transactionData = data.data?.getTransactions || 
                                          data.data?.getTransactionsUser || 
                                          data.data?.getTransactionsBlock || [];
                    this.transactions = transactionData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    
                    // Load user data for all unique user IDs
                    await this.loadUserData();
                }
            } catch (error) {
                console.error('Error loading transactions:', error);
            } finally {
                this.loading = false;
            }
        },  

        async loadCurrencies() {
            try {
                const data = await window.AuthHandler.graphqlRequest(\`
                    query {
                        getCurrencies {
                            id
                            name
                            icon
                            usdValue
                        }
                    }
                \`);

                if (!data.errors) {
                    this.currencies = data.data?.getCurrencies || [];
                }
            } catch (error) {
                console.error('Error loading currencies:', error);
            }        },        loadCurrentUser() {
            // Get current user from AuthHandler
            this.currentUser = window.AuthHandler ? window.AuthHandler.getCurrentUser() : null;
            
            // Fallback to localStorage for backward compatibility
            if (!this.currentUser) {
                const userString = localStorage.getItem('currentUser');
                if (userString) {
                    try {
                        this.currentUser = JSON.parse(userString);
                    } catch (error) {
                        console.error('Error parsing current user:', error);
                    }
                }
            }
        },      

        async loadAllUsers() {
            try {
                const data = await window.AuthHandler.graphqlRequest(\`
                    query {
                        getUsers {
                            id
                            username
                        }
                    }
                \`);

                if (!data.errors && data.data?.getUsers) {
                    // Convert array to object for easier lookup
                    data.data.getUsers.forEach(user => {
                        this.users[user.id] = user;
                    });
                }
            } catch (error) {
                console.error('Error loading all users:', error);
            }
        },

        async loadUserData() {
            // Get all unique user IDs from transactions
            const userIds = new Set();
            this.transactions.forEach(transaction => {
                if (transaction.senderId) userIds.add(transaction.senderId);
                if (transaction.receiverId) userIds.add(transaction.receiverId);
            });            // Load user data for IDs we don't have cached
            for (const userId of userIds) {
                if (!this.users[userId]) {
                    try {
                        const data = await window.AuthHandler.graphqlRequest(\`
                            query GetUser($id: String!) {
                                getUser(id: $id) {
                                    id
                                    username
                                }
                            }
                        \`, { id: userId });

                        if (!data.errors && data.data?.getUser) {
                            this.users[userId] = data.data.getUser;
                        }
                    } catch (error) {
                        console.error('Error loading user data:', error);
                    }
                }
            }
        },

        clearFilters() {
            this.filterUserId = '';
            this.filterBlockId = '';
            this.loadTransactions();
        },

        filterByUser(userId) {
            if (userId) {
                this.filterUserId = userId;
                this.loadTransactions();
            }
        },        init() {
            // Use AuthHandler for authentication state
            this.isAuthenticated = window.AuthHandler ? window.AuthHandler.isAuthenticated() : !!localStorage.getItem('authToken');
            this.loadCurrentUser(); // Load current user info
            this.loadAllUsers(); // Load all users for dropdowns
            this.loadTransactions();
            this.loadCurrencies();
            
            // Listen for auth state changes
            window.addEventListener('authTokenRefreshed', () => {
                this.isAuthenticated = true;
                this.loadCurrentUser();
            });
            
            window.addEventListener('userLoggedOut', () => {
                this.isAuthenticated = false;
                this.currentUser = null;
            });
            
            window.addEventListener('userLoggedIn', () => {
                this.isAuthenticated = true;
                this.loadCurrentUser();
            });
        }
    }
}
</script>
`);
