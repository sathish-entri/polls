import axios from 'axios';

// Create an axios instance with base URL and credentials support
const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // Include cookies with every request
    headers: {
        'Content-Type': 'application/json'
    }
});

// Response interceptor: extract data directly from success response
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Bubble up the error for caller to handle
        return Promise.reject(error);
    }
);

export default api;
