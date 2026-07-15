import { useState } from 'react';
import { Save, Building2, DollarSign, Shield, Bell, BookOpen } from 'lucide-react';

const TABS = [
  { id: 'business', label: 'Business Info', icon: Building2 },
  { id: 'booking', label: 'Booking Rules', icon: BookOpen },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('business');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex gap-5">
      {/* Sidebar tabs */}
      <div className="w-48 flex-shrink-0 space-y-0.5">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`sidebar-link w-full ${activeTab === t.id ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}>
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5">
        {activeTab === 'business' && (
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-900">Business Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Business Name</label><input className="input" defaultValue="StayPro Rentals" /></div>
              <div><label className="label">Email</label><input className="input" type="email" defaultValue="admin@staypro.com" /></div>
              <div><label className="label">Phone</label><input className="input" defaultValue="+1 555-0100" /></div>
              <div><label className="label">Currency</label>
                <select className="input">
                  <option>USD ($)</option><option>EUR (€)</option><option>INR (₹)</option><option>GBP (£)</option>
                </select>
              </div>
              <div className="sm:col-span-2"><label className="label">Address</label><input className="input" defaultValue="100 Main Street, New York, NY 10001" /></div>
              <div><label className="label">Timezone</label>
                <select className="input"><option>America/New_York</option><option>America/Chicago</option><option>America/Los_Angeles</option></select>
              </div>
              <div><label className="label">Tax Rate (%)</label><input className="input" type="number" defaultValue="12" /></div>
            </div>
          </div>
        )}

        {activeTab === 'booking' && (
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-900">Booking Rules</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Advance Payment %</label><input className="input" type="number" defaultValue="30" /></div>
              <div><label className="label">Max Booking Duration (days)</label><input className="input" type="number" defaultValue="90" /></div>
              <div><label className="label">Min Booking Duration (days)</label><input className="input" type="number" defaultValue="1" /></div>
              <div><label className="label">Default Check-in Time</label><input className="input" type="time" defaultValue="14:00" /></div>
              <div><label className="label">Default Check-out Time</label><input className="input" type="time" defaultValue="11:00" /></div>
              <div><label className="label">Cancellation Policy</label>
                <select className="input">
                  <option>Flexible (24hrs)</option><option>Moderate (3 days)</option><option>Strict (7 days)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Security Deposit Rules</label>
                <textarea className="input h-20 resize-none" defaultValue="Security deposit is refunded within 7 business days after check-out inspection." />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-900">Finance Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Listing Fee ($)</label><input className="input" type="number" defaultValue="99" /></div>
              <div><label className="label">Commission Rate (%)</label><input className="input" type="number" defaultValue="10" /></div>
              <div><label className="label">Max Properties</label><input className="input" type="number" defaultValue="3" /></div>
              <div><label className="label">Subscription Duration (months)</label><input className="input" type="number" defaultValue="12" /></div>
              <div><label className="label">GST/Tax Number</label><input className="input" defaultValue="GST-123456789" /></div>
              <div><label className="label">Bank Account</label><input className="input" defaultValue="****4521" /></div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-900">Security Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div><p className="text-sm font-medium text-slate-900">Two-Factor Authentication</p><p className="text-xs text-slate-500 mt-0.5">Require 2FA for admin accounts</p></div>
                <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div><p className="text-sm font-medium text-slate-900">Session Timeout</p><p className="text-xs text-slate-500 mt-0.5">Auto logout after inactivity</p></div>
                <select className="input w-auto px-2 py-1 text-xs">
                  <option>30 minutes</option><option>1 hour</option><option>4 hours</option><option>8 hours</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div><p className="text-sm font-medium text-slate-900">Login History</p><p className="text-xs text-slate-500 mt-0.5">Track device login history</p></div>
                <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
              </div>
              <div><label className="label">Password Policy</label>
                <select className="input">
                  <option>Strong (8+ chars, uppercase, numbers, symbols)</option>
                  <option>Moderate (8+ chars, numbers)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="card p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-900">Notification Templates</h2>
            <div className="space-y-3">
              {['New Booking Received', 'Booking Confirmed', 'Payment Received', 'Check-in Reminder', 'Check-out Reminder', 'Cancellation Alert'].map(template => (
                <div key={template} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{template}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Email + In-app notification</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary py-1 px-2.5 text-xs gap-1">Edit</button>
                    <div className="w-8 h-5 bg-blue-600 rounded-full relative cursor-pointer flex-shrink-0">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="btn-primary">
            <Save size={15} /> Save Changes
          </button>
          {saved && <span className="text-sm text-emerald-600 font-medium animate-fade-in">Saved successfully!</span>}
        </div>
      </div>
    </div>
  );
}
