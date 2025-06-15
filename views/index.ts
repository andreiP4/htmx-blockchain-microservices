export const baseTemplate = (content: string) => /*html*/`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blockchain Explorer</title>    
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    <script src="https://unpkg.com/alpinejs" defer></script>
    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    <script src="/auth.js"></script>
    <link href="/styles.css" rel="stylesheet">
    <style type="text/tailwindcss">
      @theme {
        --color-dark-gray: #181a1b;
        --color-gold: #F0A500;
        --color-orange: #CF7500;
        --color-white: #F4F4F4;
      }
    </style>
</head>
<body class="bg-dark-gray text-white">
    <nav class="bg-dark-gray border-b border-gold/30 fixed w-full z-50">
        <div class="max-w-[95%] mx-auto">
            <div class="flex justify-between h-16">
                <!-- Left side - Title -->
                <div class="flex items-center">
                    <span class="text-2xl font-bold text-gold hover:text-orange transition-colors">
                        Blockchain Explorer
                    </span>
                </div>                  <!-- Right side - Navigation -->
                <div class="hidden sm:flex sm:items-center -mr-4" x-data="navAuth()" x-init="init()">
                    <div class="flex space-x-8 items-center">
                        <a href="/" class="text-white hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            Home
                        </a>
                        <a href="/blocks" class="text-white hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            Blocks
                        </a>
                        <a href="/transactions" class="text-white hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            Transactions
                        </a>
                        <a href="/wallet" class="text-white hover:text-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            Wallet
                        </a>
                        
                        <!-- Auth Status -->
                        <div x-show="!isAuthenticated">
                            <a href="/login" class="bg-gold text-dark-gray px-3 py-1 rounded text-sm font-medium hover:bg-orange transition-colors">
                                Login
                            </a>
                        </div>
                        <div x-show="isAuthenticated" class="flex items-center space-x-2">
                            <span class="text-green-400 text-sm">●</span>
                            <span class="text-white/70 text-sm" x-text="currentUser?.username || 'User'"></span>
                            <button @click="logout()" 
                                    class="text-white/70 hover:text-orange text-sm">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Mobile menu container -->
                <div x-data="{ open: false }" class="flex items-center sm:hidden">
                    <!-- Mobile menu button -->
                    <button type="button" 
                            class="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gold hover:bg-dark-gray/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold"
                            @click="open = !open"
                            aria-expanded="false">
                        <span class="sr-only">Open main menu</span>
                        <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <!-- Mobile menu -->
                    <div class="absolute top-16 right-0 w-48 bg-dark-gray/95 backdrop-blur-sm shadow-lg rounded-lg" 
                         x-show="open" 
                         x-transition>
                        <div class="px-2 pt-2 pb-3 space-y-1">
                            <a href="/" class="text-white hover:text-gold block px-3 py-2 rounded-md text-base font-medium">
                                Home
                            </a>
                            <a href="/blocks" class="text-white hover:text-gold block px-3 py-2 rounded-md text-base font-medium">
                                Blocks
                            </a>
                            <a href="/transactions" class="text-white hover:text-gold block px-3 py-2 rounded-md text-base font-medium">
                                Transactions
                            </a>
                            <a href="/wallet" class="text-white hover:text-gold block px-3 py-2 rounded-md text-base font-medium">
                                Wallet
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        ${content}
    </main>

    <script>
    // Navigation auth handler
    function navAuth() {
        return {
            isAuthenticated: false,
            currentUser: null,            init() {
                this.updateAuthState();

                // Listen for auth events
                window.addEventListener('authTokenRefreshed', (e) => {
                    this.currentUser = e.detail.user;
                    this.isAuthenticated = true;
                });

                window.addEventListener('userLoggedOut', () => {
                    this.isAuthenticated = false;
                    this.currentUser = null;
                });

                window.addEventListener('userLoggedIn', () => {
                    this.updateAuthState();
                });
            },

            updateAuthState() {
                this.isAuthenticated = window.AuthHandler.isAuthenticated();
                this.currentUser = window.AuthHandler.getCurrentUser();
            },

            logout() {
                window.AuthHandler.logout();
            }
        }
    }
    </script>
</body>
</html>
`;
