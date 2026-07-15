import { useState } from 'react';
import { Search, Eye, CheckCircle, XCircle, Calendar, Users, Download, FileText } from 'lucide-react';
import { bookingStatusBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { BOOKINGS } from '../../lib/mockData';
import { Booking } from '../../lib/types';
import { generateBookingPDF, generateAllBookingsPDF } from '../../lib/pdf';

const STATUS_TABS = ['all', 'pending', 'awaiting_approval', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];

export default function Bookings() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState<Booking | null>(null);

  const filtered = BOOKINGS.filter(b => {
    const matchSearch =
      b.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      b.property_name.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'all' || b.status === tab;
    return matchSearch && matchTab;
  });

  const nights = (b: Booking) => {
    const d1 = new Date(b.check_in);
    const d2 = new Date(b.check_out);
    return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by guest, property, or ID..."
            className="input pl-9 w-full" />
        </div>
        <button onClick={() => generateAllBookingsPDF(filtered)}
          className="btn-primary flex-shrink-0 flex items-center gap-2">
          <Download size={15} /> Download All PDF
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map(s => {
          const count = s === 'all' ? BOOKINGS.length : BOOKINGS.filter(b => b.status === s).length;
          return (
            <button key={s} onClick={() => setTab(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              <span className={`ml-1.5 ${tab === s ? 'opacity-70' : 'text-slate-400'}`}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Booking ID</th>
                <th className="table-th">Guest</th>
                <th className="table-th">Property</th>
                <th className="table-th">Dates</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td">
                    <span className="font-mono text-xs font-medium text-slate-900">{b.id}</span>
                  </td>
                  <td className="table-td">
                    <div>
                      <p className="font-medium text-slate-900">{b.guest_name}</p>
                      <p className="text-xs text-slate-500">{b.guest_email}</p>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <img src={b.property_cover} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-900 text-xs">{b.property_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar size={12} className="text-slate-400" />
                      <span>{b.check_in}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{nights(b)} nights · {b.num_guests} guests</div>
                  </td>
                  <td className="table-td">
                    <p className="font-semibold text-slate-900">${b.total_amount.toLocaleString()}</p>
                    {b.balance_due > 0 && (
                      <p className="text-[11px] text-red-500">Due: ${b.balance_due.toLocaleString()}</p>
                    )}
                  </td>
                  <td className="table-td">{bookingStatusBadge(b.status)}</td>
                  <td className="table-td">
                    <div className="flex gap-1.5">
                      <button onClick={() => setSelected(b)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => generateBookingPDF(b)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors" title="Download PDF">
                        <FileText size={14} />
                      </button>
                      {b.status === 'awaiting_approval' && (
                        <>
                          <button className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors">
                            <CheckCircle size={14} />
                          </button>
                          <button className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors">
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">No bookings found.</div>
          )}
        </div>
      </div>

      {/* Booking detail modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Booking ${selected.id}`} size="lg">
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <img src={selected.property_cover} alt="" className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <p className="font-semibold text-slate-900">{selected.property_name}</p>
                <div className="mt-1">{bookingStatusBadge(selected.status)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">Guest</p>
                <p className="font-medium">{selected.guest_name}</p>
                <p className="text-slate-500">{selected.guest_email}</p>
                <p className="text-slate-500">{selected.guest_phone}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">Stay Details</p>
                <p><span className="text-slate-500">Check-in:</span> <span className="font-medium">{selected.check_in}</span></p>
                <p><span className="text-slate-500">Check-out:</span> <span className="font-medium">{selected.check_out}</span></p>
                <p><span className="text-slate-500">Guests:</span> <span className="font-medium">{selected.num_guests}</span></p>
                {selected.vehicle_number && <p><span className="text-slate-500">Vehicle:</span> <span className="font-medium">{selected.vehicle_number}</span></p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">ID Proof</p>
                <p><span className="text-slate-500">Type:</span> <span className="font-medium">{selected.id_proof_type}</span></p>
                <p><span className="text-slate-500">Number:</span> <span className="font-mono font-medium">{selected.id_proof_number}</span></p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Payment Summary</p>
              <div className="flex justify-between"><span className="text-slate-500">Total Amount</span><span className="font-semibold">${selected.total_amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Advance Paid</span><span className="text-emerald-600 font-medium">${selected.advance_paid.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-1"><span className="font-medium">Balance Due</span><span className={`font-bold ${selected.balance_due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>${selected.balance_due.toLocaleString()}</span></div>
            </div>
            {selected.notes && <p className="text-sm text-slate-600 italic">"{selected.notes}"</p>}
            {selected.status === 'awaiting_approval' && (
              <div className="flex gap-2">
                <button className="btn-primary flex-1 justify-center"><CheckCircle size={15} /> Approve Booking</button>
                <button className="btn-danger flex-1 justify-center"><XCircle size={15} /> Reject</button>
              </div>
            )}
            <button onClick={() => generateBookingPDF(selected)}
              className="btn-secondary w-full justify-center">
              <Download size={15} /> Download PDF Report
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
