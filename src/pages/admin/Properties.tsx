import { useState } from 'react';
import { Search, MapPin, Users, Bed, Bath, CheckCircle, XCircle, Eye, Edit3, Plus, Trash2 } from 'lucide-react';
import { propertyStatusBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useData } from '../../context/DataContext';
import { Property, CURRENCY } from '../../lib/types';

const MAX_PROPERTIES = 3;

const ALL_AMENITIES = ['WiFi', 'AC', 'TV', 'Kitchen', 'Parking', 'Swimming Pool', 'Washing Machine', 'Hot Water', 'Pets Allowed'];

const EMPTY_FORM = {
  name: '', description: '', location: '', address: '',
  capacity: 4, bedrooms: 1, bathrooms: 1,
  daily_price: 0, weekly_price: 0, monthly_price: 0,
  security_deposit: 0, cleaning_fee: 0,
  status: 'available' as Property['status'],
  amenities: [] as string[],
  cover_photo: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
};

type FormState = typeof EMPTY_FORM;

export default function Properties() {
  const { properties, addProperty, updateProperty, deleteProperty, approveProperty } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Property | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  const canAddProperty = properties.length < MAX_PROPERTIES;

  const filtered = properties.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowFormModal(true);
  };

  const openEdit = (p: Property) => {
    setForm({
      name: p.name, description: p.description, location: p.location, address: p.address,
      capacity: p.capacity, bedrooms: p.bedrooms, bathrooms: p.bathrooms,
      daily_price: p.daily_price, weekly_price: p.weekly_price, monthly_price: p.monthly_price,
      security_deposit: p.security_deposit, cleaning_fee: p.cleaning_fee,
      status: p.status, amenities: p.amenities, cover_photo: p.cover_photo,
    });
    setEditingId(p.id);
    setSelected(null);
    setShowFormModal(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.location) return;
    if (editingId) {
      updateProperty(editingId, form);
    } else {
      addProperty({ ...form, gallery: [form.cover_photo], rules: {}, is_approved: false });
    }
    setShowFormModal(false);
  };

  const toggleAmenity = (a: string) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }));
  };

  return (
    <div className="space-y-5">
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
        {canAddProperty ? (
          <button onClick={openAdd} className="btn-primary flex-shrink-0">
            <Plus size={15} /> Add Property
          </button>
        ) : (
          <span className="text-xs text-amber-600 font-medium flex items-center px-3">
            Max {MAX_PROPERTIES} properties reached
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['all', 'available', 'occupied', 'maintenance'].map(s => {
          const count = s === 'all' ? properties.length : properties.filter(p => p.status === s).length;
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
              <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-1">{property.name}</h3>
              <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
                <MapPin size={11} /> {property.location}
              </div>
              <div className="flex gap-3 text-xs text-slate-600 mb-3">
                <span className="flex items-center gap-1"><Users size={11} />{property.capacity}</span>
                <span className="flex items-center gap-1"><Bed size={11} />{property.bedrooms} bed</span>
                <span className="flex items-center gap-1"><Bath size={11} />{property.bathrooms} bath</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span className="text-base font-bold text-slate-900">{CURRENCY}{property.daily_price}</span>
                  <span className="text-xs text-slate-500">/night</span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setSelected(property)}
                    className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
                    <Eye size={13} /> View
                  </button>
                  <button onClick={() => openEdit(property)}
                    className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors" title="Edit">
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => setDeleteTarget(property)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-slate-400 text-sm">No properties found.</div>
      )}

      {/* Add/Edit Property modal */}
      {showFormModal && (
        <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)}
          title={editingId ? 'Edit Property' : 'Add New Property'} size="xl">
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Property Name</label>
                <input className="input" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Property D" />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Miami Beach, FL" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address</label>
                <input className="input" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Full address" />
              </div>
              <div>
                <label className="label">Daily Price ({CURRENCY})</label>
                <input className="input" type="number" value={form.daily_price}
                  onChange={e => setForm(f => ({ ...f, daily_price: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Weekly Price ({CURRENCY})</label>
                <input className="input" type="number" value={form.weekly_price}
                  onChange={e => setForm(f => ({ ...f, weekly_price: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Monthly Price ({CURRENCY})</label>
                <input className="input" type="number" value={form.monthly_price}
                  onChange={e => setForm(f => ({ ...f, monthly_price: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Security Deposit ({CURRENCY})</label>
                <input className="input" type="number" value={form.security_deposit}
                  onChange={e => setForm(f => ({ ...f, security_deposit: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Capacity (guests)</label>
                <input className="input" type="number" value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Bedrooms</label>
                <input className="input" type="number" value={form.bedrooms}
                  onChange={e => setForm(f => ({ ...f, bedrooms: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Bathrooms</label>
                <input className="input" type="number" value={form.bathrooms}
                  onChange={e => setForm(f => ({ ...f, bathrooms: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Cleaning Fee ({CURRENCY})</label>
                <input className="input" type="number" value={form.cleaning_fee}
                  onChange={e => setForm(f => ({ ...f, cleaning_fee: +e.target.value }))} />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as Property['status'] }))}>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Cover Photo URL</label>
                <input className="input" value={form.cover_photo}
                  onChange={e => setForm(f => ({ ...f, cover_photo: e.target.value }))}
                  placeholder="https://..." />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea className="input h-24 resize-none" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Property description..." />
              </div>
            </div>
            <div>
              <label className="label mb-2">Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_AMENITIES.map(a => (
                  <label key={a} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    form.amenities.includes(a) ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 hover:bg-slate-100'
                  }`}>
                    <input type="checkbox" className="rounded" checked={form.amenities.includes(a)}
                      onChange={() => toggleAmenity(a)} />
                    <span className="text-xs">{a}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button onClick={handleSubmit} className="btn-primary flex-1 justify-center">
                {editingId ? 'Save Changes' : 'Create Property'}
              </button>
              <button onClick={() => setShowFormModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
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
                  <div className="flex justify-between"><span className="text-slate-500">Daily</span><span className="font-semibold">{CURRENCY}{selected.daily_price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Weekly</span><span className="font-semibold">{CURRENCY}{selected.weekly_price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Monthly</span><span className="font-semibold">{CURRENCY}{selected.monthly_price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Security Deposit</span><span className="font-semibold">{CURRENCY}{selected.security_deposit}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Cleaning Fee</span><span className="font-semibold">{CURRENCY}{selected.cleaning_fee}</span></div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {selected.amenities.map(a => (
                  <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-600">{selected.description}</p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {!selected.is_approved && (
                <button onClick={() => { approveProperty(selected.id); setSelected(null); }}
                  className="btn-primary flex-1 justify-center">
                  <CheckCircle size={15} /> Approve Property
                </button>
              )}
              <button onClick={() => openEdit(selected)} className="btn-secondary flex-1 justify-center">
                <Edit3 size={15} /> Edit Details
              </button>
              <button onClick={() => { setDeleteTarget(selected); setSelected(null); }}
                className="btn-danger flex-1 justify-center">
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Property" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteTarget.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => { deleteProperty(deleteTarget.id); setDeleteTarget(null); }}
                className="btn-danger flex-1 justify-center">
                <Trash2 size={15} /> Delete
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
