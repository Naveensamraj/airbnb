import type { Notification } from '../lib/types';
import { api, unwrap } from './api';
import { mapNotificationFromApi } from './mappers';

export async function getNotifications(params: Record<string, unknown> = {}): Promise<Notification[]> {
  const response = await api.get('/notifications', { params: { limit: 100, ...params } });
  return (unwrap<unknown[]>(response) || []).map(mapNotificationFromApi).filter(Boolean);
}

export async function createNotification(notification: Partial<Notification>): Promise<Notification> { return mapNotificationFromApi(unwrap<unknown>(await api.post('/notifications', notification))); }
export async function markAsRead(id: string): Promise<Notification> { return mapNotificationFromApi(unwrap<unknown>(await api.patch(`/notifications/${id}/read`))); }
export async function markAllAsRead(): Promise<void> { await api.patch('/notifications/read-all'); }
export async function deleteNotification(id: string): Promise<void> { await api.delete(`/notifications/${id}`); }
export async function getUnreadCount(): Promise<number> { return unwrap<{ unread_count?: number }>(await api.get('/notifications/unread-count')).unread_count ?? 0; }
