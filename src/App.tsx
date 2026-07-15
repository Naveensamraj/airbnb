import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';

import AdminDashboard from './pages/admin/AdminDashboard';
import Properties from './pages/admin/Properties';
import Bookings from './pages/admin/Bookings';
import Guests from './pages/admin/Guests';
import Finance from './pages/admin/Finance';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

interface PageConfig {
  title: string;
  subtitle?: string;
  component: React.ComponentType;
}

const PAGES: Record<string, PageConfig> = {
  dashboard: { title: 'Admin Dashboard', subtitle: 'Overview of your rental system', component: AdminDashboard },
  properties: { title: 'Property Management', subtitle: 'Manage all rental properties', component: Properties },
  bookings: { title: 'Bookings', subtitle: 'Track and manage all bookings', component: Bookings },
  guests: { title: 'Guest Management', subtitle: 'View and manage guest records', component: Guests },
  finance: { title: 'Finance', subtitle: 'Track income, expenses, and profit', component: Finance },
  reports: { title: 'Reports', subtitle: 'Analytics and performance insights', component: Reports },
  settings: { title: 'Settings', subtitle: 'Configure system preferences', component: Settings },
};

function AppContent() {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<string>('dashboard');

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

  if (!user) {
    return <Login />;
  }

  const page = PAGES[view] ?? PAGES.dashboard;
  const PageComponent = page.component;

  return (
    <DataProvider>
      <DashboardLayout
        title={page.title}
        subtitle={page.subtitle}
        activeView={view}
        onNavigate={(v) => setView(v)}
      >
        <PageComponent />
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
