import axios from 'axios';

// Create an axios instance with base URL and credentials support
const api = axios.create({
    // In production, VITE_API_URL = your Render backend URL (e.g. https://polls-api.onrender.com/api)
    // In development, '/api' is proxied to localhost:5000 by Vite
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true, // Include cookies with every request (works on desktop)
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor: attach Bearer token for mobile browsers that block cross-domain cookies
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: bubble up errors for caller to handle
api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
