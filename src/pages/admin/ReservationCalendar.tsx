import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Home,
  DollarSign, TrendingUp, Clock, CheckCircle2, AlertTriangle, Eye, Edit3,
  Trash2, Download, RefreshCw, Layers, Sparkles, X, Move
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Booking, CURRENCY } from '../../lib/types';
import { generateBookingPDF } from '../../lib/pdf';
import { checkDoubleBooking } from '../../services/bookingService';
import BookingCalendarDetailModal from '../../components/ui/BookingCalendarDetailModal';
import Modal from '../../components/ui/Modal';
import IdProofUpload from '../../components/ui/IdProofUpload';

type CalendarViewMode = 'month' | 'week' | 'day';

const STATUS_COLORS: Record<Booking['status'], { bg: string; border: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-amber-950', label: 'Pending' },
  confirmed: { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-white', label: 'Confirmed' },
  checked_in: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white', label: 'Checked In' },
  checked_out: { bg: 'bg-slate-500', border: 'border-slate-600', text: 'text-white', label: 'Checked Out' },
  cancelled: { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white', label: 'Cancelled' },
  awaiting_approval: { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white', label: 'Awaiting Approval' },
  awaiting_payment: { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-amber-950', label: 'Awaiting Payment' },
  refunded: { bg: 'bg-slate-400', border: 'border-slate-500', text: 'text-white', label: 'Refunded' },
};

export default function ReservationCalendar() {
  const {
    bookings, properties, addBooking, updateBooking, deleteBooking,
  } = useData();
  const { user } = useAuth();

  // Navigation & View Mode
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Filters
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [guestSearch, setGuestSearch] = useState<string>('');

  // Modals & Popups
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; booking: Booking } | null>(null);
  const [hoveredBooking, setHoveredBooking] = useState<{ booking: Booking; x: number; y: number } | null>(null);

  // New / Edit Booking Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);

  const [form, setForm] = useState({
    property_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in: '',
    check_out: '',
    status: 'pending' as Booking['status'],
    total_amount: 0,
    advance_paid: 0,
    num_guests: 1,
    id_proof_type: 'Passport',
    id_proof_number: '',
    notes: '',
  });

  // Move / Reschedule Modal State
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Delete Target Modal
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);

  // ----------------------------------------------------
  // Month & Date Calculations
  // ----------------------------------------------------
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month - 1, 1));
    else if (viewMode === 'week') setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000));
    else setCurrentDate(new Date(currentDate.getTime() - 86400000));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month + 1, 1));
    else if (viewMode === 'week') setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000));
    else setCurrentDate(new Date(currentDate.getTime() + 86400000));
  };

  const handleToday = () => setCurrentDate(new Date());

  // ----------------------------------------------------
  // Filtered Bookings
  // ----------------------------------------------------
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (!b) return false;
      if (selectedPropertyId !== 'all' && b.property_id !== selectedPropertyId) return false;
      if (selectedStatus !== 'all' && b.status !== selectedStatus) return false;
      if (guestSearch) {
        const q = guestSearch.toLowerCase();
        const match =
          (b.guest_name || '').toLowerCase().includes(q) ||
          (b.property_name || '').toLowerCase().includes(q) ||
          (b.id || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [bookings, selectedPropertyId, selectedStatus, guestSearch]);

  // ----------------------------------------------------
  // Monthly Analytics Calculations
  // ----------------------------------------------------
  const analytics = useMemo(() => {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const daysInMonthCount = endOfMonth.getDate();

    let bookingsThisMonth = 0;
    let revenueThisMonth = 0;
    let occupiedDaysCount = 0;
    let upcomingCheckInsCount = 0;
    let upcomingCheckOutsCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    filteredBookings.forEach((b) => {
      if (!b) return;
      if ((b.status as string) === 'cancelled' || (b.status as string) === 'rejected') return;

      const cIn = b.check_in ? new Date(b.check_in) : null;
      const cOut = b.check_out ? new Date(b.check_out) : null;

      if (cIn && cOut && !Number.isNaN(cIn.getTime()) && !Number.isNaN(cOut.getTime())) {
        // Check if booking overlaps this month
        if (cIn <= endOfMonth && cOut >= startOfMonth) {
          bookingsThisMonth++;
          revenueThisMonth += (b.total_amount || 0);

          // Calculate overlap days in this month
          const overlapStart = Math.max(cIn.getTime(), startOfMonth.getTime());
          const overlapEnd = Math.min(cOut.getTime(), endOfMonth.getTime());
          if (overlapEnd >= overlapStart) {
            const overlapDays = Math.max(1, Math.round((overlapEnd - overlapStart) / 86400000));
            occupiedDaysCount += overlapDays;
          }
        }
      }

      if (b.check_in && b.check_in >= todayStr && (b.status === 'confirmed' || b.status === 'pending')) {
        upcomingCheckInsCount++;
      }
      if (b.check_out && b.check_out >= todayStr && b.status === 'checked_in') {
        upcomingCheckOutsCount++;
      }
    });

    const activePropCount = selectedPropertyId === 'all'
      ? Math.max(1, properties.length)
      : 1;

    const totalCapacityDays = daysInMonthCount * activePropCount;
    const occupancyRate = Math.min(100, Math.round((occupiedDaysCount / totalCapacityDays) * 100));
    const availableDaysCount = Math.max(0, totalCapacityDays - occupiedDaysCount);

    return {
      bookingsThisMonth,
      revenueThisMonth,
      occupiedDaysCount,
      availableDaysCount,
      occupancyRate,
      upcomingCheckInsCount,
      upcomingCheckOutsCount,
    };
  }, [filteredBookings, year, month, properties, selectedPropertyId]);

  // ----------------------------------------------------
  // Days in View Computation
  // ----------------------------------------------------
  const calendarGridDays = useMemo(() => {
    const days: Date[] = [];
    if (viewMode === 'month') {
      const firstDay = new Date(year, month, 1);
      const dayOfWeek = firstDay.getDay(); // 0 = Sun
      const startDate = new Date(year, month, 1 - dayOfWeek);

      for (let i = 0; i < 35; i++) {
        days.push(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i));
      }
    } else if (viewMode === 'week') {
      const dayOfWeek = currentDate.getDay();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - dayOfWeek);
      for (let i = 0; i < 7; i++) {
        days.push(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i));
      }
    } else {
      // Day View
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()));
    }
    return days;
  }, [currentDate, year, month, viewMode]);

  // Helper to format date key YYYY-MM-DD
  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Helper to get bookings active on a specific date
  const getBookingsForDate = (dateStr: string) => {
    return filteredBookings.filter((b) => {
      return b && b.check_in && b.check_out && b.check_in <= dateStr && b.check_out >= dateStr;
    });
  };

  // ----------------------------------------------------
  // Context Menu & Quick Action Handlers
  // ----------------------------------------------------
  const handleContextMenu = (e: React.MouseEvent, booking: Booking) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, booking });
  };

  const handleQuickStatusChange = async (bookingId: string, status: Booking['status']) => {
    setContextMenu(null);
    await updateBooking(bookingId, { status });
  };

  const handleOpenReschedule = (booking: Booking) => {
    setContextMenu(null);
    setRescheduleBooking(booking);
    setNewCheckIn(booking.check_in);
    setNewCheckOut(booking.check_out);
    setRescheduleError(null);
  };

  const handleSaveReschedule = async () => {
    if (!rescheduleBooking || !newCheckIn || !newCheckOut) return;

    // Double Booking Prevention Check
    const doubleCheck = checkDoubleBooking(
      bookings,
      rescheduleBooking.property_id,
      newCheckIn,
      newCheckOut,
      rescheduleBooking.id
    );

    if (doubleCheck.isConflicting) {
      setRescheduleError("This property is already booked for the selected dates.");
      return;
    }

    try {
      await updateBooking(rescheduleBooking.id, {
        check_in: newCheckIn,
        check_out: newCheckOut,
      });
      setRescheduleBooking(null);
    } catch {
      setRescheduleError("Failed to update booking dates.");
    }
  };

  // ----------------------------------------------------
  // Form Submit Handler with Double Booking Check
  // ----------------------------------------------------
  const handleFormSubmit = async () => {
    if (!form.guest_name || !form.property_id || !form.check_in || !form.check_out) {
      setFormError("Please fill out all required fields.");
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
      setFormError("This property is already booked for the selected dates.");
      return;
    }

    const prop = properties.find((p) => p.id === form.property_id);
    if (!prop) return;

    const data = {
      ...form,
      property_name: prop.name,
      property_cover: prop.cover_photo,
      guest_id: 'guest-manual',
      balance_due: form.total_amount - form.advance_paid,
    };

    try {
      if (editingId) {
        await updateBooking(editingId, data, selectedFile || undefined, removeFile);
      } else {
        await addBooking(data, selectedFile || undefined);
      }
      setShowFormModal(false);
    } catch {
      setFormError("An error occurred while saving the booking.");
    }
  };

  const openAddForDate = (dateStr: string) => {
    const nextDay = new Date(dateStr);
    nextDay.setDate(nextDay.getDate() + 1);
    const checkOutStr = formatDateKey(nextDay);

    setForm({
      property_id: properties[0]?.id || '',
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      check_in: dateStr,
      check_out: checkOutStr,
      status: 'pending',
      total_amount: 1500,
      advance_paid: 500,
      num_guests: 1,
      id_proof_type: 'Passport',
      id_proof_number: '',
      notes: '',
    });
    setEditingId(null);
    setSelectedFile(null);
    setRemoveFile(false);
    setFormError(null);
    setShowFormModal(true);
  };

  const openEditBooking = (b: Booking) => {
    setForm({
      property_id: b.property_id,
      guest_name: b.guest_name,
      guest_email: b.guest_email,
      guest_phone: b.guest_phone,
      check_in: b.check_in,
      check_out: b.check_out,
      status: b.status,
      total_amount: b.total_amount,
      advance_paid: b.advance_paid,
      num_guests: b.num_guests,
      id_proof_type: b.id_proof_type || 'Passport',
      id_proof_number: b.id_proof_number || '',
      notes: b.notes || '',
    });
    setEditingId(b.id);
    setSelectedFile(null);
    setRemoveFile(false);
    setFormError(null);
    setShowFormModal(true);
  };

  return (
    <div className="space-y-6" onClick={() => setContextMenu(null)}>

      {/* MONTHLY ANALYTICS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="card p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Bookings</p>
          <p className="text-xl font-bold text-blue-950 mt-0.5">{analytics.bookingsThisMonth}</p>
          <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1"><CalendarIcon size={10} /> This Month</p>
        </div>

        <div className="card p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Revenue</p>
          <p className="text-xl font-bold text-emerald-950 mt-0.5">{CURRENCY}{analytics.revenueThisMonth.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1"><DollarSign size={10} /> Total Value</p>
        </div>

        <div className="card p-3.5 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Occupancy %</p>
          <p className="text-xl font-bold text-purple-950 mt-0.5">{analytics.occupancyRate}%</p>
          <p className="text-[10px] text-purple-500 mt-1 flex items-center gap-1"><TrendingUp size={10} /> Monthly Rate</p>
        </div>

        <div className="card p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Occupied Days</p>
          <p className="text-xl font-bold text-amber-950 mt-0.5">{analytics.occupiedDaysCount} Days</p>
          <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1"><CheckCircle2 size={10} /> Reserved</p>
        </div>

        <div className="card p-3.5 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Available Days</p>
          <p className="text-xl font-bold text-slate-950 mt-0.5">{analytics.availableDaysCount} Days</p>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><Sparkles size={10} /> Open Capacity</p>
        </div>

        <div className="card p-3.5 bg-gradient-to-br from-sky-50 to-blue-50 border-sky-100">
          <p className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Upcoming In</p>
          <p className="text-xl font-bold text-sky-950 mt-0.5">{analytics.upcomingCheckInsCount}</p>
          <p className="text-[10px] text-sky-500 mt-1 flex items-center gap-1"><Clock size={10} /> Check-ins</p>
        </div>

        <div className="card p-3.5 bg-gradient-to-br from-rose-50 to-red-50 border-rose-100">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Upcoming Out</p>
          <p className="text-xl font-bold text-rose-950 mt-0.5">{analytics.upcomingCheckOutsCount}</p>
          <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1"><Clock size={10} /> Check-outs</p>
        </div>
      </div>

      {/* FILTER BAR & CONTROLS */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Left Controls: Today / Prev / Next / Title */}
          <div className="flex items-center gap-3">
            <button onClick={handleToday} className="btn-secondary py-1.5 px-3 text-xs font-bold">
              Today
            </button>
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button onClick={handlePrev} className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNext} className="p-1.5 hover:bg-white rounded-lg text-slate-600 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
          </div>

          {/* View Switcher: Month / Week / Day */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setViewMode('month')}
                className={`py-1.5 px-3 rounded-lg transition-all ${
                  viewMode === 'month' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Month View
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`py-1.5 px-3 rounded-lg transition-all ${
                  viewMode === 'week' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Week View
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`py-1.5 px-3 rounded-lg transition-all ${
                  viewMode === 'day' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Day View
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
          <div>
            <label className="label">Filter Property</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="input py-1.5 text-xs"
            >
              <option value="all">All Properties ({properties.length})</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Filter Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input py-1.5 text-xs"
            >
              <option value="all">All Booking Statuses</option>
              <option value="pending">Pending (Yellow)</option>
              <option value="confirmed">Confirmed (Green)</option>
              <option value="checked_in">Checked In (Blue)</option>
              <option value="checked_out">Checked Out (Grey)</option>
              <option value="cancelled">Cancelled (Red)</option>
              <option value="awaiting_approval">Awaiting Approval (Orange)</option>
            </select>
          </div>

          <div>
            <label className="label">Search Guest / ID</label>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                placeholder="Guest name or ID..."
                className="input pl-8 py-1.5 text-xs"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => { setSelectedPropertyId('all'); setSelectedStatus('all'); setGuestSearch(''); }}
              className="btn-secondary py-1.5 px-3 text-xs w-full justify-center gap-1"
            >
              <RefreshCw size={13} /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* CALENDAR LEGEND */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-600 flex items-center gap-1.5">
          <Layers size={14} className="text-blue-600" /> Booking Status Color Legend:
        </span>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> Pending
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Confirmed
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Checked In
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-slate-500" /> Checked Out
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Cancelled
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-3 h-3 rounded-full bg-orange-500" /> Awaiting Approval
          </span>
        </div>
      </div>

      {/* MAIN CALENDAR GRID */}
      <div className="card overflow-hidden shadow-sm relative">

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center font-bold text-slate-600 text-xs py-2.5">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 bg-white">
          {calendarGridDays.map((dateObj, idx) => {
            const dateStr = formatDateKey(dateObj);
            const isToday = dateStr === formatDateKey(new Date());
            const isCurrentMonth = dateObj.getMonth() === month;
            const dayBookings = getBookingsForDate(dateStr);

            return (
              <div
                key={idx}
                onClick={() => openAddForDate(dateStr)}
                className={`min-h-[120px] p-1.5 transition-colors relative group ${
                  !isCurrentMonth ? 'bg-slate-50/60 opacity-60' : 'hover:bg-blue-50/30'
                }`}
              >
                {/* Date Number Badge */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {dateObj.getDate()}
                  </span>
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                    + Add
                  </span>
                </div>

                {/* Day Booking Pills */}
                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map((b) => {
                    const colorStyle = (b.status && STATUS_COLORS[b.status]) || STATUS_COLORS.pending;
                    return (
                      <div
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(b);
                        }}
                        onContextMenu={(e) => handleContextMenu(e, b)}
                        onMouseEnter={(e) => setHoveredBooking({ booking: b, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredBooking(null)}
                        className={`${colorStyle.bg} ${colorStyle.text} text-[11px] p-1.5 rounded-lg shadow-xs cursor-pointer truncate font-medium border ${colorStyle.border} transition-all hover:scale-[1.02]`}
                      >
                        <p className="font-bold truncate leading-none">{b.guest_name || 'Guest'}</p>
                        <p className="text-[10px] opacity-90 truncate mt-0.5 leading-none">{b.property_name || 'Property'}</p>
                      </div>
                    );
                  })}

                  {dayBookings.length > 3 && (
                    <p className="text-[10px] font-bold text-blue-600 text-center pt-0.5">
                      +{dayBookings.length - 3} more booking(s)
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HOVER TOOLTIP */}
      {hoveredBooking && hoveredBooking.booking && (
        <div
          style={{ top: hoveredBooking.y + 12, left: hoveredBooking.x + 12 }}
          className="fixed z-50 bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1 pointer-events-none w-56 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-1">
            <span className="font-bold text-blue-300 truncate">{hoveredBooking.booking.guest_name || 'Guest'}</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-blue-600/30 rounded text-blue-200">
              {hoveredBooking.booking.status || 'pending'}
            </span>
          </div>
          <p className="text-slate-300 font-medium truncate flex items-center gap-1">
            <Home size={11} /> {hoveredBooking.booking.property_name || 'Property'}
          </p>
          <p className="text-slate-400 text-[11px] flex items-center gap-1">
            <CalendarIcon size={11} /> {hoveredBooking.booking.check_in || 'N/A'} → {hoveredBooking.booking.check_out || 'N/A'}
          </p>
          <p className="text-emerald-400 font-bold text-xs pt-1 border-t border-slate-800">
            Total: {CURRENCY}{(hoveredBooking.booking.total_amount || 0).toLocaleString()}
          </p>
        </div>
      )}

      {/* RIGHT-CLICK CONTEXT MENU */}
      {contextMenu && contextMenu.booking && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-2xl py-1.5 text-xs w-48 font-medium animate-fade-in"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 font-bold text-slate-800 truncate">
            {contextMenu.booking.guest_name || 'Guest'}
          </div>
          <button
            onClick={() => { setSelectedBooking(contextMenu.booking); setContextMenu(null); }}
            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
          >
            <Eye size={13} /> View Booking Details
          </button>
          <button
            onClick={() => { openEditBooking(contextMenu.booking); setContextMenu(null); }}
            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
          >
            <Edit3 size={13} /> Edit Booking
          </button>
          <button
            onClick={() => handleOpenReschedule(contextMenu.booking)}
            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
          >
            <Move size={13} /> Move / Reschedule Dates
          </button>
          <button
            onClick={() => handleQuickStatusChange(contextMenu.booking.id, 'checked_in')}
            className="w-full px-3 py-1.5 text-left hover:bg-blue-50 text-blue-600 flex items-center gap-2"
          >
            <CheckCircle2 size={13} /> Mark Checked In
          </button>
          <button
            onClick={() => handleQuickStatusChange(contextMenu.booking.id, 'checked_out')}
            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 text-slate-600 flex items-center gap-2"
          >
            <CheckCircle2 size={13} /> Mark Checked Out
          </button>
          <button
            onClick={() => handleQuickStatusChange(contextMenu.booking.id, 'cancelled')}
            className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
          >
            <X size={13} /> Cancel Booking
          </button>
          <button
            onClick={async () => {
              const b = contextMenu.booking;
              setContextMenu(null);
              await generateBookingPDF(b, user?.full_name || 'Admin');
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
          >
            <Download size={13} /> Download PDF Receipt
          </button>
          <button
            onClick={() => { setDeleteTarget(contextMenu.booking); setContextMenu(null); }}
            className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-slate-100"
          >
            <Trash2 size={13} /> Delete Booking
          </button>
        </div>
      )}

      {/* DAY DETAILS / BOOKING DETAIL MODAL */}
      {selectedBooking && (
        <BookingCalendarDetailModal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
          property={properties.find((p) => p.id === selectedBooking.property_id)}
          onEdit={openEditBooking}
          onDelete={(b) => setDeleteTarget(b)}
        />
      )}

      {/* RESCHEDULE / MOVE DATES MODAL */}
      {rescheduleBooking && (
        <Modal isOpen={!!rescheduleBooking} onClose={() => setRescheduleBooking(null)} title="Reschedule Booking Dates" size="md">
          <div className="space-y-4 text-xs">
            {rescheduleError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle size={16} /> {rescheduleError}
              </div>
            )}
            <p className="text-slate-600">
              Reschedule dates for <span className="font-bold text-slate-900">{rescheduleBooking.guest_name || 'Guest'}</span> at{' '}
              <span className="font-bold text-slate-900">{rescheduleBooking.property_name || 'Property'}</span>.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">New Check-in Date</label>
                <input
                  type="date"
                  className="input"
                  value={newCheckIn}
                  onChange={(e) => { setNewCheckIn(e.target.value); setRescheduleError(null); }}
                />
              </div>
              <div>
                <label className="label">New Check-out Date</label>
                <input
                  type="date"
                  className="input"
                  value={newCheckOut}
                  onChange={(e) => { setNewCheckOut(e.target.value); setRescheduleError(null); }}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSaveReschedule} className="btn-primary flex-1 justify-center">
                Save New Dates
              </button>
              <button onClick={() => setRescheduleBooking(null)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE / EDIT BOOKING MODAL */}
      {showFormModal && (
        <Modal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          title={editingId ? 'Edit Reservation' : 'Create New Reservation'}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle size={16} /> {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Property</label>
                <select
                  className="input"
                  value={form.property_id}
                  onChange={(e) => setForm((f) => ({ ...f, property_id: e.target.value }))}
                >
                  <option value="">Select Property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Guest Name</label>
                <input
                  className="input"
                  value={form.guest_name}
                  onChange={(e) => setForm((f) => ({ ...f, guest_name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="label">Guest Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.guest_email}
                  onChange={(e) => setForm((f) => ({ ...f, guest_email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="label">Guest Phone</label>
                <input
                  className="input"
                  value={form.guest_phone}
                  onChange={(e) => setForm((f) => ({ ...f, guest_phone: e.target.value }))}
                  placeholder="+1 555-0100"
                />
              </div>

              <div>
                <label className="label">Check-in Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.check_in}
                  onChange={(e) => { setForm((f) => ({ ...f, check_in: e.target.value })); setFormError(null); }}
                />
              </div>

              <div>
                <label className="label">Check-out Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.check_out}
                  onChange={(e) => { setForm((f) => ({ ...f, check_out: e.target.value })); setFormError(null); }}
                />
              </div>

              <div>
                <label className="label">Booking Status</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Booking['status'] }))}
                >
                  <option value="pending">Pending (Yellow)</option>
                  <option value="confirmed">Confirmed (Green)</option>
                  <option value="checked_in">Checked In (Blue)</option>
                  <option value="checked_out">Checked Out (Grey)</option>
                  <option value="cancelled">Cancelled (Red)</option>
                  <option value="awaiting_approval">Awaiting Approval (Orange)</option>
                </select>
              </div>

              <div>
                <label className="label">Total Amount ({CURRENCY})</label>
                <input
                  type="number"
                  className="input"
                  value={form.total_amount}
                  onChange={(e) => setForm((f) => ({ ...f, total_amount: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="label">Advance Paid ({CURRENCY})</label>
                <input
                  type="number"
                  className="input"
                  value={form.advance_paid}
                  onChange={(e) => setForm((f) => ({ ...f, advance_paid: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="label">ID Proof Type</label>
                <select
                  className="input"
                  value={form.id_proof_type}
                  onChange={(e) => setForm((f) => ({ ...f, id_proof_type: e.target.value }))}
                >
                  <option>Passport</option>
                  <option>Driver's License</option>
                  <option>National ID</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="label">ID Proof Number</label>
                <input
                  className="input"
                  value={form.id_proof_number}
                  onChange={(e) => setForm((f) => ({ ...f, id_proof_number: e.target.value }))}
                  placeholder="ID Number..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label mb-1.5 block">ID Proof Document Upload</label>
                <IdProofUpload
                  selectedFile={selectedFile}
                  onFileSelect={(file) => {
                    setSelectedFile(file);
                    if (file) setRemoveFile(false);
                  }}
                  onRemoveExisting={() => {
                    setSelectedFile(null);
                    setRemoveFile(true);
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleFormSubmit} className="btn-primary flex-1 justify-center">
                {editingId ? 'Save Reservation' : 'Create Reservation'}
              </button>
              <button onClick={() => setShowFormModal(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Reservation" size="sm">
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Are you sure you want to delete the reservation for{' '}
              <span className="font-bold text-slate-900">{deleteTarget.guest_name || 'Guest'}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await deleteBooking(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="btn-danger flex-1 justify-center"
              >
                <Trash2 size={14} /> Delete
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
