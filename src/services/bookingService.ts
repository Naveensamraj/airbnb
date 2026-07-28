import type { Booking, BookingStatus } from '../lib/types';
import { api, unwrap } from './api';
import { BOOKING_STATUS_TO_API, mapBookingFromApi, mapBookingToApi } from './mappers';

type BookingInput = Omit<Booking, 'id' | 'created_at'> | Booking | Partial<Booking>;

export async function getBookings(params: Record<string, unknown> = {}): Promise<Booking[]> {
  const response = await api.get('/bookings', { params: { limit: 100, ...params } });
  return (unwrap<unknown[]>(response) || []).map(mapBookingFromApi).filter(Boolean);
}

export async function getBookingById(id: string): Promise<Booking> { return mapBookingFromApi(unwrap<unknown>(await api.get(`/bookings/${id}`))); }
export async function createBooking(booking: BookingInput): Promise<Booking> { return mapBookingFromApi(unwrap<unknown>(await api.post('/bookings', mapBookingToApi(booking)))); }
export async function updateBooking(id: string, booking: BookingInput): Promise<Booking> { return mapBookingFromApi(unwrap<unknown>(await api.put(`/bookings/${id}`, mapBookingToApi(booking)))); }
export async function deleteBooking(id: string): Promise<void> { await api.delete(`/bookings/${id}`); }
export async function approveBooking(id: string): Promise<Booking> { return mapBookingFromApi(unwrap<unknown>(await api.patch(`/bookings/${id}/approve`))); }
export async function rejectBooking(id: string): Promise<Booking> { return mapBookingFromApi(unwrap<unknown>(await api.patch(`/bookings/${id}/reject`))); }

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const apiStatus = BOOKING_STATUS_TO_API[status] || status;
  return mapBookingFromApi(unwrap<unknown>(await api.patch(`/bookings/${id}/status`, { status: apiStatus })));
}

export async function checkAvailability(params: Record<string, unknown>): Promise<unknown> { return unwrap<unknown>(await api.get('/bookings/availability', { params })); }
