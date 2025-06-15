import { baseTemplate } from './index';

export const loginPage = () => baseTemplate(/*html*/`
<div class="max-w-md mx-auto mt-10" x-data="authApp()">
    <div class="bg-dark-gray/30 border border-gold/20 rounded-lg p-8">
        <!-- Toggle between Login and Register -->
        <div class="flex mb-6 bg-dark-gray/50 rounded-lg p-1">
            <button 
                @click="isLogin = true"
                :class="isLogin ? 'bg-gold text-dark-gray' : 'text-gold'"
                class="flex-1 py-2 rounded-lg font-semibold transition-colors">
                Login
            </button>
            <button 
                @click="isLogin = false"
                :class="!isLogin ? 'bg-gold text-dark-gray' : 'text-gold'"
                class="flex-1 py-2 rounded-lg font-semibold transition-colors">
                Register
            </button>
        </div>        
        
        <!-- Login Form -->
        <form x-show="isLogin" 
              hx-post="/api"
              hx-swap="none"
              @htmx:after-request="handleAuthResponse($el, $event)"
              class="space-y-4">
            
            <input type="hidden" name="query" value="mutation LoginUser($credential: String!, $password: String!) { loginUser(credential: $credential, password: $password) { user { id username email } accessToken refreshToken } }">
            
            <h2 class="text-2xl font-bold text-gold mb-6">Welcome Back</h2>
            <div>
                <label class="block text-sm font-medium text-gold mb-1">Username or Email</label>
                <input type="text" name="credential" required
                       class="w-full px-3 py-2 bg-dark-gray border border-gold/30 rounded-lg text-white focus:border-gold focus:outline-none">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gold mb-1">Password</label>
                <input type="password" name="password" required
                       class="w-full px-3 py-2 bg-dark-gray border border-gold/30 rounded-lg text-white focus:border-gold focus:outline-none">
            </div>
            
            <button type="submit" 
                    class="w-full bg-gold text-dark-gray py-2 rounded-lg font-semibold hover:bg-orange transition-colors">
                Sign In
            </button>
        </form>        
        
        <!-- Register Form -->
        <form x-show="!isLogin" 
              hx-post="/api"
              hx-swap="none"
              @htmx:after-request="handleAuthResponse($el, $event)"
              class="space-y-4">
            
            <input type="hidden" name="query" value="mutation RegisterUser($username: String!, $email: String!, $password: String!) { registerUser(username: $username, email: $email, password: $password) { user { id username email } accessToken refreshToken } }">
            
            <h2 class="text-2xl font-bold text-gold mb-6">Create Account</h2>
            
            <div>
                <label class="block text-sm font-medium text-gold mb-1">Username</label>
                <input type="text" name="username" required
                       class="w-full px-3 py-2 bg-dark-gray border border-gold/30 rounded-lg text-white focus:border-gold focus:outline-none">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gold mb-1">Email</label>
                <input type="email" name="email" required
                       class="w-full px-3 py-2 bg-dark-gray border border-gold/30 rounded-lg text-white focus:border-gold focus:outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gold mb-1">Password</label>
                <input type="password" name="password" required
                       class="w-full px-3 py-2 bg-dark-gray border border-gold/30 rounded-lg text-white focus:border-gold focus:outline-none">
            </div>
            
            <button type="submit" 
                    class="w-full bg-gold text-dark-gray py-2 rounded-lg font-semibold hover:bg-orange transition-colors">
                Create Account
            </button>
        </form>

        <!-- Status Messages -->
        <div x-show="message" 
             :class="messageType === 'success' ? 'text-green-400' : 'text-red-400'"
             class="mt-4 text-center text-sm"
             x-text="message">
        </div>

        <!-- Already Logged In -->
        <div x-show="isAuthenticated" class="text-center py-8">
            <p class="text-gold mb-4">You are already logged in!</p>
            <div class="space-y-2">
                <a href="/wallet" class="block bg-gold/20 text-gold px-4 py-2 rounded hover:bg-gold/30 transition-colors">
                    Go to Wallets
                </a>
                <button @click="logout()" 
                        class="block w-full bg-red-500/20 text-red-400 px-4 py-2 rounded hover:bg-red-500/30 transition-colors">
                    Logout
                </button>
            </div>
        </div>
    </div>
</div>

<script>
function authApp() {
    return {
        isLogin: true,
        isAuthenticated: false,
        message: '',
        messageType: 'info',        handleAuthResponse(form, event) {
            console.log('🔍 Auth Response Event:', event.detail);
            
            try {
                const response = JSON.parse(event.detail.xhr.responseText);
                if (response.errors) {
                    this.message = response.errors[0].message;
                    this.messageType = 'error';
                } else {
                    const authData = response.data?.loginUser || response.data?.registerUser;
                    
                    if (authData && authData.accessToken) {
                        // Store tokens and user data
                        localStorage.setItem('authToken', authData.accessToken);
                        localStorage.setItem('refreshToken', authData.refreshToken);
                        localStorage.setItem('currentUser', JSON.stringify(authData.user));
                        
                        // Dispatch login event for other components
                        window.dispatchEvent(new CustomEvent('userLoggedIn', {
                            detail: { user: authData.user, accessToken: authData.accessToken }
                        }));
                        
                        this.message = 'Success! Redirecting...';
                        this.messageType = 'success';
                        this.isAuthenticated = true;
                        window.location.href = '/wallet';
                        
                    } else {
                        this.message = 'Login failed - no data received';
                        this.messageType = 'error';
                    }
                }
            } catch (error) {
                this.message = 'Error processing response';
                this.messageType = 'error';
            }
            
            form.reset();
        },

        logout() {
            // Use the global auth handler
            window.AuthHandler.logout();
            this.isAuthenticated = false;
            this.message = 'Logged out successfully';
            this.messageType = 'success';
        },

        init() {
            // Use the global auth handler to check authentication
            this.isAuthenticated = window.AuthHandler ? window.AuthHandler.isAuthenticated() : !!localStorage.getItem('authToken');
            
            // Listen for auth events
            window.addEventListener('userLoggedOut', () => {
                this.isAuthenticated = false;
            });
            
            window.addEventListener('authTokenRefreshed', () => {
                this.isAuthenticated = true;
            });
        }
    }
}
</script>
`);
