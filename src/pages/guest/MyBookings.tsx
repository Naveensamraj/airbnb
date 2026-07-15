import { useState } from 'react';
import { Calendar, MapPin, Users, XCircle, Eye } from 'lucide-react';
import { bookingStatusBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { BOOKINGS } from '../../lib/mockData';
import { Booking } from '../../lib/types';

const GUEST_ID = 'guest-001';

export default function MyBookings() {
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState<Booking | null>(null);

  const myBookings = BOOKINGS.filter(b => b.guest_id === GUEST_ID);
  const filtered = myBookings.filter(b => tab === 'all' || b.status === tab);

  const nights = (b: Booking) => {
    return Math.max(1, Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000));
  };

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Bookings', value: myBookings.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Active / Upcoming', value: myBookings.filter(b => ['confirmed','checked_in','awaiting_approval'].includes(b.status)).length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Total Spent', value: `$${myBookings.reduce((s, b) => s + b.advance_paid, 0).toLocaleString()}`, color: 'bg-amber-50 text-amber-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`card p-4 ${color}`}>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs mt-1 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {['all', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map(s => {
          const count = s === 'all' ? myBookings.length : myBookings.filter(b => b.status === s).length;
          return (
            <button key={s} onClick={() => setTab(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === s ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} ({count})
            </button>
          );
        })}
      </div>

      {/* Booking cards */}
      <div className="space-y-4">
        {filtered.map(b => (
          <div key={b.id} className="card overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-40 h-36 sm:h-auto flex-shrink-0 overflow-hidden">
                <img src={b.property_cover} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">{b.property_name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{b.id}</p>
                  </div>
                  {bookingStatusBadge(b.status)}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-600 mb-3">
                  <span className="flex items-center gap-1"><Calendar size={11} />{b.check_in} → {b.check_out}</span>
                  <span>{nights(b)} nights</span>
                  <span className="flex items-center gap-1"><Users size={11} />{b.num_guests} guests</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-base font-bold text-slate-900">${b.total_amount.toLocaleString()}</span>
                    {b.balance_due > 0 && <span className="text-xs text-red-500 ml-2">Balance: ${b.balance_due.toLocaleString()}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(b)} className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
                      <Eye size={13} /> View
                    </button>
                    {['confirmed', 'awaiting_approval', 'pending'].includes(b.status) && (
                      <button className="flex items-center gap-1.5 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium border border-red-200 transition-colors">
                        <XCircle size={13} /> Cancel
                      </button>
                    )}
                    {b.balance_due > 0 && b.status === 'confirmed' && (
                      <button className="btn-primary py-1.5 px-3 text-xs">Pay Balance</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm card">No bookings found.</div>
        )}
      </div>

      {/* Booking detail modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Booking ${selected.id}`} size="md">
          <div className="space-y-4">
            <img src={selected.property_cover} alt="" className="w-full h-36 object-cover rounded-xl" />
            <div>
              <p className="font-semibold text-slate-900 text-lg">{selected.property_name}</p>
              {bookingStatusBadge(selected.status)}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Check-in</span><span className="font-medium">{selected.check_in}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Check-out</span><span className="font-medium">{selected.check_out}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Duration</span><span className="font-medium">{nights(selected)} nights</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Guests</span><span className="font-medium">{selected.num_guests}</span></div>
              {selected.vehicle_number && <div className="flex justify-between"><span className="text-slate-500">Vehicle</span><span className="font-medium">{selected.vehicle_number}</span></div>}
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Total Amount</span><span className="font-semibold">${selected.total_amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Advance Paid</span><span className="text-emerald-600 font-medium">${selected.advance_paid.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold"><span>Balance Due</span><span className={selected.balance_due > 0 ? 'text-red-600' : 'text-emerald-600'}>${selected.balance_due.toLocaleString()}</span></div>
            </div>
            {selected.balance_due > 0 && (
              <button className="w-full btn-primary justify-center py-2.5">Pay Remaining Balance</button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
