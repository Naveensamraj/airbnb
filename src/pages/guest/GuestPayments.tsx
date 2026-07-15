import { CreditCard, DollarSign, TrendingDown, Receipt } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { PAYMENTS, BOOKINGS } from '../../lib/mockData';

const GUEST_ID = 'guest-001';
const METHOD_LABELS: Record<string, string> = { cash: 'Cash', upi: 'UPI', card: 'Card', bank_transfer: 'Bank Transfer' };

export default function GuestPayments() {
  const myBookingIds = BOOKINGS.filter(b => b.guest_id === GUEST_ID).map(b => b.id);
  const myPayments = PAYMENTS.filter(p => myBookingIds.includes(p.booking_id) || p.guest_name === 'James Carter');

  const totalPaid = myPayments.filter(p => p.type !== 'refund' && p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const totalRefunded = myPayments.filter(p => p.type === 'refund').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 bg-emerald-50 text-emerald-700">
          <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
          <p className="text-xs mt-1">Total Paid</p>
        </div>
        <div className="card p-4 bg-red-50 text-red-600">
          <p className="text-2xl font-bold">${totalRefunded.toLocaleString()}</p>
          <p className="text-xs mt-1">Refunded</p>
        </div>
        <div className="card p-4 bg-blue-50 text-blue-700">
          <p className="text-2xl font-bold">{myPayments.length}</p>
          <p className="text-xs mt-1">Transactions</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-900">Payment History</p>
        </div>
        <div className="divide-y divide-slate-100">
          {myPayments.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                p.type === 'refund' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {p.type === 'refund' ? <TrendingDown size={16} /> : <DollarSign size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{p.property_name}</p>
                <p className="text-xs text-slate-500">{METHOD_LABELS[p.method]} · {p.receipt_number || p.id.slice(0, 14)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${p.type === 'refund' ? 'text-red-600' : 'text-emerald-700'}`}>
                  {p.type === 'refund' ? '+' : '-'}${p.amount.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400">{new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <Badge
                label={p.status}
                variant={p.status === 'completed' ? 'success' : p.status === 'failed' ? 'error' : 'warning'}
              />
            </div>
          ))}
          {myPayments.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">No payments yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
