import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DemoUser, UserRole } from '../lib/types';
import { DEMO_USERS } from '../lib/mockData';

interface AuthContextValue {
  user: DemoUser | null;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  demoLogin: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'prms_demo_user';

const ADMIN_PASSWORD = 'Admin@123';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    if (email.toLowerCase() !== 'admin@staypro.com' || password !== ADMIN_PASSWORD) {
      return { error: 'Invalid email or password.' };
    }
    const demoUser = DEMO_USERS.find(u => u.email === email.toLowerCase());
    if (!demoUser) return { error: 'User not found.' };
    setUser(demoUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
    return {};
  };

  const demoLogin = () => {
    const demoUser = DEMO_USERS.find(u => u.role === 'admin');
    if (demoUser) {
      setUser(demoUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, login, demoLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
