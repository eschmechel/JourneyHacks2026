import React, { createContext, useContext, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { authApi } from '../services/api';
import { storage } from '../services/storage';

interface User {
  id: number;
  friendCode: string;
  displayName: string | null;
  mode: 'OFF' | 'FRIENDS' | 'EVERYONE';
  radiusMeters: number;
  showFriendsOnMap: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const deviceSecret = await storage.getDeviceSecret();
      const savedUser = await storage.getUser();
      
      if (deviceSecret && savedUser) {
        setUser(savedUser);
      } else {
        // No auth, navigate to register
        router.replace('/register');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/register');
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    try {
      const response = await authApi.register();
      
      await storage.setDeviceSecret(response.deviceSecret);
      
      const userData: User = {
        id: response.user.id,
        friendCode: response.user.friendCode,
        displayName: response.user.displayName,
        mode: response.user.mode,
        radiusMeters: response.user.radiusMeters,
        showFriendsOnMap: response.user.showFriendsOnMap || false,
      };
      
      await storage.setUser(userData);
      setUser(userData);
      
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    await storage.clear();
    setUser(null);
    router.replace('/register');
  };

  const refreshUser = (userData: User) => {
    setUser(userData);
    storage.setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
