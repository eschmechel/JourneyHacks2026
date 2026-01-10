import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('deviceSecret');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API methods
export const authApi = {
  register: () => api.post('/auth/register'),
};

export const settingsApi = {
  get: () => api.get('/me/settings'),
  update: (data: { displayName?: string; mode?: string; radiusMeters?: number }) =>
    api.put('/me/settings', data),
};

export const locationApi = {
  update: (data: { latitude: number; longitude: number; accuracy?: number; isSimulated?: boolean }) =>
    api.put('/me/location', data),
};

export const friendsApi = {
  list: () => api.get('/friends'),
  acceptInvite: (friendCode: string) =>
    api.post('/friends/invite/accept', { friendCode }),
};

export const nearbyApi = {
  get: () => api.get('/nearby'),
};
