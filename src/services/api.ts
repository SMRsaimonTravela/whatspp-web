import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const message = error.response?.data?.error || error.response?.data?.message || 'An error occurred';

    if (error.response?.status === 401) {
      // Check if we're on login/signup page - don't redirect or show toast (form handles it)
      const isAuthPage = window.location.pathname.includes('/signin') ||
                         window.location.pathname.includes('/signup') ||
                         window.location.pathname.includes('/login') ||
                         window.location.pathname.includes('/register');

      if (!isAuthPage) {
        // On other pages, clear auth and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/signin';
        toast.error('Session expired. Please login again.');
      }
      // On auth pages, don't show toast - let the form component handle the error display
    } else if (error.response?.status === 403) {
      toast.error('Access denied');
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else {
      // Don't show toast on auth pages for other errors too
      const isAuthPage = window.location.pathname.includes('/signin') ||
                         window.location.pathname.includes('/signup') ||
                         window.location.pathname.includes('/login') ||
                         window.location.pathname.includes('/register');
      if (!isAuthPage) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
