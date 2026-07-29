import { api } from './api';
import type { Expense } from '../lib/types';

export async function getExpenses(): Promise<Expense[]> {
  const response = await api.get('/expenses');
  return response.data?.data || [];
}

export async function createExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
  const response = await api.post('/expenses', data);
  return response.data?.data;
}

export async function updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
  const response = await api.put(`/expenses/${id}`, data);
  return response.data?.data;
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${id}`);
}
