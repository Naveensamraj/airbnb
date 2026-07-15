import { useState } from 'react';
import { Search, MapPin, Users, Bed, Bath, Wifi, Wind, Car, Waves, Star } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { PROPERTIES } from '../../lib/mockData';
import { Property } from '../../lib/types';

const AMENITY_ICONS: Record<string, React.ElementType> = {
  WiFi: Wifi, AC: Wind, Parking: Car, 'Swimming Pool': Waves,
};

export default function GuestHome() {
  const [search, setSearch] = useState('');
  const [guestsFilter, setGuestsFilter] = useState(1);
  const [selected, setSelected] = useState<Property | null>(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  const approvedProperties = PROPERTIES.filter(h => h.is_approved && h.status === 'available');
  const filtered = approvedProperties.filter(h => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.location.toLowerCase().includes(search.toLowerCase());
    const matchGuests = h.capacity >= guestsFilter;
    return matchSearch && matchGuests;
  });

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search location or property name..."
              className="input pl-9 w-full" />
          </div>
          <div className="flex gap-2">
            <input type="date" className="input" placeholder="Check-in" />
            <input type="date" className="input" placeholder="Check-out" />
            <select className="input w-auto px-3" value={guestsFilter} onChange={e => setGuestsFilter(+e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary flex-shrink-0"><Search size={15} /> Search</button>
        </div>
      </div>

      <p className="text-sm text-slate-500">{filtered.length} properties available</p>

      {/* Properties grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(property => (
          <div key={property.id}
            onClick={() => setSelected(property)}
            className="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="relative h-48 overflow-hidden">
              <img src={property.cover_photo} alt={property.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-sm font-bold text-slate-900">${property.daily_price}</span>
                <span className="text-xs text-slate-500">/night</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-slate-900 text-sm">{property.name}</h3>
                <div className="flex items-center gap-0.5 text-amber-500 flex-shrink-0 ml-2">
                  <Star size={12} className="fill-amber-400" />
                  <span className="text-xs font-medium text-slate-700">4.8</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
                <MapPin size={11} />{property.location}
              </div>
              <div className="flex gap-3 text-xs text-slate-600 mb-3">
                <span className="flex items-center gap-1"><Users size={11} />Up to {property.capacity}</span>
                <span className="flex items-center gap-1"><Bed size={11} />{property.bedrooms} bed</span>
                <span className="flex items-center gap-1"><Bath size={11} />{property.bathrooms} bath</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {property.amenities.slice(0, 4).map(a => {
                  const Icon = AMENITY_ICONS[a];
                  return (
                    <span key={a} className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {Icon ? <Icon size={9} /> : null}{a}
                    </span>
                  );
                })}
              </div>
              <button
                onClick={e => { e.stopPropagation(); setSelected(property); setBookingModal(true); }}
                className="w-full btn-primary justify-center py-2">
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Property detail modal */}
      {selected && !bookingModal && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected.name} size="xl">
          <div className="space-y-5">
            <img src={selected.cover_photo} alt={selected.name} className="w-full h-56 object-cover rounded-xl" />
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1 text-slate-500 text-sm mb-1"><MapPin size={13} />{selected.address}</div>
                <div className="flex gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Users size={13} />Up to {selected.capacity} guests</span>
                  <span className="flex items-center gap-1"><Bed size={13} />{selected.bedrooms} bedrooms</span>
                  <span className="flex items-center gap-1"><Bath size={13} />{selected.bathrooms} baths</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">${selected.daily_price}</p>
                <p className="text-sm text-slate-500">per night</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {selected.amenities.map(a => (
                  <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Pricing</p>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Daily</span><span className="font-medium">${selected.daily_price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Weekly</span><span className="font-medium">${selected.weekly_price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Monthly</span><span className="font-medium">${selected.monthly_price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Security Deposit</span><span className="font-medium">${selected.security_deposit}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Cleaning Fee</span><span className="font-medium">${selected.cleaning_fee}</span></div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Property Rules</p>
                <div className="space-y-1 text-xs text-slate-600">
                  <p>Smoking: {selected.rules.smoking ? '✓ Allowed' : '✗ Not Allowed'}</p>
                  <p>Pets: {selected.rules.pets ? '✓ Allowed' : '✗ Not Allowed'}</p>
                  <p>Parties: {selected.rules.parties ? '✓ Allowed' : '✗ Not Allowed'}</p>
                  <p>Check-in: {selected.rules.checkin as string}</p>
                  <p>Check-out: {selected.rules.checkout as string}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setBookingModal(true)} className="w-full btn-primary justify-center py-3 text-base">
              Book This Property
            </button>
          </div>
        </Modal>
      )}

      {/* Booking modal */}
      {selected && bookingModal && (
        <Modal isOpen={bookingModal} onClose={() => { setBookingModal(false); setSelected(null); }} title="Book Property" size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <img src={selected.cover_photo} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <p className="font-semibold text-slate-900">{selected.name}</p>
                <p className="text-sm text-slate-500">${selected.daily_price}/night</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Check-in Date</label><input type="date" className="input" value={checkIn} onChange={e => setCheckIn(e.target.value)} /></div>
              <div><label className="label">Check-out Date</label><input type="date" className="input" value={checkOut} onChange={e => setCheckOut(e.target.value)} /></div>
            </div>
            <div><label className="label">Number of Guests</label>
              <select className="input"><option>1</option><option>2</option><option>3</option><option>4</option></select>
            </div>
            <div><label className="label">Full Name</label><input className="input" placeholder="Your full name" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Phone</label><input className="input" type="tel" placeholder="+1 555-0000" /></div>
              <div><label className="label">Vehicle Number</label><input className="input" placeholder="Optional" /></div>
            </div>
            <div><label className="label">Special Requests</label><textarea className="input h-16 resize-none" /></div>
            {checkIn && checkOut && (
              <div className="bg-blue-50 rounded-xl p-3 text-sm">
                <div className="flex justify-between mb-1"><span className="text-slate-600">Duration</span>
                  <span className="font-medium">{Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))} nights</span>
                </div>
                <div className="flex justify-between mb-1"><span className="text-slate-600">Room charges</span>
                  <span className="font-medium">${(Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) * selected.daily_price).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-1"><span className="text-slate-600">Cleaning fee</span><span className="font-medium">${selected.cleaning_fee}</span></div>
                <div className="flex justify-between font-bold border-t border-blue-200 pt-1 mt-1"><span>Total</span>
                  <span>${((Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) * selected.daily_price) + selected.cleaning_fee).toLocaleString()}</span>
                </div>
                <p className="text-xs text-blue-600 mt-2">30% advance required to confirm booking</p>
              </div>
            )}
            <button className="w-full btn-primary justify-center py-2.5">Proceed to Payment</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
