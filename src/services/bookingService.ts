import type { Booking, BookingStatus } from '../lib/types';
import { api, unwrap } from './api';
import { BOOKING_STATUS_TO_API, mapBookingFromApi, mapBookingToApi } from './mappers';

type BookingInput = Omit<Booking, 'id' | 'created_at'> | Booking | Partial<Booking>;

export async function getBookings(params: Record<string, unknown> = {}): Promise<Booking[]> {
  const response = await api.get('/bookings', { params: { limit: 100, ...params } });
  return (unwrap<unknown[]>(response) || []).map(mapBookingFromApi).filter(Boolean);
}

function preparePayload(booking: BookingInput, file?: File, removeFile?: boolean): FormData | Record<string, any> {
  const data = mapBookingToApi(booking);
  if (!file && !removeFile) return data;

  const formData = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      formData.append(key, String(val));
    }
  });
  if (file) {
    formData.append('id_proof_file', file);
  }
  if (removeFile) {
    formData.append('remove_id_proof', 'true');
  }
  return formData;
}

export async function getBookingById(id: string): Promise<Booking> { return mapBookingFromApi(unwrap<unknown>(await api.get(`/bookings/${id}`))); }

export async function createBooking(booking: BookingInput, file?: File): Promise<Booking> {
  const payload = preparePayload(booking, file);
  const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
  return mapBookingFromApi(unwrap<unknown>(await api.post('/bookings', payload, config)));
}

export async function updateBooking(id: string, booking: BookingInput, file?: File, removeFile?: boolean): Promise<Booking> {
  const payload = preparePayload(booking, file, removeFile);
  const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
  return mapBookingFromApi(unwrap<unknown>(await api.put(`/bookings/${id}`, payload, config)));
}

export async function deleteBooking(id: string): Promise<void> { await api.delete(`/bookings/${id}`); }
export async function approveBooking(id: string): Promise<Booking> { return mapBookingFromApi(unwrap<unknown>(await api.patch(`/bookings/${id}/approve`))); }
export async function rejectBooking(id: string): Promise<Booking> { return mapBookingFromApi(unwrap<unknown>(await api.patch(`/bookings/${id}/reject`))); }

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const apiStatus = BOOKING_STATUS_TO_API[status] || status;
  return mapBookingFromApi(unwrap<unknown>(await api.patch(`/bookings/${id}/status`, { status: apiStatus })));
}

export async function checkAvailability(params: Record<string, unknown>): Promise<unknown> { return unwrap<unknown>(await api.get('/bookings/availability', { params })); }

export function checkDoubleBooking(
  bookings: Booking[],
  propertyId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): { isConflicting: boolean; conflictingBooking?: Booking } {
  if (!propertyId || !checkIn || !checkOut) return { isConflicting: false };

  const newStart = new Date(checkIn).getTime();
  const newEnd = new Date(checkOut).getTime();

  if (Number.isNaN(newStart) || Number.isNaN(newEnd) || newStart >= newEnd) {
    return { isConflicting: false };
  }

  const conflict = bookings.find((b) => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.property_id !== propertyId) return false;
    if ((b.status as string) === 'cancelled' || (b.status as string) === 'rejected') return false;

    const existStart = new Date(b.check_in).getTime();
    const existEnd = new Date(b.check_out).getTime();

    if (Number.isNaN(existStart) || Number.isNaN(existEnd)) return false;

    return newStart < existEnd && newEnd > existStart;
  });

  return {
    isConflicting: Boolean(conflict),
    conflictingBooking: conflict,
  };
}
