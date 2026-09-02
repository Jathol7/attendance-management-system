import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresPasswordChange: boolean;
  viewMode: 'admin' | 'employee';
  setViewMode: (mode: 'admin' | 'employee') => void;
  login: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  register: (payload: { name: string; email: string; password: string; department: string; jobTitle?: string; avatarUrl?: string }) => Promise<{ message: string; status: string }>;
  logout: () => void;
  changePassword: (payload: { newPassword: string; currentPassword?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('attendance_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [viewMode, setViewMode] = useState<'admin' | 'employee'>('employee');

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const { user: fetchedUser } = await api.getMe();
        setUser(fetchedUser);
        setRequiresPasswordChange(fetchedUser.isFirstLogin);
        if (fetchedUser.role === 'admin') {
          setViewMode('admin');
        } else {
          setViewMode('employee');
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
        localStorage.removeItem('attendance_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await api.login(credentials);
      localStorage.setItem('attendance_token', response.token);
      setToken(response.token);
      setUser(response.user);
      setRequiresPasswordChange(response.requiresPasswordChange || response.user.isFirstLogin);
      if (response.user.role === 'admin') {
        setViewMode('admin');
      } else {
        setViewMode('employee');
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: { name: string; email: string; password: string; department: string; jobTitle?: string; avatarUrl?: string }) => {
    return api.register(payload);
  };

  const logout = () => {
    localStorage.removeItem('attendance_token');
    setToken(null);
    setUser(null);
    setRequiresPasswordChange(false);
    setViewMode('employee');
  };

  const changePassword = async (payload: { newPassword: string; currentPassword?: string }) => {
    const res = await api.changePassword(payload);
    localStorage.setItem('attendance_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setRequiresPasswordChange(false);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const { user: fetchedUser } = await api.getMe();
      setUser(fetchedUser);
      setRequiresPasswordChange(fetchedUser.isFirstLogin);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        requiresPasswordChange,
        viewMode,
        setViewMode,
        login,
        register,
        logout,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
