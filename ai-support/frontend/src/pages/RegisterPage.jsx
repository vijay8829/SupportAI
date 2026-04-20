import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, ArrowRight, Eye, EyeOff, Building2, User, Mail, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import clsx from 'clsx';

function AIStarIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
    </svg>
  );
}

const PERKS = [
  'Free forever on the starter plan',
  'AI answers from your own knowledge base',
  'Deploy chat widget in under 5 minutes',
  'Full conversation history & analytics',
];

function FieldRow({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon size={14} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form,    setForm]    = useState({ name: '', email: '', password: '', companyName: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const pwStrength = form.password.length === 0 ? 0
    : form.password.length < 6  ? 1
    : form.password.length < 10 ? 2
    : 3;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ══ LEFT — branding ══ */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #0f0c29 0%, #1e1b4b 45%, #1a1040 100%)' }}>

        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[80px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-[70px] opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600 flex items-center justify-center"
            style={{ boxShadow: '0 4px 18px rgba(99,102,241,.55)' }}>
            <AIStarIcon size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-extrabold text-lg tracking-tight">SupportAI</p>
            <p className="text-indigo-300/60 text-[11px] font-medium">Production-ready RAG</p>
          </div>
        </div>

        <div className="relative space-y-7">
          <div>
            <h2 className="text-[32px] font-extrabold text-white leading-tight tracking-tight">
              Start for free.<br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #a5b4fc, #c4b5fd)' }}>
                Scale with AI.
              </span>
            </h2>
            <p className="text-gray-400 text-[13.5px] leading-relaxed mt-3 max-w-xs">
              Everything you need to deploy an AI support agent — no credit card required.
            </p>
          </div>

          <div className="space-y-2.5">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 size={11} className="text-emerald-400" />
                </div>
                <span className="text-[13px] text-gray-300">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-gray-600">© 2026 SupportAI · All rights reserved</p>
      </div>

      {/* ══ RIGHT — form ══ */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-[400px] space-y-7 py-4">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <AIStarIcon size={15} className="text-white" />
            </div>
            <span className="font-extrabold text-gray-900 text-lg">SupportAI</span>
          </div>

          <div>
            <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight">Create your account</h1>
            <p className="text-[13.5px] text-gray-500 mt-1">
              Already have one?{' '}
              <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name + Company */}
            <div className="grid grid-cols-2 gap-3.5">
              <FieldRow label="Your name" icon={User}>
                <input
                  className="input-field pl-9 text-[14px]"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={set('name')}
                  required
                />
              </FieldRow>
              <FieldRow label="Company name" icon={Building2}>
                <input
                  className="input-field pl-9 text-[14px]"
                  placeholder="Acme Inc."
                  value={form.companyName}
                  onChange={set('companyName')}
                  required
                />
              </FieldRow>
            </div>

            <FieldRow label="Work email" icon={Mail}>
              <input
                type="email"
                className="input-field pl-9 text-[14px]"
                placeholder="jane@acme.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </FieldRow>

            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Lock size={14} />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pl-9 pr-11 text-[14px]"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Password strength */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(n => (
                      <div key={n} className={clsx(
                        'h-1 flex-1 rounded-full transition-all duration-300',
                        pwStrength >= n
                          ? n === 1 ? 'bg-red-400' : n === 2 ? 'bg-amber-400' : 'bg-emerald-400'
                          : 'bg-gray-100'
                      )} />
                    ))}
                  </div>
                  <p className={clsx('text-[11px] font-medium transition-colors',
                    pwStrength === 1 ? 'text-red-500' : pwStrength === 2 ? 'text-amber-500' : 'text-emerald-600'
                  )}>
                    {pwStrength === 1 ? 'Too short' : pwStrength === 2 ? 'Could be stronger' : 'Strong password'}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !form.name || !form.email || !form.password || !form.companyName}
              className="w-full btn-primary justify-center py-3 text-[14.5px] rounded-xl gap-2.5 mt-2"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                : <><Sparkles size={15} /> Create free account</>}
            </button>

            <p className="text-center text-[11.5px] text-gray-400">
              By creating an account you agree to our{' '}
              <span className="text-gray-600 font-medium underline underline-offset-2 cursor-pointer hover:text-gray-800">Terms</span>
              {' '}and{' '}
              <span className="text-gray-600 font-medium underline underline-offset-2 cursor-pointer hover:text-gray-800">Privacy Policy</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
