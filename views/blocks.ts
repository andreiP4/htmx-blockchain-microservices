import { baseTemplate } from './index';

export const blocksPage = () => baseTemplate(/*html*/`
<div class="space-y-6" x-data="blocksApp()">
    <!-- Header Section -->    <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gold">Blockchain Explorer</h1>        
        <div class="flex items-center space-x-4">
            <!-- Error/Success Messages -->
            <div x-show="mineMessage" 
                 :class="mineMessageType === 'error' ? 'text-red-400' : 'text-green-400'"
                 class="text-sm font-medium"
                 x-text="mineMessage">
            </div>
            
            <button 
                @click="mineBlock()"
                :disabled="miningInProgress"
                :class="miningInProgress ? 'bg-gray-500 cursor-not-allowed' : 'bg-gold hover:bg-orange'"
                class="text-dark-gray px-4 py-2 rounded-lg font-semibold transition-colors">
                <span x-show="!miningInProgress">Mine New Block</span>
                <span x-show="miningInProgress">Mining...</span>
            </button>
        </div>
    </div>

    <!-- Stats Section -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-dark-gray/50 p-4 rounded-lg border border-gold/20">
            <h3 class="text-sm text-gold/80">Total Blocks</h3>
            <p class="text-2xl font-bold" x-text="blocks.length">-</p>
        </div>
        <div class="bg-dark-gray/50 p-4 rounded-lg border border-gold/20">
            <h3 class="text-sm text-gold/80">Latest Block</h3>
            <p class="text-2xl font-bold" x-text="blocks[0]?.index || 0">-</p>
        </div>
        <div class="bg-dark-gray/50 p-4 rounded-lg border border-gold/20">
            <h3 class="text-sm text-gold/80">Network Status</h3>
            <p class="text-2xl font-bold text-green-400">Active</p>
        </div>
    </div>

    <!-- Blocks List -->
    <div class="space-y-4" id="blocks-container">
        <h2 class="text-xl font-semibold text-gold">Recent Blocks</h2>
        
        <!-- Loading State -->
        <div x-show="loading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
            <p class="mt-2 text-gold/80">Loading blocks...</p>
        </div>

        <!-- Blocks List -->
        <template x-for="block in blocks" :key="block.id">
            <div class="bg-dark-gray/30 border border-gold/20 rounded-lg p-4 hover:border-gold/40 transition-colors">
                <div class="flex justify-between items-start">
                    <div class="space-y-2">
                        <div class="flex items-center space-x-4">
                            <span class="text-lg font-bold text-gold" x-text="'Block #' + block.id"></span>
                            <span class="text-sm text-white/70" x-text="new Date(block.timestamp).toLocaleString()"></span>
                        </div>
                        <div class="space-y-1 text-sm">
                            <div><span class="text-gold/80">Hash:</span> <span class="font-mono text-xs" x-text="block.hash"></span></div>
                            <div><span class="text-gold/80">Previous Hash:</span> <span class="font-mono text-xs" x-text="block.previousHash"></span></div>
                            <div><span class="text-gold/80">Nonce:</span> <span x-text="block.nonce"></span></div>
                        </div>
                    </div>
                    <button 
                        class="text-gold hover:text-orange text-sm"
                        @click="selectedBlock = block.id === selectedBlock ? null : block.id">
                        <span x-text="selectedBlock === block.id ? 'Hide Details' : 'View Details'"></span>
                    </button>
                </div>
                  <!-- Block Details (Collapsible) -->
                <div x-show="selectedBlock === block.id" 
                     x-transition:enter="transition ease-out duration-200"
                     x-transition:enter-start="opacity-0 transform scale-95"
                     x-transition:enter-end="opacity-100 transform scale-100"
                     class="mt-4 pt-4 border-t border-gold/20">
                    <h4 class="text-gold font-semibold mb-2">Block Details</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div><strong>Index:</strong> <span x-text="block.id"></span></div>
                        <div><strong>Timestamp:</strong> <span x-text="new Date(block.timestamp).toISOString()"></span></div>
                        <div class="col-span-2"><strong>Hash:</strong> <span class="font-mono break-all" x-text="block.hash"></span></div>
                        <div class="col-span-2"><strong>Previous Hash:</strong> <span class="font-mono break-all" x-text="block.previousHash"></span></div>
                    </div>
                    
                    <!-- Block Transactions -->
                    <div class="mt-4">
                        <h5 class="text-gold font-semibold mb-2">Transactions in this Block</h5>
                        <div x-show="loadingTransactions[block.id]" class="text-center py-4">
                            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gold"></div>
                        </div>
                        <div x-show="blockTransactions[block.id] && blockTransactions[block.id].length === 0" class="text-gold/60 text-sm py-4">
                            No transactions in this block yet.
                        </div>
                        <div x-show="blockTransactions[block.id] && blockTransactions[block.id].length > 0" class="space-y-2">
                            <template x-for="transaction in blockTransactions[block.id]" :key="transaction.id">
                                <div class="bg-dark-gray/50 border border-gold/10 rounded p-3 text-sm">
                                    <div class="flex justify-between items-center">
                                        <div class="flex space-x-4">
                                            <span class="font-mono text-xs" x-text="transaction.id.substring(0, 8) + '...'"></span>
                                            <span class="text-gold" x-text="transaction.amount + ' ' + transaction.currencyId"></span>
                                        </div>
                                        <span class="text-xs text-white/70" x-text="new Date(transaction.timestamp).toLocaleDateString()"></span>
                                    </div>                                    <div class="mt-1 text-xs text-white/60">
                                        From: <span class="font-mono" x-text="users[transaction.senderId]?.username || transaction.senderId.substring(0, 12) + '...'"></span> → 
                                        To: <span class="font-mono" x-text="users[transaction.receiverId]?.username || transaction.receiverId.substring(0, 12) + '...'"></span>
                                    </div>
                                </div>
                            </template>
                        </div>
                        <button 
                            @click="loadBlockTransactions(block.id)"
                            x-show="!blockTransactions[block.id]"
                            class="mt-2 text-gold hover:text-orange text-sm underline">
                            Load Transactions
                        </button>
                    </div>
                </div>
            </div>
        </template>

        <!-- Empty State -->
        <div x-show="!loading && blocks.length === 0" class="text-center py-12">
            <p class="text-gold/60">No blocks found. Mine the first block to get started!</p>
        </div>
    </div>
</div>

<script>
function blocksApp() {
    return {
        blocks: [],
        loading: true,
        selectedBlock: null,
        blockTransactions: {},
        loadingTransactions: {},
        miningInProgress: false,
        mineMessage: '',
        mineMessageType: '',
        users: {}, // Cache for user data

        async mineBlock() {
            this.miningInProgress = true;
            this.mineMessage = '';
            
            try {
                const response = await fetch('/api', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('authToken') ? 'Bearer ' + localStorage.getItem('authToken') : ''
                    },
                    body: JSON.stringify({
                        query: \`
                            mutation {
                                mineBlock {
                                    id
                                    previousHash
                                    timestamp
                                    hash
                                    nonce
                                }
                            }
                        \`
                    })
                });

                const data = await response.json();
                
                if (data.errors) {
                    this.mineMessage = data.errors[0].message;
                    this.mineMessageType = 'error';
                } else if (data.data?.mineBlock === null) {
                    this.mineMessage = 'Cannot mine block now, not enough pending transactions';
                    this.mineMessageType = 'error';
                } else if (data.data?.mineBlock) {
                    this.mineMessage = 'Block mined successfully!';
                    this.mineMessageType = 'success';
                    // Refresh the blocks list
                    await this.loadBlocks();
                } else {
                    this.mineMessage = 'Unknown error occurred while mining block';
                    this.mineMessageType = 'error';
                }
                
                // Clear message after 5 seconds
                setTimeout(() => {
                    this.mineMessage = '';
                }, 5000);
                
            } catch (error) {
                console.error('Error mining block:', error);
                this.mineMessage = 'Network error occurred while mining block';
                this.mineMessageType = 'error';
                
                // Clear message after 5 seconds
                setTimeout(() => {
                    this.mineMessage = '';
                }, 5000);
            } finally {
                this.miningInProgress = false;
            }
        },

        async loadBlocks() {
            this.loading = true;
            try {
                const response = await fetch('/api', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('authToken') ? 'Bearer ' + localStorage.getItem('authToken') : ''
                    },
                    body: JSON.stringify({
                        query: \`
                            query {
                                getBlockchain {
                                    id
                                    previousHash
                                    timestamp
                                    hash
                                    nonce
                                }
                            }
                        \`
                    })
                });

                const data = await response.json();
                if (data.errors) {
                    console.error('GraphQL errors:', data.errors);
                } else {
                    this.blocks = data.data?.getBlockchain?.sort((a, b) => b.index - a.index) || [];
                }
            } catch (error) {
                console.error('Error loading blocks:', error);
            } finally {
                this.loading = false;            }        },

        async loadUserData(userIds) {
            // Load user data for IDs we don't have cached
            for (const userId of userIds) {
                if (!this.users[userId] && userId) {
                    try {
                        const response = await fetch('/api', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': localStorage.getItem('authToken') ? 'Bearer ' + localStorage.getItem('authToken') : ''
                            },
                            body: JSON.stringify({
                                query: \`
                                    query GetUser($id: String!) {
                                        getUser(id: $id) {
                                            id
                                            username
                                        }
                                    }
                                \`,
                                variables: { id: userId }
                            })
                        });

                        const data = await response.json();
                        if (!data.errors && data.data?.getUser) {
                            this.users[userId] = data.data.getUser;
                        }
                    } catch (error) {
                        console.error('Error loading user data:', error);
                    }
                }
            }
        },

        async loadBlockTransactions(blockId) {
            this.loadingTransactions[blockId] = true;
            try {
                const response = await fetch('/api', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('authToken') ? 'Bearer ' + localStorage.getItem('authToken') : ''
                    },                    body: JSON.stringify({
                        query: \`
                            query GetTransactionsBlock($blockId: String!) {
                                getTransactionsBlock(blockId: $blockId) {
                                    id
                                    senderId
                                    receiverId
                                    amount
                                    currencyId
                                    timestamp
                                }
                            }
                        \`,
                        variables: { blockId: blockId }
                    })
                });

                const data = await response.json();
                if (!data.errors) {
                    this.blockTransactions[blockId] = data.data?.getTransactionsBlock || [];
                    
                    // Load user data for all unique user IDs in these transactions
                    const userIds = new Set();
                    this.blockTransactions[blockId].forEach(transaction => {
                        if (transaction.senderId) userIds.add(transaction.senderId);
                        if (transaction.receiverId) userIds.add(transaction.receiverId);
                    });
                    
                    if (userIds.size > 0) {
                        await this.loadUserData(userIds);
                    }
                } else {
                    console.error('Error loading block transactions:', data.errors);
                }
            } catch (error) {
                console.error('Error loading block transactions:', error);
            } finally {
                this.loadingTransactions[blockId] = false;
            }
        },

        init() {
            this.loadBlocks();
            // Auto-refresh every 30 seconds
            setInterval(() => this.loadBlocks(), 30000);
        }
    }
}
</script>
`);
