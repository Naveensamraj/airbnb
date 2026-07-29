import jsPDF from 'jspdf';
import { Booking, Guest, Expense, CURRENCY } from './types';

const BRAND = '#1e40af'; // Deep blue header
const BRAND_SECONDARY = '#3b82f6';
const DARK = '#0f172a';
const MUTED = '#475569';
const LIGHT = '#f8fafc';
const BORDER_COLOR = '#e2e8f0';

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function nights(b: Booking): number {
  const d1 = new Date(b.check_in);
  const d2 = new Date(b.check_out);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 1;
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000));
}

async function getImageDataUrl(fileUrl: string): Promise<{ dataUrl: string; format: 'JPEG' | 'PNG' } | null> {
  try {
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:5000${fileUrl}`;
    const res = await fetch(fullUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    const mime = blob.type.toLowerCase();

    let format: 'JPEG' | 'PNG' = 'JPEG';
    if (mime.includes('png')) format = 'PNG';

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve({ dataUrl: reader.result, format });
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(BRAND);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#ffffff');
  doc.text(text.toUpperCase(), 18, y + 5);
  return y + 10;
}

function tableRow(
  doc: jsPDF,
  label1: string,
  val1: string,
  label2: string,
  val2: string,
  y: number,
  isAlt = false
): number {
  if (isAlt) {
    doc.setFillColor(LIGHT);
    doc.rect(14, y - 4, 182, 7, 'F');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  doc.text(label1, 18, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DARK);
  doc.text(val1 || 'N/A', 60, y);

  if (label2) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(MUTED);
    doc.text(label2, 110, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    doc.text(val2 || 'N/A', 150, y);
  }

  return y + 7;
}

export async function generateBookingPDF(booking: Booking, adminName = 'Logged-in Admin') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  // ==========================================
  // SECTION 1: HEADER & STAYPRO BRANDING
  // ==========================================
  doc.setFillColor(BRAND);
  doc.rect(0, 0, 210, 32, 'F');

  // Logo Graphic
  doc.setFillColor('#ffffff');
  doc.roundedRect(14, 6, 20, 20, 3, 3, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND);
  doc.text('SP', 19, 19);

  // Title
  doc.setTextColor('#ffffff');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('StayPro Rental Manager', 39, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Booking Receipt & Summary', 39, 21);

  doc.setFontSize(8);
  doc.text(`Booking ID: ${booking.id}`, 39, 27);

  // Top Right Info Box
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT DATE:', 150, 13);
  doc.setFont('helvetica', 'normal');
  const bookingCreatedDate = booking.created_at ? new Date(booking.created_at).toLocaleDateString() : dateStr;
  doc.text(bookingCreatedDate, 178, 13);

  doc.setFont('helvetica', 'bold');
  doc.text('STATUS:', 150, 20);
  doc.setFont('helvetica', 'bold');
  const statusUpper = statusLabel(booking.status).toUpperCase();
  if (['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'APPROVED'].includes(statusUpper)) {
    doc.setTextColor('#86efac'); // Light green
  } else if (['CANCELLED', 'REJECTED'].includes(statusUpper)) {
    doc.setTextColor('#fca5a5'); // Light red
  } else {
    doc.setTextColor('#fde047'); // Yellow
  }
  doc.text(statusUpper, 178, 20);

  let y = 40;

  // ==========================================
  // SECTION 2: GUEST INFORMATION
  // ==========================================
  y = sectionTitle(doc, 'Section 1: Guest Information', y);
  y = tableRow(doc, 'Full Name:', booking.guest_name, 'Email:', booking.guest_email, y, true);
  y = tableRow(doc, 'Phone Number:', booking.guest_phone || 'N/A', 'Address:', 'Registered Guest Address', y, false);
  y += 3;

  // ==========================================
  // SECTION 3: PROPERTY INFORMATION
  // ==========================================
  y = sectionTitle(doc, 'Section 2: Property Information', y);
  y = tableRow(doc, 'Property Name:', booking.property_name, 'Property Type:', 'Luxury Vacation Rental', y, true);
  y = tableRow(doc, 'Property Owner:', 'StayPro Management', 'Daily Rate:', `${CURRENCY}${booking.total_amount ? (booking.total_amount / nights(booking)).toFixed(2) : '0'} / night`, y, false);
  y += 3;

  // ==========================================
  // SECTION 4: BOOKING INFORMATION
  // ==========================================
  y = sectionTitle(doc, 'Section 3: Booking Information', y);
  y = tableRow(doc, 'Check-in Date:', booking.check_in, 'Check-out Date:', booking.check_out, y, true);
  y = tableRow(doc, 'Number of Nights:', `${nights(booking)} Night(s)`, 'Number of Guests:', `${booking.num_guests} Guest(s)`, y, false);
  y = tableRow(doc, 'Booking Status:', statusLabel(booking.status), '', '', y, true);
  y += 3;

  // ==========================================
  // SECTION 5: PAYMENT INFORMATION
  // ==========================================
  y = sectionTitle(doc, 'Section 4: Payment Information', y);
  y = tableRow(doc, 'Total Amount:', `${CURRENCY}${booking.total_amount.toLocaleString()}`, 'Advance Paid:', `${CURRENCY}${booking.advance_paid.toLocaleString()}`, y, true);
  const paymentStatusStr = booking.balance_due <= 0 ? 'Paid in Full' : booking.advance_paid > 0 ? 'Partial / Advance Paid' : 'Pending Payment';
  y = tableRow(doc, 'Balance Due:', `${CURRENCY}${booking.balance_due.toLocaleString()}`, 'Payment Status:', paymentStatusStr, y, false);
  y += 3;

  // ==========================================
  // SECTION 6: IDENTITY VERIFICATION
  // ==========================================
  y = sectionTitle(doc, 'Section 5: Identity Verification', y);
  y = tableRow(doc, 'ID Proof Type:', booking.id_proof_type || 'N/A', 'ID Proof Number:', booking.id_proof_number || 'N/A', y, true);

  const fileName = booking.id_proof_original_name || (booking.id_proof_file ? booking.id_proof_file.split('/').pop() : 'N/A') || 'N/A';
  y = tableRow(doc, 'Uploaded File Name:', fileName, '', '', y, false);

  if (booking.id_proof_file) {
    const isImage = booking.id_proof_mime_type?.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp)$/i.test(booking.id_proof_file);

    if (isImage) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED);
      doc.text('ID Proof Thumbnail:', 18, y + 2);

      const imageData = await getImageDataUrl(booking.id_proof_file);
      if (imageData) {
        try {
          doc.addImage(imageData.dataUrl, imageData.format, 60, y - 2, 35, 25);
          y += 28;
        } catch {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(DARK);
          doc.text('(Thumbnail unavailable)', 60, y + 2);
          y += 8;
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(DARK);
        doc.text('(Document preview attached below)', 60, y + 2);
        y += 8;
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED);
      doc.text('Verification Note:', 18, y + 1);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(BRAND);
      doc.text('Identity document attached in system.', 60, y + 1);
      y += 7;
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED);
    doc.text('Verification Status:', 18, y + 1);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED);
    doc.text('No identity document uploaded.', 60, y + 1);
    y += 7;
  }
  y += 2;

  // ==========================================
  // SECTION 7: ADDITIONAL NOTES
  // ==========================================
  y = sectionTitle(doc, 'Section 6: Additional Notes', y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(DARK);

  const notesText = booking.notes || 'No additional notes provided for this booking record.';
  const splitNotes = doc.splitTextToSize(notesText, 174);
  doc.text(splitNotes, 18, y);
  y += splitNotes.length * 5 + 4;

  // Check if we need to avoid running past bottom margin before footer
  if (y > 255) {
    doc.addPage();
    y = 20;
  }

  // ==========================================
  // SECTION 8: FOOTER & CONFIDENTIALITY
  // ==========================================
  const footerY = 275;
  doc.setDrawColor(BORDER_COLOR);
  doc.line(14, footerY - 5, 196, footerY - 5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND);
  doc.text('StayPro Rental Manager', 14, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED);
  doc.text(`Generated: ${dateStr} at ${timeStr} | Generated By: ${adminName}`, 14, footerY + 4);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#ef4444'); // Red notice
  doc.text('CONFIDENTIAL DOCUMENT', 196, footerY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED);
  doc.text('Page 1 of 1', 196, footerY + 4, { align: 'right' });

  doc.save(`booking-receipt-${booking.id}.pdf`);
}

export function generateAllBookingsPDF(bookings: Booking[]) {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString();

  doc.setFillColor(BRAND);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('All Bookings Report', 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`StayPro Rental Manager | Total Bookings: ${bookings.length}`, 14, 20);
  doc.setFontSize(8);
  doc.text(`Generated Date: ${dateStr}`, 14, 25);

  let y = 36;

  const cols = [
    { header: 'Booking ID', x: 14 },
    { header: 'Guest Name', x: 42 },
    { header: 'Property', x: 82 },
    { header: 'Check-in', x: 122 },
    { header: 'Check-out', x: 146 },
    { header: 'ID Type', x: 170 },
    { header: 'ID Number', x: 188 },
  ];

  doc.setFillColor(BRAND_SECONDARY);
  doc.rect(14, y - 4, 182, 7, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#ffffff');
  cols.forEach((c) => doc.text(c.header, c.x, y + 1));
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  bookings.forEach((b, i) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
      doc.setFillColor(BRAND_SECONDARY);
      doc.rect(14, y - 4, 182, 7, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#ffffff');
      cols.forEach((c) => doc.text(c.header, c.x, y + 1));
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
    }
    if (i % 2 === 1) {
      doc.setFillColor(LIGHT);
      doc.rect(14, y - 4, 182, 6, 'F');
    }
    doc.setTextColor(DARK);
    doc.text(b.id, cols[0].x, y);
    doc.text((b.guest_name || '').slice(0, 22), cols[1].x, y);
    doc.text((b.property_name || '').slice(0, 20), cols[2].x, y);
    doc.text(b.check_in || '-', cols[3].x, y);
    doc.text(b.check_out || '-', cols[4].x, y);
    doc.text((b.id_proof_type || 'N/A').slice(0, 10), cols[5].x, y);
    doc.text((b.id_proof_number || 'N/A').slice(0, 10), cols[6].x, y);
    y += 6;
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(230);
    doc.line(14, 285, 196, 285);
    doc.setFontSize(7);
    doc.setTextColor(MUTED);
    doc.text('StayPro - Property Rental Manager | Confidential', 14, 290);
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: 'right' });
  }

  doc.save('all-bookings-report.pdf');
}

export async function generateGuestPDF(guest: Guest, guestBookings: Booking[] = [], adminName = 'Logged-in Admin') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  // Banner Header
  doc.setFillColor(BRAND);
  doc.rect(0, 0, 210, 32, 'F');

  // Logo
  doc.setFillColor('#ffffff');
  doc.roundedRect(14, 6, 20, 20, 3, 3, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND);
  doc.text('SP', 19, 19);

  doc.setTextColor('#ffffff');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('StayPro Rental Manager', 39, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Guest Profile & Dossier', 39, 21);

  doc.setFontSize(8);
  doc.text(`Guest ID: ${guest.id}`, 39, 27);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORT DATE:', 145, 13);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, 175, 13);

  doc.setFont('helvetica', 'bold');
  doc.text('GUEST STATUS:', 145, 20);
  const statusUpper = (guest.status || 'active').toUpperCase();
  if (statusUpper === 'ACTIVE') {
    doc.setTextColor('#86efac');
  } else if (statusUpper === 'BLACKLISTED') {
    doc.setTextColor('#fca5a5');
  } else {
    doc.setTextColor('#fde047');
  }
  doc.text(statusUpper, 175, 20);

  let y = 38;

  // SECTION 1: OVERVIEW
  y = sectionTitle(doc, 'Section 1: Guest Overview & Profile', y);
  y = tableRow(doc, 'Full Name:', guest.name, 'Guest ID:', guest.id, y, true);
  y = tableRow(doc, 'Status:', statusLabel(guest.status || 'active'), 'Registration Date:', guest.lifetime_since || 'N/A', y, false);
  y += 2;

  // SECTION 2: CONTACT
  y = sectionTitle(doc, 'Section 2: Contact Information', y);
  y = tableRow(doc, 'Full Name:', guest.name, 'Email Address:', guest.email || 'N/A', y, true);
  y = tableRow(doc, 'Phone Number:', guest.phone || 'N/A', 'Alt Phone:', guest.alt_phone || 'N/A', y, false);
  const fullAddress = [guest.address, guest.city, guest.state, guest.country, guest.postal_code].filter(Boolean).join(', ') || 'N/A';
  y = tableRow(doc, 'Full Address:', fullAddress, '', '', y, true);
  y = tableRow(doc, 'Emergency Contact:', guest.emergency_contact_name || 'N/A', 'Emergency Phone:', guest.emergency_contact_phone || 'N/A', y, false);
  y += 2;

  // SECTION 3: IDENTITY DETAILS
  y = sectionTitle(doc, 'Section 3: Identity Verification', y);
  y = tableRow(doc, 'ID Proof Type:', guest.id_proof_type || 'Passport', 'ID Proof Number:', guest.id_proof_number || 'N/A', y, true);
  const fileName = guest.id_proof_original_name || (guest.id_proof_file ? guest.id_proof_file.split('/').pop() : 'N/A') || 'N/A';
  y = tableRow(doc, 'Uploaded Document:', fileName, '', '', y, false);

  if (guest.id_proof_file) {
    const isImage = guest.id_proof_mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(guest.id_proof_file);
    if (isImage) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED);
      doc.text('ID Proof Preview:', 18, y + 2);

      const imageData = await getImageDataUrl(guest.id_proof_file);
      if (imageData) {
        try {
          doc.addImage(imageData.dataUrl, imageData.format, 60, y - 2, 35, 25);
          y += 28;
        } catch {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(DARK);
          doc.text('(Preview image attached in system)', 60, y + 2);
          y += 8;
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(DARK);
        doc.text('(Document preview attached in system)', 60, y + 2);
        y += 8;
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED);
      doc.text('Verification Note:', 18, y + 1);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(BRAND);
      doc.text('Identity document attached in system.', 60, y + 1);
      y += 7;
    }
  }
  y += 2;

  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  // SECTION 4: BOOKING HISTORY
  y = sectionTitle(doc, 'Section 4: Booking History & Stay Details', y);
  y = tableRow(doc, 'Total Bookings:', String(guest.total_bookings), 'Active Bookings:', String(guest.active_bookings || 0), y, true);
  y = tableRow(doc, 'Completed Bookings:', String(guest.completed_bookings || 0), 'Cancelled Bookings:', String(guest.cancelled_bookings || 0), y, false);
  y = tableRow(doc, 'Pending Bookings:', String(guest.pending_bookings || 0), 'Total Nights Stayed:', `${guest.total_nights_stayed || 0} Night(s)`, y, true);
  y = tableRow(doc, 'Last Booking Date:', guest.last_booking_date || 'N/A', 'Favourite Property:', guest.favourite_property || 'N/A', y, false);
  y += 2;

  if (guestBookings.length > 0) {
    const cols = [
      { header: 'Property', x: 18 },
      { header: 'Check-in', x: 80 },
      { header: 'Check-out', x: 110 },
      { header: 'Status', x: 140 },
      { header: 'Amount', x: 175 },
    ];
    doc.setFillColor(BRAND_SECONDARY);
    doc.rect(14, y, 182, 6, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#ffffff');
    cols.forEach((c) => doc.text(c.header, c.x, y + 4));
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    guestBookings.forEach((b, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      if (i % 2 === 1) {
        doc.setFillColor(LIGHT);
        doc.rect(14, y - 3, 182, 6, 'F');
      }
      doc.setTextColor(DARK);
      doc.text((b.property_name || '').slice(0, 28), cols[0].x, y);
      doc.text(b.check_in || '-', cols[1].x, y);
      doc.text(b.check_out || '-', cols[2].x, y);
      doc.text(statusLabel(b.status || ''), cols[3].x, y);
      doc.text(`${CURRENCY}${b.total_amount.toLocaleString()}`, cols[4].x, y);
      y += 6;
    });
    y += 2;
  }

  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  // SECTION 5: PAYMENT SUMMARY
  y = sectionTitle(doc, 'Section 5: Payment Summary', y);
  y = tableRow(doc, 'Total Paid:', `${CURRENCY}${(guest.total_paid || 0).toLocaleString()}`, 'Advance Paid:', `${CURRENCY}${(guest.advance_paid || 0).toLocaleString()}`, y, true);
  y = tableRow(doc, 'Outstanding Balance:', `${CURRENCY}${(guest.outstanding_balance || 0).toLocaleString()}`, 'Preferred Method:', guest.preferred_payment_method || 'UPI', y, false);
  y += 2;

  // SECTION 6: STATISTICS
  y = sectionTitle(doc, 'Section 6: Lifetime Statistics', y);
  y = tableRow(doc, 'Total Money Spent:', `${CURRENCY}${guest.total_spent.toLocaleString()}`, 'Avg Booking Value:', `${CURRENCY}${(guest.avg_booking_value || 0).toLocaleString()}`, y, true);
  y = tableRow(doc, 'Avg Stay Duration:', `${guest.avg_stay_duration || 0} Night(s)`, 'Customer Since:', guest.lifetime_since || 'N/A', y, false);
  y += 2;

  // SECTION 7: NOTES
  y = sectionTitle(doc, 'Section 7: Guest & Admin Notes', y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  doc.text('Guest Notes:', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DARK);
  const guestNotesText = guest.guest_notes || 'No guest notes recorded.';
  doc.text(doc.splitTextToSize(guestNotesText, 130), 60, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(MUTED);
  doc.text('Internal Admin Notes:', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DARK);
  const adminNotesText = guest.admin_notes || 'No internal admin notes recorded.';
  doc.text(doc.splitTextToSize(adminNotesText, 130), 60, y);
  y += 10;

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = 285;
    doc.setDrawColor(BORDER_COLOR);
    doc.line(14, footerY - 4, 196, footerY - 4);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND);
    doc.text('StayPro Rental Manager - Confidential Guest Dossier', 14, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED);
    doc.text(`Generated: ${dateStr} at ${timeStr} | Generated By: ${adminName}`, 14, footerY + 4);

    doc.text(`Page ${i} of ${pageCount}`, 196, footerY + 4, { align: 'right' });
  }

  doc.save(`guest-profile-${guest.id}.pdf`);
}

export function generateExpensePDF(expenses: Expense[], adminName = 'Admin') {
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Header Banner
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('StayPro Rental Manager', 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Expense Summary Report', 14, 22);

  // Metadata Box
  doc.setTextColor(MUTED);
  doc.setFontSize(8.5);
  doc.text(`Generated: ${dateStr} at ${timeStr} | By: ${adminName}`, 196, 15, { align: 'right' });
  doc.text(`Total Expense Items: ${expenses.length}`, 196, 22, { align: 'right' });

  let y = 38;

  // Financial Total Summary
  const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 16, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK);
  doc.text('FINANCIAL SUMMARY:', 20, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED);
  doc.text(`Records: ${expenses.length}`, 80, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#dc2626');
  doc.text(`Total Expenses: ${CURRENCY}${totalAmount.toLocaleString()}`, 190, y + 10, { align: 'right' });

  y += 24;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK);
  doc.text('PROPERTY', 18, y + 5.5);
  doc.text('CATEGORY', 70, y + 5.5);
  doc.text('DESCRIPTION', 115, y + 5.5);
  doc.text('AMOUNT', 160, y + 5.5);
  doc.text('DATE', 190, y + 5.5, { align: 'right' });

  y += 8;

  expenses.forEach((e, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(idx % 2 === 0 ? '#ffffff' : '#f8fafc');
    doc.rect(14, y, 182, 9, 'F');

    const categoryDisplay = e.category === 'other'
      ? (e.custom_category || e.customCategory || 'Other')
      : (e.category ? e.category.charAt(0).toUpperCase() + e.category.slice(1) : 'Misc');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    doc.text((e.property_name || 'General').slice(0, 25), 18, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(e.category === 'other' ? '#2563eb' : DARK);
    doc.text(categoryDisplay.slice(0, 20), 70, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED);
    doc.text((e.description || '-').slice(0, 28), 115, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#dc2626');
    doc.text(`-${CURRENCY}${(e.amount || 0).toLocaleString()}`, 160, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(DARK);
    doc.text(e.expense_date || '-', 190, y + 6, { align: 'right' });

    y += 9;
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED);
    doc.text(`StayPro Expense Report | Page ${i} of ${pageCount}`, 14, 288);
  }

  doc.save('expense-records-report.pdf');
}
