import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles, Download } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type?: 'success' | 'warning' | 'info' | 'download';
  sticky?: boolean;
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 pointer-events-none w-full max-w-xl md:max-w-2xl px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl text-[13px] font-['Public_Sans'] font-medium animate-in fade-in slide-in-from-top-2 duration-200 cursor-pointer border-2 ${
            t.type === 'warning'
              ? 'bg-[#2b1718] text-[#ffdad6] border-[#ffb4ab]'
              : t.type === 'download'
              ? 'bg-[#0f281e] text-[#6ffbbe] border-[#00a86b]'
              : t.type === 'info'
              ? 'bg-[#181d2a] text-[#dae2fd] border-[#4a5878]'
              : 'bg-[#181b25] text-white border-[#3b4354]'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {t.type === 'warning' && <AlertCircle className="w-5 h-5 text-[#ffb4ab]" />}
            {t.type === 'download' && <Download className="w-5 h-5 text-[#6ffbbe]" />}
            {t.type === 'info' && <Sparkles className="w-5 h-5 text-[#82b1ff]" />}
            {(!t.type || t.type === 'success') && (
              <CheckCircle2 className="w-5 h-5 text-[#4edea3]" />
            )}
          </div>
          <div className="flex-1 break-words whitespace-pre-wrap leading-relaxed">
            {t.message}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(t.id);
            }}
            className="text-xs opacity-60 hover:opacity-100 px-1.5 py-0.5 rounded transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
