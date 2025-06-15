import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { baseTemplate } from '../../views/index';
import { execute, parse, validate } from 'graphql';
import { schema } from './graphql/graphqlSchema';
import { createGraphQLContext } from './auth/tokenVerification';

dotenv.config();

export const app = express();

app.use(express.json()); // For JSON requests
app.use(express.urlencoded({ extended: true })); // For form-encoded requests

app.use(express.static('public'));

app.get('/', (_, res) => {
    res.send(baseTemplate(/*html*/`
        <div class="text-center space-y-8" x-data="homeApp()">
            <div class="space-y-4">
                <h1 class="text-4xl md:text-6xl font-bold text-gold">
                    Blockchain Explorer
                </h1>
                <p class="text-lg text-white/80 max-w-2xl mx-auto">
                    Explore blocks, manage transactions, and control your digital wallets in our decentralized ecosystem.
                </p>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div class="bg-dark-gray/30 border border-gold/20 rounded-lg p-6">
                    <h3 class="text-2xl font-bold text-gold" x-text="stats.totalBlocks">-</h3>
                    <p class="text-white/70">Total Blocks</p>
                </div>
                <div class="bg-dark-gray/30 border border-gold/20 rounded-lg p-6">
                    <h3 class="text-2xl font-bold text-gold" x-text="stats.totalTransactions">-</h3>
                    <p class="text-white/70">Transactions</p>
                </div>
                <div class="bg-dark-gray/30 border border-gold/20 rounded-lg p-6">
                    <h3 class="text-2xl font-bold text-gold" x-text="stats.activeCurrencies">-</h3>
                    <p class="text-white/70">Currencies</p>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-4 justify-center">
                <a href="/blocks" 
                   class="bg-gold text-dark-gray px-6 py-3 rounded-lg font-semibold hover:bg-orange transition-colors">
                    Explore Blocks
                </a>
                <a href="/transactions" 
                   class="bg-gold/20 text-gold border border-gold px-6 py-3 rounded-lg font-semibold hover:bg-gold/30 transition-colors">
                    View Transactions
                </a>
                <a href="/wallet" 
                   class="bg-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange/80 transition-colors">
                    Manage Wallet
                </a>
            </div>

            <!-- Authentication Status -->
            <div x-show="!isAuthenticated" class="mt-8">
                <p class="text-white/60 mb-4">Sign in to access all features</p>
                <a href="/login" 
                   class="inline-block bg-gold/10 text-gold border border-gold px-4 py-2 rounded-lg hover:bg-gold/20 transition-colors">
                    Sign In / Register
                </a>
            </div>
        </div>

        <script>
        function homeApp() {
            return {
                stats: {
                    totalBlocks: 0,
                    totalTransactions: 0,
                    activeCurrencies: 0
                },
                isAuthenticated: false,

                async loadStats() {
                    try {
                        // Load blockchain stats
                        const blocksResponse = await fetch('/api', {
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
                                        }
                                        getCurrencies {
                                            id
                                        }
                                        getTransactions {
                                            id
                                        }
                                    }
                                \`
                            })
                        });

                        const blocksData = await blocksResponse.json();
                        if (!blocksData.errors) {
                            this.stats.totalBlocks = blocksData.data?.getBlockchain?.length || 0;
                            this.stats.activeCurrencies = blocksData.data?.getCurrencies?.length || 0;
                            this.stats.totalTransactions = blocksData.data?.getTransactions?.length || 0;
                        }
                    } catch (error) {
                        console.error('Error loading stats:', error);
                    }
                },

                init() {
                    this.isAuthenticated = !!localStorage.getItem('authToken');
                    this.loadStats();
                }
            }
        }
        </script>
    `));
});

app.get('/blocks', (_, res) => {
    res.send(require('../../views/blocks').blocksPage());
});

app.get('/transactions', (_, res) => {
    res.send(require('../../views/transactions').transactionsPage());
});

app.get('/wallet', (_, res) => {
    res.send(require('../../views/wallet').walletPage());
});

app.get('/login', (_, res) => {
    res.send(require('../../views/auth').loginPage());
});

// Custom GraphQL endpoint that handles form data
app.all('/api', (req: Request, res: Response): void => {
    (async () => {
        let graphqlRequest: any = req.body;

        // Convert form-encoded data to GraphQL JSON format
        if (req.headers['content-type']?.includes('application/x-www-form-urlencoded') && req.body) {
            if (req.body.query) {
                graphqlRequest = {
                    query: req.body.query,
                    variables: {}
                };

                // Extract variables from form fields (excluding 'query')
                Object.keys(req.body).forEach(key => {
                    if (key !== 'query') {
                        graphqlRequest.variables[key] = req.body[key];
                    }
                });
            }
        }

        try {
            // Parse the query
            const document = parse(graphqlRequest.query);

            // Validate the query
            const validationErrors = validate(schema, document);
            if (validationErrors.length > 0) {
                res.status(400).json({ errors: validationErrors });
                return;
            }

            // Create context
            const context = createGraphQLContext(req);

            // Execute the query
            const result = await execute({
                schema,
                document,
                variableValues: graphqlRequest.variables,
                contextValue: context
            });

            res.json(result);
        } catch (error) {            res.status(500).json({
                errors: [{
                    message: error instanceof Error ? error.message : 'Internal server error'
                }]
            });
        }
    })();
});

// Add a global auth JavaScript handler
app.get('/auth.js', (_, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
// Global authentication handler
window.AuthHandler = {
    // Check if token is expired (with 5 minute buffer)
    isTokenExpired(token) {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < (currentTime + 300); // 5 minute buffer
        } catch (e) {
            return true;
        }
    },

    // Enhanced fetch with token handling
    async apiRequest(url, options = {}) {
        const token = localStorage.getItem('authToken');
        
        const requestOptions = {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': token ? \`Bearer \${token}\` : ''
            }
        };

        const response = await fetch(url, requestOptions);
        
        // If we get a 401, redirect to login
        if (response.status === 401) {
            this.logout();
            throw new Error('Authentication required');
        }

        return response;
    },

    // GraphQL-specific request helper
    async graphqlRequest(query, variables = {}, options = {}) {
        const response = await this.apiRequest('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: JSON.stringify({ query, variables }),
            ...options
        });

        return response.json();
    },

    // Logout helper
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    },

    // Get current user info
    getCurrentUser() {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    },

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        return !!(token && !this.isTokenExpired(token));
    }
};

// Intercept HTMX requests to add authentication headers
document.addEventListener('htmx:configRequest', function(evt) {
    const token = localStorage.getItem('authToken');
    if (token && !window.AuthHandler.isTokenExpired(token)) {
        evt.detail.headers['Authorization'] = 'Bearer ' + token;
    }
});

// Handle authentication errors in HTMX responses
document.addEventListener('htmx:responseError', function(evt) {
    if (evt.detail.xhr.status === 401) {
        window.AuthHandler.logout();
    }
});
    `);
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});