import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileText, Trash2, RefreshCw, CheckCircle,
  XCircle, Plus, X, Loader2, AlertCircle, BookOpen,
  File, Hash, HardDrive, Clock, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { docsAPI } from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

/* ── helpers ── */
function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const STATUS_CFG = {
  ready:      { Icon: CheckCircle, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Ready',      dot: 'bg-emerald-400' },
  processing: { Icon: Loader2,     cls: 'bg-amber-50  text-amber-700  border-amber-200',    label: 'Processing', dot: 'bg-amber-400', spin: true },
  failed:     { Icon: XCircle,     cls: 'bg-red-50    text-red-600    border-red-200',      label: 'Failed',     dot: 'bg-red-400' },
};

const TYPE_CFG = {
  pdf:  { bg: 'bg-red-50',    border: 'border-red-100',    icon: 'text-red-500',    label: 'PDF' },
  faq:  { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'text-violet-500', label: 'FAQ' },
  text: { bg: 'bg-blue-50',   border: 'border-blue-100',   icon: 'text-blue-500',   label: 'TXT' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.processing;
  const { Icon } = cfg;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold border', cfg.cls)}>
      <Icon size={10} className={cfg.spin ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  );
}

/* ── stat card ── */
function MiniStat({ icon: Icon, label, value, color }) {
  return (
    <div className={clsx('flex items-center gap-3 p-4 rounded-2xl border', color)}>
      <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-current" />
      </div>
      <div>
        <p className="text-lg font-extrabold tabular-nums leading-none">{value}</p>
        <p className="text-[11px] font-medium opacity-70 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ══ MAIN ══ */
export default function DocumentUpload() {
  const [docs,      setDocs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState([]);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ name: '', content: '', type: 'faq' });

  const loadDocs = useCallback(async () => {
    try {
      const { data } = await docsAPI.list();
      setDocs(data.documents);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  useEffect(() => {
    if (!docs.some(d => d.status === 'processing')) return;
    const t = setTimeout(loadDocs, 2500);
    return () => clearTimeout(t);
  }, [docs, loadDocs]);

  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setUploading(true);
    setProgress(files.map(f => ({ name: f.name, state: 'loading' })));

    for (let i = 0; i < files.length; i++) {
      const f  = files[i];
      const fd = new FormData();
      fd.append('file', f);
      fd.append('name', f.name);
      fd.append('type', f.type === 'application/pdf' ? 'pdf' : 'text');
      try {
        await docsAPI.upload(fd);
        setProgress(p => p.map((x, j) => j === i ? { ...x, state: 'done' } : x));
        toast.success(`"${f.name}" uploaded`);
      } catch {
        setProgress(p => p.map((x, j) => j === i ? { ...x, state: 'error' } : x));
        toast.error(`Failed: ${f.name}`);
      }
    }
    setUploading(false);
    setProgress([]);
    loadDocs();
  }, [loadDocs]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'text/markdown': ['.md'] },
    maxSize: 10 * 1024 * 1024,
    onDropRejected: (files) => {
      files.forEach(({ file, errors }) =>
        toast.error(`${file.name}: ${errors[0]?.message || 'Rejected'}`)
      );
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.content.trim()) return toast.error('Name and content are required');
    setUploading(true);
    try {
      await docsAPI.uploadText({ name: form.name.trim(), content: form.content.trim(), type: form.type });
      toast.success(`"${form.name}" added`);
      setForm({ name: '', content: '', type: 'faq' });
      setShowForm(false);
      loadDocs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.name}"?\nAll embeddings will be removed.`)) return;
    try {
      await docsAPI.delete(doc._id);
      toast.success('Document deleted');
      setDocs(p => p.filter(d => d._id !== doc._id));
    } catch { toast.error('Delete failed'); }
  };

  const readyDocs   = docs.filter(d => d.status === 'ready');
  const totalChunks = readyDocs.reduce((s, d) => s + (d.chunksCount || 0), 0);
  const failedDocs  = docs.filter(d => d.status === 'failed');

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-extrabold text-gray-900 tracking-tight">Knowledge Base</h1>
          <p className="text-[12px] sm:text-[13px] text-gray-500 mt-0.5">
            {readyDocs.length} active doc{readyDocs.length !== 1 ? 's' : ''}
            {totalChunks > 0 && <> · <span className="font-semibold text-gray-700">{totalChunks.toLocaleString()}</span> chunks indexed</>}
          </p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary flex-shrink-0 text-xs sm:text-sm px-3 py-2">
          <Plus size={13} />
          <span className="hidden sm:inline">Add </span>Content
        </button>
      </div>

      {/* ── Stats row ── */}
      {docs.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <MiniStat icon={FileText} label="Active docs"    value={readyDocs.length}          color="text-indigo-700 bg-indigo-50 border-indigo-100" />
          <MiniStat icon={Hash}     label="Chunks indexed" value={totalChunks.toLocaleString()} color="text-violet-700 bg-violet-50 border-violet-100" />
          <MiniStat icon={HardDrive} label="Failed"        value={failedDocs.length}           color={failedDocs.length > 0 ? 'text-red-700 bg-red-50 border-red-100' : 'text-gray-500 bg-gray-50 border-gray-100'} />
        </div>
      )}

      {/* ── Text/FAQ form ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-[0_4px_24px_rgba(99,102,241,.1)] p-6 animate-slide-down">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900 text-[15px]">Add Text or FAQ</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">Paste product info, policies, or Q&A pairs</p>
            </div>
            <button onClick={() => setShowForm(false)}
              className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Document Name</label>
                <input className="input-field text-[13px]" placeholder="e.g. Product FAQ"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Format</label>
                <select className="input-field text-[13px]" value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="faq">FAQ (Q: / A: pairs)</option>
                  <option value="text">Plain text / article</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">Content</label>
              <textarea
                className="input-field h-44 resize-none font-mono text-[12px] leading-relaxed"
                placeholder={form.type === 'faq'
                  ? 'Q: What is your refund policy?\nA: We offer a 30-day money-back guarantee.\n\nQ: How do I cancel?\nA: You can cancel anytime from your dashboard.'
                  : 'Paste your article, policy, or support documentation here…'}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-gray-400">
                  {form.type === 'faq' ? 'Use "Q:" / "A:" prefixes for best retrieval accuracy' : 'Clear headings improve chunking quality'}
                </p>
                <p className={clsx('text-[11px] tabular-nums font-medium', form.content.length > 8000 ? 'text-amber-500' : 'text-gray-300')}>
                  {form.content.length.toLocaleString()} chars
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <BookOpen size={13} />}
                {uploading ? 'Processing…' : 'Add to Knowledge Base'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Drop zone ── */}
      <div
        {...getRootProps()}
        className={clsx(
          'relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-300',
          isDragActive
            ? 'border-indigo-400 bg-indigo-50/60 scale-[1.015]'
            : 'border-gray-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/20'
        )}
        style={isDragActive ? { boxShadow: '0 0 0 4px rgba(99,102,241,.1) inset' } : {}}
      >
        <input {...getInputProps()} />

        <div className={clsx(
          'w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300',
          isDragActive ? 'bg-indigo-100 scale-110 rotate-6 shadow-lg shadow-indigo-100' : 'bg-gray-50 border border-gray-100'
        )}>
          <Upload size={24} className={isDragActive ? 'text-indigo-600' : 'text-gray-400'} />
        </div>

        <p className={clsx('text-[14px] font-bold transition-colors', isDragActive ? 'text-indigo-700' : 'text-gray-700')}>
          {isDragActive ? 'Drop to upload…' : 'Drag & drop files here'}
        </p>
        <p className="text-[12px] text-gray-400 mt-1.5">
          PDF, TXT, MD · up to <strong className="text-gray-500">10 MB</strong> per file
        </p>
        <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-[12px] text-gray-500 font-medium transition-colors">
          <Plus size={11} /> or click to browse
        </span>

        {/* Upload progress */}
        {uploading && progress.length > 0 && (
          <div className="mt-5 space-y-2 text-left max-w-md mx-auto">
            {progress.map((p, i) => (
              <div key={i} className={clsx(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-[12.5px] transition-all',
                p.state === 'done'    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                p.state === 'error'   ? 'bg-red-50    border-red-200    text-red-600'    :
                                        'bg-white      border-gray-100   text-gray-600'
              )}>
                <File size={12} className="flex-shrink-0 opacity-60" />
                <span className="flex-1 truncate font-medium">{p.name}</span>
                {p.state === 'done'    && <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />}
                {p.state === 'error'   && <XCircle     size={13} className="text-red-400   flex-shrink-0" />}
                {p.state === 'loading' && <Loader2     size={13} className="animate-spin text-indigo-400 flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Document list ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>

        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-[13.5px]">Documents</h3>
            <span className="text-[11px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{docs.length}</span>
          </div>
          <button onClick={loadDocs}
            className="p-1.5 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-indigo-500 transition-all"
            title="Refresh">
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="p-5 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 shimmer rounded-full w-2/5" />
                  <div className="h-2.5 shimmer rounded-full w-1/3" />
                </div>
                <div className="w-20 h-6 shimmer rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && docs.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <FileText size={28} className="text-gray-200" />
            </div>
            <p className="text-[13.5px] font-semibold text-gray-500">No documents yet</p>
            <p className="text-[12px] text-gray-400 mt-1">Upload a PDF or click "Add Content" to paste your FAQ</p>
          </div>
        )}

        {/* Rows */}
        {!loading && docs.length > 0 && (
          <div className="divide-y divide-gray-50/80">
            {docs.map(doc => {
              const ts = TYPE_CFG[doc.type] || TYPE_CFG.text;
              return (
                <div key={doc._id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors group">

                  {/* File icon */}
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border', ts.bg, ts.border)}>
                    <FileText size={16} className={ts.icon} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-gray-900 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={clsx('text-[10.5px] font-bold uppercase tracking-wider', ts.icon)}>{ts.label}</span>
                      {doc.chunksCount > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Hash size={9} />{doc.chunksCount} chunks
                        </span>
                      )}
                      {doc.fileSize > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <HardDrive size={9} />{formatSize(doc.fileSize)}
                        </span>
                      )}
                      {doc.createdAt && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock size={9} />{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {doc.errorMessage && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle size={10} className="text-red-400 flex-shrink-0" />
                        <p className="text-[11px] text-red-400 truncate">{doc.errorMessage}</p>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0"><StatusBadge status={doc.status} /></div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-2 rounded-xl text-gray-200 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                    title="Delete document"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
