import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles, Download } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'warning' | 'info' | 'download';
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#181b25] text-white shadow-xl text-[13px] font-['Public_Sans'] font-medium animate-in fade-in slide-in-from-top-2 duration-200 cursor-pointer"
        >
          {t.type === 'warning' && <AlertCircle className="w-4 h-4 text-[#ffdad6] shrink-0" />}
          {t.type === 'download' && <Download className="w-4 h-4 text-[#6ffbbe] shrink-0" />}
          {t.type === 'info' && <Sparkles className="w-4 h-4 text-[#dae2fd] shrink-0" />}
          {(!t.type || t.type === 'success') && (
            <CheckCircle2 className="w-4 h-4 text-[#4edea3] shrink-0" />
          )}
          <span className="truncate">{t.message}</span>
        </div>
      ))}
    </div>
  );
};
