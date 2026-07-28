import type { Booking, BookingStatus, DemoUser, Expense, Guest, Notification, Payment, Property } from '../lib/types';
import { toId, toIsoDate, toIsoDateTime } from './api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiRecord = Record<string, any>;

const BOOKING_STATUS_FROM_API: Record<string, BookingStatus> = { pending: 'pending', approved: 'confirmed', rejected: 'cancelled', active: 'checked_in', completed: 'checked_out', cancelled: 'cancelled' };
export const BOOKING_STATUS_TO_API: Record<string, string> = { pending: 'pending', awaiting_payment: 'pending', awaiting_approval: 'pending', confirmed: 'approved', checked_in: 'active', checked_out: 'completed', cancelled: 'cancelled', refunded: 'cancelled' };
const PAYMENT_STATUS_FROM_API: Record<string, Payment['status']> = { pending: 'pending', paid: 'completed', failed: 'failed', refunded: 'refunded', overdue: 'pending' };
const PAYMENT_METHOD_FROM_API: Record<string, Payment['method']> = { cash: 'cash', upi: 'upi', bank_transfer: 'bank_transfer', credit_card: 'card', debit_card: 'card' };
export const PAYMENT_METHOD_TO_API: Record<string, string> = { cash: 'cash', upi: 'upi', card: 'credit_card', bank_transfer: 'bank_transfer' };
const NOTIFICATION_TYPE_FROM_API: Record<string, Notification['type']> = { booking: 'booking', payment: 'payment', property: 'info', system: 'info' };

export function mapUserFromApi(value: unknown): DemoUser {
  const user = (value || {}) as ApiRecord;
  return { id: toId(user), role: 'admin', full_name: user.full_name || '', email: user.email || '', phone: user.phone || '', address: user.address || '' };
}

export function mapPropertyFromApi(value: unknown): Property {
  const property = (value || {}) as ApiRecord;
  return {
    id: toId(property), name: property.name || '', description: property.description || '', location: property.location || '', address: property.address || '',
    capacity: property.capacity ?? 0, bedrooms: property.bedrooms ?? 0, bathrooms: property.bathrooms ?? 0, daily_price: property.daily_price ?? 0,
    weekly_price: property.weekly_price ?? 0, monthly_price: property.monthly_price ?? 0, security_deposit: property.security_deposit ?? 0,
    cleaning_fee: property.cleaning_fee ?? 0, status: property.status || 'available', amenities: property.amenities || [], rules: property.rules || {},
    cover_photo: property.cover_photo || '', gallery: property.gallery || [], is_approved: Boolean(property.is_approved), created_at: toIsoDateTime(property.createdAt || property.created_at),
  };
}

export function mapPropertyToApi(property: Partial<Property>): ApiRecord {
  const payload: ApiRecord = {
    name: property.name?.trim() || '',
    description: property.description?.trim() || 'A beautiful rental property with modern amenities.',
    location: property.location?.trim() || '',
    address: property.address?.trim() || property.location?.trim() || '123 Main Street',
    capacity: Math.max(1, Math.round(Number(property.capacity) || 1)),
    bedrooms: Math.max(1, Math.round(Number(property.bedrooms) || 1)),
    bathrooms: Math.max(1, Math.round(Number(property.bathrooms) || 1)),
    daily_price: Math.max(0, Number(property.daily_price) || 0),
    weekly_price: Math.max(0, Number(property.weekly_price) || 0),
    monthly_price: Math.max(0, Number(property.monthly_price) || 0),
    security_deposit: Math.max(0, Number(property.security_deposit) || 0),
    cleaning_fee: Math.max(0, Number(property.cleaning_fee) || 0),
    status: property.status || 'available',
    amenities: property.amenities || [],
    cover_photo: property.cover_photo || '',
    gallery: property.gallery || (property.cover_photo ? [property.cover_photo] : []),
    rules: property.rules || { smoking: false, pets: false, parties: false, checkin: '2:00 PM', checkout: '11:00 AM' },
  };
  return payload;
}

export function mapBookingFromApi(value: unknown): Booking {
  const booking = (value || {}) as ApiRecord;
  return {
    id: toId(booking), property_id: toId(booking.property), property_name: booking.property_name || booking.property?.name || '', property_cover: booking.property_cover || booking.property?.cover_photo || '',
    guest_id: toId(booking.guest), guest_name: booking.guest_name || booking.guest?.full_name || '', guest_email: booking.guest_email || booking.guest?.email || '', guest_phone: booking.guest_phone || booking.guest?.phone || '',
    check_in: toIsoDate(booking.check_in), check_out: toIsoDate(booking.check_out), status: BOOKING_STATUS_FROM_API[booking.status] || booking.status || 'pending',
    total_amount: booking.total_amount ?? 0, advance_paid: booking.advance_paid ?? 0, balance_due: booking.balance_due ?? 0, num_guests: booking.num_guests ?? 1,
    vehicle_number: booking.vehicle_number || '', id_proof_type: booking.id_proof_type || '', id_proof_number: booking.id_proof_number || '', notes: booking.notes || '', created_at: toIsoDateTime(booking.createdAt || booking.created_at),
  };
}

export function mapBookingToApi(booking: Partial<Booking>): ApiRecord {
  const payload: ApiRecord = {
    property: booking.property_id, check_in: booking.check_in, check_out: booking.check_out, num_guests: booking.num_guests,
    total_amount: booking.total_amount, advance_paid: booking.advance_paid, vehicle_number: booking.vehicle_number,
    id_proof_type: booking.id_proof_type, id_proof_number: booking.id_proof_number, notes: booking.notes,
  };
  if (booking.guest_name) payload.guest_name = booking.guest_name;
  if (booking.guest_email) payload.guest_email = booking.guest_email;
  if (booking.guest_phone) payload.guest_phone = booking.guest_phone;
  if (booking.status) payload.status = BOOKING_STATUS_TO_API[booking.status] || booking.status;
  return payload;
}

export function mapPaymentFromApi(value: unknown): Payment {
  const payment = (value || {}) as ApiRecord;
  return {
    id: toId(payment), booking_id: toId(payment.booking), guest_name: payment.guest_name || payment.user?.full_name || '', property_name: payment.property_name || payment.property?.name || '',
    type: payment.type || 'advance', amount: payment.amount ?? 0, method: PAYMENT_METHOD_FROM_API[payment.method] || payment.method || 'upi', status: PAYMENT_STATUS_FROM_API[payment.status] || payment.status || 'pending',
    receipt_number: payment.receipt_number || '', notes: payment.notes || '', created_at: toIsoDateTime(payment.createdAt || payment.created_at),
  };
}

export function mapNotificationFromApi(value: unknown): Notification {
  const notification = (value || {}) as ApiRecord;
  return { id: toId(notification), title: notification.title || '', message: notification.message || '', type: NOTIFICATION_TYPE_FROM_API[notification.type] || notification.type || 'info', is_read: Boolean(notification.is_read), created_at: toIsoDateTime(notification.createdAt || notification.created_at) };
}

export function deriveGuestsFromBookings(bookings: Booking[]): Guest[] {
  const guests = new Map<string, Guest>();
  bookings.forEach((booking) => {
    const key = booking.guest_email || booking.guest_id;
    if (!key) return;
    const guest = guests.get(key) || { id: booking.guest_id || key, name: booking.guest_name, email: booking.guest_email, phone: booking.guest_phone, address: '', total_bookings: 0, total_spent: 0, last_visit: null, is_blacklisted: false };
    guest.total_bookings += 1;
    if (booking.status !== 'cancelled') guest.total_spent += booking.advance_paid || 0;
    if (booking.check_out && (!guest.last_visit || booking.check_out > guest.last_visit)) guest.last_visit = booking.check_out;
    guests.set(key, guest);
  });
  return Array.from(guests.values());
}

export function buildRevenueData(revenueItems: Array<{ month?: string; _id?: { month?: string }; total?: number; revenue?: number }> = [], expenses: Expense[] = []): Array<{ month: string; revenue: number; expenses: number }> {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const expenseByMonth = expenses.reduce<Record<string, number>>((totals, expense) => { const key = expense.expense_date?.slice(0, 7); if (key) totals[key] = (totals[key] || 0) + expense.amount; return totals; }, {});
  return revenueItems.map((item) => { const monthKey = item.month || item._id?.month || ''; return { month: monthNames[Number(monthKey.split('-')[1]) - 1] || monthKey, revenue: item.total ?? item.revenue ?? 0, expenses: expenseByMonth[monthKey] || 0 }; });
}

export function buildOccupancyData(properties: Property[], bookings: Booking[]): Array<{ property: string; rate: number }> {
  return properties.map((property) => {
    const activeBookings = bookings.filter((booking) => booking.property_id === property.id && booking.status !== 'cancelled');
    const rate = property.status === 'occupied' ? 100 : property.status === 'reserved' ? 75 : property.status === 'available' && activeBookings.length ? 60 : 0;
    return { property: property.name, rate };
  });
}

export function buildBookingTrendData(bookings: Booking[]): Array<{ week: string; bookings: number }> {
  const now = new Date();
  return Array.from({ length: 8 }, (_, index) => {
    const weeksAgo = 7 - index;
    const start = new Date(now); start.setDate(now.getDate() - weeksAgo * 7);
    const end = new Date(start); end.setDate(start.getDate() + 7);
    return { week: `W${index + 1}`, bookings: bookings.filter((booking) => { const created = new Date(booking.created_at); return created >= start && created < end; }).length };
  });
}
