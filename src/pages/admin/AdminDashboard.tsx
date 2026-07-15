import { Building2, BookOpen, Users, DollarSign, ArrowRightLeft, CalendarCheck, CalendarX, Clock } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import { BarChart, LineChart, HorizontalBar } from '../../components/ui/Chart';
import { bookingStatusBadge } from '../../components/ui/Badge';
import { BOOKINGS, REVENUE_DATA, OCCUPANCY_DATA, BOOKING_TREND_DATA, NOTIFICATIONS, PROPERTIES } from '../../lib/mockData';

export default function AdminDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const todayCheckins = BOOKINGS.filter(b => b.check_in === today).length;
  const todayCheckouts = BOOKINGS.filter(b => b.check_out === today).length;
  const pending = BOOKINGS.filter(b => ['pending', 'awaiting_approval', 'awaiting_payment'].includes(b.status)).length;
  const totalRevenue = REVENUE_DATA.reduce((s, d) => s + d.revenue, 0);

  const recentActivity = [
    ...NOTIFICATIONS.map(n => ({ ...n, time: new Date(n.created_at).toLocaleDateString() })),
  ].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Properties" value={PROPERTIES.length} icon={Building2} color="blue" />
        <StatCard title="Total Bookings" value={BOOKINGS.length} icon={BookOpen} trend={8} trendLabel="vs last month" color="emerald" />
        <StatCard title="Monthly Revenue" value={24500} icon={DollarSign} trend={18} trendLabel="vs last month" color="amber" prefix="$" />
        <StatCard title="Pending Approvals" value={pending} icon={Clock} color="red" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Properties" value={PROPERTIES.filter(p => p.status !== 'maintenance').length} icon={Building2} color="blue" />
        <StatCard title="Today's Check-ins" value={todayCheckins || 1} icon={CalendarCheck} color="emerald" />
        <StatCard title="Today's Check-outs" value={todayCheckouts || 2} icon={CalendarX} color="amber" />
        <StatCard title="Pending Payments" value={3} icon={ArrowRightLeft} color="red" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Revenue & Expenses</p>
              <p className="text-xs text-slate-500 mt-0.5">Last 7 months</p>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />Revenue
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />Expenses
              </span>
            </div>
          </div>
          <BarChart
            data={REVENUE_DATA.map(d => ({ label: d.month, value: d.revenue, value2: d.expenses }))}
            color="#2563eb"
            color2="#10b981"
            height={180}
          />
        </div>

        {/* Occupancy */}
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-900 mb-1">Occupancy Rate</p>
          <p className="text-xs text-slate-500 mb-4">By property</p>
          <HorizontalBar
            data={OCCUPANCY_DATA.map(d => ({ label: d.property, value: d.rate }))}
            color="#2563eb"
            suffix="%"
          />
        </div>
      </div>

      {/* Booking trend + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-900 mb-1">Booking Trend</p>
          <p className="text-xs text-slate-500 mb-2">Last 8 weeks</p>
          <LineChart
            data={BOOKING_TREND_DATA.map(d => ({ label: d.week, value: d.bookings }))}
            color="#2563eb"
            height={110}
          />
        </div>

        <div className="card p-5 lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900 mb-4">Recent Bookings</p>
          <div className="space-y-2">
            {BOOKINGS.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                <img src={b.property_cover} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{b.guest_name}</p>
                  <p className="text-xs text-slate-500 truncate">{b.property_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {bookingStatusBadge(b.status)}
                  <p className="text-xs text-slate-400 mt-1">${b.total_amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent notifications */}
      <div className="card p-5">
        <p className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</p>
        <div className="divide-y divide-slate-50">
          {recentActivity.map(n => (
            <div key={n.id} className={`flex gap-3 py-3 ${!n.is_read ? 'opacity-100' : 'opacity-60'}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                n.type === 'payment' ? 'bg-emerald-500' :
                n.type === 'booking' ? 'bg-blue-500' :
                n.type === 'warning' ? 'bg-amber-500' : 'bg-slate-400'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-500">{n.message}</p>
              </div>
              <p className="text-xs text-slate-400 flex-shrink-0">{n.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
