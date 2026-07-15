import { Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { NOTIFICATIONS } from '../../lib/mockData';

const TYPE_COLORS: Record<string, string> = {
  booking: 'bg-blue-100 text-blue-700',
  payment: 'bg-emerald-100 text-emerald-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-slate-100 text-slate-700',
};

export default function GuestNotifications() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, is_read: true })));
  const markRead = (id: string) => setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-slate-600" />
          <p className="text-sm text-slate-500">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      <div className="card divide-y divide-slate-100">
        {notifs.map(n => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`flex gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}
          >
            <span className={`mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded h-fit ${TYPE_COLORS[n.type] ?? 'bg-slate-100 text-slate-600'}`}>
              {n.type}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">{n.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
              <p className="text-[11px] text-slate-400 mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
          </div>
        ))}
        {notifs.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">No notifications yet.</div>
        )}
      </div>
    </div>
  );
}
