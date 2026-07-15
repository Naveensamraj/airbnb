import { useState } from 'react';
import { Search, MapPin, Users, Bed, Bath, CheckCircle, XCircle, Eye, Edit3, Plus } from 'lucide-react';
import { propertyStatusBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { PROPERTIES } from '../../lib/mockData';
import { Property } from '../../lib/types';

const MAX_PROPERTIES = 3;

const AMENITY_ICONS: Record<string, string> = {
  WiFi: '📶', AC: '❄️', TV: '📺', Kitchen: '🍳', Parking: '🚗',
  'Swimming Pool': '🏊', 'Washing Machine': '🫧', 'Hot Water': '🚿', 'Pets Allowed': '🐾',
};

export default function Properties() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Property | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const canAddProperty = PROPERTIES.length < MAX_PROPERTIES;

  const filtered = PROPERTIES.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search properties..."
            className="input pl-9 w-full" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="input w-auto px-3 py-2">
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
          <option value="reserved">Reserved</option>
        </select>
        {canAddProperty && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex-shrink-0">
            <Plus size={15} />
            Add Property
          </button>
        )}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['all', 'available', 'occupied', 'maintenance'].map(s => {
          const count = s === 'all' ? PROPERTIES.length : PROPERTIES.filter(p => p.status === s).length;
          const colors: Record<string, string> = {
            all: 'text-slate-700 bg-slate-100', available: 'text-emerald-700 bg-emerald-50',
            occupied: 'text-blue-700 bg-blue-50', maintenance: 'text-red-700 bg-red-50',
          };
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`card p-3 text-center transition-all ${statusFilter === s ? 'ring-2 ring-blue-500' : ''} ${colors[s]}`}>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs capitalize font-medium mt-0.5">{s === 'all' ? 'Total' : s}</p>
            </button>
          );
        })}
      </div>

      {/* Properties grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(property => (
          <div key={property.id} className="card overflow-hidden hover:shadow-md transition-shadow group">
            <div className="relative h-44 overflow-hidden">
              <img src={property.cover_photo} alt={property.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute top-3 left-3">{propertyStatusBadge(property.status)}</div>
              <div className="absolute top-3 right-3 bg-slate-900/70 text-white text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm">
                {property.name}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-slate-900 text-sm leading-tight">{property.name}</h3>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
                <MapPin size={11} /> {property.location}
              </div>
              <div className="flex gap-3 text-xs text-slate-600 mb-3">
                <span className="flex items-center gap-1"><Users size={11} />{property.capacity}</span>
                <span className="flex items-center gap-1"><Bed size={11} />{property.bedrooms} bed</span>
                <span className="flex items-center gap-1"><Bath size={11} />{property.bathrooms} bath</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {property.amenities.slice(0, 4).map(a => (
                  <span key={a} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {AMENITY_ICONS[a] || ''} {a}
                  </span>
                ))}
                {property.amenities.length > 4 && (
                  <span className="text-[10px] text-slate-400">+{property.amenities.length - 4}</span>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span className="text-base font-bold text-slate-900">${property.daily_price}</span>
                  <span className="text-xs text-slate-500">/night</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(property)}
                    className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
                    <Eye size={13} /> View
                  </button>
                  {!property.is_approved && (
                    <button className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
                      <CheckCircle size={13} /> Approve
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">{property.location}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Property modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Property" size="xl">
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Property Name</label>
                <input className="input" placeholder="e.g. Property D" />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" placeholder="e.g. Miami Beach, FL" />
              </div>
              <div>
                <label className="label">Address</label>
                <input className="input" placeholder="Full address" />
              </div>
              <div>
                <label className="label">Daily Price ($)</label>
                <input className="input" type="number" placeholder="0" />
              </div>
              <div>
                <label className="label">Weekly Price ($)</label>
                <input className="input" type="number" placeholder="0" />
              </div>
              <div>
                <label className="label">Monthly Price ($)</label>
                <input className="input" type="number" placeholder="0" />
              </div>
              <div>
                <label className="label">Security Deposit ($)</label>
                <input className="input" type="number" placeholder="0" />
              </div>
              <div>
                <label className="label">Capacity (guests)</label>
                <input className="input" type="number" placeholder="0" />
              </div>
              <div>
                <label className="label">Bedrooms</label>
                <input className="input" type="number" placeholder="0" />
              </div>
              <div>
                <label className="label">Bathrooms</label>
                <input className="input" type="number" placeholder="0" />
              </div>
              <div>
                <label className="label">Cleaning Fee ($)</label>
                <input className="input" type="number" placeholder="0" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea className="input h-24 resize-none" placeholder="Property description..." />
              </div>
            </div>
            <div>
              <label className="label mb-2">Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['WiFi', 'AC', 'TV', 'Kitchen', 'Parking', 'Swimming Pool', 'Washing Machine', 'Hot Water', 'Pets Allowed'].map(a => (
                  <label key={a} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                    <input type="checkbox" className="rounded" />
                    <span className="text-xs text-slate-700">{a}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button className="btn-primary flex-1 justify-center">Create Property</button>
              <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Property detail modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected.name} size="xl">
          <div className="space-y-5">
            <img src={selected.cover_photo} alt={selected.name} className="w-full h-56 object-cover rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Property Details</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-bold text-blue-700">{selected.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="font-medium text-right">{selected.location}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Capacity</span><span className="font-medium">{selected.capacity} guests</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Bedrooms</span><span className="font-medium">{selected.bedrooms}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Bathrooms</span><span className="font-medium">{selected.bathrooms}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Status</span>{propertyStatusBadge(selected.status)}</div>
                  <div className="flex justify-between"><span className="text-slate-500">Approved</span>
                    {selected.is_approved
                      ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={14} />Yes</span>
                      : <span className="text-red-500 flex items-center gap-1"><XCircle size={14} />No</span>}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pricing</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Daily</span><span className="font-semibold">${selected.daily_price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Weekly</span><span className="font-semibold">${selected.weekly_price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Monthly</span><span className="font-semibold">${selected.monthly_price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Security Deposit</span><span className="font-semibold">${selected.security_deposit}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Cleaning Fee</span><span className="font-semibold">${selected.cleaning_fee}</span></div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {selected.amenities.map(a => (
                  <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                    {AMENITY_ICONS[a] || ''} {a}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-600">{selected.description}</p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {!selected.is_approved && (
                <button className="btn-primary flex-1 justify-center">
                  <CheckCircle size={15} /> Approve Property
                </button>
              )}
              <button className="btn-secondary flex-1 justify-center">
                <Edit3 size={15} /> Edit Details
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
