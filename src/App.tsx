import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import Properties from './pages/admin/Properties';
import Bookings from './pages/admin/Bookings';
import Guests from './pages/admin/Guests';
import Finance from './pages/admin/Finance';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

// Guest pages
import GuestHome from './pages/guest/GuestHome';
import MyBookings from './pages/guest/MyBookings';
import GuestPayments from './pages/guest/GuestPayments';
import GuestNotifications from './pages/guest/GuestNotifications';
import GuestProfile from './pages/guest/GuestProfile';

interface PageConfig {
  title: string;
  subtitle?: string;
  component: React.ComponentType;
}

const ADMIN_PAGES: Record<string, PageConfig> = {
  dashboard: { title: 'Admin Dashboard', subtitle: 'Overview of your rental system', component: AdminDashboard },
  properties: { title: 'Property Management', subtitle: 'Manage all rental properties', component: Properties },
  bookings: { title: 'Bookings', subtitle: 'Track and manage all bookings', component: Bookings },
  guests: { title: 'Guest Management', subtitle: 'View and manage guest records', component: Guests },
  finance: { title: 'Finance', subtitle: 'Track income, expenses, and profit', component: Finance },
  reports: { title: 'Reports', subtitle: 'Analytics and performance insights', component: Reports },
  settings: { title: 'Settings', subtitle: 'Configure system preferences', component: Settings },
};

const GUEST_PAGES: Record<string, PageConfig> = {
  browse: { title: 'Browse Properties', subtitle: 'Find your perfect rental', component: GuestHome },
  bookings: { title: 'My Bookings', subtitle: 'View and manage your bookings', component: MyBookings },
  payments: { title: 'Payments', subtitle: 'Payment history and receipts', component: GuestPayments },
  notifications: { title: 'Notifications', subtitle: 'Stay updated on your bookings', component: GuestNotifications },
  profile: { title: 'My Profile', subtitle: 'Manage your account', component: GuestProfile },
};

const DEFAULT_VIEWS = { admin: 'dashboard', guest: 'browse' };

function AppContent() {
  const { user, role, isLoading } = useAuth();
  const [view, setView] = useState<string>('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !role) {
    return <Login />;
  }

  const activeView = view || DEFAULT_VIEWS[role];
  const pages = role === 'admin' ? ADMIN_PAGES : GUEST_PAGES;
  const page = pages[activeView] ?? Object.values(pages)[0];
  const PageComponent = page.component;

  return (
    <DashboardLayout
      title={page.title}
      subtitle={page.subtitle}
      activeView={activeView}
      onNavigate={(v) => setView(v)}
    >
      <PageComponent />
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
