import type { Property } from '../lib/types';
import { api, unwrap } from './api';
import { mapPropertyFromApi, mapPropertyToApi } from './mappers';

type PropertyInput = Omit<Property, 'id' | 'created_at'> | Property | Partial<Property>;

export async function getProperties(params: Record<string, unknown> = {}): Promise<Property[]> {
  const response = await api.get('/properties', { params: { limit: 100, ...params } });
  return (unwrap<unknown[]>(response) || []).map(mapPropertyFromApi).filter(Boolean);
}

export async function getPropertyById(id: string): Promise<Property> {
  const data = unwrap<{ property?: unknown } | unknown>(await api.get(`/properties/${id}`));
  return mapPropertyFromApi(typeof data === 'object' && data !== null && 'property' in data ? data.property : data);
}

export async function createProperty(property: PropertyInput): Promise<Property> {
  return mapPropertyFromApi(unwrap<unknown>(await api.post('/properties', mapPropertyToApi(property))));
}

export async function updateProperty(id: string, property: PropertyInput): Promise<Property> {
  return mapPropertyFromApi(unwrap<unknown>(await api.put(`/properties/${id}`, mapPropertyToApi(property))));
}

export async function deleteProperty(id: string): Promise<void> { await api.delete(`/properties/${id}`); }

export async function approveProperty(id: string, approved = true): Promise<Property> {
  return mapPropertyFromApi(unwrap<unknown>(await api.patch(`/properties/${id}/approve`, { approved })));
}

export async function updatePropertyStatus(id: string, status: Property['status']): Promise<Property> {
  return mapPropertyFromApi(unwrap<unknown>(await api.patch(`/properties/${id}/status`, { status })));
}
