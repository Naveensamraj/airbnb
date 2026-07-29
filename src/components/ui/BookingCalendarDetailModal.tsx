import { useState } from 'react';
import {
  Calendar, User, Home, CreditCard, FileText,
  Download, ExternalLink, Edit3, Trash2, ShieldCheck, Loader2
} from 'lucide-react';
import Modal from './Modal';
import { bookingStatusBadge } from './Badge';
import { Booking, Property, CURRENCY } from '../../lib/types';
import { generateBookingPDF } from '../../lib/pdf';
import { getBookingById } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';

interface BookingCalendarDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  property?: Property;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
}

export default function BookingCalendarDetailModal({
  isOpen,
  onClose,
  booking,
  property,
  onEdit,
  onDelete,
}: BookingCalendarDetailModalProps) {
  const { user } = useAuth();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const d1 = booking.check_in ? new Date(booking.check_in) : new Date();
  const d2 = booking.check_out ? new Date(booking.check_out) : new Date();
  const nightsCount = Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())
    ? 1
    : Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000));

  const isPdf = booking.id_proof_mime_type === 'application/pdf' ||
    Boolean(booking.id_proof_file && booking.id_proof_file.toLowerCase().endsWith('.pdf'));

  const isImage = booking.id_proof_mime_type?.startsWith('image/') ||
    Boolean(booking.id_proof_file && /\.(jpg|jpeg|png|webp)$/i.test(booking.id_proof_file));

  const fullFileUrl = booking.id_proof_file
    ? (booking.id_proof_file.startsWith('http') ? booking.id_proof_file : `http://localhost:5000${booking.id_proof_file}`)
    : null;

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const freshBooking = await getBookingById(booking.id).catch(() => booking);
      await generateBookingPDF(freshBooking, user?.full_name || 'Admin');
    } catch (err) {
      console.error('PDF download error:', err);
      await generateBookingPDF(booking, user?.full_name || 'Admin');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const totalAmt = booking.total_amount || 0;
  const advPaid = booking.advance_paid || 0;
  const balDue = booking.balance_due ?? (totalAmt - advPaid);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reservation Details" size="lg">
      <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">

        {/* Top Banner */}
        <div className="bg-slate-900 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            {booking.property_cover ? (
              <img src={booking.property_cover} alt="" className="w-14 h-14 rounded-xl object-cover border border-white/20" />
            ) : (
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                <Home size={24} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">{booking.property_name || 'Property'}</h3>
                {bookingStatusBadge(booking.status)}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Booking ID: {booking.id}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Total Amount</p>
            <p className="text-xl font-bold text-emerald-400">{CURRENCY}{totalAmt.toLocaleString()}</p>
          </div>
        </div>

        {/* Section 1: Stay & Date Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <p className="text-slate-400 font-medium flex items-center gap-1"><Calendar size={12} /> Check-in Date</p>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{booking.check_in || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium flex items-center gap-1"><Calendar size={12} /> Check-out Date</p>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{booking.check_out || 'N/A'}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Duration & Guests</p>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{nightsCount} Night(s) • {booking.num_guests || 1} Guest(s)</p>
          </div>
        </div>

        {/* Section 2: Guest Contact & Address */}
        <div className="card p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <User size={14} className="text-blue-600" /> Guest Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Guest Name</p>
              <p className="font-semibold text-slate-900 mt-0.5">{booking.guest_name || 'Guest'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Email Address</p>
              <p className="font-semibold text-slate-900 mt-0.5">{booking.guest_email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Phone Number</p>
              <p className="font-semibold text-slate-900 mt-0.5">{booking.guest_phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Property Location</p>
              <p className="font-semibold text-slate-900 mt-0.5">{property?.location || 'Main Property'}</p>
            </div>
          </div>
        </div>

        {/* Section 3: Financial & Payment Breakdown */}
        <div className="card p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <CreditCard size={14} className="text-blue-600" /> Financial Summary
          </p>
          <div className="grid grid-cols-3 gap-3 text-xs text-center">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-slate-400 font-medium">Total Amount</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{CURRENCY}{totalAmt.toLocaleString()}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-emerald-600 font-medium">Advance Paid</p>
              <p className="font-bold text-emerald-700 text-sm mt-0.5">{CURRENCY}{advPaid.toLocaleString()}</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-amber-600 font-medium">Balance Due</p>
              <p className="font-bold text-amber-700 text-sm mt-0.5">{CURRENCY}{balDue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Section 4: Identity Proof Verification */}
        <div className="card p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <ShieldCheck size={14} className="text-blue-600" /> Identity Document Verification
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-400 font-medium">ID Proof Type</p>
              <p className="font-semibold text-slate-900 mt-0.5">{booking.id_proof_type || 'Passport'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">ID Proof Number</p>
              <p className="font-mono font-semibold text-slate-900 mt-0.5">{booking.id_proof_number || 'N/A'}</p>
            </div>
          </div>

          {fullFileUrl ? (
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl mt-2">
              {isImage && (
                <img src={fullFileUrl} alt="ID Document" className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
              )}
              {isPdf && (
                <FileText size={28} className="text-red-500 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-semibold text-slate-800 truncate">
                  {booking.id_proof_original_name || (booking.id_proof_file ? booking.id_proof_file.split('/').pop() : 'Document')}
                </p>
                <p className="text-[11px] text-slate-400">Attached ID Document</p>
              </div>
              <div className="flex items-center gap-1">
                <a href={fullFileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700" title="View">
                  <ExternalLink size={14} />
                </a>
                <a href={fullFileUrl} download className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500" title="Download">
                  <Download size={14} />
                </a>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No identity proof uploaded.</p>
          )}
        </div>

        {/* Section 5: Special Notes */}
        {booking.notes && (
          <div className="card p-4 space-y-1 text-xs">
            <p className="text-slate-500 font-semibold">Special Booking Notes</p>
            <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">{booking.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="btn-secondary py-2 px-3 text-xs justify-center flex-1 gap-1.5"
          >
            {isDownloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Download PDF
          </button>
          <button
            onClick={() => { onClose(); onEdit(booking); }}
            className="btn-primary py-2 px-3 text-xs justify-center flex-1 gap-1.5"
          >
            <Edit3 size={14} /> Edit Booking
          </button>
          <button
            onClick={() => { onClose(); onDelete(booking); }}
            className="btn-danger py-2 px-3 text-xs justify-center gap-1.5"
          >
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={onClose} className="btn-secondary py-2 px-3 text-xs">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
