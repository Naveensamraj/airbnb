import type { Guest } from '../lib/types';
import { api, unwrap } from './api';
import { mapGuestFromApi } from './mappers';

export async function getGuests(): Promise<Guest[]> {
  const response = await api.get('/guests');
  const items = unwrap<unknown[]>(response) || [];
  return items.map(mapGuestFromApi);
}

export async function getGuestById(id: string): Promise<Guest & { bookings?: any[]; payments?: any[] }> {
  const response = await api.get(`/guests/${id}`);
  const data = unwrap<any>(response);
  const mapped = mapGuestFromApi(data);
  return {
    ...mapped,
    bookings: data.bookings || [],
    payments: data.payments || [],
  };
}

export async function createGuest(guestData: Partial<Guest>): Promise<Guest> {
  const response = await api.post('/guests', guestData);
  return mapGuestFromApi(unwrap<unknown>(response));
}

export async function updateGuest(id: string, guestData: Partial<Guest>): Promise<Guest> {
  const response = await api.put(`/guests/${id}`, guestData);
  return mapGuestFromApi(unwrap<unknown>(response));
}

export async function toggleGuestBlacklist(id: string): Promise<Guest> {
  const response = await api.patch(`/guests/${id}/blacklist`);
  return mapGuestFromApi(unwrap<unknown>(response));
}

export async function deleteGuest(id: string): Promise<void> {
  await api.delete(`/guests/${id}`);
}
