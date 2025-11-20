class BaseApiService {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_BASE_URL;
        if (!this.baseURL) {
            throw new Error('VITE_API_BASE_URL environment variable is not set');
        }
        this.token = localStorage.getItem('authToken');
    }

    setAuthToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const contentType = response.headers.get('content-type');

            if (!response.ok) {
                let body = null;
                try {
                    if (contentType && contentType.includes('application/json')) {
                        body = await response.json();
                    } else {
                        body = await response.text();
                    }
                } catch {
                    body = null;
                }

                const error = new Error(body?.message || body || `HTTP error ${response.status}`);
                error.status = response.status;
                error.body = body;

                if (response.status === 401 && !options.skipAuthHandling) {
                    this.setAuthToken(null);
                }

                throw error;
            }

            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return response;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
}

export default BaseApiService;
