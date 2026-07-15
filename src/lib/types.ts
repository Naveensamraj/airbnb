export type UserRole = 'admin' | 'guest';

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
  vehicle_number: string;
  id_proof_type: string;
  id_proof_number: string;
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

export interface Expense {
  id: string;
  property_id: string;
  property_name: string;
  category: 'maintenance' | 'electricity' | 'water' | 'cleaning' | 'repairs' | 'salary' | 'misc';
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

export interface DemoUser {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string;
  address: string;
}
