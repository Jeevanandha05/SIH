import React, { createContext, useContext, useState, ReactNode } from 'react';
import { usersData, User } from '@/data/blockchainData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const getLiveUsers = (): User[] => {
    try {
      const storedUsers = localStorage.getItem('certchain_users');
      if (storedUsers) {
        return JSON.parse(storedUsers);
      }
    } catch (e) {
      console.error("Failed to parse users from localStorage", e);
    }
    return usersData; // Fallback to initial data
  };

  const login = (username: string, password: string): boolean => {
    const currentUsers = getLiveUsers();
    const foundUser = currentUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (foundUser) {
      // Admin role requires the specific password '1234'
      if (foundUser.role === 'admin') {
        if (password === '1234') {
          setUser(foundUser);
          return true;
        }
      } else if (foundUser.role === 'uploader') { // For 'uploader' role
        if (password.length >= 4) {
          setUser(foundUser);
          return true;
        }
      }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
