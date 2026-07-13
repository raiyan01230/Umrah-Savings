import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, Trophy, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info' | 'milestone';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-100'
                : toast.type === 'milestone'
                ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/80 dark:border-amber-700/80 dark:text-amber-100 ring-2 ring-amber-400 dark:ring-amber-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
              {toast.type === 'milestone' && <Trophy className="w-6 h-6 text-amber-500 animate-bounce" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium leading-relaxed">{toast.text}</p>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
