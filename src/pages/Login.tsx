import { useState } from 'react';
import { Building2, Shield, Users, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../lib/types';

const DEMO_ROLES: { role: UserRole; label: string; desc: string; icon: React.ElementType; color: string; email: string; pwd: string }[] = [
  { role: 'admin', label: 'Admin', desc: 'Full system access', icon: Shield, color: 'from-blue-500 to-blue-700', email: 'admin@staypro.com', pwd: 'Admin@123' },
  { role: 'guest', label: 'Guest', desc: 'Browse & book rentals', icon: Users, color: 'from-amber-500 to-amber-700', email: 'guest@staypro.com', pwd: 'Guest@123' },
];

export default function Login() {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) setError(result.error);
  };

  const handleDemo = (role: UserRole) => {
    demoLogin(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">StayPro</p>
              <p className="text-blue-300 text-xs mt-0.5">Private Rental Management</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your<br />
            <span className="text-blue-400">rental portfolio</span><br />
            with confidence
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            A complete end-to-end platform for property owners and guests.
            From bookings to finance, everything in one place.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-4 mt-8">
          {[
            { stat: '5+', label: 'Properties Managed' },
            { stat: '6', label: 'Active Bookings' },
            { stat: '$126K', label: 'Revenue Tracked' },
            { stat: '98%', label: 'Occupancy Rate' },
          ].map(({ stat, label }) => (
            <div key={label} className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-2xl font-bold text-white">{stat}</p>
              <p className="text-slate-400 text-sm mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <p className="text-white font-bold">StayPro</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
            <p className="text-slate-500 text-sm mb-8">Sign in to your account to continue</p>

            {/* Demo quick access */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Demo Access</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ROLES.map(({ role, label, desc, icon: Icon, color }) => (
                  <button
                    key={role}
                    onClick={() => handleDemo(role)}
                    className={`group relative bg-gradient-to-br ${color} rounded-xl p-3 text-left text-white hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
                  >
                    <Icon size={18} className="mb-1.5 opacity-90" />
                    <p className="text-xs font-bold">{label}</p>
                    <p className="text-[10px] opacity-75 leading-tight mt-0.5">{desc}</p>
                    <ChevronRight size={12} className="absolute top-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or sign in manually</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="admin@staypro.com"
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full btn-primary justify-center py-2.5 text-base font-semibold disabled:opacity-60">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">
                Demo credentials: admin / guest @staypro.com &middot; Password: Role@123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
