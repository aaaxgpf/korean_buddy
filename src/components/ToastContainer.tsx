import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { ToastItem } from '../types';
import { subscribeToast } from '../utils/toast';

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    // 1. Subscribe to custom internal event dispatcher
    const unsubscribe = subscribeToast((newToast) => {
      setToasts((prev) => {
        // Prevent exact duplicate spam within 1.5s
        const existing = prev.find(t => t.message === newToast.message);
        if (existing) return prev;
        return [...prev.slice(-3), newToast]; // Keep at most 4 active toasts
      });
    });

    // 2. Also listen on window event
    const handleWindowEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        setToasts((prev) => {
          const existing = prev.find(t => t.message === customEvent.detail.message);
          if (existing) return prev;
          return [...prev.slice(-3), customEvent.detail];
        });
      }
    };

    window.addEventListener('app_toast', handleWindowEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('app_toast', handleWindowEvent);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      id="global-toast-container"
      className="fixed top-4 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const duration = toast.duration || 4500;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const config = {
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
      accent: 'bg-rose-600',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      accent: 'bg-amber-600',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      accent: 'bg-emerald-600',
    },
    info: {
      bg: 'bg-stone-50 border-stone-200 text-stone-900',
      icon: <Info className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />,
      accent: 'bg-stone-600',
    },
  }[toast.type || 'info'];

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`pointer-events-auto shadow-lg rounded-2xl border p-3.5 flex items-start gap-3 backdrop-blur-md ${config.bg}`}
      role="alert"
    >
      {config.icon}
      
      <div className="flex-1 min-w-0 pr-1">
        <div className="font-semibold text-xs leading-snug tracking-tight text-neutral-900">
          {toast.title}
        </div>
        <div className="text-[11px] leading-relaxed text-neutral-700 mt-0.5 font-sans break-words">
          {toast.message}
        </div>

        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="mt-2 text-xs font-semibold text-neutral-900 bg-black/5 hover:bg-black/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer shrink-0"
        title="关闭通知"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
