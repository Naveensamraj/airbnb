import jsPDF from 'jspdf';
import { Booking, CURRENCY } from './types';

const BRAND = '#2563eb';
const DARK = '#0f172a';
const MUTED = '#64748b';
const LIGHT = '#f1f5f9';

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function nights(b: Booking): number {
  const d1 = new Date(b.check_in);
  const d2 = new Date(b.check_out);
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000));
}

function drawHeader(doc: jsPDF, title: string, subtitle: string, startY: number): number {
  doc.setFillColor(BRAND);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 20);
  doc.setTextColor(MUTED);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
  return startY;
}

function drawFooter(doc: jsPDF) {
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
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(LIGHT);
  doc.rect(14, y - 4, 182, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(DARK);
  doc.text(text.toUpperCase(), 16, y + 1);
  return y + 8;
}

function fieldLine(doc: jsPDF, label: string, value: string, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(label, 16, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DARK);
  doc.text(value || '-', 70, y);
  return y + 6;
}

export function generateBookingPDF(booking: Booking) {
  const doc = new jsPDF();
  let y = drawHeader(doc, 'Booking Report', `Booking ID: ${booking.id}`, 36);

  y = sectionTitle(doc, 'Guest Information', y);
  y = fieldLine(doc, 'Name:', booking.guest_name, y);
  y = fieldLine(doc, 'Email:', booking.guest_email, y);
  y = fieldLine(doc, 'Phone:', booking.guest_phone, y);
  y = fieldLine(doc, 'ID Proof Type:', booking.id_proof_type, y);
  y = fieldLine(doc, 'ID Proof Number:', booking.id_proof_number, y);
  y += 3;

  y = sectionTitle(doc, 'Stay Details', y);
  y = fieldLine(doc, 'Property:', booking.property_name, y);
  y = fieldLine(doc, 'Check-in:', booking.check_in, y);
  y = fieldLine(doc, 'Check-out:', booking.check_out, y);
  y = fieldLine(doc, 'Nights:', String(nights(booking)), y);
  y = fieldLine(doc, 'Guests:', String(booking.num_guests), y);
  y = fieldLine(doc, 'Vehicle:', booking.vehicle_number || 'N/A', y);
  y += 3;

  y = sectionTitle(doc, 'Payment Summary', y);
  y = fieldLine(doc, 'Total Amount:', `${CURRENCY}${booking.total_amount.toLocaleString()}`, y);
  y = fieldLine(doc, 'Advance Paid:', `${CURRENCY}${booking.advance_paid.toLocaleString()}`, y);
  y = fieldLine(doc, 'Balance Due:', `${CURRENCY}${booking.balance_due.toLocaleString()}`, y);
  y = fieldLine(doc, 'Status:', statusLabel(booking.status), y);
  if (booking.notes) {
    y += 2;
    y = fieldLine(doc, 'Notes:', booking.notes, y);
  }

  drawFooter(doc);
  doc.save(`booking-${booking.id}.pdf`);
}

export function generateAllBookingsPDF(bookings: Booking[]) {
  const doc = new jsPDF();
  let y = drawHeader(doc, 'All Bookings Report', `${bookings.length} booking(s) on record`, 36);

  const cols = [
    { header: 'Booking ID', x: 14, w: 28 },
    { header: 'Guest', x: 42, w: 38 },
    { header: 'Property', x: 80, w: 34 },
    { header: 'Check-in', x: 114, w: 22 },
    { header: 'Check-out', x: 136, w: 22 },
    { header: 'ID Type', x: 158, w: 20 },
    { header: 'ID Number', x: 178, w: 22 },
  ];

  doc.setFillColor(BRAND);
  doc.rect(14, y - 4, 182, 8, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#ffffff');
  cols.forEach(c => doc.text(c.header, c.x, y + 1));
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  bookings.forEach((b, i) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
      doc.setFillColor(BRAND);
      doc.rect(14, y - 4, 182, 8, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#ffffff');
      cols.forEach(c => doc.text(c.header, c.x, y + 1));
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
    }
    if (i % 2 === 1) {
      doc.setFillColor(LIGHT);
      doc.rect(14, y - 4, 182, 6, 'F');
    }
    doc.setTextColor(DARK);
    doc.text(b.id, cols[0].x, y);
    doc.text(b.guest_name.slice(0, 20), cols[1].x, y);
    doc.text(b.property_name.slice(0, 18), cols[2].x, y);
    doc.text(b.check_in, cols[3].x, y);
    doc.text(b.check_out, cols[4].x, y);
    doc.text(b.id_proof_type, cols[5].x, y);
    doc.text(b.id_proof_number, cols[6].x, y);
    y += 6;
  });

  drawFooter(doc);
  doc.save('all-bookings-report.pdf');
}
