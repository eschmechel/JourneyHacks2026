import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi, settingsApi } from '../lib/api';

interface User {
  id: number;
  displayName: string | null;
  friendCode: string;
  mode: string;
  radiusMeters: number;
  showFriendsOnMap: boolean;
}

interface AuthContextType {
  user: User | null;
  deviceSecret: string | null;
  isLoading: boolean;
  login: (secret: string) => Promise<void>;
  logout: () => void;
  register: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [deviceSecret, setDeviceSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const secret = localStorage.getItem('deviceSecret');
    if (secret) {
      setDeviceSecret(secret);
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const secret = localStorage.getItem('deviceSecret');
      // For Alice demo mode, set mock user instead of API call
      if (secret === '847bdc04-f607-4774-9646-5cd2318a2e83') {
        // Load saved settings from localStorage or use defaults
        const savedSettings = localStorage.getItem('alice-demo-settings');
        const settings = savedSettings ? JSON.parse(savedSettings) : {
          displayName: 'Alice',
          mode: 'EVERYONE',
          radiusMeters: 1000,
          showFriendsOnMap: true,
        };
        
        setUser({
          id: 1,
          displayName: settings.displayName,
          friendCode: 'ALICE123',
          mode: settings.mode,
          radiusMeters: settings.radiusMeters,
          showFriendsOnMap: settings.showFriendsOnMap,
        });
        setIsLoading(false);
        return;
      }
      
      const response = await settingsApi.get();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('deviceSecret');
      setDeviceSecret(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (secret: string) => {
    localStorage.setItem('deviceSecret', secret);
    setDeviceSecret(secret);
    // For demo mode with Alice's hardcoded secret, set mock user
    if (secret === 'alice-demo-secret-123') {
      setUser({
        id: 1,
        displayName: 'Alice',
        friendCode: 'ALICE123',
        mode: 'EVERYONE',
        radiusMeters: 1000,
        showFriendsOnMap: true,
      });
      setIsLoading(false);
    } else {
      await fetchUser();
    }
  };

  const logout = () => {
    localStorage.removeItem('deviceSecret');
    setDeviceSecret(null);
    setUser(null);
  };

  const register = async () => {
    try {
      const response = await authApi.register();
      const { deviceSecret: newSecret } = response.data;
      await login(newSecret);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, deviceSecret, isLoading, login, logout, register, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
