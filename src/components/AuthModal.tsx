import React, { useEffect, useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Key,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { normalizeIndianPhone, PHONE_VALIDATION_MESSAGE } from '../utils/phone';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; role: 'customer' | 'admin' }) => void;
  initialMode?: 'customer_login' | 'register' | 'admin_login';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'customer_login',
}) => {
  const [mode, setMode] = useState<'customer_login' | 'register' | 'admin_login'>(initialMode);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [initialMode, isOpen]);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [address, setAddress] = useState('');

  // Admin credentials
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (mode === 'register') {
      if (password.length < 8) {
        setErrorMsg('Password must be at least 8 characters.');
        return;
      }
      const normalizedPhone = normalizeIndianPhone(phone);
      if (!normalizedPhone) {
        setPhoneError(PHONE_VALIDATION_MESSAGE);
        return;
      }
      setPhoneError(null);
    }
    setLoading(true);

    try {
      if (mode === 'admin_login') {
        const res = await api.login(adminEmail.trim().toLowerCase(), adminPassword);
        if (res.user.role !== 'admin') throw new Error('This account does not have administrator access.');
        onLoginSuccess(res.user);
      } else if (mode === 'register') {
        const res = await api.register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: normalizeIndianPhone(phone) || phone,
          address,
        });
        setEmail(res.user.email);
        setPassword('');
        setMode('customer_login');
        setSuccessMsg('Your account was created. Sign in to continue.');
        return;
      } else {
        const res = await api.login(email.trim().toLowerCase(), password);
        onLoginSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative border border-slate-200 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3 text-brand-600" />
            <span>ShopCart account</span>
          </div>
          <h3 className="text-xl font-extrabold text-[#17212B] tracking-tight">
            {mode === 'customer_login' && 'Customer Login'}
            {mode === 'register' && 'Customer Registration'}
            {mode === 'admin_login' && 'Administrator Portal Login'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'customer_login' && 'Sign in to access your orders, cart, and saved wishlist.'}
            {mode === 'register' && 'Create an account to keep your orders and saved items together.'}
            {mode === 'admin_login' && 'Access product catalog controls, order dispatching, and analytics.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setErrorMsg(null); setSuccessMsg(null); setMode('customer_login'); }}
            className={`py-2 px-1 rounded-lg transition-all text-center cursor-pointer ${
              mode === 'customer_login'
                ? 'bg-white text-brand-700 shadow-xs'
                : 'text-slate-600 hover:text-[#17212B]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setErrorMsg(null); setSuccessMsg(null); setMode('register'); }}
            className={`py-2 px-1 rounded-lg transition-all text-center cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-brand-700 shadow-xs'
                : 'text-slate-600 hover:text-[#17212B]'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => { setErrorMsg(null); setSuccessMsg(null); setMode('admin_login'); }}
            className={`py-2 px-1 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1 ${
              mode === 'admin_login'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-[#17212B]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Form Body */}
        {errorMsg && <p role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMsg}</p>}
        {successMsg && <p role="status" className="mb-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-700">{successMsg}</p>}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'customer_login' && (
            <>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
                    placeholder="customer@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
                    placeholder="Your Full Name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
                    onBlur={() => setPhoneError(normalizeIndianPhone(phone) ? null : PHONE_VALIDATION_MESSAGE)}
                    aria-invalid={Boolean(phoneError)}
                    aria-describedby={phoneError ? 'registration-phone-error' : undefined}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
                    placeholder="+91 9876543210"
                  />
                </div>
                {phoneError && <p id="registration-phone-error" role="alert" className="mt-1 text-[11px] text-rose-600">{phoneError}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Delivery Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <textarea
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none resize-none"
                    placeholder="Campus Hostel Block, Room Number, Street"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'admin_login' && (
            <>
              <div className="p-3 bg-brand-50/70 border border-brand-100 rounded-xl text-brand-900 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Admin Privileges:</strong> Product catalogue management, price & inventory stock updates, order status changes, customer disabling, and system analytics.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Admin Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
                    placeholder="admin@shopcart.store"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Admin Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none"
                    placeholder="admin123"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-2.5 mt-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <span>
              {mode === 'customer_login' && 'Sign In as Customer'}
              {mode === 'register' && 'Create Customer Account'}
              {mode === 'admin_login' && 'Sign In to Admin Dashboard'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          {mode === 'customer_login' && (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setErrorMsg(null); setSuccessMsg(null); setMode('register'); }}
                className="text-brand-600 font-bold hover:underline cursor-pointer"
              >
                Register Now
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setErrorMsg(null); setSuccessMsg(null); setMode('customer_login'); }}
                className="text-brand-600 font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          )}

          {mode === 'admin_login' && (
            <p>
              Need to test as a normal buyer?{' '}
              <button
                type="button"
                onClick={() => { setErrorMsg(null); setSuccessMsg(null); setMode('customer_login'); }}
                className="text-brand-600 font-bold hover:underline cursor-pointer"
              >
                Switch to Customer Mode
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
