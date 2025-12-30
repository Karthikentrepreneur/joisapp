import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-full max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(onRemove, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const colors = {
    success: 'border-emerald-100 bg-emerald-50/90',
    error: 'border-rose-100 bg-rose-50/90',
    info: 'border-blue-100 bg-blue-50/90',
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-[1.5rem] border shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-300 w-full max-w-[90vw] md:max-w-md ${colors[toast.type]}`}>
      <div className="shrink-0">
        {icons[toast.type]}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tight">{toast.title}</h4>
        {toast.description && <p className="text-xs text-slate-600 font-medium mt-0.5">{toast.description}</p>}
      </div>
      <button 
        onClick={onRemove}
        className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors text-slate-400 hover:text-slate-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
