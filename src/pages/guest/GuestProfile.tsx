import { useState } from 'react';
import { User, Phone, Mail, MapPin, Shield, Lock, Save, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function GuestProfile() {
  const { user } = useAuth();
  const [tab, setTab] = useState('personal');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '??';

  return (
    <div className="max-w-2xl space-y-5">
      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 text-2xl font-bold">
              {initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
              <Camera size={13} className="text-slate-600" />
            </button>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{user?.full_name}</p>
            <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
            <p className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-2 inline-block font-medium">Guest Account</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[
          { id: 'personal', label: 'Personal Info', icon: User },
          { id: 'id', label: 'ID Verification', icon: Shield },
          { id: 'security', label: 'Security', icon: Lock },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'personal' && (
        <div className="card p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Full Name</label>
              <div className="relative"><User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" defaultValue={user?.full_name} />
              </div>
            </div>
            <div><label className="label">Email</label>
              <div className="relative"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" type="email" defaultValue={user?.email} />
              </div>
            </div>
            <div><label className="label">Phone</label>
              <div className="relative"><Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" defaultValue={user?.phone} />
              </div>
            </div>
            <div className="sm:col-span-2"><label className="label">Address</label>
              <div className="relative"><MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9" defaultValue={user?.address} />
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Emergency Contact</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Name</label><input className="input" placeholder="Emergency contact name" /></div>
              <div><label className="label">Phone</label><input className="input" placeholder="+1 555-0000" /></div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} className="btn-primary"><Save size={15} /> Save Changes</button>
            {saved && <span className="text-sm text-emerald-600 font-medium animate-fade-in">Saved!</span>}
          </div>
        </div>
      )}

      {tab === 'id' && (
        <div className="card p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">ID Verification</h3>
          <p className="text-sm text-slate-500">Verified ID helps build trust and is required for check-in.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">ID Type</label>
              <select className="input"><option>Passport</option><option>Driver's License</option><option>National ID</option></select>
            </div>
            <div><label className="label">ID Number</label><input className="input" placeholder="ID document number" /></div>
          </div>
          <div>
            <label className="label">Upload ID Document</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-colors cursor-pointer">
              <Shield size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, PDF up to 5MB</p>
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary"><Shield size={15} /> Submit for Verification</button>
        </div>
      )}

      {tab === 'security' && (
        <div className="card p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Security Settings</h3>
          <div className="space-y-4">
            <div><label className="label">Current Password</label><input className="input" type="password" placeholder="••••••••" /></div>
            <div><label className="label">New Password</label><input className="input" type="password" placeholder="••••••••" /></div>
            <div><label className="label">Confirm New Password</label><input className="input" type="password" placeholder="••••••••" /></div>
          </div>
          <button onClick={handleSave} className="btn-primary"><Lock size={15} /> Update Password</button>
        </div>
      )}
    </div>
  );
}
