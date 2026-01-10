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
  update: (data: { displayName?: string; mode?: string; radiusMeters?: number; showFriendsOnMap?: boolean }) =>
    api.put('/me/settings', data),
};

export const locationApi = {
  update: (data: { latitude: number; longitude: number; accuracy?: number; isSimulated?: boolean }) =>
    api.put('/me/location', data),
};

export const friendsApi = {
  list: () => api.get('/friends'),
  sendRequest: (friendCode: string) =>
    api.post('/friends/invite/send', { friendCode }),
  acceptInvite: (friendCode: string) =>
    api.post('/friends/invite/accept', { friendCode }),
  acceptRequest: (requestId: number) =>
    api.post('/friends/invite/accept', { requestId }),
  rejectRequest: (requestId: number) =>
    api.post('/friends/invite/reject', { requestId }),
  getPendingRequests: () =>
    api.get('/friends/invite/pending'),
  unfriend: (friendId: number) =>
    api.delete(`/friends/invite/unfriend/${friendId}`),
};

export const nearbyApi = {
  get: (params?: { scope?: 'friends' | 'everyone' }) =>
    api.get('/nearby', { params }),
};
