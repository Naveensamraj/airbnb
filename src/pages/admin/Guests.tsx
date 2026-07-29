import { useState, useMemo } from 'react';
import { Search, Eye, Ban, Mail, Phone, BookOpen, Plus, Edit3, Trash2, FileText, Loader2 } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import GuestProfileModal from '../../components/ui/GuestProfileModal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Guest, CURRENCY } from '../../lib/types';
import { generateGuestPDF } from '../../lib/pdf';
import { getGuestById } from '../../services/guestService';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  alt_phone: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postal_code: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  id_proof_type: 'Passport',
  id_proof_number: '',
  guest_notes: '',
  admin_notes: '',
};

type FormState = typeof EMPTY_FORM;

export default function Guests() {
  const { guests, bookings, payments, addGuest, updateGuest, deleteGuest, toggleBlacklist } = useData();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Guest | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = useMemo(() => (
    guests.filter(g =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search)
    )
  ), [guests, search]);

  const guestBookings = useMemo(() => (
    selected ? bookings.filter(b => b.guest_id === selected.id || b.guest_email === selected.email) : []
  ), [bookings, selected]);

  const guestPayments = useMemo(() => (
    selected ? payments.filter(p => p.guest_name === selected.name || p.booking_id) : []
  ), [payments, selected]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowFormModal(true);
  };

  const openEdit = (g: Guest) => {
    setForm({
      name: g.name || '',
      email: g.email || '',
      phone: g.phone || '',
      alt_phone: g.alt_phone || '',
      address: g.address || '',
      city: g.city || '',
      state: g.state || '',
      country: g.country || '',
      postal_code: g.postal_code || '',
      emergency_contact_name: g.emergency_contact_name || '',
      emergency_contact_phone: g.emergency_contact_phone || '',
      id_proof_type: g.id_proof_type || 'Passport',
      id_proof_number: g.id_proof_number || '',
      guest_notes: g.guest_notes || '',
      admin_notes: g.admin_notes || '',
    });
    setEditingId(g.id);
    setSelected(null);
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) return;
    if (editingId) {
      await updateGuest(editingId, form);
    } else {
      await addGuest(form);
    }
    setShowFormModal(false);
  };

  const handleDownloadGuestPdf = async (targetGuest: Guest) => {
    try {
      setDownloadingId(targetGuest.id);
      // Fetch latest guest profile with full MongoDB records
      const fullProfile = await getGuestById(targetGuest.id).catch(() => targetGuest);
      const targetBookings = (fullProfile as any).bookings || bookings.filter(b => b.guest_id === targetGuest.id || b.guest_email === targetGuest.email);
      await generateGuestPDF(fullProfile, targetBookings, user?.full_name || 'Logged-in Admin');
    } catch (err) {
      console.error('Failed to generate Guest PDF:', err);
      const targetBookings = bookings.filter(b => b.guest_id === targetGuest.id || b.guest_email === targetGuest.email);
      await generateGuestPDF(targetGuest, targetBookings, user?.full_name || 'Logged-in Admin');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleUpdateAdminNotes = async (guestId: string, adminNotes: string) => {
    await updateGuest(guestId, { admin_notes: adminNotes });
    if (selected && selected.id === guestId) {
      setSelected({ ...selected, admin_notes: adminNotes });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by guest name, email, or phone number..."
            className="input pl-9 w-full"
          />
        </div>
        <button onClick={openAdd} className="btn-primary flex-shrink-0">
          <Plus size={15} /> Register New Guest
        </button>
      </div>

      {/* Guests Table */}
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
                const initials = (g.name || 'G').split(' ').map(n => n[0]).join('').slice(0, 2);
                return (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        {g.avatar_url ? (
                          <img src={g.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-semibold flex-shrink-0">
                            {initials}
                          </div>
                        )}
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
                      <span className="font-semibold text-emerald-700">{CURRENCY}{(g.total_spent || 0).toLocaleString()}</span>
                    </td>
                    <td className="table-td">
                      <p className="text-xs">{g.last_visit ?? <span className="text-slate-400">Never</span>}</p>
                    </td>
                    <td className="table-td">
                      {g.status === 'blacklisted' ? (
                        <Badge label="Blacklisted" variant="error" dot />
                      ) : g.status === 'inactive' ? (
                        <Badge label="Inactive" variant="warning" dot />
                      ) : (
                        <Badge label="Active" variant="success" dot />
                      )}
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelected(g)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="View Full Guest Profile"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDownloadGuestPdf(g)}
                          disabled={downloadingId === g.id}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors disabled:opacity-50"
                          title="Download Guest Dossier PDF"
                        >
                          {downloadingId === g.id ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                        </button>
                        <button
                          onClick={() => openEdit(g)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                          title="Edit Profile"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => toggleBlacklist(g.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            g.status === 'blacklisted'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                              : 'bg-red-50 hover:bg-red-100 text-red-500'
                          }`}
                          title={g.status === 'blacklisted' ? 'Remove Blacklist' : 'Blacklist'}
                        >
                          <Ban size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(g)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                          title="Delete"
                        >
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
            <div className="py-12 text-center text-slate-400 text-sm">No guests found on record.</div>
          )}
        </div>
      </div>

      {/* 7-Section Full Guest Profile Modal */}
      {selected && (
        <GuestProfileModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          guest={selected}
          bookings={guestBookings}
          payments={guestPayments}
          onUpdateAdminNotes={handleUpdateAdminNotes}
          onDownloadPdf={handleDownloadGuestPdf}
          onToggleBlacklist={toggleBlacklist}
          onEditGuest={openEdit}
        />
      )}

      {/* Add / Edit Guest Register Modal */}
      {showFormModal && (
        <Modal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          title={editingId ? 'Edit Guest Profile' : 'Register New Guest'}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 555-0100"
                />
              </div>
              <div>
                <label className="label">Alternative Phone</label>
                <input
                  className="input"
                  value={form.alt_phone}
                  onChange={e => setForm(f => ({ ...f, alt_phone: e.target.value }))}
                  placeholder="+1 555-0199"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Street Address</label>
                <input
                  className="input"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="123 Main Street, Suite 400"
                />
              </div>
              <div>
                <label className="label">City</label>
                <input
                  className="input"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="San Francisco"
                />
              </div>
              <div>
                <label className="label">State / Province</label>
                <input
                  className="input"
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  placeholder="California"
                />
              </div>
              <div>
                <label className="label">Country</label>
                <input
                  className="input"
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  placeholder="United States"
                />
              </div>
              <div>
                <label className="label">Postal Code</label>
                <input
                  className="input"
                  value={form.postal_code}
                  onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))}
                  placeholder="94105"
                />
              </div>
              <div>
                <label className="label">Emergency Contact Name</label>
                <input
                  className="input"
                  value={form.emergency_contact_name}
                  onChange={e => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="label">Emergency Contact Phone</label>
                <input
                  className="input"
                  value={form.emergency_contact_phone}
                  onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))}
                  placeholder="+1 555-0999"
                />
              </div>
              <div>
                <label className="label">ID Proof Type</label>
                <select
                  className="input"
                  value={form.id_proof_type}
                  onChange={e => setForm(f => ({ ...f, id_proof_type: e.target.value }))}
                >
                  <option>Passport</option>
                  <option>Driver's License</option>
                  <option>National ID</option>
                </select>
              </div>
              <div>
                <label className="label">ID Proof Number</label>
                <input
                  className="input"
                  value={form.id_proof_number}
                  onChange={e => setForm(f => ({ ...f, id_proof_number: e.target.value }))}
                  placeholder="A12345678"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Guest Special Notes</label>
                <textarea
                  className="input h-16 resize-none"
                  value={form.guest_notes}
                  onChange={e => setForm(f => ({ ...f, guest_notes: e.target.value }))}
                  placeholder="Special preferences, allergies, dietary requests..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Internal Admin Notes</label>
                <textarea
                  className="input h-16 resize-none"
                  value={form.admin_notes}
                  onChange={e => setForm(f => ({ ...f, admin_notes: e.target.value }))}
                  placeholder="Internal staff notes, VIP status, remarks..."
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">
                {editingId ? 'Save Profile Changes' : 'Register Guest'}
              </button>
              <button onClick={() => setShowFormModal(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Guest Profile" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Delete guest record for <span className="font-semibold text-slate-900">{deleteTarget.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  deleteGuest(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="btn-danger flex-1 justify-center"
              >
                <Trash2 size={15} /> Delete Guest
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
