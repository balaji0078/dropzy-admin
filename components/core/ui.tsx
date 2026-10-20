"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Lock, RefreshCw, Info } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth-context";
import { CORE_API } from "@/lib/config";
import type { Role } from "@/lib/core-types";
import { hasAnyRole, landingRoute } from "@/lib/roles";
import { errorCopy, type ErrorContext } from "@/lib/core-errors";
import { formatISTTime } from "@/lib/format";
import { cn } from "@/lib/utils";

// ───────────────────────────── class helpers ─────────────────────────────
export const inputCls =
  "w-full px-3 py-2 text-[13px] rounded-xl border border-line bg-surface-alt text-ink placeholder:text-ink-faint focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/25 disabled:bg-surface disabled:text-ink-faint disabled:cursor-not-allowed";
export const btnPrimary =
  "rb-btn rb-btn-primary px-4 py-2 text-[13px] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";
export const btnOutline =
  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-line-strong text-[13px] font-semibold text-ink bg-surface hover:bg-surface-alt hover:border-gold/60 hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-ink disabled:hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70";
type RowTone = "red" | "green" | "blue" | "indigo" | "amber" | "gray" | "purple";
// Dark-tinted row actions (semantic colours from the customer app; focus ring is always gold).
const ROW_TONE: Record<RowTone, string> = {
  red: "text-danger hover:bg-danger/10",
  green: "text-success hover:bg-success/10",
  blue: "text-info hover:bg-info/10",
  indigo: "text-primary-light hover:bg-primary/15",
  amber: "text-warning hover:bg-warning/10",
  gray: "text-ink-soft hover:bg-surface-alt hover:text-ink",
  purple: "text-purple-400 hover:bg-purple-400/10",
};
export const rowAction = (color: RowTone = "indigo") =>
  `inline-flex items-center gap-1 text-[12px] font-semibold ${ROW_TONE[color]} px-2 py-1 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70`;

// ───────────────────────────── page shell ─────────────────────────────
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-bold text-ink">{title}</h1>
        {description && <p className="text-[13px] text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warning" | "danger" | "success"; title?: ReactNode; children?: ReactNode }) {
  const styles = {
    info: "bg-info/10 border-info/40 text-ink [&_svg]:text-info",
    warning: "bg-warning/10 border-warning/40 text-ink [&_svg]:text-warning",
    danger: "bg-danger/10 border-danger/40 text-ink [&_svg]:text-danger",
    success: "bg-success/10 border-success/40 text-ink [&_svg]:text-success",
  }[tone];
  const Icon = tone === "info" ? Info : tone === "success" ? Info : AlertTriangle;
  return (
    <div className={cn("flex gap-2.5 rounded-xl border px-4 py-3 text-[13px]", styles)} role={tone === "danger" ? "alert" : "status"}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  );
}

/**
 * Wrapper for every core page: renders the page header, gates by role (page access per CLIENT_CONTRACTS.md §4.1) and
 * shows a notice when NEXT_PUBLIC_CORE_API is off (core-only routes).
 */
export function CorePage({ title, description, roles, actions, children }: { title: string; description?: ReactNode; roles: readonly Role[]; actions?: ReactNode; children: ReactNode }) {
  const { roles: mine } = useAuth();
  if (!CORE_API) {
    return (
      <div className="space-y-5">
        <PageHeader title={title} description={description} />
        <Notice tone="info" title="Available in core mode">
          This page uses the Dropzy core API. Build the portal with <code className="font-mono">NEXT_PUBLIC_CORE_API=true</code> to enable it.
        </Notice>
      </div>
    );
  }
  if (!hasAnyRole(mine, roles)) {
    return (
      <div className="space-y-5">
        <PageHeader title={title} />
        <div className="rb-card-flat p-8 text-center">
          <Lock className="w-6 h-6 mx-auto text-ink-faint" aria-hidden />
          <p className="mt-2 text-[14px] font-semibold text-ink">You don&apos;t have access to this page.</p>
          <p className="text-[12px] text-ink-soft">Ask an admin if you need this permission.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}

/** Client redirect (used for legacy routes disabled in core mode and for /settlements → /finance/settlements). */
export function Redirect({ to }: { to: string }) {
  const router = useRouter();
  const { roles, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    // /dashboard is not available to warehouse staff: send them to their landing page instead.
    const target = to === "/dashboard" && !hasAnyRole(roles, ["support", "ops_manager", "finance", "admin"]) ? landingRoute(roles) : to;
    router.replace(target);
  }, [to, router, roles, loading]);
  return <p className="text-[13px] text-ink-soft" role="status">Redirecting…</p>;
}

// ───────────────────────────── layout pieces ─────────────────────────────
export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rb-card-flat p-5", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          {title && <h2 className="text-[14px] font-bold text-ink">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function KV({ items, cols = 2 }: { items: [ReactNode, ReactNode][]; cols?: 1 | 2 | 3 | 4 }) {
  const grid = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-3", 4: "grid-cols-2 lg:grid-cols-4" }[cols];
  return (
    <dl className={cn("grid gap-x-6 gap-y-3 text-[13px]", grid)}>
      {items.map(([k, v], i) => (
        <div key={i}>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{k}</dt>
          <dd className="mt-0.5 text-ink break-words">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ErrorBanner({ error, ctx = "default", onRetry }: { error: unknown; ctx?: ErrorContext; onRetry?: () => void }) {
  if (!error) return null;
  const c = errorCopy(error, ctx);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] text-ink [&>div>svg]:text-danger" role="alert">
      <div className="flex gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{c.title}</p>
          {c.body && <p>{c.body}</p>}
          {c.correlationId && <p className="text-[11px] font-mono text-danger mt-0.5">Ref: {c.correlationId}</p>}
        </div>
      </div>
      {onRetry && (
        <button onClick={onRetry} className={btnOutline}>
          <RefreshCw className="w-3.5 h-3.5" aria-hidden /> Retry
        </button>
      )}
    </div>
  );
}

export function LastSynced({ at, onRefresh }: { at: number | string | null | undefined; onRefresh?: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12px] text-ink-soft">
      Last synced {at ? formatISTTime(at) : "—"}
      {onRefresh && (
        <button onClick={onRefresh} className="p-1 rounded hover:bg-surface-alt hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70" aria-label="Refresh now">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}

// ───────────────────────────── forms ─────────────────────────────
export function Field({ label, hint, error, children, required, htmlFor }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-[12px] font-semibold text-ink-soft">
        {label}
        {required && <span className="text-danger" aria-hidden> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-ink-soft">{hint}</p>}
      {error && <p className="text-[11px] text-danger" role="alert">{error}</p>}
    </div>
  );
}

/** Labelled input with generated id. */
export function TextField(props: {
  label: ReactNode; value: string; onChange: (v: string) => void; hint?: ReactNode; error?: ReactNode; required?: boolean; type?: string;
  placeholder?: string; disabled?: boolean; inputMode?: "text" | "numeric" | "decimal" | "tel"; maxLength?: number; suffix?: ReactNode; prefix?: ReactNode;
  autoFocus?: boolean; min?: string; max?: string;
}) {
  const id = useId();
  return (
    <Field label={props.label} hint={props.hint} error={props.error} required={props.required} htmlFor={id}>
      <div className="relative flex items-center">
        {props.prefix && <span className="absolute left-3 text-[13px] text-ink-soft" aria-hidden>{props.prefix}</span>}
        <input
          id={id} type={props.type || "text"} value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder}
          disabled={props.disabled} inputMode={props.inputMode} maxLength={props.maxLength} required={props.required} autoFocus={props.autoFocus}
          min={props.min} max={props.max} aria-invalid={!!props.error}
          className={cn(inputCls, props.prefix ? "pl-7" : "", props.suffix ? "pr-16" : "")}
        />
        {props.suffix && <span className="absolute right-3 text-[12px] text-ink-soft" aria-hidden>{props.suffix}</span>}
      </div>
    </Field>
  );
}

export function SelectField(props: {
  label: ReactNode; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; hint?: ReactNode;
  error?: ReactNode; required?: boolean; disabled?: boolean; placeholder?: string;
}) {
  const id = useId();
  return (
    <Field label={props.label} hint={props.hint} error={props.error} required={props.required} htmlFor={id}>
      <select id={id} value={props.value} onChange={(e) => props.onChange(e.target.value)} disabled={props.disabled} required={props.required} className={inputCls}>
        {props.placeholder !== undefined && <option value="">{props.placeholder}</option>}
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

export function TextAreaField(props: { label: ReactNode; value: string; onChange: (v: string) => void; hint?: ReactNode; error?: ReactNode; required?: boolean; rows?: number; maxLength?: number; disabled?: boolean; placeholder?: string }) {
  const id = useId();
  return (
    <Field label={props.label} hint={props.hint} error={props.error} required={props.required} htmlFor={id}>
      <textarea id={id} value={props.value} onChange={(e) => props.onChange(e.target.value)} rows={props.rows || 3} maxLength={props.maxLength}
        disabled={props.disabled} placeholder={props.placeholder} required={props.required} aria-invalid={!!props.error} className={inputCls} />
    </Field>
  );
}

export function CheckboxField({ label, checked, onChange, disabled, hint }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; hint?: ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="inline-flex items-center gap-2 text-[13px] text-ink cursor-pointer">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="w-4 h-4 accent-primary" />
        {label}
      </label>
      {hint && <p className="text-[11px] text-ink-soft ml-6">{hint}</p>}
    </div>
  );
}

export function RadioGroup<V extends string>({ legend, value, onChange, options }: { legend: ReactNode; value: V | ""; onChange: (v: V) => void; options: { value: V; label: ReactNode; hint?: ReactNode; disabled?: boolean }[] }) {
  const name = useId();
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-[12px] font-semibold text-ink-soft mb-1">{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className={cn("flex items-start gap-2 text-[13px] rounded-lg border px-3 py-2 cursor-pointer", value === o.value ? "border-gold/70 bg-gold/10 shadow-[inset_3px_0_0_#F5C451]" : "border-line hover:border-line-strong", o.disabled && "opacity-50 cursor-not-allowed")}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} disabled={o.disabled} className="mt-0.5 accent-primary" />
          <span>
            <span className="font-medium text-ink">{o.label}</span>
            {o.hint && <span className="block text-[11px] text-ink-soft">{o.hint}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

// ───────────────────────────── tabs ─────────────────────────────
export function Tabs<V extends string>({ tabs, value, onChange, label }: { tabs: { value: V; label: ReactNode }[]; value: V; onChange: (v: V) => void; label: string }) {
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const n = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[n].value);
    (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 border-b border-line">
      {tabs.map((t, i) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} tabIndex={value === t.value ? 0 : -1} onKeyDown={(e) => onKey(e, i)} onClick={() => onChange(t.value)}
          className={cn("px-3 py-2 text-[13px] font-semibold -mb-px border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded-t", value === t.value ? "border-gold text-gold" : "border-transparent text-ink-soft hover:text-ink hover:border-line-strong")}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ───────────────────────────── dialogs ─────────────────────────────
/**
 * Override / confirmation dialog with a mandatory reason (default min 5 chars). Every override in the portal goes through it.
 * `children` renders extra fields; `canConfirm` gates the confirm button on them.
 */
export function ReasonDialog({
  open, title, summary, confirmLabel = "Confirm", minLength = 5, maxLength = 500, reasonLabel = "Reason", danger, busy, canConfirm = true,
  onConfirm, onClose, children, requireReason = true,
}: {
  open: boolean; title: string; summary?: ReactNode; confirmLabel?: string; minLength?: number; maxLength?: number; reasonLabel?: string;
  danger?: boolean; busy?: boolean; canConfirm?: boolean; onConfirm: (reason: string) => void | Promise<void>; onClose: () => void;
  children?: ReactNode; requireReason?: boolean;
}) {
  const [reason, setReason] = useState("");
  useEffect(() => {
    if (open) setReason("");
  }, [open]);
  const len = reason.trim().length;
  const reasonOk = !requireReason || len >= minLength;
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (reasonOk && canConfirm && !busy) onConfirm(reason.trim());
        }}
      >
        {summary && <div className="text-[13px] text-ink">{summary}</div>}
        {children}
        {requireReason && (
          <TextAreaField
            label={`${reasonLabel} (min ${minLength} characters)`}
            value={reason}
            onChange={setReason}
            maxLength={maxLength}
            required
            hint={`${len}/${maxLength}`}
            error={reason && !reasonOk ? `Enter at least ${minLength} characters.` : undefined}
          />
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={btnOutline}>Cancel</button>
          <button type="submit" disabled={!reasonOk || !canConfirm || busy} className={danger ? btnDanger : btnPrimary}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger, busy, onConfirm, onClose }: { open: boolean; title: string; message: ReactNode; confirmLabel?: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="text-[13px] text-ink">{message}</div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnOutline}>Cancel</button>
          <button type="button" data-autofocus onClick={onConfirm} disabled={busy} className={danger ? btnDanger : btnPrimary}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** Small key-value JSON viewer for audit before/after summaries. */
export function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-ink-faint">—</span>;
  return <pre className="text-[11px] bg-surface-alt text-ink-soft border border-line rounded-lg p-2 overflow-x-auto max-w-[480px] whitespace-pre-wrap break-all">{JSON.stringify(value, null, 2)}</pre>;
}
