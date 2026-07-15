import { useState } from 'react';
import { Search, Eye, Ban, Mail, Phone, MapPin, BookOpen, Plus, Edit3, Trash2, Download, FileText } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';
import { Guest, CURRENCY } from '../../lib/types';
import jsPDF from 'jspdf';

const EMPTY_FORM = { name: '', email: '', phone: '', address: '' };
type FormState = typeof EMPTY_FORM;

const BRAND = '#2563eb';
const DARK = '#0f172a';
const MUTED = '#64748b';
const LIGHT = '#f1f5f9';

function generateGuestPDF(guest: Guest, bookings: { id: string; property_name: string; check_in: string; check_out: string; status: string; total_amount: number; id_proof_type: string; id_proof_number: string }[]) {
  const doc = new jsPDF();
  doc.setFillColor(BRAND);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Guest Report', 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Guest: ${guest.name} · ID: ${guest.id}`, 14, 20);
  doc.setTextColor(MUTED);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

  let y = 38;
  doc.setFillColor(LIGHT);
  doc.rect(14, y - 4, 182, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK);
  doc.text('GUEST INFORMATION', 16, y + 1);
  y += 8;

  const field = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text(label, 16, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    doc.text(value || '-', 70, y);
    y += 6;
  };

  field('Name:', guest.name);
  field('Email:', guest.email);
  field('Phone:', guest.phone);
  field('Address:', guest.address);
  field('Status:', guest.is_blacklisted ? 'Blacklisted' : 'Active');
  field('Total Bookings:', String(guest.total_bookings));
  field('Total Spent:', `${CURRENCY}${guest.total_spent.toLocaleString()}`);
  field('Last Visit:', guest.last_visit ?? 'Never');
  y += 3;

  if (bookings.length > 0) {
    doc.setFillColor(LIGHT);
    doc.rect(14, y - 4, 182, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DARK);
    doc.text('BOOKING HISTORY & ID PROOF', 16, y + 1);
    y += 8;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(BRAND);
    doc.rect(14, y - 4, 182, 7, 'F');
    doc.setTextColor('#ffffff');
    doc.text('Property', 16, y);
    doc.text('Check-in', 80, y);
    doc.text('Check-out', 105, y);
    doc.text('ID Type', 130, y);
    doc.text('ID Number', 155, y);
    doc.text('Amount', 185, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    bookings.forEach((b, i) => {
      if (y > 275) { doc.addPage(); y = 20; }
      if (i % 2 === 1) { doc.setFillColor(LIGHT); doc.rect(14, y - 4, 182, 6, 'F'); }
      doc.setTextColor(DARK);
      doc.text(b.property_name.slice(0, 25), 16, y);
      doc.text(b.check_in, 80, y);
      doc.text(b.check_out, 105, y);
      doc.text(b.id_proof_type, 130, y);
      doc.text(b.id_proof_number, 155, y);
      doc.text(`${CURRENCY}${b.total_amount.toLocaleString()}`, 185, y);
      y += 6;
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(230);
    doc.line(14, 285, 196, 285);
    doc.setFontSize(7);
    doc.setTextColor(MUTED);
    doc.text('StayPro - Property Rental Management', 14, 290);
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: 'right' });
  }

  doc.save(`guest-${guest.id}.pdf`);
}

export default function Guests() {
  const { guests, bookings, addGuest, updateGuest, deleteGuest, toggleBlacklist } = useData();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Guest | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);

  const filtered = guests.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.email.toLowerCase().includes(search.toLowerCase()) ||
    g.phone.includes(search)
  );

  const guestBookings = selected ? bookings.filter(b => b.guest_id === selected.id) : [];

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowFormModal(true);
  };

  const openEdit = (g: Guest) => {
    setForm({ name: g.name, email: g.email, phone: g.phone, address: g.address });
    setEditingId(g.id);
    setSelected(null);
    setShowFormModal(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    if (editingId) {
      updateGuest(editingId, form);
    } else {
      addGuest(form);
    }
    setShowFormModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or phone..."
            className="input pl-9 w-full" />
        </div>
        <button onClick={openAdd} className="btn-primary flex-shrink-0">
          <Plus size={15} /> Register Guest
        </button>
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
                const gBookings = bookings.filter(b => b.guest_id === g.id);
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
                      <span className="font-semibold text-emerald-700">{CURRENCY}{g.total_spent.toLocaleString()}</span>
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
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" title="View">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => generateGuestPDF(g, gBookings)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors" title="Download PDF">
                          <FileText size={14} />
                        </button>
                        <button onClick={() => openEdit(g)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors" title="Edit">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => toggleBlacklist(g.id)}
                          className={`p-1.5 rounded-lg transition-colors ${g.is_blacklisted ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}
                          title={g.is_blacklisted ? 'Unblacklist' : 'Blacklist'}>
                          <Ban size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(g)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">No guests found.</div>
          )}
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
                <p className="text-xl font-bold text-emerald-700">{CURRENCY}{selected.total_spent.toLocaleString()}</p>
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
                        <p className="text-[11px] text-slate-400">{b.id_proof_type}: {b.id_proof_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-900">{CURRENCY}{b.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => generateGuestPDF(selected, guestBookings)}
                className="btn-secondary flex-1 justify-center">
                <Download size={15} /> Download PDF
              </button>
              <button onClick={() => openEdit(selected)} className="btn-secondary flex-1 justify-center">
                <Edit3 size={15} /> Edit Guest
              </button>
              <button onClick={() => toggleBlacklist(selected.id)} className="btn-danger flex-1 justify-center">
                <Ban size={15} /> {selected.is_blacklisted ? 'Unblacklist' : 'Blacklist'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit Guest modal */}
      {showFormModal && (
        <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)}
          title={editingId ? 'Edit Guest' : 'Register New Guest'} size="md">
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555-0100" />
            </div>
            <div>
              <label className="label">Address</label>
              <textarea className="input h-20 resize-none" value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, City, Country" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">
                {editingId ? 'Save Changes' : 'Register Guest'}
              </button>
              <button onClick={() => setShowFormModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Guest" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Delete guest <span className="font-semibold text-slate-900">{deleteTarget.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => { deleteGuest(deleteTarget.id); setDeleteTarget(null); }}
                className="btn-danger flex-1 justify-center"><Trash2 size={15} /> Delete</button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
