"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastKind = "success" | "error";
type ToastOpts = { detail?: string };
type Toast = { id: number; msg: string; kind: ToastKind; detail?: string; open?: boolean };
type PushFn = (msg: string, kind?: ToastKind, opts?: ToastOpts) => void;

const ToastCtx = createContext<PushFn>(() => {});

/** const toast = useToast(); toast("Saved"); toast("Failed", "error"); toast("Failed", "error", { detail: "Ref: corr_…" }); */
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback<PushFn>((msg, kind = "success", opts) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind, detail: opts?.detail }]);
    setTimeout(() => dismiss(id), kind === "error" ? 8000 : 3500);
  }, [dismiss]);
  const toggle = (id: number) => setToasts((t) => t.map((x) => (x.id === id ? { ...x, open: !x.open } : x)));
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[110] flex flex-col gap-2 max-w-md" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role={t.kind === "error" ? "alert" : "status"}
            className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${t.kind === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
            <span className="mt-0.5">{t.kind === "success" ? <CheckCircle2 size={16} aria-hidden /> : <AlertCircle size={16} aria-hidden />}</span>
            <div className="flex-1">
              <span>{t.msg}</span>
              {t.detail && (
                <div className="mt-1">
                  <button onClick={() => toggle(t.id)} className="text-[11px] underline opacity-90 hover:opacity-100">{t.open ? "Hide details" : "Details"}</button>
                  {t.open && <p className="mt-1 text-[11px] font-mono select-all">{t.detail}</p>}
                </div>
              )}
            </div>
            <button onClick={() => dismiss(t.id)} className="ml-1 opacity-80 hover:opacity-100" aria-label="Dismiss notification"><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
