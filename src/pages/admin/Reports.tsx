import { BarChart2, TrendingUp, Download, BarChart } from 'lucide-react';
import { BarChart as BarChartComponent, HorizontalBar, LineChart } from '../../components/ui/Chart';
import { REVENUE_DATA, OCCUPANCY_DATA, BOOKING_TREND_DATA, BOOKINGS, PROPERTIES } from '../../lib/mockData';

export default function Reports() {
  const cancelledCount = BOOKINGS.filter(b => b.status === 'cancelled').length;
  const completedCount = BOOKINGS.filter(b => b.status === 'checked_out').length;
  const totalRevenue = REVENUE_DATA.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue YTD', value: `$${totalRevenue.toLocaleString()}`, color: 'text-emerald-700 bg-emerald-50' },
          { label: 'Avg. Occupancy', value: '74%', color: 'text-blue-700 bg-blue-50' },
          { label: 'Completed Stays', value: completedCount, color: 'text-slate-700 bg-slate-100' },
          { label: 'Cancellation Rate', value: `${Math.round((cancelledCount / BOOKINGS.length) * 100)}%`, color: 'text-red-700 bg-red-50' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`card p-4 ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm mt-1 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Monthly Revenue</p>
              <p className="text-xs text-slate-500">Income trend over 7 months</p>
            </div>
            <button className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
              <Download size={12} /> Export
            </button>
          </div>
          <LineChart
            data={REVENUE_DATA.map(d => ({ label: d.month, value: d.revenue }))}
            color="#10b981"
            height={140}
          />
        </div>

        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-900 mb-1">Booking Volume</p>
          <p className="text-xs text-slate-500 mb-4">Weekly booking count (last 8 weeks)</p>
          <BarChartComponent
            data={BOOKING_TREND_DATA.map(d => ({ label: d.week, value: d.bookings }))}
            color="#2563eb"
            height={140}
          />
        </div>
      </div>

      {/* Occupancy + Property performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-900 mb-1">Occupancy by Property</p>
          <p className="text-xs text-slate-500 mb-4">Average occupancy rate</p>
          <HorizontalBar
            data={OCCUPANCY_DATA.map(d => ({ label: d.property, value: d.rate }))}
            color="#2563eb"
            suffix="%"
          />
        </div>

        <div className="card p-5">
          <p className="text-sm font-semibold text-slate-900 mb-4">Booking Status Breakdown</p>
          {[
            { label: 'Confirmed', count: BOOKINGS.filter(b => b.status === 'confirmed').length, color: 'bg-emerald-500' },
            { label: 'Checked In', count: BOOKINGS.filter(b => b.status === 'checked_in').length, color: 'bg-blue-500' },
            { label: 'Checked Out', count: BOOKINGS.filter(b => b.status === 'checked_out').length, color: 'bg-slate-400' },
            { label: 'Pending', count: BOOKINGS.filter(b => ['pending','awaiting_payment','awaiting_approval'].includes(b.status)).length, color: 'bg-amber-500' },
            { label: 'Cancelled', count: cancelledCount, color: 'bg-red-500' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-3 mb-3">
              <div className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
              <span className="text-sm text-slate-600 flex-1">{label}</span>
              <span className="text-sm font-semibold text-slate-900">{count}</span>
              <div className="w-24 h-1.5 bg-slate-100 rounded-full">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${(count / BOOKINGS.length) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most booked properties */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-slate-900">Top Performing Properties</p>
          <button className="btn-secondary py-1.5 px-3 text-xs gap-1.5"><Download size={12} /> PDF</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">#</th>
                <th className="table-th">Property</th>
                <th className="table-th">Location</th>
                <th className="table-th">Bookings</th>
                <th className="table-th">Occupancy</th>
                <th className="table-th">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PROPERTIES.filter(h => h.is_approved).map((h, i) => {
                const bookingCount = BOOKINGS.filter(b => b.property_id === h.id).length;
                const occ = OCCUPANCY_DATA.find(o => o.property.includes(h.name.split(' ')[0]))?.rate ?? 0;
                const rev = BOOKINGS.filter(b => b.property_id === h.id && b.status !== 'cancelled')
                  .reduce((s, b) => s + b.advance_paid, 0);
                return (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="table-td">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'
                      }`}>{i + 1}</span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <img src={h.cover_photo} alt="" className="w-9 h-9 rounded-lg object-cover" />
                        <span className="font-medium text-slate-900">{h.name}</span>
                      </div>
                    </td>
                    <td className="table-td text-slate-500 text-xs">{h.location}</td>
                    <td className="table-td font-medium">{bookingCount}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${occ}%` }} />
                        </div>
                        <span className="text-xs font-medium">{occ}%</span>
                      </div>
                    </td>
                    <td className="table-td font-semibold text-emerald-700">${rev.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
