import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import DashboardLayout from './components/layout/DashboardLayout';

import AdminDashboard from './pages/admin/AdminDashboard';
import Properties from './pages/admin/Properties';
import Bookings from './pages/admin/Bookings';
import Guests from './pages/admin/Guests';
import Finance from './pages/admin/Finance';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import ReservationCalendar from './pages/admin/ReservationCalendar';

import Login from './pages/Login';

interface PageConfig {
  title: string;
  subtitle?: string;
  component: React.ComponentType;
}

const PAGES: Record<string, PageConfig> = {
  dashboard: { title: 'Admin Dashboard', subtitle: 'Overview of your rental system', component: AdminDashboard },
  properties: { title: 'Property Management', subtitle: 'Manage all rental properties', component: Properties },
  bookings: { title: 'Bookings', subtitle: 'Track and manage all bookings', component: Bookings },
  calendar: { title: 'Reservation Calendar', subtitle: 'Interactive Property Booking & Occupancy Schedule', component: ReservationCalendar },
  guests: { title: 'Guest Management', subtitle: 'View and manage guest records', component: Guests },
  finance: { title: 'Finance', subtitle: 'Track income, expenses, and profit', component: Finance },
  reports: { title: 'Reports', subtitle: 'Analytics and performance insights', component: Reports },
  settings: { title: 'Settings', subtitle: 'Configure system preferences', component: Settings },
};

function AppContent() {
  const { user, isLoading, error } = useAuth();
  const [view, setView] = useState<string>('dashboard');
  const page = PAGES[view] ?? PAGES.dashboard;
  const PageComponent = page.component;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading StayPro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <DataProvider>
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-700 text-center font-medium">
          {error}
        </div>
      )}
      <DashboardLayout
        title={page.title}
        subtitle={page.subtitle}
        activeView={view}
        onNavigate={(v) => setView(v)}
      >
        <PageComponent {...({ onNavigate: (v: string) => setView(v) } as any)} />
      </DashboardLayout>
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
