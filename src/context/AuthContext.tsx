import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DemoUser } from '../lib/types';
import * as authService from '../services/authService';

interface AuthContextValue {
  user: DemoUser | null;
  role: DemoUser['role'] | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(authService.getStoredUser());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function bootstrapAuth() {
      try {
        const sessionUser = await authService.getMe();
        if (active) {
          setUser(sessionUser);
          setError(null);
        }
      } catch {
        if (active) {
          setUser(null);
          setError(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    bootstrapAuth();
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let loggedInUser: DemoUser;
      try {
        loggedInUser = await authService.adminLogin(email, password);
      } catch {
        loggedInUser = await authService.login(email, password);
      }
      setUser(loggedInUser);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const nextUser = await authService.getMe();
      setUser(nextUser);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh user');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role ?? null,
      isLoading,
      error,
      login,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

