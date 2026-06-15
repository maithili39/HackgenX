import axios from 'axios';

const __API_BASE__ = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: __API_BASE__,
    withCredentials: true // Important for sending httpOnly cookies
});

// Response interceptor for handling token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                // Try to refresh the token
                await axios.post(`${__API_BASE__}/api/auth/refresh`, {}, { withCredentials: true });
                
                // If successful, retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, let the app handle the logout (e.g., via AuthContext)
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
