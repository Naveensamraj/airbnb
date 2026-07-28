import type { DemoUser } from '../lib/types';
import { api, clearTokens, setTokens, unwrap } from './api';
import { mapUserFromApi } from './mappers';

const USER_KEY = 'prms_user';

interface AuthResponse { user: unknown; accessToken: string; refreshToken?: string }

export function getStoredUser(): DemoUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as DemoUser; } catch { return null; }
}

export function storeUser(user: DemoUser | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

async function authenticate(path: string, email: string, password: string): Promise<DemoUser> {
  const response = await api.post(path, { email, password });
  const data = unwrap<AuthResponse>(response);
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  const user = mapUserFromApi(data.user);
  storeUser(user);
  return user;
}

export function adminLogin(email: string, password: string): Promise<DemoUser> {
  return authenticate('/auth/admin/login', email, password);
}

export function login(email: string, password: string): Promise<DemoUser> {
  return authenticate('/auth/login', email, password);
}

export async function getMe(): Promise<DemoUser> {
  const response = await api.get('/auth/me');
  const data = unwrap<{ user: unknown }>(response);
  const user = mapUserFromApi(data.user);
  storeUser(user);
  return user;
}

export async function updateProfile(updates: Partial<DemoUser>): Promise<DemoUser> {
  const response = await api.put('/auth/profile', updates);
  const data = unwrap<{ user: unknown }>(response);
  const user = mapUserFromApi(data.user);
  storeUser(user);
  return user;
}

export async function logout(): Promise<void> {
  try { await api.post('/auth/logout'); } catch { /* Clear local auth even when offline. */ }
  clearTokens();
  storeUser(null);
}

export function refreshSession(): Promise<DemoUser> { return getMe(); }

export async function ensureAdminSession(): Promise<DemoUser> {
  try { return await getMe(); } catch { /* Sign in with the configured admin account. */ }
  const email = import.meta.env.VITE_ADMIN_EMAIL;
  const password = import.meta.env.VITE_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Missing admin credentials in environment variables');
  return adminLogin(email, password);
}
