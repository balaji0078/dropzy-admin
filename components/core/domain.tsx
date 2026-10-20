"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, FileText, Timer } from "lucide-react";
import { coreEvidence } from "@/lib/core-api";
import { API_ORIGIN } from "@/lib/config";
import type { Evidence, SurchargeBreakdown, SurchargeQuote } from "@/lib/core-types";
import { formatBps, formatCountdown, formatGrams, formatIST, formatKg, formatPaise, formatSignedKg } from "@/lib/format";
import { useNow } from "@/lib/use-core";
import { cn } from "@/lib/utils";
import qrcode from "qrcode-generator";

// ───────────────────────────── §6.1 surcharge breakdown ─────────────────────────────
/** Renders CLIENT_CONTRACTS.md §6.1 from the server `breakdown` (display strings and *Paise values only). */
export function SurchargeBreakdownView({ breakdown, quote, title = "Extra weight charge" }: { breakdown: SurchargeBreakdown | undefined | null; quote?: Pick<SurchargeQuote, "version" | "status" | "taxRateBps"> | null; title?: string }) {
  if (!breakdown) return <p className="text-[13px] text-ink-soft">No breakdown available.</p>;
  const b = breakdown;
  const d = b.display || {};
  const lines = b.lines || [];
  const sur = lines.filter((l) => l.code === "SURCHARGE");
  const fee = lines.filter((l) => l.code === "FEE");
  const tax = lines.filter((l) => l.code === "TAX");
  const taxLabel = quote?.taxRateBps !== undefined && quote?.taxRateBps !== null ? `GST ${formatBps(quote.taxRateBps)}` : undefined;
  const rows: [string, string][] = [
    ["Declared weight", d.declared || formatKg(b.declaredWeightGrams)],
    ["Measured weight", d.actual || formatKg(b.actualWeightGrams)],
    ["Difference", d.rawDifference || formatSignedKg(b.rawDifferenceGrams)],
    ["Allowed variance", formatGrams(b.toleranceGrams)],
    ["Billable extra weight", `${d.billableDifference || formatKg(b.billableDifferenceGrams)} (${b.extraUnits ?? 0} × ${formatGrams(b.incrementGrams)})`],
    ...sur.map((l): [string, string] => [`Extra weight (${b.extraUnits ?? 0} × ${formatPaise(b.ratePerIncrementPaise)})`, formatPaise(l.amountPaise)]),
    ...fee.map((l): [string, string] => [l.label || "Surcharge handling fee", formatPaise(l.amountPaise)]),
    ...tax.map((l): [string, string] => [taxLabel || (l.label?.split(" on ")[0] ?? "GST"), formatPaise(l.amountPaise)]),
  ];
  const isOpen = !quote || quote.status === "OPEN";
  return (
    <div className="rounded-xl border border-line p-4 text-[13px]">
      <p className="font-bold text-ink mb-2">{title}</p>
      <table className="w-full">
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={i}>
              <th scope="row" className="text-left font-normal text-ink-soft py-0.5 pr-4">{k}</th>
              <td className="text-right text-ink tabular-nums">{v}</td>
            </tr>
          ))}
          <tr className="border-t border-line">
            <th scope="row" className="text-left font-bold text-ink pt-1.5">{isOpen ? "Total due" : `Total (${quote?.status?.toLowerCase()})`}</th>
            <td className="text-right font-bold text-ink pt-1.5 tabular-nums">{d.total || formatPaise(b.totalPaise)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-ink-soft">
        Tariff version {b.tariffVersion ?? "—"}
        {quote ? ` · Quote v${quote.version}` : ""}
      </p>
    </div>
  );
}

// ───────────────────────────── countdown ─────────────────────────────
/** Deadline with live countdown: "19 Oct, 03:35 PM (1 h 25 min left)" / "passed". */
export function Deadline({ at, compact }: { at: string | null | undefined; compact?: boolean }) {
  const now = useNow(30000);
  if (!at) return <span className="text-ink-faint">—</span>;
  const ms = new Date(at).getTime() - now;
  const passed = ms <= 0;
  return (
    <span className={cn("inline-flex flex-col", compact && "flex-row gap-1.5 items-center")}>
      <span className="text-ink">{formatIST(at)}</span>
      <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold", passed ? "text-danger" : ms < 3600000 ? "text-gold" : "text-ink-soft")}>
        <Timer className="w-3 h-3" aria-hidden />
        {passed ? `Passed ${formatCountdown(-ms)} ago` : `${formatCountdown(ms)} left`}
      </span>
    </span>
  );
}

// ───────────────────────────── OTP boxes ─────────────────────────────
/** `length` boxes (from codeLength; default 6). Paste and keyboard friendly. */
export function OtpInput({ length = 6, value, onChange, disabled, label = "One-time code", autoFocus }: { length?: number; value: string; onChange: (v: string) => void; disabled?: boolean; label?: string; autoFocus?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const n = Math.min(Math.max(length || 6, 4), 8);
  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus, n]);
  const set = (i: number, ch: string) => {
    const arr = value.padEnd(n, " ").slice(0, n).split("");
    arr[i] = ch || " ";
    onChange(arr.join("").replace(/\s+$/, "").replace(/\s/g, ""));
  };
  return (
    <div role="group" aria-label={label} className="flex gap-2">
      {Array.from({ length: n }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          aria-label={`${label} digit ${i + 1} of ${n}`}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          value={value[i] || ""}
          onChange={(e) => {
            // No maxLength: autofill / "one-time-code" suggestions insert the whole code at once and must not be truncated.
            const v = e.target.value.replace(/\D/g, "");
            const prev = value[i] || "";
            if (v.length <= 1) {
              set(i, v);
              if (v && i < n - 1) refs.current[i + 1]?.focus();
              return;
            }
            if (v.length === 2 && prev && v.includes(prev)) {
              set(i, v[0] === prev ? v[1] : v[0]); // overtyping a filled box
              if (i < n - 1) refs.current[i + 1]?.focus();
              return;
            }
            const merged = (value.slice(0, i) + v).slice(0, n);
            onChange(merged);
            refs.current[Math.min(merged.length, n) - 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < n - 1) refs.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            const v = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, n);
            if (v) {
              e.preventDefault();
              onChange(v);
              refs.current[Math.min(v.length, n) - 1]?.focus();
            }
          }}
          className="w-11 h-12 text-center text-[18px] font-bold rounded-lg border border-line-strong focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/40 disabled:bg-surface-alt"
        />
      ))}
    </div>
  );
}

// ───────────────────────────── evidence ─────────────────────────────
export function evidenceUrl(e: Evidence | undefined | null): string | null {
  if (!e?.downloadUrl) return null;
  return /^https?:\/\//.test(e.downloadUrl) ? e.downloadUrl : `${API_ORIGIN}${e.downloadUrl.startsWith("/") ? "" : "/"}${e.downloadUrl}`;
}

/** Thumbnail for an evidence id: GET /evidence/{id} for a short-lived signed URL (permission checked server side). */
export function EvidenceThumb({ id, size = 64, known }: { id: string | null | undefined; size?: number; known?: Evidence }) {
  const [ev, setEv] = useState<Evidence | null>(known || null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!id || known) return;
    let cancelled = false;
    coreEvidence
      .get(id)
      .then((e) => !cancelled && setEv(e))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [id, known]);
  if (!id) return <span className="text-ink-faint">—</span>;
  const url = evidenceUrl(ev);
  if (failed || (ev && !url)) return <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint"><ImageOff className="w-3.5 h-3.5" aria-hidden />Unavailable</span>;
  if (!ev) return <span className="inline-block rounded-lg bg-surface-alt animate-pulse" style={{ width: size, height: size }} aria-label="Loading evidence" />;
  if (ev.contentType === "application/pdf")
    return (
      <a href={url!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] text-info underline">
        <FileText className="w-3.5 h-3.5" aria-hidden />PDF evidence
      </a>
    );
  return (
    <a href={url!} target="_blank" rel="noreferrer" title={`${ev.kind || "Evidence"} · ${formatIST(ev.createdAt)}`} className="inline-block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url!} alt={`${ev.kind || "Evidence"} photo`} width={size} height={size} className="rounded-lg object-cover border border-line" style={{ width: size, height: size }} />
    </a>
  );
}

/** File input for an evidence photo (camera on mobile). */
export function PhotoInput({ label, file, onChange, disabled }: { label: string; file: File | null; onChange: (f: File | null) => void; disabled?: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <div className="space-y-1">
      <label className="block text-[12px] font-semibold text-ink-soft">
        {label}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            if (f && f.size > 5 * 1024 * 1024) {
              e.target.value = "";
              onChange(null);
              alert("Photos must be 5 MB or smaller.");
              return;
            }
            onChange(f);
          }}
          className="mt-1 block w-full text-[12px] text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-surface-alt file:px-3 file:py-2 file:text-[12px] file:font-semibold"
        />
      </label>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview && <img src={preview} alt="Selected photo preview" className="h-24 rounded-lg border border-line object-cover" />}
    </div>
  );
}

// ───────────────────────────── QR (rendered locally; secrets never leave the browser) ─────────────────────────────

export function QrCode({ value, size = 184, label }: { value: string; size?: number; label: string }) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  const margin = 2;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + margin} ${r + margin}h1v1h-1z`;
  return (
    <svg role="img" aria-label={label} width={size} height={size} viewBox={`0 0 ${n + margin * 2} ${n + margin * 2}`} shapeRendering="crispEdges" className="bg-surface">
      <rect width="100%" height="100%" fill="#fff" />
      <path d={d} fill="#111" />
    </svg>
  );
}
