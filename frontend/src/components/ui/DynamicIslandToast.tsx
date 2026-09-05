import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';

export interface DynamicIslandToastProps {
  show: boolean;
  message: string | null;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const DynamicIslandToast: React.FC<DynamicIslandToastProps> = ({
  show,
  message,
  type = 'success',
  onClose,
}) => {
  return (
    <AnimatePresence>
      {show && message && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto min-w-[320px] bg-white/95 text-slate-900 backdrop-blur-xl border border-slate-200/90 px-5 py-3 rounded-full shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5 flex items-center justify-between gap-3 pointer-events-auto select-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                type === 'success'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : type === 'error'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}
            >
              {type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : type === 'error' ? (
                <AlertCircle size={16} />
              ) : (
                <Sparkles size={16} />
              )}
            </div>
            <span className="text-xs font-extrabold text-slate-800 truncate pr-1">
              {message}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0 font-extrabold text-xs"
          >
            <X size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
