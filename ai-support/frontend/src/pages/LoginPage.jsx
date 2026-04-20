import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, ArrowRight, Sparkles, CheckCircle, Zap, Shield, Brain } from 'lucide-react';

function AIStarIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
    </svg>
  );
}

const FEATURES = [
  { icon: Brain,   text: 'RAG-powered answers from your own docs' },
  { icon: Zap,     text: 'Token-by-token streaming responses' },
  { icon: Shield,  text: 'Answers only from verified sources' },
];

export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ══ LEFT — branding panel ══ */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(155deg, #0f0c29 0%, #1e1b4b 45%, #1a1040 100%)',
        }}>

        {/* Glow blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[80px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-[70px] opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

        {/* Floating dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { left: '12%', top: '18%', size: 3, delay: '0s',    opacity: 0.6 },
            { left: '78%', top: '12%', size: 2, delay: '0.4s',  opacity: 0.4 },
            { left: '88%', top: '45%', size: 3, delay: '0.8s',  opacity: 0.5 },
            { left: '25%', top: '72%', size: 2, delay: '1.2s',  opacity: 0.35 },
            { left: '65%', top: '82%', size: 2, delay: '0.6s',  opacity: 0.45 },
            { left: '45%', top: '30%', size: 1.5, delay: '1s',  opacity: 0.3 },
          ].map((d, i) => (
            <div key={i} className="absolute rounded-full animate-float bg-white"
              style={{ left: d.left, top: d.top, width: d.size, height: d.size, opacity: d.opacity, animationDelay: d.delay }} />
          ))}
        </div>

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

        {/* Hero text */}
        <div className="relative space-y-7">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[11.5px] font-semibold text-indigo-200">Live & production-ready</span>
            </div>
            <h2 className="text-[34px] font-extrabold text-white leading-[1.15] tracking-tight">
              AI-powered support<br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #a5b4fc, #c4b5fd, #818cf8)' }}>
                that actually works.
              </span>
            </h2>
            <p className="text-gray-400 text-[14px] leading-relaxed max-w-xs">
              Upload your knowledge base, deploy in minutes, and let AI handle customer questions 24/7.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-[9px] bg-indigo-500/20 border border-indigo-400/25 flex items-center justify-center flex-shrink-0">
                  <Icon size={12} className="text-indigo-300" />
                </div>
                <span className="text-[13px] text-gray-300">{text}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="pt-2 flex items-center gap-3">
            <div className="flex -space-x-2">
              {['#6366f1','#8b5cf6','#a78bfa','#06b6d4'].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#1e1b4b] flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: c }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-[12px] text-gray-400">
              Join <span className="text-gray-200 font-semibold">500+</span> companies using SupportAI
            </p>
          </div>
        </div>

        <p className="relative text-[11px] text-gray-600">© 2026 SupportAI · All rights reserved</p>
      </div>

      {/* ══ RIGHT — form ══ */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[400px] space-y-8">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <AIStarIcon size={15} className="text-white" />
            </div>
            <span className="font-extrabold text-gray-900 text-lg">SupportAI</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-[13.5px] text-gray-500">
              New here?{' '}
              <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 underline underline-offset-2">
                Create a free account
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                className="input-field text-[15px]"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12.5px] font-semibold text-gray-700">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field text-[15px] pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.email || !form.password}
              className="w-full btn-primary justify-center py-3 text-[14.5px] rounded-xl mt-1 gap-2.5"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                : <><ArrowRight size={16} /> Sign in</>}
            </button>
          </form>

          {/* Demo box */}
          <div className="p-4 rounded-2xl border border-indigo-100"
            style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles size={13} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-[12.5px] font-bold text-indigo-800 mb-1.5">Demo credentials</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-semibold text-indigo-500 w-16">Email</span>
                    <code className="text-[12px] font-mono text-indigo-700">admin@demo.com</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-semibold text-indigo-500 w-16">Password</span>
                    <code className="text-[12px] font-mono text-indigo-700">password123</code>
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  onClick={() => setForm({ email: 'admin@demo.com', password: 'password123' })}
                >
                  <CheckCircle size={12} />
                  Auto-fill & try demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
