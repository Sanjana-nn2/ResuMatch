import axios from 'axios';

// Get API base URL directly from environment variable (or default fallback to production backend)
export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || 'https://resumatch-backend-pfx5.onrender.com').replace(/\/+$/, '');
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 160000,
});

// Request interceptor: Dynamic base URL + Auto-inject JWT if authenticated
api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = typeof window !== 'undefined' ? localStorage.getItem('resumatch_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Clear token upon 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && localStorage.getItem('resumatch_token')) {
        localStorage.removeItem('resumatch_token');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Clean user-facing error message extractor.
 * Avoids exposing localhost, IP addresses, internal stack traces, or raw error codes to users.
 */
export function getFriendlyErrorMessage(err) {
  if (err.response) {
    const data = err.response.data;
    if (typeof data === 'object' && data !== null && (data.error || data.message)) {
      return data.error || data.message;
    }
    if (err.response.status === 404) {
      return 'Requested resource was not found.';
    }
    if (err.response.status === 403) {
      return 'Access denied. Please check your account privileges.';
    }
    if (err.response.status >= 500) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    return `Request failed with status code ${err.response.status}.`;
  }

  // Network error or timeout (no HTTP response received)
  if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
    return 'The request timed out. Please check your connection and try again.';
  }

  return 'Service temporarily unavailable. Please try again later.';
}

export default api;
