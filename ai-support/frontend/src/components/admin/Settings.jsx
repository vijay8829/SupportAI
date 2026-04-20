import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Save, Copy, ExternalLink, Sparkles, Palette,
  MessageSquare, Key, CheckCircle, Loader2,
  Globe, Building2, Zap, Hash
} from 'lucide-react';
import clsx from 'clsx';

const PROMPT_TEMPLATES = [
  {
    label: 'Professional',
    icon: '🎯',
    value: "You are a professional customer support assistant. Answer questions ONLY based on the provided knowledge base context. Be concise, friendly, and accurate. If you don't know something, say so clearly.",
  },
  {
    label: 'Casual & Friendly',
    icon: '😊',
    value: "You're a helpful and friendly support buddy! Answer questions based on the context provided. Keep it casual, warm, and to the point. If something isn't in your knowledge base, let them know cheerfully!",
  },
  {
    label: 'Technical Expert',
    icon: '🔧',
    value: "You are a technical support specialist. Provide precise, detailed answers based strictly on the documentation provided. Use technical terminology where appropriate. Always cite the relevant section when answering.",
  },
];

const BRAND_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444',
  '#f59e0b','#10b981','#06b6d4','#0ea5e9',
  '#64748b','#1e293b',
];

function Section({ icon: Icon, iconColor, title, desc, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', iconColor)}>
            <Icon size={14} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-[13.5px]">{title}</h3>
            <p className="text-[11.5px] text-gray-400 mt-0.5">{desc}</p>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { company, updateCompany } = useAuth();
  const [form, setForm] = useState({
    systemPrompt:   company?.systemPrompt   || '',
    welcomeMessage: company?.welcomeMessage || '',
    primaryColor:   company?.primaryColor   || '#6366f1',
  });
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [copiedUrl,  setCopiedUrl]  = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(null);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCompany(form);
      setSaved(true);
      toast.success('Settings saved!');
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const chatUrl = `${window.location.origin}/chat/${company?.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(chatUrl);
    setCopiedUrl(true);
    toast.success('URL copied!');
    setTimeout(() => setCopiedUrl(false), 2200);
  };

  const applyTemplate = (idx) => {
    setForm(f => ({ ...f, systemPrompt: PROMPT_TEMPLATES[idx].value }));
    setActiveTemplate(idx);
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Customize your AI assistant and chat widget</p>
      </div>

      {/* ── Widget URL ── */}
      <Section icon={Globe} iconColor="bg-indigo-50 text-indigo-600" title="Chat Widget URL" desc="Share with customers or embed in your site">
        <div className="flex gap-2">
          <input
            className="input-field font-mono text-[12px] flex-1 bg-gray-50 text-gray-600"
            value={chatUrl}
            readOnly
          />
          <button
            onClick={copyUrl}
            className={clsx('btn-secondary flex-shrink-0 transition-all', copiedUrl && 'text-emerald-600 border-emerald-200 bg-emerald-50')}
          >
            {copiedUrl ? <CheckCircle size={13} /> : <Copy size={13} />}
            {copiedUrl ? 'Copied!' : 'Copy'}
          </button>
          <a href={chatUrl} target="_blank" rel="noreferrer" className="btn-primary flex-shrink-0">
            <ExternalLink size={13} /> Open
          </a>
        </div>
      </Section>

      {/* ── OpenAI key notice ── */}
      <div className="rounded-2xl border border-amber-100 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #fffbeb, #fff7ed)' }}>
        <div className="p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Key size={15} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 text-[13.5px] mb-1.5">Activate Real AI</h3>
            <p className="text-[12.5px] text-amber-700 leading-relaxed mb-2">
              Currently in <strong>demo mode</strong>. Enable real AI answers by adding your OpenAI key:
            </p>
            <ol className="text-[12px] text-amber-700 space-y-1 list-decimal pl-4">
              <li>Get your key at <strong className="text-amber-900">platform.openai.com</strong></li>
              <li>Open <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono border border-amber-200 text-amber-800">backend/.env</code></li>
              <li>Set <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono border border-amber-200 text-amber-800">OPENAI_API_KEY=sk-...</code></li>
              <li>Restart the backend server</li>
            </ol>
          </div>
        </div>
      </div>

      {/* ── System prompt ── */}
      <Section icon={Sparkles} iconColor="bg-violet-50 text-violet-600" title="AI System Prompt" desc="Defines personality, tone, and behavior">
        <div className="flex gap-2 mb-3 flex-wrap">
          {PROMPT_TEMPLATES.map((t, i) => (
            <button
              key={t.label}
              onClick={() => applyTemplate(i)}
              className={clsx(
                'flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full border font-medium transition-all',
                activeTemplate === i
                  ? 'bg-violet-600 text-white border-violet-600 shadow-[0_2px_8px_rgba(124,58,237,.35)]'
                  : 'border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50'
              )}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <textarea
          className="input-field h-36 font-mono text-[12px] resize-none leading-relaxed"
          value={form.systemPrompt}
          onChange={e => { set('systemPrompt')(e); setActiveTemplate(null); }}
          placeholder="You are a helpful customer support assistant for [Company]…"
        />
        <p className="text-[11.5px] text-gray-400 mt-1.5 flex items-center gap-1.5">
          <Zap size={10} className="text-violet-400" />
          Knowledge base context is automatically appended — don't include product data here.
        </p>
      </Section>

      {/* ── Welcome message ── */}
      <Section icon={MessageSquare} iconColor="bg-emerald-50 text-emerald-600" title="Welcome Message" desc="First message users see when the chat opens">
        <input
          className="input-field text-[13.5px]"
          value={form.welcomeMessage}
          onChange={set('welcomeMessage')}
          placeholder="Hi there! How can I help you today?"
        />

        {/* Preview */}
        <div className="mt-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
          <p className="text-[11px] font-semibold text-gray-400 mb-2.5 uppercase tracking-wider">Preview</p>
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0"
              style={{ boxShadow: '0 2px 8px rgba(99,102,241,.35)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
              </svg>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] text-gray-700 shadow-sm max-w-xs">
              {form.welcomeMessage || 'Hi there! How can I help you today?'}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Brand color ── */}
      <Section icon={Palette} iconColor="bg-pink-50 text-pink-500" title="Brand Color" desc="Used in the chat widget header and buttons">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {BRAND_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setForm(f => ({ ...f, primaryColor: c }))}
              className={clsx(
                'w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 active:scale-95',
                form.primaryColor === c && 'ring-2 ring-offset-2 scale-110'
              )}
              style={{
                backgroundColor: c,
                ringColor: c,
                boxShadow: form.primaryColor === c ? `0 2px 10px ${c}60` : undefined,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="color"
              value={form.primaryColor}
              onChange={set('primaryColor')}
              className="w-9 h-9 rounded-xl border border-gray-200 cursor-pointer overflow-hidden p-0.5"
            />
          </div>
          <input
            className="input-field w-32 font-mono text-[13px] uppercase"
            value={form.primaryColor}
            onChange={set('primaryColor')}
          />
          {/* Live preview dot */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 transition-all duration-300"
            style={{ backgroundColor: form.primaryColor, boxShadow: `0 3px 12px ${form.primaryColor}50` }}>
            AI
          </div>
        </div>
      </Section>

      {/* ── Account info ── */}
      <Section icon={Building2} iconColor="bg-gray-100 text-gray-500" title="Account Info" desc="Your company details and usage">
        <div className="space-y-2">
          {[
            { label: 'Company',              value: company?.name,                           icon: Building2 },
            { label: 'Widget slug',          value: company?.slug,   mono: true,             icon: Hash      },
            { label: 'Plan',                 value: company?.plan,   capitalize: true,        icon: Zap       },
            { label: 'Messages this month',  value: company?.messagesThisMonth?.toLocaleString() || '0', icon: MessageSquare },
          ].map(({ label, value, mono, capitalize, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <Icon size={12} className="text-gray-400" />
                <span className="text-[13px] text-gray-500">{label}</span>
              </div>
              <span className={clsx(
                'text-[13px] font-semibold',
                mono       ? 'font-mono text-[12px] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-lg text-gray-700' : 'text-gray-900',
                capitalize && 'capitalize text-indigo-600'
              )}>
                {value ?? '—'}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Save ── */}
      <div className="flex items-center justify-between pt-1 pb-3">
        <p className="text-[12px] text-gray-400">
          {saved ? '✓ All changes saved' : 'Unsaved changes will be lost on navigation'}
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className={clsx(
            'btn-primary px-6 py-2.5 transition-all min-w-[140px] justify-center',
            saved && '!from-emerald-500 !to-emerald-600 !shadow-[0_2px_8px_rgba(16,185,129,.4)]'
          )}
        >
          {saving  ? <><Loader2 size={14} className="animate-spin" /> Saving…</> :
           saved   ? <><CheckCircle size={14} /> Saved!</>                       :
                     <><Save size={14} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
