// Global authentication handler with automatic token refresh
window.AuthHandler = {
    // Store for ongoing refresh attempts
    refreshPromise: null,

    // Check if token is expired (with 1 minute buffer)
    isTokenExpired(token) {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < (currentTime + 60); // 1 minute buffer
        } catch (e) {
            return true;
        }
    },

    // Check if refresh token is available and valid
    hasValidRefreshToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return false;
        
        try {
            const payload = JSON.parse(atob(refreshToken.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp > currentTime; // Check if refresh token is not expired
        } catch (e) {
            return false;
        }
    },

    // Refresh the access token using refresh token
    async refreshAccessToken() {
        // Prevent multiple simultaneous refresh attempts
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken || !this.hasValidRefreshToken()) {
            this.logout();
            throw new Error('No valid refresh token available');
        }

        this.refreshPromise = fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `
                    mutation RefreshToken($refreshToken: String!) {
                        refreshToken(refreshToken: $refreshToken) {
                            accessToken
                            refreshToken
                            user {
                                id
                                username
                                email
                            }
                        }
                    }
                `,
                variables: { refreshToken }
            })
        })
        .then(response => response.json())
        .then(data => {
            this.refreshPromise = null;
            
            if (data.errors || !data.data?.refreshToken) {
                throw new Error(data.errors?.[0]?.message || 'Token refresh failed');
            }

            const { accessToken, refreshToken: newRefreshToken, user } = data.data.refreshToken;
            
            // Update stored tokens
            localStorage.setItem('authToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            localStorage.setItem('currentUser', JSON.stringify(user));

            // Dispatch event for other parts of the app to react
            window.dispatchEvent(new CustomEvent('authTokenRefreshed', { 
                detail: { accessToken, user } 
            }));

            return accessToken;
        })
        .catch(error => {
            this.refreshPromise = null;
            console.error('Token refresh failed:', error);
            
            // Only logout if the refresh token is actually invalid
            // Don't logout for network errors or temporary issues
            if (error.message.includes('invalid') || error.message.includes('expired')) {
                this.logout();
            }
            throw error;
        });

        return this.refreshPromise;
    },

    // Enhanced fetch with automatic token refresh
    async apiRequest(url, options = {}) {
        let token = localStorage.getItem('authToken');
        
        // Check if token needs refresh before making the request
        if (this.isTokenExpired(token)) {
            if (this.hasValidRefreshToken()) {
                try {
                    token = await this.refreshAccessToken();
                } catch (error) {
                    throw new Error('Authentication failed: ' + error.message);
                }
            } else {
                throw new Error('Authentication required');
            }
        }

        // Set up the request with the token
        const requestOptions = {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': token ? `Bearer ${token}` : ''
            }
        };

        // Make the request
        let response = await fetch(url, requestOptions);
        
        // If we get a 401 and haven't tried refreshing yet, try refreshing the token
        if (response.status === 401 && !options._retryAttempt && this.hasValidRefreshToken()) {
            try {
                token = await this.refreshAccessToken();
                requestOptions.headers['Authorization'] = `Bearer ${token}`;
                requestOptions._retryAttempt = true;
                response = await fetch(url, requestOptions);
            } catch (error) {
                throw new Error('Authentication failed: ' + error.message);
            }
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
        
        // Only redirect to login if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
        }
    },

    // Get current user info
    getCurrentUser() {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    },

    // Check if user is authenticated (can be authenticated even with expired access token if refresh token exists)
    isAuthenticated() {
        return this.hasValidRefreshToken(); // As long as we have a valid refresh token, we can authenticate
    },

    // Initialize authentication state - call this on page load
    async initAuth() {
        const token = localStorage.getItem('authToken');
        
        // If we have an expired access token but a valid refresh token, refresh it
        if (this.isTokenExpired(token) && this.hasValidRefreshToken()) {
            try {
                await this.refreshAccessToken();
                return true;
            } catch (error) {
                console.error('Failed to refresh token on init:', error);
                return false;
            }
        }
        
        return this.isAuthenticated();
    }
};

// Intercept HTMX requests to add authentication headers
document.addEventListener('htmx:configRequest', async function(evt) {
    let token = localStorage.getItem('authToken');
    
    // If token is expired but we have a valid refresh token, refresh it first
    if (window.AuthHandler.isTokenExpired(token) && window.AuthHandler.hasValidRefreshToken()) {
        try {
            token = await window.AuthHandler.refreshAccessToken();
        } catch (error) {
            console.error('Failed to refresh token for HTMX request:', error);
            return; // Let the request proceed without token, it will likely fail with 401
        }
    }
    
    if (token) {
        evt.detail.headers['Authorization'] = 'Bearer ' + token;
    }
});

// Handle token refresh for HTMX requests that return 401
document.addEventListener('htmx:responseError', async function(evt) {
    if (evt.detail.xhr.status === 401 && window.AuthHandler.hasValidRefreshToken()) {
        try {
            await window.AuthHandler.refreshAccessToken();
            // Retry the original request with new token
            const newToken = localStorage.getItem('authToken');
            if (newToken) {
                // Re-trigger the same element that caused the error
                htmx.trigger(evt.detail.elt, evt.detail.requestConfig.triggeringEvent.type);
            }
        } catch (error) {
            console.error('Failed to refresh token for HTMX request:', error);
            // Don't automatically logout here, let the user try again
        }
    }
});
