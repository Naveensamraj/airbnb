import { useState } from 'react';
import { Euro, TrendingUp, TrendingDown, Filter, Download, CreditCard, Plus, Trash2 } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import { BarChart } from '../../components/ui/Chart';
import Badge from '../../components/ui/Badge';
import { useData } from '../../context/DataContext';
import { CURRENCY } from '../../lib/types';

const METHOD_LABELS: Record<string, string> = { cash: 'Cash', upi: 'UPI', card: 'Card', bank_transfer: 'Bank Transfer' };
const TYPE_COLORS: Record<string, string> = {
  advance: 'info', balance: 'success', deposit: 'default',
  refund: 'purple', penalty: 'error', damage: 'error', extra: 'warning',
};

export default function Finance() {
  const { payments, expenses, addExpense, deleteExpense } = useData();
  const [tab, setTab] = useState<'income' | 'expenses'>('income');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ property_name: '', category: 'maintenance' as const, amount: 0, description: '', expense_date: new Date().toISOString().slice(0, 10) });

  const totalIncome = payments.filter(p => !['refund'].includes(p.type) && p.status === 'completed')
    .reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalRefunds = payments.filter(p => p.type === 'refund').reduce((s, p) => s + p.amount, 0);
  const profit = totalIncome - totalExpenses - totalRefunds;

  const filteredPayments = payments.filter(p =>
    methodFilter === 'all' || p.method === methodFilter
  );

  const handleAddExpense = () => {
    if (!expenseForm.property_name || !expenseForm.amount) return;
    addExpense({ ...expenseForm, property_id: 'manual' });
    setShowExpenseModal(false);
    setExpenseForm({ property_name: '', category: 'maintenance' as const, amount: 0, description: '', expense_date: new Date().toISOString().slice(0, 10) });
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={totalIncome} icon={Euro} color="emerald" prefix="€" trend={18} trendLabel="vs last month" />
        <StatCard title="Total Expenses" value={totalExpenses} icon={TrendingDown} color="red" prefix="€" />
        <StatCard title="Refunds Issued" value={totalRefunds} icon={CreditCard} color="amber" prefix="€" />
        <StatCard title="Net Profit" value={profit} icon={TrendingUp} color="blue" prefix="€" trend={12} trendLabel="margin" />
      </div>

      {/* Revenue chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Revenue vs Expenses</p>
            <p className="text-xs text-slate-500">Monthly breakdown</p>
          </div>
          <button className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
            <Download size={13} /> Export
          </button>
        </div>
        <BarChart
          data={REVENUE_DATA.map(d => ({ label: d.month, value: d.revenue, value2: d.expenses }))}
          color="#10b981"
          color2="#ef4444"
          height={160}
          showLegend
          legend1="Revenue"
          legend2="Expenses"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(['income', 'expenses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'income' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900">Payment Transactions</p>
            <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
              className="input w-auto px-2 py-1 text-xs">
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Receipt #</th>
                <th className="table-th">Guest</th>
                <th className="table-th">Property</th>
                <th className="table-th">Type</th>
                <th className="table-th">Method</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Date</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td font-mono text-xs">{p.receipt_number || p.id.slice(0, 10)}</td>
                  <td className="table-td font-medium">{p.guest_name}</td>
                  <td className="table-td text-slate-500 text-xs">{p.property_name}</td>
                  <td className="table-td">
                    <Badge label={p.type} variant={(TYPE_COLORS[p.type] as any) ?? 'default'} />
                  </td>
                  <td className="table-td text-xs">{METHOD_LABELS[p.method]}</td>
                  <td className="table-td">
                    <span className={`font-semibold ${p.type === 'refund' ? 'text-red-600' : 'text-emerald-700'}`}>
                      {p.type === 'refund' ? '-' : '+'}{CURRENCY}{p.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="table-td text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="table-td">
                    <Badge
                      label={p.status}
                      variant={p.status === 'completed' ? 'success' : p.status === 'failed' ? 'error' : 'warning'}
                      dot
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900">Expense Records</p>
            <button onClick={() => setShowExpenseModal(true)} className="btn-primary py-1.5 px-3 text-xs gap-1.5"><Plus size={13} /> Add Expense</button>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-th">Property</th>
                <th className="table-th">Category</th>
                <th className="table-th">Description</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Date</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td font-medium">{e.property_name}</td>
                  <td className="table-td">
                    <Badge label={e.category} variant="warning" />
                  </td>
                  <td className="table-td text-slate-500 text-xs">{e.description}</td>
                  <td className="table-td font-semibold text-red-600">-{CURRENCY}{e.amount.toLocaleString()}</td>
                  <td className="table-td text-xs">{e.expense_date}</td>
                  <td className="table-td">
                    <button onClick={() => deleteExpense(e.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
      {showExpenseModal && (
        <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Add Expense" size="md">
          <div className="space-y-4">
            <div>
              <label className="label">Property Name</label>
              <input className="input" value={expenseForm.property_name}
                onChange={e => setExpenseForm(f => ({ ...f, property_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={expenseForm.category}
                onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value as any }))}>
                {['maintenance', 'electricity', 'water', 'cleaning', 'repairs', 'salary', 'misc'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Amount ({CURRENCY})</label>
              <input className="input" type="number" value={expenseForm.amount}
                onChange={e => setExpenseForm(f => ({ ...f, amount: +e.target.value }))} />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="input" value={expenseForm.description}
                onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={expenseForm.expense_date}
                onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleAddExpense} className="btn-primary flex-1 justify-center">Add Expense</button>
              <button onClick={() => setShowExpenseModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
