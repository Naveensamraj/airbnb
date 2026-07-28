import { useState, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useData } from '../../context/DataContext';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  activeView: string;
  onNavigate: (view: string) => void;
}

export default function DashboardLayout({ children, title, subtitle, activeView, onNavigate }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading, error, refreshData } = useData();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        activeView={activeView}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-slide-up">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-700 text-xs font-medium">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => refreshData()}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors flex-shrink-0"
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
              <span className="text-sm font-medium">Loading data...</span>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
