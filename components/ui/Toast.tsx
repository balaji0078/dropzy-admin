"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastKind = "success" | "error";
type Toast = { id: number; msg: string; kind: ToastKind };

const ToastCtx = createContext<(msg: string, kind?: ToastKind) => void>(() => {});

/** const toast = useToast(); toast("Saved"); toast("Failed", "error"); */
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((msg: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status"
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${t.kind === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
            {t.kind === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{t.msg}</span>
            <button onClick={() => dismiss(t.id)} className="ml-1 opacity-80 hover:opacity-100"><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
