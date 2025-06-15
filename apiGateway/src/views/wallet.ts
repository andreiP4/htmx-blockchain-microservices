import { baseTemplate } from './index';

export const walletPage = () => baseTemplate(/*html*/`
<div class="space-y-6" x-data="walletApp()">
    <!-- Header Section -->
    <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gold">My Wallets</h1>
        <div x-show="!isAuthenticated" class="text-orange">
            <a href="/login" class="hover:text-gold">Please login to manage wallets</a>
        </div>
    </div>

    <!-- Create Wallet Form -->
    <div x-show="isAuthenticated" class="bg-dark-gray/30 border border-gold/20 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gold mb-4">Create New Wallet</h2>        <form 
            hx-post="/api"
            hx-vals="js:{
                query: 'mutation CreateWallet($currencyId: String!) { createWallet(currencyId: $currencyId) { id userId currencyId balance } }',
                variables: { currencyId: document.getElementById('currencyId').value }
            }"
            hx-headers="js:{
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }"
            hx-swap="none"
            @htmx:after-request="handleWalletCreation($el, $event)"
            class="flex gap-4">
            
            <select id="currencyId" name="currencyId" required 
                    class="flex-1 px-3 py-2 bg-dark-gray border border-gold/30 rounded-lg text-white focus:border-gold focus:outline-none">
                <option value="">Select Currency</option>
                <template x-for="currency in currencies" :key="currency.id">
                    <option :value="currency.id" x-text="currency.name + ' (' + currency.id.toUpperCase() + ')'"></option>
                </template>
            </select>
            
            <button type="submit" 
                    class="bg-gold text-dark-gray px-6 py-2 rounded-lg font-semibold hover:bg-orange transition-colors">
                Create Wallet
            </button>
        </form>
    </div>

    <!-- Wallets List -->
    <div x-show="isAuthenticated">
        <h2 class="text-xl font-semibold text-gold mb-4">Your Wallets</h2>
        
        <!-- Loading State -->
        <div x-show="loading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
            <p class="mt-2 text-gold/80">Loading wallets...</p>
        </div>        <!-- Wallets Grid -->
        <div id="wallets-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <template x-for="wallet in wallets" :key="wallet.id">
                <div class="bg-dark-gray/30 border border-gold/20 rounded-lg p-4 hover:border-gold/40 transition-colors">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-lg font-semibold text-gold" x-text="wallet.currencyId.toUpperCase()"></h3>
                        <span class="text-xs text-gold/60 font-mono" x-text="wallet.id.substring(0, 8) + '...'"></span>
                    </div>
                    
                    <div class="space-y-2">
                        <div class="text-2xl font-bold" x-text="wallet.balance || '0'"></div>
                        <div class="text-sm text-white/60">Balance</div>
                    </div>
                </div>
            </template>
        </div>        <!-- Empty State -->
        <div x-show="!loading && wallets.length === 0" class="text-center py-12">
            <p class="text-gold/60">No wallets found. Create your first wallet to get started!</p>
        </div>
    </div>
</div>

<script>
function walletApp() {
    return {
        wallets: [],
        currencies: [],
        loading: true,
        isAuthenticated: false,

        async loadWallets() {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.isAuthenticated = false;
                this.loading = false;
                return;
            }

            this.isAuthenticated = true;
            this.loading = true;

            try {
                const response = await fetch('/api', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({                        query: \`
                            query {
                                getWallets {
                                    id
                                    userId
                                    currencyId
                                    balance
                                }
                            }
                        \`
                    })
                });

                const data = await response.json();
                if (data.errors) {
                    console.error('GraphQL errors:', data.errors);
                    if (data.errors.some(e => e.message.includes('UNAUTHORIZED'))) {
                        localStorage.removeItem('authToken');
                        this.isAuthenticated = false;
                    }
                } else {
                    this.wallets = data.data?.getWallets || [];
                }
            } catch (error) {
                console.error('Error loading wallets:', error);
            } finally {
                this.loading = false;
            }
        },

        async loadCurrencies() {
            try {
                const response = await fetch('/api', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: \`
                            query {
                                getCurrencies {
                                    id
                                    name
                                    icon
                                    usdValue
                                }
                            }
                        \`
                    })
                });

                const data = await response.json();
                if (!data.errors) {
                    this.currencies = data.data?.getCurrencies || [];
                }
            } catch (error) {
                console.error('Error loading currencies:', error);
            }        },

        handleWalletCreation(form, event) {
            try {
                const response = JSON.parse(event.detail.xhr.responseText);
                if (response.errors) {
                    console.error('Error creating wallet:', response.errors);
                    // You could show an error message here
                } else {
                    // Success - refresh the wallets list
                    this.loadWallets();
                    form.reset();
                }
            } catch (error) {
                console.error('Error parsing response:', error);
            }
        },

        init() {
            this.loadWallets();
            this.loadCurrencies();
        }
    }
}
</script>
`);
