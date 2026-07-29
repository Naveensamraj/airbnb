import { useState, useMemo } from 'react';
import { Search, Eye, CheckCircle, XCircle, Calendar, Download, FileText, Plus, Edit3, Trash2, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { bookingStatusBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import IdProofUpload from '../../components/ui/IdProofUpload';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Booking, CURRENCY } from '../../lib/types';
import { generateBookingPDF, generateAllBookingsPDF } from '../../lib/pdf';
import { getBookingById, checkDoubleBooking } from '../../services/bookingService';

const STATUS_TABS = ['all', 'pending', 'awaiting_approval', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];

const EMPTY_FORM = {
  property_id: '', guest_name: '', guest_email: '', guest_phone: '',
  check_in: '', check_out: '', status: 'pending' as Booking['status'],
  total_amount: 0, advance_paid: 0, num_guests: 1,
  id_proof_type: 'Passport', id_proof_number: '', notes: '',
};

type FormState = typeof EMPTY_FORM;

interface BookingsProps {
  onNavigate?: (view: string) => void;
}

export default function Bookings({ onNavigate }: BookingsProps) {
  const { bookings, properties, addBooking, updateBooking, deleteBooking, approveBooking, rejectBooking } = useData();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);

  // ID proof file handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);
  const [editingBookingObj, setEditingBookingObj] = useState<Booking | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = useMemo(() => (
    bookings.filter(b => {
      if (!b) return false;
      const matchSearch =
        (b.guest_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.property_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.id || '').toLowerCase().includes(search.toLowerCase());
      const matchTab = tab === 'all' || b.status === tab;
      return matchSearch && matchTab;
    })
  ), [bookings, search, tab]);

  const nights = (b: Booking) => {
    const d1 = new Date(b.check_in);
    const d2 = new Date(b.check_out);
    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 1;
    return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000));
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setEditingBookingObj(null);
    setSelectedFile(null);
    setRemoveExistingFile(false);
    setFormError(null);
    setShowFormModal(true);
  };

  const openEdit = (b: Booking) => {
    setForm({
      property_id: b.property_id, guest_name: b.guest_name, guest_email: b.guest_email,
      guest_phone: b.guest_phone, check_in: b.check_in, check_out: b.check_out,
      status: b.status, total_amount: b.total_amount, advance_paid: b.advance_paid,
      num_guests: b.num_guests, id_proof_type: b.id_proof_type || 'Passport',
      id_proof_number: b.id_proof_number || '', notes: b.notes || '',
    });
    setEditingId(b.id);
    setEditingBookingObj(b);
    setSelectedFile(null);
    setRemoveExistingFile(false);
    setSelected(null);
    setFormError(null);
    setShowFormModal(true);
  };

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.guest_name || !form.property_id || !form.check_in || !form.check_out) {
      setFormError('Please fill out all required fields.');
      return;
    }

    const doubleCheck = checkDoubleBooking(
      bookings,
      form.property_id,
      form.check_in,
      form.check_out,
      editingId || undefined
    );

    if (doubleCheck.isConflicting) {
      setFormError('This property is already booked for the selected dates.');
      return;
    }

    const prop = properties.find(p => p.id === form.property_id);
    if (!prop) return;
    const balance = form.total_amount - form.advance_paid;
    const data = {
      ...form,
      property_name: prop.name,
      property_cover: prop.cover_photo,
      guest_id: 'guest-manual',
      balance_due: balance,
    };

    try {
      if (editingId) {
        await updateBooking(editingId, data, selectedFile || undefined, removeExistingFile);
      } else {
        await addBooking(data, selectedFile || undefined);
      }
      setShowFormModal(false);
      setSelectedFile(null);
      setRemoveExistingFile(false);
      setFormError(null);
    } catch {
      setFormError('Failed to save booking.');
    }
  };

  const handleDownloadPdf = async (booking: Booking) => {
    try {
      setDownloadingId(booking.id);
      // Fetch latest booking data from MongoDB before generating PDF
      const freshBooking = await getBookingById(booking.id).catch(() => booking);
      await generateBookingPDF(freshBooking, user?.full_name || 'Logged-in Admin');
    } catch (err) {
      console.error('Failed to download PDF:', err);
      await generateBookingPDF(booking, user?.full_name || 'Logged-in Admin');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by guest, property, or ID..."
            className="input pl-9 w-full" />
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('calendar')}
            className="btn-primary bg-indigo-600 hover:bg-indigo-500 text-white flex-shrink-0 flex items-center gap-2"
          >
            <Calendar size={15} /> Reservation Calendar
          </button>
        )}
        <button onClick={openAdd} className="btn-primary flex-shrink-0">
          <Plus size={15} /> New Booking
        </button>
        <button onClick={() => generateAllBookingsPDF(filtered)}
          className="btn-secondary flex-shrink-0 flex items-center gap-2">
          <Download size={15} /> Download All
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_TABS.map(s => {
          const count = s === 'all' ? bookings.length : bookings.filter(b => b.status === s).length;
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
                    <p className="font-semibold text-slate-900">{CURRENCY}{b.total_amount.toLocaleString()}</p>
                    {b.balance_due > 0 && (
                      <p className="text-[11px] text-red-500">Due: {CURRENCY}{b.balance_due.toLocaleString()}</p>
                    )}
                  </td>
                  <td className="table-td">{bookingStatusBadge(b.status)}</td>
                  <td className="table-td">
                    <div className="flex gap-1.5">
                      <button onClick={() => setSelected(b)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" title="View">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleDownloadPdf(b)} disabled={downloadingId === b.id}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors disabled:opacity-50" title="Download PDF Receipt">
                        {downloadingId === b.id ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                      </button>
                      <button onClick={() => openEdit(b)}
                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors" title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(b)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                      {b.status === 'awaiting_approval' && (
                        <>
                          <button onClick={() => approveBooking(b.id)}
                            className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors" title="Approve">
                            <CheckCircle size={14} />
                          </button>
                          <button onClick={() => rejectBooking(b.id)}
                            className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors" title="Reject">
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

      {/* Add/Edit Booking modal */}
      {showFormModal && (
        <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)}
          title={editingId ? 'Edit Booking' : 'New Booking'} size="lg">
          <div className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold text-xs flex items-center gap-2">
                <AlertTriangle size={16} /> {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Property</label>
                <select className="input" value={form.property_id}
                  onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))}>
                  <option value="">Select property...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as Booking['status'] }))}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                  {!['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].includes(form.status) && (
                    <option value={form.status}>
                      {form.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </option>
                  )}
                </select>
              </div>
              <div>
                <label className="label">Guest Name</label>
                <input className="input" value={form.guest_name}
                  onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Guest Email</label>
                <input className="input" type="email" value={form.guest_email}
                  onChange={e => setForm(f => ({ ...f, guest_email: e.target.value }))} />
              </div>
              <div>
                <label className="label">Guest Phone</label>
                <input className="input" value={form.guest_phone}
                  onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Number of Guests</label>
                <input className="input" type="number" value={form.num_guests}
                  onChange={e => setForm(f => ({ ...f, num_guests: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Check-in Date</label>
                <input className="input" type="date" value={form.check_in}
                  onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} />
              </div>
              <div>
                <label className="label">Check-out Date</label>
                <input className="input" type="date" value={form.check_out}
                  onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} />
              </div>
              <div>
                <label className="label">Total Amount ({CURRENCY})</label>
                <input className="input" type="number" value={form.total_amount}
                  onChange={e => setForm(f => ({ ...f, total_amount: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Advance Paid ({CURRENCY})</label>
                <input className="input" type="number" value={form.advance_paid}
                  onChange={e => setForm(f => ({ ...f, advance_paid: +e.target.value }))} />
              </div>
              <div>
                <label className="label">ID Proof Type</label>
                <select className="input" value={form.id_proof_type}
                  onChange={e => setForm(f => ({ ...f, id_proof_type: e.target.value }))}>
                  <option>Passport</option>
                  <option>Driver's License</option>
                  <option>National ID</option>
                </select>
              </div>
              <div>
                <label className="label">ID Proof Number</label>
                <input className="input" value={form.id_proof_number}
                  onChange={e => setForm(f => ({ ...f, id_proof_number: e.target.value }))} />
              </div>

              {/* ID Proof File Upload Component */}
              <div className="sm:col-span-2">
                <IdProofUpload
                  selectedFile={selectedFile}
                  onFileSelect={(file) => {
                    setSelectedFile(file);
                    if (file) setRemoveExistingFile(false);
                  }}
                  existingUrl={!removeExistingFile ? editingBookingObj?.id_proof_file : undefined}
                  existingFileName={!removeExistingFile ? editingBookingObj?.id_proof_original_name : undefined}
                  existingMimeType={!removeExistingFile ? editingBookingObj?.id_proof_mime_type : undefined}
                  onRemoveExisting={() => {
                    setRemoveExistingFile(true);
                    setSelectedFile(null);
                  }}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Notes</label>
                <textarea className="input h-20 resize-none" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">
                {editingId ? 'Save Changes' : 'Create Booking'}
              </button>
              <button onClick={() => setShowFormModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

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
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase">Identity Verification</p>
                <p><span className="text-slate-500">Type:</span> <span className="font-medium">{selected.id_proof_type || 'N/A'}</span></p>
                <p><span className="text-slate-500">Number:</span> <span className="font-mono font-medium">{selected.id_proof_number || 'N/A'}</span></p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase">Uploaded Document</p>
                {selected.id_proof_file ? (
                  <div className="space-y-1">
                    <p className="font-medium text-slate-800 text-xs truncate">
                      {selected.id_proof_original_name || selected.id_proof_file.split('/').pop()}
                    </p>
                    <a
                      href={selected.id_proof_file.startsWith('http') ? selected.id_proof_file : `http://localhost:5000${selected.id_proof_file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
                    >
                      View Uploaded Document <ExternalLink size={12} />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No document uploaded</p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Payment Summary</p>
              <div className="flex justify-between"><span className="text-slate-500">Total Amount</span><span className="font-semibold">{CURRENCY}{selected.total_amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Advance Paid</span><span className="text-emerald-600 font-medium">{CURRENCY}{selected.advance_paid.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-1"><span className="font-medium">Balance Due</span><span className={`font-bold ${selected.balance_due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{CURRENCY}{selected.balance_due.toLocaleString()}</span></div>
            </div>

            {selected.notes && <p className="text-sm text-slate-600 italic">"{selected.notes}"</p>}

            {selected.status === 'awaiting_approval' && (
              <div className="flex gap-2">
                <button onClick={() => { approveBooking(selected.id); setSelected(null); }}
                  className="btn-primary flex-1 justify-center"><CheckCircle size={15} /> Approve Booking</button>
                <button onClick={() => { rejectBooking(selected.id); setSelected(null); }}
                  className="btn-danger flex-1 justify-center"><XCircle size={15} /> Reject</button>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => openEdit(selected)} className="btn-secondary flex-1 justify-center">
                <Edit3 size={15} /> Edit Booking
              </button>
              <button onClick={() => handleDownloadPdf(selected)} disabled={downloadingId === selected.id}
                className="btn-secondary flex-1 justify-center disabled:opacity-50">
                {downloadingId === selected.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Download PDF
              </button>
              <button onClick={() => { setDeleteTarget(selected); setSelected(null); }}
                className="btn-danger flex-1 justify-center">
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Booking" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Delete booking <span className="font-semibold text-slate-900">{deleteTarget.id}</span> for {deleteTarget.guest_name}?
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => { deleteBooking(deleteTarget.id); setDeleteTarget(null); }}
                className="btn-danger flex-1 justify-center"><Trash2 size={15} /> Delete</button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
