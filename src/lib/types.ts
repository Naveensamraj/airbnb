export type UserRole = 'admin';

export const CURRENCY = '€';

export function formatMoney(n: number): string {
  return `${CURRENCY}${n.toLocaleString()}`;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  avatar_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Property {
  id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  daily_price: number;
  weekly_price: number;
  monthly_price: number;
  security_deposit: number;
  cleaning_fee: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  amenities: string[];
  rules: Record<string, string | boolean>;
  cover_photo: string;
  gallery: string[];
  is_approved: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  property_id: string;
  property_name: string;
  property_cover: string;
  guest_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  total_amount: number;
  advance_paid: number;
  balance_due: number;
  num_guests: number;
  id_proof_type: string;
  id_proof_number: string;
  id_proof_file?: string;
  id_proof_mime_type?: string;
  id_proof_original_name?: string;
  id_proof_size?: number;
  notes: string;
  created_at: string;
}

export type BookingStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'awaiting_approval'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'refunded';

export interface Payment {
  id: string;
  booking_id: string;
  guest_name: string;
  property_name: string;
  type: 'advance' | 'balance' | 'deposit' | 'refund' | 'penalty' | 'damage' | 'extra';
  amount: number;
  method: 'cash' | 'upi' | 'card' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  receipt_number: string;
  notes: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'maintenance'
  | 'electricity'
  | 'water'
  | 'cleaning'
  | 'repairs'
  | 'salary'
  | 'misc'
  | 'other';

export interface Expense {
  id: string;
  property_id: string;
  property_name: string;
  category: ExpenseCategory | string;
  custom_category?: string | null;
  customCategory?: string | null;
  amount: number;
  description: string;
  expense_date: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'booking' | 'payment';
  is_read: boolean;
  created_at: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  alt_phone?: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  avatar_url?: string;
  status?: 'active' | 'blacklisted' | 'inactive';
  is_blacklisted: boolean;

  id_proof_type?: string;
  id_proof_number?: string;
  id_proof_file?: string;
  id_proof_mime_type?: string;
  id_proof_original_name?: string;
  id_proof_size?: number;

  total_bookings: number;
  active_bookings?: number;
  completed_bookings?: number;
  cancelled_bookings?: number;
  pending_bookings?: number;
  last_booking_date?: string | null;
  last_check_in?: string | null;
  last_check_out?: string | null;
  total_nights_stayed?: number;
  favourite_property?: string;

  total_paid?: number;
  pending_amount?: number;
  advance_paid?: number;
  refund_amount?: number;
  outstanding_balance?: number;
  preferred_payment_method?: string;
  last_payment_date?: string | null;

  total_spent: number;
  avg_booking_value?: number;
  avg_stay_duration?: number;
  lifetime_since?: string;
  last_visit: string | null;

  guest_notes?: string;
  admin_notes?: string;

  created_at?: string;
  updated_at?: string;
}

export interface DemoUser {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string;
  address: string;
}
