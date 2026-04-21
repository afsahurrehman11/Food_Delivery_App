import axios from 'axios';
import {Platform} from 'react-native';
import {API_BASE_URL} from '../config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// Read the tab-isolated token (sessionStorage on web, AsyncStorage on native)
const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return sessionStorage.getItem('session_access_token') || null;
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    return AsyncStorage.getItem('session_access_token');
  } catch (_) {
    return null;
  }
};

const clearSession = async () => {
  try {
    if (Platform.OS === 'web') {
      sessionStorage.removeItem('session_access_token');
      sessionStorage.removeItem('session_user');
    } else {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem('session_access_token');
      await AsyncStorage.removeItem('session_user');
    }
  } catch (_) {}
};

// Interceptor to attach auth token
api.interceptors.request.use(async config => {
  try {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData (let axios handle it)
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  } catch (e) {
    return config;
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  async error => {
    const status = error?.response?.status;
    // Only clear token on 401 (expired/invalid token), NOT on 403 (wrong role)
    if (status === 401) {
      await clearSession();
    }
    return Promise.reject(error);
  },
);

export default api;
