'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbase';
import type { UsersRecord } from '@/lib/pocketbase-types';

interface AuthContextType {
  user: UsersRecord | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UsersRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = () => {
      if (pb.authStore.isValid) {
        setUser(pb.authStore.model as unknown as UsersRecord);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model as unknown as UsersRecord | null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      setUser(authData.record as unknown as UsersRecord);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
