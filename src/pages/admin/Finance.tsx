import { useState, useMemo } from 'react';
import {
  Euro, TrendingUp, TrendingDown, Download, CreditCard,
  Plus, Trash2, Edit3, Search, Filter, AlertCircle
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import { BarChart } from '../../components/ui/Chart';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';
import { CURRENCY, Expense, ExpenseCategory } from '../../lib/types';
import { getExpenseCategoryDisplay } from '../../services/mappers';
import { generateExpensePDF } from '../../lib/pdf';
import { useAuth } from '../../context/AuthContext';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', upi: 'UPI', card: 'Card', bank_transfer: 'Bank Transfer'
};

const TYPE_COLORS: Record<string, string> = {
  advance: 'info', balance: 'success', deposit: 'default',
  refund: 'purple', penalty: 'error', damage: 'error', extra: 'warning',
};

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'water', label: 'Water' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'salary', label: 'Salary' },
  { value: 'misc', label: 'Misc' },
  { value: 'other', label: 'Other' },
];

export default function Finance() {
  const { user } = useAuth();
  const { payments, expenses, addExpense, updateExpense, deleteExpense, deletePayment, revenueData } = useData();
  const [tab, setTab] = useState<'income' | 'expenses'>('income');
  const [methodFilter, setMethodFilter] = useState('all');

  // Expense Filters
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseSearch, setExpenseSearch] = useState('');

  // Expense Modal State (for both Add and Edit)
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState<{
    property_name: string;
    category: ExpenseCategory | string;
    custom_category: string;
    amount: number;
    description: string;
    expense_date: string;
  }>({
    property_name: '',
    category: 'maintenance',
    custom_category: '',
    amount: 0,
    description: '',
    expense_date: new Date().toISOString().slice(0, 10),
  });
  const [formError, setFormError] = useState<string | null>(null);

  const financialSummary = useMemo(() => {
    const totalIncome = payments
      .filter((p) => !['refund'].includes(p.type) && p.status === 'completed')
      .reduce((s, p) => s + p.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalRefunds = payments
      .filter((p) => p.type === 'refund')
      .reduce((s, p) => s + p.amount, 0);
    const profit = totalIncome - totalExpenses - totalRefunds;
    return { totalIncome, totalExpenses, totalRefunds, profit };
  }, [payments, expenses]);

  const filteredPayments = useMemo(() => (
    payments.filter((p) => methodFilter === 'all' || p.method === methodFilter)
  ), [payments, methodFilter]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Category filter
      if (expenseCategoryFilter !== 'all') {
        if (expenseCategoryFilter === 'other' && e.category !== 'other') return false;
        if (expenseCategoryFilter !== 'other' && e.category !== expenseCategoryFilter) return false;
      }

      // Search filter (searches Property, Category, Custom Category, Description)
      if (expenseSearch.trim()) {
        const q = expenseSearch.toLowerCase();
        const displayCategory = getExpenseCategoryDisplay(e).toLowerCase();
        const match =
          (e.property_name || '').toLowerCase().includes(q) ||
          (e.category || '').toLowerCase().includes(q) ||
          (e.custom_category || e.customCategory || '').toLowerCase().includes(q) ||
          displayCategory.includes(q) ||
          (e.description || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [expenses, expenseCategoryFilter, expenseSearch]);

  const openAddExpenseModal = () => {
    setEditingExpenseId(null);
    setExpenseForm({
      property_name: '',
      category: 'maintenance',
      custom_category: '',
      amount: 0,
      description: '',
      expense_date: new Date().toISOString().slice(0, 10),
    });
    setFormError(null);
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setExpenseForm({
      property_name: exp.property_name || '',
      category: exp.category || 'maintenance',
      custom_category: exp.custom_category || exp.customCategory || '',
      amount: exp.amount || 0,
      description: exp.description || '',
      expense_date: exp.expense_date || new Date().toISOString().slice(0, 10),
    });
    setFormError(null);
    setShowExpenseModal(true);
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.property_name.trim()) {
      setFormError('Property Name is required.');
      return;
    }
    if (expenseForm.amount <= 0) {
      setFormError('Amount must be greater than 0.');
      return;
    }
    if (expenseForm.category === 'other' && !expenseForm.custom_category.trim()) {
      setFormError('Custom Category is required when Category is "Other".');
      return;
    }

    const payload = {
      property_id: 'manual',
      property_name: expenseForm.property_name.trim(),
      category: expenseForm.category,
      custom_category: expenseForm.category === 'other' ? expenseForm.custom_category.trim() : null,
      customCategory: expenseForm.category === 'other' ? expenseForm.custom_category.trim() : null,
      amount: expenseForm.amount,
      description: expenseForm.description.trim(),
      expense_date: expenseForm.expense_date,
    };

    if (editingExpenseId) {
      await updateExpense(editingExpenseId, payload);
    } else {
      await addExpense(payload);
    }

    setShowExpenseModal(false);
  };

  const handleExportExpensePdf = () => {
    generateExpensePDF(filteredExpenses, user?.full_name || 'Admin');
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={financialSummary.totalIncome} icon={Euro} color="emerald" prefix="€" trend={18} trendLabel="vs last month" />
        <StatCard title="Total Expenses" value={financialSummary.totalExpenses} icon={TrendingDown} color="red" prefix="€" />
        <StatCard title="Refunds Issued" value={financialSummary.totalRefunds} icon={CreditCard} color="amber" prefix="€" />
        <StatCard title="Net Profit" value={financialSummary.profit} icon={TrendingUp} color="blue" prefix="€" trend={12} trendLabel="margin" />
      </div>

      {/* Revenue chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Revenue vs Expenses</p>
            <p className="text-xs text-slate-500">Monthly breakdown</p>
          </div>
          <button onClick={() => generateExpensePDF(expenses, user?.full_name || 'Admin')} className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
            <Download size={13} /> Export PDF
          </button>
        </div>
        <BarChart
          data={revenueData.map((d) => ({ label: d.month, value: d.revenue, value2: d.expenses }))}
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
        {(['income', 'expenses'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'income' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900">Payment Transactions</p>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="input w-auto px-2 py-1 text-xs"
            >
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
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td font-mono text-xs">{p.receipt_number || p.id.slice(0, 10)}</td>
                    <td className="table-td font-medium">{p.guest_name}</td>
                    <td className="table-td text-slate-500 text-xs">{p.property_name}</td>
                    <td className="table-td">
                      <Badge
                        label={p.type}
                        variant={(TYPE_COLORS[p.type] as 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple') ?? 'default'}
                      />
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
                    <td className="table-td">
                      <button
                        onClick={() => deletePayment(p.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                        title="Delete payment"
                      >
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

      {tab === 'expenses' && (
        <div className="card overflow-hidden">
          {/* Header Controls: Search, Filter, Export PDF, Add Expense */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search property, category, description..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="input pl-8 py-1.5 text-xs w-full bg-white"
                />
              </div>

              <div className="flex items-center gap-1">
                <Filter size={13} className="text-slate-400" />
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="input py-1.5 px-2 text-xs w-auto bg-white"
                >
                  <option value="all">All Categories</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExpensePdf}
                className="btn-secondary py-1.5 px-3 text-xs gap-1.5 flex-shrink-0"
                title="Download Expense PDF Report"
              >
                <Download size={13} /> PDF Report
              </button>
              <button
                onClick={openAddExpenseModal}
                className="btn-primary py-1.5 px-3 text-xs gap-1.5 flex-shrink-0"
              >
                <Plus size={13} /> Add Expense
              </button>
            </div>
          </div>

          {/* Expense Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="table-th">Property</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Description</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Date</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs font-medium">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-td font-medium text-slate-900">{e.property_name || 'General Property'}</td>
                      <td className="table-td">
                        <Badge
                          label={getExpenseCategoryDisplay(e)}
                          variant={e.category === 'other' ? 'purple' : 'warning'}
                        />
                      </td>
                      <td className="table-td text-slate-500 text-xs">{e.description || '-'}</td>
                      <td className="table-td font-semibold text-red-600">
                        -{CURRENCY}{(e.amount || 0).toLocaleString()}
                      </td>
                      <td className="table-td text-xs text-slate-600">{e.expense_date}</td>
                      <td className="table-td">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditExpenseModal(e)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Edit Expense"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => deleteExpense(e.id)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT EXPENSE MODAL */}
      {showExpenseModal && (
        <Modal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          title={editingExpenseId ? 'Edit Expense' : 'Add Expense'}
          size="md"
        >
          <div className="space-y-4 text-xs">
            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle size={15} /> {formError}
              </div>
            )}

            <div>
              <label className="label">Property Name <span className="text-red-500">*</span></label>
              <input
                className="input"
                placeholder="e.g., Luxury Beachfront Villa"
                value={expenseForm.property_name}
                onChange={(e) => {
                  setExpenseForm((f) => ({ ...f, property_name: e.target.value }));
                  if (formError) setFormError(null);
                }}
              />
            </div>

            <div>
              <label className="label">Category <span className="text-red-500">*</span></label>
              <select
                className="input"
                value={expenseForm.category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setExpenseForm((f) => ({
                    ...f,
                    category: newCat,
                    // If switching away from 'other', clear custom_category
                    custom_category: newCat === 'other' ? f.custom_category : '',
                  }));
                  if (formError) setFormError(null);
                }}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* DYNAMIC CUSTOM CATEGORY FIELD (Shown when category === 'other') */}
            {expenseForm.category === 'other' && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 animate-fade-in">
                <label className="label text-blue-900 font-semibold flex items-center justify-between">
                  <span>Custom Category <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-blue-600 font-normal">Required</span>
                </label>
                <input
                  className="input bg-white border-blue-300 focus:border-blue-500"
                  placeholder="Enter expense category"
                  value={expenseForm.custom_category}
                  onChange={(e) => {
                    setExpenseForm((f) => ({ ...f, custom_category: e.target.value }));
                    if (formError) setFormError(null);
                  }}
                />
                <p className="text-[11px] text-slate-500 leading-tight">
                  Examples: <span className="text-slate-600 italic">Cleaning, Pest Control, Internet, Courier, Office Supplies, Printing, Decoration, Marketing, Laundry, Fuel, Miscellaneous</span>
                </p>
              </div>
            )}

            <div>
              <label className="label">Amount ({CURRENCY}) <span className="text-red-500">*</span></label>
              <input
                className="input"
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={expenseForm.amount || ''}
                onChange={(e) => {
                  setExpenseForm((f) => ({ ...f, amount: +e.target.value }));
                  if (formError) setFormError(null);
                }}
              />
            </div>

            <div>
              <label className="label">Description</label>
              <input
                className="input"
                placeholder="Optional details or invoice reference"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="label">Expense Date <span className="text-red-500">*</span></label>
              <input
                className="input"
                type="date"
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm((f) => ({ ...f, expense_date: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={handleSaveExpense} className="btn-primary flex-1 justify-center">
                {editingExpenseId ? 'Update Expense' : 'Add Expense'}
              </button>
              <button onClick={() => setShowExpenseModal(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
