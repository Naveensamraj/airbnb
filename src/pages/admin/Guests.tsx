import { useState } from 'react';
import { Search, Eye, Ban, Mail, Phone, MapPin, BookOpen, DollarSign } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { GUESTS, BOOKINGS } from '../../lib/mockData';
import { bookingStatusBadge } from '../../components/ui/Badge';

export default function Guests() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof GUESTS[0] | null>(null);

  const filtered = GUESTS.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.email.toLowerCase().includes(search.toLowerCase()) ||
    g.phone.includes(search)
  );

  const guestBookings = selected ? BOOKINGS.filter(b => b.guest_id === selected.id) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or phone..."
            className="input pl-9 w-full" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Guest</th>
                <th className="table-th">Contact</th>
                <th className="table-th">Bookings</th>
                <th className="table-th">Total Spent</th>
                <th className="table-th">Last Visit</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(g => {
                const initials = g.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                return (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-semibold flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{g.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{g.id.slice(0, 10)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <p className="text-xs flex items-center gap-1 text-slate-600"><Mail size={11} />{g.email}</p>
                      <p className="text-xs flex items-center gap-1 text-slate-500 mt-0.5"><Phone size={11} />{g.phone}</p>
                    </td>
                    <td className="table-td">
                      <span className="flex items-center gap-1 font-medium">
                        <BookOpen size={13} className="text-slate-400" />{g.total_bookings}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <DollarSign size={13} />{g.total_spent.toLocaleString()}
                      </span>
                    </td>
                    <td className="table-td">
                      <p className="text-xs">{g.last_visit ?? <span className="text-slate-400">Never</span>}</p>
                    </td>
                    <td className="table-td">
                      {g.is_blacklisted
                        ? <Badge label="Blacklisted" variant="error" dot />
                        : <Badge label="Active" variant="success" dot />}
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1.5">
                        <button onClick={() => setSelected(g)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
                          <Ban size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guest detail modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Guest Profile" size="lg">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-2xl font-bold">
                {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{selected.name}</p>
                <p className="text-sm text-slate-500">ID: {selected.id}</p>
                {selected.is_blacklisted && <Badge label="Blacklisted" variant="error" />}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600"><Mail size={14} />{selected.email}</div>
              <div className="flex items-center gap-2 text-slate-600"><Phone size={14} />{selected.phone}</div>
              <div className="flex items-center gap-2 text-slate-600"><MapPin size={14} />{selected.address}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-700">{selected.total_bookings}</p>
                <p className="text-xs text-blue-600 mt-0.5">Total Bookings</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-emerald-700">${selected.total_spent.toLocaleString()}</p>
                <p className="text-xs text-emerald-600 mt-0.5">Total Spent</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-700">{selected.last_visit ?? 'N/A'}</p>
                <p className="text-xs text-amber-600 mt-0.5">Last Visit</p>
              </div>
            </div>
            {guestBookings.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Booking History</p>
                <div className="space-y-2">
                  {guestBookings.map(b => (
                    <div key={b.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                      <img src={b.property_cover} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{b.property_name}</p>
                        <p className="text-xs text-slate-500">{b.check_in} → {b.check_out}</p>
                      </div>
                      <div className="text-right">
                        {bookingStatusBadge(b.status)}
                        <p className="text-xs font-semibold text-slate-900 mt-1">${b.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button className="btn-danger flex-1 justify-center"><Ban size={15} /> Blacklist Guest</button>
              <button className="btn-secondary flex-1 justify-center"><Mail size={15} /> Send Message</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
