"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = true,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800/80 dark:bg-slate-950 sm:p-8"
        >
          <div className="flex flex-col items-center text-center">
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isDestructive ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"}`}>
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {description}
            </p>

            <div className="mt-8 flex w-full gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 app-button app-button-secondary rounded-2xl py-3.5 text-sm font-black disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 app-button rounded-2xl py-3.5 text-sm font-black text-white disabled:opacity-50 ${isDestructive ? "bg-rose-600 hover:bg-rose-700" : "bg-red-600 hover:bg-red-700"}`}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : confirmLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
