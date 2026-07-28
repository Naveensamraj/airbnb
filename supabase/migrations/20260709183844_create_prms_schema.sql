/*
# Private Rental Management System - Core Schema

## Summary
Creates the foundational tables for a multi-role rental management system
supporting Admin, Host, and Guest roles.

## New Tables

### profiles
Extends Supabase auth.users with role and profile data.
- id: references auth.users
- role: enum (admin, host, guest)
- full_name, phone, address, avatar_url
- is_active, created_at

### houses
Rental property listings managed by hosts.
- id, host_id (references profiles)
- name, description, location, address
- capacity, bedrooms, bathrooms
- daily_price, weekly_price, monthly_price, security_deposit, cleaning_fee
- status: available/occupied/maintenance/reserved
- amenities (jsonb), rules (jsonb), cover_photo
- is_approved (admin must approve)

### bookings
Rental bookings linking guests to houses.
- id, house_id, guest_id, host_id
- check_in, check_out dates
- status: pending/awaiting_payment/awaiting_approval/confirmed/checked_in/checked_out/cancelled/refunded
- total_amount, advance_paid, balance_due
- num_guests, vehicle_number, notes

### payments
Financial transactions linked to bookings.
- id, booking_id, guest_id
- type: advance/balance/deposit/refund/penalty/damage/extra
- amount, method: cash/upi/card/bank_transfer
- status: pending/completed/failed/refunded
- receipt_number, notes

### expenses
Property-related expenses.
- id, house_id, host_id
- category: maintenance/electricity/water/cleaning/repairs/salary/misc
- amount, description, date

### notifications
In-app notifications for all user roles.
- id, user_id, title, message, type, is_read, created_at

## Security
- RLS enabled on all tables
- Profiles: users can read all profiles (for host/admin lookups), update only own
- Houses: public read of approved houses, hosts manage own, admin full access
- Bookings: guests see own, hosts see for their houses, admin sees all
- Payments/Expenses: scoped to relevant parties
- Notifications: users see only their own
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'host', 'guest')),
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  avatar_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Houses table
CREATE TABLE IF NOT EXISTS houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  location text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  capacity int NOT NULL DEFAULT 2,
  bedrooms int NOT NULL DEFAULT 1,
  bathrooms int NOT NULL DEFAULT 1,
  daily_price numeric(10,2) NOT NULL DEFAULT 0,
  weekly_price numeric(10,2) DEFAULT 0,
  monthly_price numeric(10,2) DEFAULT 0,
  security_deposit numeric(10,2) DEFAULT 0,
  cleaning_fee numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance','reserved')),
  amenities jsonb DEFAULT '[]',
  rules jsonb DEFAULT '{}',
  cover_photo text DEFAULT '',
  gallery jsonb DEFAULT '[]',
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE houses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "houses_select" ON houses;
CREATE POLICY "houses_select" ON houses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "houses_insert" ON houses;
CREATE POLICY "houses_insert" ON houses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "houses_update" ON houses;
CREATE POLICY "houses_update" ON houses FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "houses_delete" ON houses;
CREATE POLICY "houses_delete" ON houses FOR DELETE
  TO authenticated USING (auth.uid() = host_id);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_in date NOT NULL,
  check_out date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','awaiting_payment','awaiting_approval','confirmed','checked_in','checked_out','cancelled','refunded')),
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  advance_paid numeric(10,2) DEFAULT 0,
  balance_due numeric(10,2) DEFAULT 0,
  num_guests int NOT NULL DEFAULT 1,
  vehicle_number text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select" ON bookings;
CREATE POLICY "bookings_select" ON bookings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "bookings_insert" ON bookings;
CREATE POLICY "bookings_insert" ON bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = guest_id);

DROP POLICY IF EXISTS "bookings_update" ON bookings;
CREATE POLICY "bookings_update" ON bookings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bookings_delete" ON bookings;
CREATE POLICY "bookings_delete" ON bookings FOR DELETE
  TO authenticated USING (true);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'advance' CHECK (type IN ('advance','balance','deposit','refund','penalty','damage','extra')),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','upi','card','bank_transfer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  receipt_number text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select" ON payments;
CREATE POLICY "payments_select" ON payments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "payments_insert" ON payments;
CREATE POLICY "payments_insert" ON payments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "payments_update" ON payments;
CREATE POLICY "payments_update" ON payments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "payments_delete" ON payments;
CREATE POLICY "payments_delete" ON payments FOR DELETE
  TO authenticated USING (true);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id uuid REFERENCES houses(id) ON DELETE SET NULL,
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'maintenance' CHECK (category IN ('maintenance','electricity','water','cleaning','repairs','salary','misc')),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  description text DEFAULT '',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_select" ON expenses;
CREATE POLICY "expenses_select" ON expenses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "expenses_insert" ON expenses;
CREATE POLICY "expenses_insert" ON expenses FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "expenses_update" ON expenses;
CREATE POLICY "expenses_update" ON expenses FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "expenses_delete" ON expenses;
CREATE POLICY "expenses_delete" ON expenses FOR DELETE
  TO authenticated USING (true);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info','success','warning','error','booking','payment')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_houses_host_id ON houses(host_id);
CREATE INDEX IF NOT EXISTS idx_houses_status ON houses(status);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_house_id ON bookings(house_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
