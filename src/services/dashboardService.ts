import type { Booking, Notification, Payment } from '../lib/types';
import { api, unwrap } from './api';
import { mapBookingFromApi, mapNotificationFromApi, mapPaymentFromApi } from './mappers';

export interface DashboardData {
  stats: DashboardStats;
  monthlyRevenue: Array<{ month: string; total: number; count?: number }>;
  recentBookings: Booking[];
  recentPayments: Payment[];
  recentNotifications: Notification[];
}

export interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  pendingApprovals: number;
  occupiedProperties: number;
  availableProperties: number;
}

export async function getDashboard(): Promise<DashboardData> {
  const data = unwrap<{ stats?: Partial<DashboardStats>; monthlyRevenue?: Array<{ month: string; total: number; count?: number }>; recentBookings?: unknown[]; recentPayments?: unknown[]; recentNotifications?: unknown[] }>(await api.get('/dashboard'));
  return {
    stats: {
      totalUsers: data.stats?.totalUsers ?? 0,
      totalProperties: data.stats?.totalProperties ?? 0,
      totalBookings: data.stats?.totalBookings ?? 0,
      totalRevenue: data.stats?.totalRevenue ?? 0,
      pendingApprovals: data.stats?.pendingApprovals ?? 0,
      occupiedProperties: data.stats?.occupiedProperties ?? 0,
      availableProperties: data.stats?.availableProperties ?? 0,
    }, monthlyRevenue: data.monthlyRevenue || [],
    recentBookings: (data.recentBookings || []).map(mapBookingFromApi).filter(Boolean),
    recentPayments: (data.recentPayments || []).map(mapPaymentFromApi).filter(Boolean),
    recentNotifications: (data.recentNotifications || []).map(mapNotificationFromApi).filter(Boolean),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> { return unwrap<DashboardStats>(await api.get('/dashboard/stats')); }
export async function getDashboardRevenue(params: Record<string, unknown> = {}): Promise<Array<{ month: string; total: number; count: number }>> {
  const data = unwrap<Array<{ month?: string; _id?: { month?: string }; total?: number; count?: number }>>(await api.get('/dashboard/revenue', { params }));
  return (data || []).map((item) => ({ month: item.month || item._id?.month || '', total: item.total ?? 0, count: item.count ?? 0 }));
}
export async function getDashboardRecent(): Promise<Omit<DashboardData, 'stats' | 'monthlyRevenue'>> {
  const data = unwrap<{ recentBookings?: unknown[]; recentPayments?: unknown[]; recentNotifications?: unknown[] }>(await api.get('/dashboard/recent'));
  return {
    recentBookings: (data.recentBookings || []).map(mapBookingFromApi).filter(Boolean),
    recentPayments: (data.recentPayments || []).map(mapPaymentFromApi).filter(Boolean),
    recentNotifications: (data.recentNotifications || []).map(mapNotificationFromApi).filter(Boolean),
  };
}
