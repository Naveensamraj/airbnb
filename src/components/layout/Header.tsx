import { useState } from 'react';
import { Bell, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
}

export default function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const { notifications } = useData();
  const [showNotifs, setShowNotifs] = useState(false);
  const unread = notifications.filter(n => !n.is_read).length;

  const typeColor = (type: string) => {
    const m: Record<string, string> = {
      booking: 'bg-blue-100 text-blue-700',
      payment: 'bg-emerald-100 text-emerald-700',
      success: 'bg-green-100 text-green-700',
      warning: 'bg-amber-100 text-amber-700',
      error: 'bg-red-100 text-red-700',
      info: 'bg-slate-100 text-slate-700',
    };
    return m[type] ?? m.info;
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold text-slate-900 truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {unread}
                </span>
              )}
            </button>

            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 animate-fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                    <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 ${n.is_read ? 'opacity-60' : 'bg-blue-50/30'}`}>
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeColor(n.type)}`}>
                            {n.type}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-900">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.full_name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
