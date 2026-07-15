import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DemoUser, UserRole } from '../lib/types';
import { DEMO_USERS } from '../lib/mockData';

interface AuthContextValue {
  user: DemoUser | null;
  role: UserRole | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'prms_demo_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const adminUser = DEMO_USERS.find(u => u.role === 'admin');
    if (adminUser) {
      setUser(adminUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
    }
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
