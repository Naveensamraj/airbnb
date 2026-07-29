import { useState, useEffect } from 'react';
import {
  User, Mail, Calendar, CreditCard, ShieldAlert,
  FileText, Download, ExternalLink, Save, CheckCircle2, Clock,
  Home, Award, FileCheck
} from 'lucide-react';
import Modal from './Modal';
import Badge from './Badge';
import { Guest, Booking, Payment, CURRENCY } from '../../lib/types';

interface GuestProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest;
  bookings?: Booking[];
  payments?: Payment[];
  onUpdateAdminNotes?: (id: string, adminNotes: string) => Promise<void>;
  onDownloadPdf?: (guest: Guest) => void;
  onToggleBlacklist?: (id: string) => void;
  onEditGuest?: (guest: Guest) => void;
}

export default function GuestProfileModal({
  isOpen,
  onClose,
  guest,
  bookings = [],
  payments = [],
  onUpdateAdminNotes,
  onDownloadPdf,
  onToggleBlacklist,
  onEditGuest,
}: GuestProfileModalProps) {
  const [adminNotes, setAdminNotes] = useState(guest.admin_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    setAdminNotes(guest.admin_notes || '');
  }, [guest]);

  const handleSaveNotes = async () => {
    if (!onUpdateAdminNotes) return;
    setIsSavingNotes(true);
    try {
      await onUpdateAdminNotes(guest.id, adminNotes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save admin notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const initials = (guest.name || 'Guest')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isPdf = guest.id_proof_mime_type === 'application/pdf' ||
    Boolean(guest.id_proof_file && guest.id_proof_file.toLowerCase().endsWith('.pdf'));

  const isImage = guest.id_proof_mime_type?.startsWith('image/') ||
    Boolean(guest.id_proof_file && /\.(jpg|jpeg|png|webp)$/i.test(guest.id_proof_file));

  const fullFileUrl = guest.id_proof_file
    ? (guest.id_proof_file.startsWith('http') ? guest.id_proof_file : `http://localhost:5000${guest.id_proof_file}`)
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comprehensive Guest Profile" size="xl">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">

        {/* SECTION 1: HEADER & OVERVIEW */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              {guest.avatar_url ? (
                <img
                  src={guest.avatar_url}
                  alt={guest.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-2 border-white/20 shadow-md">
                  {initials}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight">{guest.name}</h2>
                  {guest.status === 'blacklisted' ? (
                    <Badge label="Blacklisted" variant="error" dot />
                  ) : guest.status === 'inactive' ? (
                    <Badge label="Inactive" variant="warning" dot />
                  ) : (
                    <Badge label="Active Guest" variant="success" dot />
                  )}
                </div>
                <p className="text-xs text-blue-200 mt-1 font-mono">ID: {guest.id}</p>
                <div className="flex items-center gap-4 text-xs text-slate-300 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> Registered: {guest.lifetime_since || (guest.created_at ? new Date(guest.created_at).toLocaleDateString() : 'N/A')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Updated: {guest.updated_at ? new Date(guest.updated_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              {onDownloadPdf && (
                <button
                  onClick={() => onDownloadPdf(guest)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <Download size={14} /> PDF Report
                </button>
              )}
              {onEditGuest && (
                <button
                  onClick={() => onEditGuest(guest)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
                >
                  <User size={14} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: CONTACT INFORMATION */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Mail size={15} className="text-blue-600" /> Section 2: Contact Information
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Full Name</p>
              <p className="font-semibold text-slate-900 mt-0.5">{guest.name}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Email Address</p>
              <p className="font-semibold text-slate-900 mt-0.5">{guest.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Phone Number</p>
              <p className="font-semibold text-slate-900 mt-0.5">{guest.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Alternative Phone</p>
              <p className="font-semibold text-slate-900 mt-0.5">{guest.alt_phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Street Address</p>
              <p className="font-semibold text-slate-900 mt-0.5">{guest.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">City / State</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {[guest.city, guest.state].filter(Boolean).join(', ') || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Country & Postal Code</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {[guest.country, guest.postal_code].filter(Boolean).join(' - ') || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Emergency Contact Name</p>
              <p className="font-semibold text-slate-900 mt-0.5">{guest.emergency_contact_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Emergency Contact Phone</p>
              <p className="font-semibold text-slate-900 mt-0.5">{guest.emergency_contact_phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: IDENTITY DETAILS */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileCheck size={15} className="text-blue-600" /> Section 3: Identity Verification
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 font-medium">ID Proof Type</p>
                <p className="font-semibold text-slate-900 mt-0.5">{guest.id_proof_type || 'Passport'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">ID Proof Number</p>
                <p className="font-mono font-semibold text-slate-900 mt-0.5">{guest.id_proof_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Original Filename</p>
                <p className="font-semibold text-slate-800 mt-0.5 truncate">
                  {guest.id_proof_original_name || (guest.id_proof_file ? guest.id_proof_file.split('/').pop() : 'N/A')}
                </p>
              </div>
            </div>

            {/* Uploaded ID Document Preview / Actions */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
              <p className="text-xs font-bold text-slate-600 mb-2">Uploaded Document</p>

              {fullFileUrl ? (
                <div className="space-y-3">
                  {isImage && (
                    <div className="w-full h-24 rounded-lg overflow-hidden border border-slate-200 bg-white">
                      <img src={fullFileUrl} alt="ID Proof" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {isPdf && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      <FileText size={28} className="flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs truncate">{guest.id_proof_original_name || 'PDF Document'}</p>
                        <p className="text-[11px] text-red-500">Identity document attached in system</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={fullFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary py-1.5 px-3 text-xs flex-1 justify-center gap-1"
                    >
                      <ExternalLink size={13} /> View File
                    </a>
                    <a
                      href={fullFileUrl}
                      download
                      className="btn-secondary py-1.5 px-3 text-xs flex-1 justify-center gap-1"
                    >
                      <Download size={13} /> Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs italic">
                  No identity document uploaded for this guest.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: BOOKING HISTORY */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Home size={15} className="text-blue-600" /> Section 4: Booking History & Stay Summary
            </h3>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-900 text-base">{guest.total_bookings}</p>
              <p className="text-slate-500 text-[11px]">Total Bookings</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="font-bold text-emerald-700 text-base">{guest.active_bookings || 0}</p>
              <p className="text-emerald-600 text-[11px]">Active</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="font-bold text-blue-700 text-base">{guest.completed_bookings || 0}</p>
              <p className="text-blue-600 text-[11px]">Completed</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="font-bold text-amber-700 text-base">{guest.pending_bookings || 0}</p>
              <p className="text-amber-600 text-[11px]">Pending</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="font-bold text-red-700 text-base">{guest.cancelled_bookings || 0}</p>
              <p className="text-red-600 text-[11px]">Cancelled</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
            <div>
              <p className="text-slate-400 font-medium">Last Booking Date</p>
              <p className="font-semibold text-slate-900 mt-0.5">{guest.last_booking_date || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Last Check-in / Check-out</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {[guest.last_check_in, guest.last_check_out].filter(Boolean).join(' → ') || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Total Nights & Favourite Property</p>
              <p className="font-semibold text-slate-900 mt-0.5">
                {guest.total_nights_stayed || 0} Night(s) • <span className="text-blue-600">{guest.favourite_property || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Bookings Table */}
          {bookings.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl mt-3">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Booking ID</th>
                    <th className="p-2.5">Property</th>
                    <th className="p-2.5">Check-in</th>
                    <th className="p-2.5">Check-out</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono text-slate-900">{b.id}</td>
                      <td className="p-2.5 font-medium text-slate-900">{b.property_name}</td>
                      <td className="p-2.5 text-slate-600">{b.check_in}</td>
                      <td className="p-2.5 text-slate-600">{b.check_out}</td>
                      <td className="p-2.5">{b.status}</td>
                      <td className="p-2.5 text-right font-semibold text-slate-900">
                        {CURRENCY}{b.total_amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 5: PAYMENT INFORMATION */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <CreditCard size={15} className="text-blue-600" /> Section 5: Payment Information
            </h3>
            {payments.length > 0 && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {payments.length} Transaction(s)
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-slate-400 font-medium">Total Amount Paid</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{CURRENCY}{(guest.total_paid || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-emerald-600 font-medium">Advance Paid</p>
              <p className="font-bold text-emerald-700 text-sm mt-0.5">{CURRENCY}{(guest.advance_paid || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-red-600 font-medium">Outstanding Balance</p>
              <p className="font-bold text-red-700 text-sm mt-0.5">{CURRENCY}{(guest.outstanding_balance || 0).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-blue-600 font-medium">Preferred Method</p>
              <p className="font-bold text-blue-700 text-sm mt-0.5">{guest.preferred_payment_method || 'UPI'}</p>
            </div>
          </div>
        </div>

        {/* SECTION 6: STATISTICS */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Award size={15} className="text-blue-600" /> Section 6: Lifetime Guest Statistics
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Total Money Spent</p>
              <p className="font-bold text-emerald-700 text-base mt-0.5">{CURRENCY}{guest.total_spent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Average Booking Value</p>
              <p className="font-bold text-slate-900 text-base mt-0.5">{CURRENCY}{(guest.avg_booking_value || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Average Stay Duration</p>
              <p className="font-bold text-slate-900 text-base mt-0.5">{guest.avg_stay_duration || 0} Night(s)</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Customer Lifetime Since</p>
              <p className="font-bold text-slate-900 text-base mt-0.5">{guest.lifetime_since || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* SECTION 7: NOTES & ADMIN NOTES */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileText size={15} className="text-blue-600" /> Section 7: Notes & Internal Comments
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p className="text-slate-500 font-semibold">Guest Notes</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 min-h-[80px] italic">
                {guest.guest_notes || 'No special guest instructions recorded.'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 font-semibold">Internal Admin Notes (Private)</p>
                {notesSaved && (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Saved to MongoDB
                  </span>
                )}
              </div>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter internal admin comments, verification logs, or preferences..."
                className="input w-full h-20 resize-none text-xs"
              />
              {onUpdateAdminNotes && (
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="btn-primary py-1.5 px-3 text-xs justify-center gap-1.5 w-full"
                >
                  <Save size={13} /> {isSavingNotes ? 'Saving...' : 'Save Admin Notes'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200">
          {onToggleBlacklist && (
            <button
              onClick={() => onToggleBlacklist(guest.id)}
              className={`py-2 px-4 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                guest.status === 'blacklisted'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              <ShieldAlert size={14} /> {guest.status === 'blacklisted' ? 'Remove from Blacklist' : 'Blacklist Guest'}
            </button>
          )}
          <button onClick={onClose} className="btn-secondary py-2 px-4 text-xs flex-1 justify-center">
            Close Profile
          </button>
        </div>
      </div>
    </Modal>
  );
}
