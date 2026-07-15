import {
  LayoutDashboard, Building2, Users, Wallet, BarChart3,
  Settings, LogOut, BookOpen, ChevronRight, Shield, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  label: string;
  icon: React.ElementType;
  view: string;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { label: 'Properties', icon: Building2, view: 'properties' },
  { label: 'Bookings', icon: BookOpen, view: 'bookings' },
  { label: 'Guests', icon: Users, view: 'guests' },
  { label: 'Finance', icon: Wallet, view: 'finance' },
  { label: 'Reports', icon: BarChart3, view: 'reports' },
  { label: 'Settings', icon: Settings, view: 'settings' },
];

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeView, onNavigate, isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '??';

  const handleNavigate = (view: string) => {
    onNavigate(view);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">StayPro</p>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Rental Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
            <Shield size={11} />
            Admin Portal
          </span>
        </div>

        <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
          {ADMIN_NAV.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleNavigate(item.view)}
                className={`sidebar-link w-full ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight size={14} className="opacity-70" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="sidebar-link sidebar-link-inactive w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
