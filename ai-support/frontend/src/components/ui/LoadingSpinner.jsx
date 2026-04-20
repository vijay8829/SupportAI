import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function LoadingSpinner({ fullscreen, size = 'md', className }) {
  const sizes = { sm: 16, md: 24, lg: 40 };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Loader2
      size={sizes[size]}
      className={clsx('animate-spin text-indigo-600', className)}
    />
  );
}
