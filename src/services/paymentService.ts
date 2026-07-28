import type { Payment } from '../lib/types';
import { api, unwrap } from './api';
import { mapPaymentFromApi } from './mappers';

export async function getPayments(params: Record<string, unknown> = {}): Promise<Payment[]> {
  const response = await api.get('/payments', { params: { limit: 100, ...params } });
  return (unwrap<unknown[]>(response) || []).map(mapPaymentFromApi).filter(Boolean);
}

export async function getPaymentById(id: string): Promise<Payment> { return mapPaymentFromApi(unwrap<unknown>(await api.get(`/payments/${id}`))); }
export async function createPayment(payment: Partial<Payment>): Promise<Payment> { return mapPaymentFromApi(unwrap<unknown>(await api.post('/payments', payment))); }
export async function updatePayment(id: string, payment: Partial<Payment>): Promise<Payment> { return mapPaymentFromApi(unwrap<unknown>(await api.put(`/payments/${id}`, payment))); }
export async function deletePayment(id: string): Promise<void> { await api.delete(`/payments/${id}`); }

export async function getRevenue(params: Record<string, unknown> = {}): Promise<Array<{ month: string; total: number; count: number }>> {
  const data = unwrap<Array<{ _id?: { month?: string }; month?: string; total?: number; count?: number }>>(await api.get('/payments/revenue', { params }));
  return (data || []).map((item) => ({ month: item._id?.month || item.month || '', total: item.total ?? 0, count: item.count ?? 0 }));
}

export async function getOutstanding(): Promise<unknown> { return unwrap<unknown>(await api.get('/payments/outstanding')); }
