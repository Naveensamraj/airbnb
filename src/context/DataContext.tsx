import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Property, Booking, Guest, Payment, Expense, Notification,
} from '../lib/types';
import { useAuth } from './AuthContext';
import * as propertyService from '../services/propertyService';
import * as bookingService from '../services/bookingService';
import * as paymentService from '../services/paymentService';
import * as notificationService from '../services/notificationService';
import * as dashboardService from '../services/dashboardService';
import {
  deriveGuestsFromBookings,
  buildRevenueData,
  buildOccupancyData,
  buildBookingTrendData,
} from '../services/mappers';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  pendingApprovals: number;
  occupiedProperties: number;
  availableProperties: number;
}

interface RevenuePoint {
  month: string;
  revenue: number;
  expenses: number;
}

interface OccupancyPoint {
  property: string;
  rate: number;
}

interface BookingTrendPoint {
  week: string;
  bookings: number;
}

interface DataContextValue {
  properties: Property[];
  bookings: Booking[];
  guests: Guest[];
  payments: Payment[];
  expenses: Expense[];
  notifications: Notification[];
  dashboardStats: DashboardStats | null;
  revenueData: RevenuePoint[];
  occupancyData: OccupancyPoint[];
  bookingTrendData: BookingTrendPoint[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;

  addProperty: (p: Omit<Property, 'id' | 'created_at'>) => Promise<void>;
  updateProperty: (id: string, p: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  approveProperty: (id: string) => Promise<void>;

  addBooking: (b: Omit<Booking, 'id' | 'created_at'>) => Promise<void>;
  updateBooking: (id: string, b: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  approveBooking: (id: string) => Promise<void>;
  rejectBooking: (id: string) => Promise<void>;

  addGuest: (g: Omit<Guest, 'id' | 'total_bookings' | 'total_spent' | 'last_visit' | 'is_blacklisted'>) => void;
  updateGuest: (id: string, g: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  toggleBlacklist: (id: string) => void;

  addPayment: (payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;

  addExpense: (e: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guestOverrides, setGuestOverrides] = useState<Guest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<Array<{ month: string; total: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const derivedGuests = useMemo(
    () => deriveGuestsFromBookings(bookings),
    [bookings],
  );

  const guests = useMemo(() => {
    const merged = new Map<string, Guest>();

    derivedGuests.forEach((guest) => {
      merged.set(guest.email || guest.id, guest);
    });

    guestOverrides.forEach((guest) => {
      const key = guest.email || guest.id;
      const existing = merged.get(key);
      merged.set(key, existing ? { ...existing, ...guest } : guest);
    });

    return Array.from(merged.values());
  }, [derivedGuests, guestOverrides]);

  const revenueData = useMemo(
    () => buildRevenueData(monthlyRevenue, expenses),
    [monthlyRevenue, expenses],
  );

  const occupancyData = useMemo(
    () => buildOccupancyData(properties, bookings),
    [properties, bookings],
  );

  const bookingTrendData = useMemo(
    () => buildBookingTrendData(bookings),
    [bookings],
  );

  const refreshData = useCallback(async () => {
    try {
      const [
        nextProperties,
        nextBookings,
        nextPayments,
        nextNotifications,
        dashboard,
        revenue,
      ] = await Promise.all([
        propertyService.getProperties().catch(() => []),
        bookingService.getBookings().catch(() => []),
        paymentService.getPayments().catch(() => []),
        notificationService.getNotifications().catch(() => []),
        dashboardService.getDashboard().catch(() => ({ stats: null, monthlyRevenue: [] })),
        dashboardService.getDashboardRevenue().catch(() => []),
      ]);

      setProperties(nextProperties);
      setBookings(nextBookings);
      setPayments(nextPayments);
      setNotifications(nextNotifications);
      if (dashboard?.stats) setDashboardStats(dashboard.stats);
      if (Array.isArray(revenue) && revenue.length) {
        setMonthlyRevenue(revenue);
      } else if (dashboard?.monthlyRevenue) {
        setMonthlyRevenue(dashboard.monthlyRevenue);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }
    refreshData();
  }, [authLoading, user?.id, refreshData]);

  const addProperty = useCallback(async (p: Omit<Property, 'id' | 'created_at'>) => {
    try {
      setError(null);
      const created = await propertyService.createProperty(p);
      setProperties((prev) => [...prev, created]);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create property');
      throw err;
    }
  }, [refreshData]);

  const updateProperty = useCallback(async (id: string, patch: Partial<Property>) => {
    try {
      setError(null);
      const current = properties.find((item) => item.id === id);
      if (!current) return;
      const updated = await propertyService.updateProperty(id, { ...current, ...patch });
      setProperties((prev) => prev.map((item) => (item.id === id ? updated : item)));
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property');
      throw err;
    }
  }, [properties, refreshData]);

  const deleteProperty = useCallback(async (id: string) => {
    try {
      setError(null);
      await propertyService.deleteProperty(id);
      setProperties((prev) => prev.filter((item) => item.id !== id));
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete property');
      throw err;
    }
  }, [refreshData]);

  const approveProperty = useCallback(async (id: string) => {
    try {
      setError(null);
      const updated = await propertyService.approveProperty(id, true);
      setProperties((prev) => prev.map((item) => (item.id === id ? updated : item)));
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve property');
      throw err;
    }
  }, [refreshData]);

  const addBooking = useCallback(async (b: Omit<Booking, 'id' | 'created_at'>) => {
    try {
      setError(null);
      const created = await bookingService.createBooking(b);
      setBookings((prev) => [created, ...prev]);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      throw err;
    }
  }, [refreshData]);

  const updateBooking = useCallback(async (id: string, patch: Partial<Booking>) => {
    try {
      setError(null);
      const current = bookings.find((item) => item.id === id);
      if (!current) return;

      let updated = current;
      if (patch.status && patch.status !== current.status) {
        updated = await bookingService.updateBookingStatus(id, patch.status);
      }

      const hasOtherChanges = Object.keys(patch).some(
        (key) => key !== 'status' && patch[key as keyof Booking] !== current[key as keyof Booking]
      );

      if (hasOtherChanges) {
        updated = await bookingService.updateBooking(id, { ...current, ...patch });
      }

      setBookings((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated, ...patch } : item)));
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
      throw err;
    }
  }, [bookings, refreshData]);

  const deleteBooking = useCallback(async (id: string) => {
    try {
      setError(null);
      await bookingService.deleteBooking(id);
      setBookings((prev) => prev.filter((item) => item.id !== id));
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete booking');
      throw err;
    }
  }, [refreshData]);

  const approveBooking = useCallback(async (id: string) => {
    try {
      setError(null);
      const updated = await bookingService.approveBooking(id);
      setBookings((prev) => prev.map((item) => (item.id === id ? updated : item)));
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve booking');
      throw err;
    }
  }, [refreshData]);

  const rejectBooking = useCallback(async (id: string) => {
    try {
      setError(null);
      const updated = await bookingService.rejectBooking(id);
      setBookings((prev) => prev.map((item) => (item.id === id ? updated : item)));
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject booking');
      throw err;
    }
  }, [refreshData]);

  const addGuest = useCallback((g: Omit<Guest, 'id' | 'total_bookings' | 'total_spent' | 'last_visit' | 'is_blacklisted'>) => {
    const ng: Guest = {
      ...g,
      id: uid('guest'),
      total_bookings: 0,
      total_spent: 0,
      last_visit: null,
      is_blacklisted: false,
    };
    setGuestOverrides((prev) => [...prev, ng]);
  }, []);

  const updateGuest = useCallback((id: string, patch: Partial<Guest>) => {
    setGuestOverrides((prev) => {
      const existing = prev.find((guest) => guest.id === id);
      if (existing) {
        return prev.map((guest) => (guest.id === id ? { ...guest, ...patch } : guest));
      }
      const derived = derivedGuests.find((guest) => guest.id === id);
      if (derived) {
        return [...prev, { ...derived, ...patch }];
      }
      return prev;
    });
  }, [derivedGuests]);

  const deleteGuest = useCallback((id: string) => {
    setGuestOverrides((prev) => prev.filter((guest) => guest.id !== id));
  }, []);

  const toggleBlacklist = useCallback((id: string) => {
    setGuestOverrides((prev) => {
      const existing = prev.find((guest) => guest.id === id);
      if (existing) {
        return prev.map((guest) => (
          guest.id === id ? { ...guest, is_blacklisted: !guest.is_blacklisted } : guest
        ));
      }
      const derived = derivedGuests.find((guest) => guest.id === id);
      if (derived) {
        return [...prev, { ...derived, is_blacklisted: !derived.is_blacklisted }];
      }
      return prev;
    });
  }, [derivedGuests]);

  const addPayment = useCallback(async (payment: Partial<Payment>) => {
    try {
      setError(null);
      const created = await paymentService.createPayment(payment);
      setPayments((prev) => [created, ...prev]);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment');
      throw err;
    }
  }, [refreshData]);

  const deletePayment = useCallback(async (id: string) => {
    try {
      setError(null);
      await paymentService.deletePayment(id);
      setPayments((prev) => prev.filter((item) => item.id !== id));
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment');
      throw err;
    }
  }, [refreshData]);

  const addExpense = useCallback((e: Omit<Expense, 'id'>) => {
    setExpenses((prev) => [{ ...e, id: uid('exp') }, ...prev]);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      setError(null);
      const updated = await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      setError(null);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      setError(null);
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, []);

  return (
    <DataContext.Provider value={{
      properties,
      bookings,
      guests,
      payments,
      expenses,
      notifications,
      dashboardStats,
      revenueData,
      occupancyData,
      bookingTrendData,
      isLoading,
      error,
      refreshData,
      addProperty,
      updateProperty,
      deleteProperty,
      approveProperty,
      addBooking,
      updateBooking,
      deleteBooking,
      approveBooking,
      rejectBooking,
      addGuest,
      updateGuest,
      deleteGuest,
      toggleBlacklist,
      addPayment,
      deletePayment,
      addExpense,
      deleteExpense,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
