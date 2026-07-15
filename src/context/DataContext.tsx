import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import {
  Property, Booking, Guest, Payment, Expense, Notification,
} from '../lib/types';
import {
  PROPERTIES, BOOKINGS, GUESTS, PAYMENTS, EXPENSES, NOTIFICATIONS,
} from '../lib/mockData';

interface DataContextValue {
  properties: Property[];
  bookings: Booking[];
  guests: Guest[];
  payments: Payment[];
  expenses: Expense[];
  notifications: Notification[];

  addProperty: (p: Omit<Property, 'id' | 'created_at'>) => void;
  updateProperty: (id: string, p: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  approveProperty: (id: string) => void;

  addBooking: (b: Omit<Booking, 'id' | 'created_at'>) => void;
  updateBooking: (id: string, b: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  approveBooking: (id: string) => void;
  rejectBooking: (id: string) => void;

  addGuest: (g: Omit<Guest, 'id' | 'total_bookings' | 'total_spent' | 'last_visit' | 'is_blacklisted'>) => void;
  updateGuest: (id: string, g: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  toggleBlacklist: (id: string) => void;

  addExpense: (e: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  markNotificationRead: (id: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS);
  const [guests, setGuests] = useState<Guest[]>(GUESTS);
  const [payments] = useState<Payment[]>(PAYMENTS);
  const [expenses, setExpenses] = useState<Expense[]>(EXPENSES);
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);

  const addProperty = useCallback((p: Omit<Property, 'id' | 'created_at'>) => {
    const np: Property = { ...p, id: uid('prop'), created_at: new Date().toISOString() };
    setProperties(prev => [...prev, np]);
  }, []);

  const updateProperty = useCallback((id: string, patch: Partial<Property>) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }, []);

  const deleteProperty = useCallback((id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  }, []);

  const approveProperty = useCallback((id: string) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, is_approved: true } : p));
  }, []);

  const addBooking = useCallback((b: Omit<Booking, 'id' | 'created_at'>) => {
    const nb: Booking = { ...b, id: uid('book'), created_at: new Date().toISOString() };
    setBookings(prev => [nb, ...prev]);
  }, []);

  const updateBooking = useCallback((id: string, patch: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }, []);

  const deleteBooking = useCallback((id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  }, []);

  const approveBooking = useCallback((id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' as const } : b));
  }, []);

  const rejectBooking = useCallback((id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b));
  }, []);

  const addGuest = useCallback((g: Omit<Guest, 'id' | 'total_bookings' | 'total_spent' | 'last_visit' | 'is_blacklisted'>) => {
    const ng: Guest = {
      ...g, id: uid('guest'),
      total_bookings: 0, total_spent: 0, last_visit: null, is_blacklisted: false,
    };
    setGuests(prev => [...prev, ng]);
  }, []);

  const updateGuest = useCallback((id: string, patch: Partial<Guest>) => {
    setGuests(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  }, []);

  const deleteGuest = useCallback((id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
  }, []);

  const toggleBlacklist = useCallback((id: string) => {
    setGuests(prev => prev.map(g => g.id === id ? { ...g, is_blacklisted: !g.is_blacklisted } : g));
  }, []);

  const addExpense = useCallback((e: Omit<Expense, 'id'>) => {
    setExpenses(prev => [{ ...e, id: uid('exp') }, ...prev]);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }, []);

  return (
    <DataContext.Provider value={{
      properties, bookings, guests, payments, expenses, notifications,
      addProperty, updateProperty, deleteProperty, approveProperty,
      addBooking, updateBooking, deleteBooking, approveBooking, rejectBooking,
      addGuest, updateGuest, deleteGuest, toggleBlacklist,
      addExpense, deleteExpense,
      markNotificationRead,
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
