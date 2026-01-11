import axios from 'axios';
import { storage } from './storage';

// For physical devices, use your computer's local IP address
// Find your IP with: ipconfig (Windows) or ifconfig/ip addr (Linux/Mac)
const API_BASE_URL = __DEV__ 
  ? 'http://172.16.132.178:8787'  // Local development - use your computer's local IP
  : 'https://api.beepd.tech';  // Production API (custom domain)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor - add Bearer token to all requests
api.interceptors.request.use(async (config) => {
  const deviceSecret = await storage.getDeviceSecret();
  if (deviceSecret) {
    config.headers.Authorization = `Bearer ${deviceSecret}`;
  }
  return config;
});

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token invalid - clear storage
      await storage.clear();
      // You could navigate to register screen here
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  async register() {
    const response = await api.post('/api/auth/register');
    return response.data;
  },
};

export const locationApi = {
  async update(latitude: number, longitude: number) {
    const response = await api.post('/api/location/update', { latitude, longitude });
    return response.data;
  },
};

export const nearbyApi = {
  async get(scope: 'friends' | 'everyone' = 'everyone') {
    const response = await api.get(`/api/location/nearby?scope=${scope}`);
    return response.data;
  },
};

export const friendsApi = {
  async list() {
    const response = await api.get('/api/friends/list');
    return response.data;
  },

  async sendRequest(friendCode: string) {
    const response = await api.post('/api/friends/invite', { friendCode });
    return response.data;
  },

  async getPendingRequests() {
    const response = await api.get('/api/friends/requests');
    return response.data;
  },

  async acceptRequest(requestId: string) {
    const response = await api.post('/api/friends/accept', { requestId });
    return response.data;
  },

  async rejectRequest(requestId: string) {
    const response = await api.post('/api/friends/reject', { requestId });
    return response.data;
  },

  async unfriend(friendId: string) {
    const response = await api.post('/api/friends/unfriend', { friendId });
    return response.data;
  },
};

export const settingsApi = {
  async get() {
    const response = await api.get('/api/settings');
    return response.data;
  },

  async update(
    displayName: string,
    mode: 'friends' | 'everyone',
    radiusMeters: number,
    showFriendsOnMap: boolean
  ) {
    const response = await api.post('/api/settings/update', {
      displayName,
      mode: mode.toUpperCase(),
      radiusMeters,
      showFriendsOnMap,
    });
    return response.data;
  },
};

export { api };
