"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Play, Send, Ban, CheckCircle2, XCircle } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { Card, CheckboxField, CorePage, ErrorBanner, Field, Notice, ReasonDialog, TextAreaField, TextField, btnOutline, btnPrimary } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import type { FieldError, Tariff, TariffConfig, TariffPreview } from "@/lib/core-types";
import {
  bpsToPercentInput, formatIST, formatKg, formatPaise, humanize, isoToISTLocal, istLocalToISO, paiseToRupeesInput, parsePercentToBps, parseRupeesToPaise,
} from "@/lib/format";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

// ───────────────────────────── config form model (PRICING.md §2) ─────────────────────────────
type Unit = "g" | "rupees" | "percent" | "minutes" | "days" | "cm" | "text" | "textarea" | "bool" | "minutesList" | "daysList" | "inputUnits" | "categories" | "fixed";
interface FieldDef { path: string; label: string; unit: Unit; help?: string }
const CATEGORIES = ["DOCUMENTS", "CLOTHING", "ELECTRONICS", "FOOD_NON_PERISHABLE", "LUGGAGE", "HOUSEHOLD", "OTHER"];
const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  { title: "Weight", fields: [
    { path: "weight.toleranceGrams", label: "Tolerance (scale variance)", unit: "g" },
    { path: "weight.billableIncrementGrams", label: "Billable increment", unit: "g" },
    { path: "weight.rounding", label: "Rounding", unit: "fixed" },
    { path: "weight.minDeclaredGrams", label: "Min declared weight", unit: "g" },
    { path: "weight.maxDeclaredGrams", label: "Max declared weight", unit: "g" },
    { path: "weight.minActualGrams", label: "Min actual weight", unit: "g" },
    { path: "weight.maxActualGrams", label: "Max actual weight", unit: "g" },
    { path: "weight.allowedInputUnits", label: "Allowed input units", unit: "inputUnits" },
    { path: "weight.maxDimensionCm", label: "Max dimension", unit: "cm" },
  ] },
  { title: "Base fare", fields: [
    { path: "baseFare.minChargePaise", label: "Minimum charge (ex-tax)", unit: "rupees", help: "Price of the first included weight" },
    { path: "baseFare.includedGrams", label: "Weight included in the minimum", unit: "g", help: "Multiple of the billable increment" },
    { path: "baseFare.perIncrementPaise", label: "Per additional increment (ex-tax)", unit: "rupees" },
  ] },
  { title: "Surcharge", fields: [
    { path: "surcharge.perIncrementPaise", label: "Per extra billable increment (ex-tax)", unit: "rupees" },
    { path: "surcharge.feePaise", label: "Handling fee (once, taxable)", unit: "rupees" },
  ] },
  { title: "Tax", fields: [
    { path: "tax.name", label: "Tax name", unit: "text" },
    { path: "tax.rateBps", label: "Tax rate", unit: "percent" },
    { path: "tax.rounding", label: "Rounding", unit: "fixed" },
    { path: "tax.applyToBaseFare", label: "Apply to base fare", unit: "bool" },
    { path: "tax.applyToSurcharge", label: "Apply to surcharge", unit: "bool" },
  ] },
  { title: "Policy — gates & deadlines", fields: [
    { path: "policy.loadGateEnabled", label: "Load gate enabled (default for routes that inherit)", unit: "bool" },
    { path: "policy.weighingRequired", label: "Weighing required", unit: "bool" },
    { path: "policy.cutoffMinutesBeforeArrival", label: "Payment cutoff before arrival", unit: "minutes" },
    { path: "policy.cutoffFollowsTripDelay", label: "Cutoff follows trip delay (must be off in MVP)", unit: "bool" },
    { path: "policy.deadlineApproachingMinutes", label: "Deadline reminders (descending)", unit: "minutesList" },
    { path: "policy.quoteTtlMinutes", label: "Quote validity", unit: "minutes" },
    { path: "policy.bookingPaymentTtlMinutes", label: "Booking payment window", unit: "minutes" },
    { path: "policy.bookingCloseMinutesBeforeDeparture", label: "Booking closes before departure", unit: "minutes" },
    { path: "policy.evidencePhotoRequiredAboveTolerance", label: "Scale photo required above tolerance", unit: "bool" },
  ] },
  { title: "Policy — money", fields: [
    { path: "policy.autoRefundWhenLighter", label: "Auto-refund when lighter (must be off in MVP)", unit: "bool" },
    { path: "policy.digitalPaymentOnly", label: "Digital payment only (must be on in MVP)", unit: "bool" },
    { path: "policy.waiverMaxPaise.ops_manager", label: "Approval limit — ops manager", unit: "rupees" },
    { path: "policy.waiverMaxPaise.admin", label: "Approval limit — admin", unit: "rupees" },
    { path: "policy.cancellation.fullRefundMinutesBeforeDeparture", label: "Full refund if cancelled before departure by", unit: "minutes" },
    { path: "policy.cancellation.lateRefundBps", label: "Late cancellation refund", unit: "percent" },
    { path: "policy.rejectionRefundBps", label: "Refund when rejected at origin", unit: "percent" },
  ] },
  { title: "Policy — warehouse & catalogue", fields: [
    { path: "policy.warehouseMaxHoldDays", label: "Maximum warehouse hold", unit: "days" },
    { path: "policy.warehouseReminderDays", label: "Reminder days (ascending)", unit: "daysList" },
    { path: "policy.storageFeePaisePerDay", label: "Storage fee per day (must be ₹0.00 in MVP)", unit: "rupees" },
    { path: "policy.allowedCategories", label: "Allowed categories", unit: "categories" },
    { path: "policy.texts.weightPolicy", label: "Weight policy text", unit: "textarea" },
    { path: "policy.texts.restrictedItems", label: "Restricted items text", unit: "textarea" },
    { path: "policy.texts.cancellation", label: "Cancellation text", unit: "textarea" },
  ] },
];

function getPath(o: unknown, path: string): any {
  return path.split(".").reduce((a: any, k) => (a === null || a === undefined ? undefined : a[k]), o);
}
function setPath<T>(o: T, path: string, v: unknown): T {
  const keys = path.split(".");
  const root: any = Array.isArray(o) ? [...(o as any)] : { ...(o as any) };
  let cur = root;
  keys.slice(0, -1).forEach((k) => {
    cur[k] = cur[k] && typeof cur[k] === "object" ? { ...cur[k] } : {};
    cur = cur[k];
  });
  cur[keys[keys.length - 1]] = v;
  return root;
}

function toText(unit: Unit, v: any): string {
  if (v === undefined || v === null) return "";
  switch (unit) {
    case "rupees": return paiseToRupeesInput(v);
    case "percent": return bpsToPercentInput(v);
    case "minutesList": case "daysList": return Array.isArray(v) ? v.join(", ") : "";
    default: return String(v);
  }
}
/** Parses form text into the stored value (integers only for money/weights/percentages); undefined = invalid text. */
function fromText(unit: Unit, t: string): unknown {
  const s = t.trim();
  switch (unit) {
    case "g": case "minutes": case "days": case "cm": return /^\d{1,7}$/.test(s) ? Number(s) : undefined;
    case "rupees": { const p = parseRupeesToPaise(s); return p === null ? undefined : p; }
    case "percent": { const b = parsePercentToBps(s); return b === null ? undefined : b; }
    case "minutesList": case "daysList": {
      if (!s) return [];
      const parts = s.split(/[\s,]+/).filter(Boolean);
      return parts.every((p) => /^\d{1,5}$/.test(p)) ? parts.map(Number) : undefined;
    }
    default: return t;
  }
}

/** Client-side mirror of PRICING.md §2.1 (the server's POST /admin/tariffs/validate is authoritative). */
function clientValidate(c: TariffConfig): Record<string, string> {
  const e: Record<string, string> = {};
  const g = (p: string) => getPath(c, p);
  const inc = g("weight.billableIncrementGrams"), tol = g("weight.toleranceGrams");
  if (!(inc > 0 && inc <= 10000)) e["weight.billableIncrementGrams"] = "Must be 1–10,000 g.";
  if (!(tol >= 0 && tol < inc)) e["weight.toleranceGrams"] = "Must be ≥ 0 and below the billable increment.";
  const minD = g("weight.minDeclaredGrams"), maxD = g("weight.maxDeclaredGrams"), minA = g("weight.minActualGrams"), maxA = g("weight.maxActualGrams");
  if (!(minD >= 1 && minD <= maxD)) e["weight.minDeclaredGrams"] = "Must be ≥ 1 g and ≤ max declared.";
  if (!(maxD <= maxA)) e["weight.maxDeclaredGrams"] = "Must be ≤ max actual.";
  if (!(maxA <= 100000)) e["weight.maxActualGrams"] = "Must be ≤ 100,000 g.";
  if (!(minA >= 1 && minA <= maxA)) e["weight.minActualGrams"] = "Must be ≥ 1 g and ≤ max actual.";
  const units = g("weight.allowedInputUnits");
  if (!Array.isArray(units) || !units.length || units.some((u: string) => !["g", "kg"].includes(u))) e["weight.allowedInputUnits"] = "Select g and/or kg.";
  const dim = g("weight.maxDimensionCm");
  if (!(dim >= 1 && dim <= 200)) e["weight.maxDimensionCm"] = "Must be 1–200 cm.";
  if (!(g("baseFare.minChargePaise") >= 0)) e["baseFare.minChargePaise"] = "Must be ≥ ₹0.00.";
  const incl = g("baseFare.includedGrams");
  if (!(incl >= inc && inc > 0 && incl % inc === 0)) e["baseFare.includedGrams"] = "Must be a multiple of the billable increment (at least one increment).";
  if (!(g("baseFare.perIncrementPaise") > 0)) e["baseFare.perIncrementPaise"] = "Must be more than ₹0.00.";
  if (!(g("surcharge.perIncrementPaise") > 0)) e["surcharge.perIncrementPaise"] = "Must be more than ₹0.00.";
  if (!(g("surcharge.feePaise") >= 0)) e["surcharge.feePaise"] = "Must be ≥ ₹0.00.";
  const rate = g("tax.rateBps");
  if (!(rate >= 0 && rate <= 10000)) e["tax.rateBps"] = "Must be 0–100%.";
  const cut = g("policy.cutoffMinutesBeforeArrival");
  if (!(cut >= 0 && cut <= 1440)) e["policy.cutoffMinutesBeforeArrival"] = "Must be 0–1,440 minutes.";
  const dam = g("policy.deadlineApproachingMinutes");
  if (Array.isArray(dam) && !dam.every((m: number, i: number) => m >= 1 && m <= 1440 && (i === 0 || m < dam[i - 1]))) e["policy.deadlineApproachingMinutes"] = "Strictly descending, each 1–1,440.";
  for (const [p, lo, hi] of [["policy.quoteTtlMinutes", 1, 120], ["policy.bookingPaymentTtlMinutes", 1, 120], ["policy.bookingCloseMinutesBeforeDeparture", 0, 720]] as const)
    if (!(g(p) >= lo && g(p) <= hi)) e[p] = `Must be ${lo}–${hi} minutes.`;
  for (const p of ["policy.cancellation.lateRefundBps", "policy.rejectionRefundBps"]) if (!(g(p) >= 0 && g(p) <= 10000)) e[p] = "Must be 0–100%.";
  const wo = g("policy.waiverMaxPaise.ops_manager"), wa = g("policy.waiverMaxPaise.admin");
  if (!(wo >= 0)) e["policy.waiverMaxPaise.ops_manager"] = "Must be ≥ ₹0.00.";
  if (!(wa >= wo)) e["policy.waiverMaxPaise.admin"] = "Must be ≥ the ops manager limit.";
  const mh = g("policy.warehouseMaxHoldDays");
  if (!(mh >= 1 && mh <= 60)) e["policy.warehouseMaxHoldDays"] = "Must be 1–60 days.";
  const rd = g("policy.warehouseReminderDays");
  if (Array.isArray(rd) && !rd.every((d: number, i: number) => d < mh && (i === 0 || d > rd[i - 1]))) e["policy.warehouseReminderDays"] = "Strictly ascending and below the maximum hold.";
  if (g("policy.storageFeePaisePerDay") !== 0 && g("policy.storageFeePaisePerDay") !== undefined) e["policy.storageFeePaisePerDay"] = "Storage fees are out of MVP: must be ₹0.00.";
  const cats = g("policy.allowedCategories");
  if (Array.isArray(cats) && !cats.length) e["policy.allowedCategories"] = "Select at least one category.";
  for (const p of ["policy.texts.weightPolicy", "policy.texts.restrictedItems", "policy.texts.cancellation"]) {
    const t = g(p);
    if (typeof t === "string" && (!t.trim() || t.length > 1000)) e[p] = "Required, at most 1,000 characters.";
  }
  if (g("policy.autoRefundWhenLighter") === true) e["policy.autoRefundWhenLighter"] = "Must be off in MVP.";
  if (g("policy.digitalPaymentOnly") === false) e["policy.digitalPaymentOnly"] = "Must be on in MVP.";
  if (g("policy.cutoffFollowsTripDelay") === true) e["policy.cutoffFollowsTripDelay"] = "Must be off in MVP.";
  return e;
}

const UNIT_SUFFIX: Partial<Record<Unit, string>> = { g: "g", minutes: "minutes", days: "days", cm: "cm", percent: "%" };

function ConfigField({ def, value, onChange, error, readOnly }: { def: FieldDef; value: any; onChange: (v: unknown, valid: boolean) => void; error?: string; readOnly: boolean }) {
  const [text, setText] = useState(toText(def.unit, value));
  const [bad, setBad] = useState(false);
  // Re-sync from the stored value (e.g. another version selected) without reformatting what the user is typing.
  useEffect(() => {
    setText((t) => (JSON.stringify(fromText(def.unit, t)) === JSON.stringify(value) ? t : toText(def.unit, value)));
    setBad(false);
  }, [value, def.unit]);
  if (def.unit === "bool")
    return <CheckboxField label={def.label} checked={!!value} onChange={(v) => onChange(v, true)} disabled={readOnly} hint={error} />;
  if (def.unit === "fixed")
    return <Field label={def.label}><p className="text-[13px] font-mono text-ink py-2">{String(value ?? "—")}</p></Field>;
  if (def.unit === "inputUnits" || def.unit === "categories") {
    const all = def.unit === "inputUnits" ? ["g", "kg"] : CATEGORIES;
    const cur: string[] = Array.isArray(value) ? value : [];
    return (
      <fieldset>
        <legend className="text-[12px] font-semibold text-ink-soft mb-1">{def.label}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {all.map((x) => <CheckboxField key={x} label={def.unit === "categories" ? humanize(x) : x} checked={cur.includes(x)} disabled={readOnly} onChange={(on) => onChange(on ? [...cur, x].filter((y, i, a) => a.indexOf(y) === i) : cur.filter((y) => y !== x), true)} />)}
        </div>
        {error && <p className="text-[11px] text-danger" role="alert">{error}</p>}
      </fieldset>
    );
  }
  if (def.unit === "textarea")
    return <TextAreaField label={def.label} value={String(value ?? "")} onChange={(v) => onChange(v, true)} disabled={readOnly} maxLength={1000} rows={3} error={error} />;
  const hint = def.unit === "rupees" && typeof value === "number" ? `${formatPaise(value)}${def.help ? ` · ${def.help}` : ""}` : def.unit === "g" && typeof value === "number" ? `${formatKg(value)}${def.help ? ` · ${def.help}` : ""}` : def.help;
  return (
    <TextField label={def.label} value={text} disabled={readOnly} prefix={def.unit === "rupees" ? "₹" : undefined} suffix={UNIT_SUFFIX[def.unit]}
      inputMode={def.unit === "text" ? "text" : "decimal"}
      hint={def.unit === "minutesList" ? "Minutes, comma separated (e.g. 120, 30)" : def.unit === "daysList" ? "Days, comma separated (e.g. 1, 3, 6)" : hint}
      error={bad ? "Enter a valid value." : error}
      onChange={(t) => {
        setText(t);
        const v = fromText(def.unit, t);
        setBad(v === undefined);
        onChange(v === undefined ? value : v, v !== undefined);
      }} />
  );
}

// Worked examples (PRICING.md §6) run through POST /admin/tariffs/{id}/preview; seed v1 values for reference only.
const EXAMPLES = [
  { id: "E1", declared: 500, actual: 800, seed: { outcome: "CHARGEABLE", total: 4720 } },
  { id: "E3", declared: 500, actual: 550, seed: { outcome: "WITHIN_TOLERANCE", total: 0 } },
  { id: "E4", declared: 500, actual: 551, seed: { outcome: "CHARGEABLE", total: 4720 } },
  { id: "E5", declared: 500, actual: 1800, seed: { outcome: "CHARGEABLE", total: 14160 } },
  { id: "E6", declared: 1000, actual: 700, seed: { outcome: "UNDER_DECLARED", total: 0 } },
];

function TariffsBody() {
  const { roles } = useAuth();
  const canWrite = hasAnyRole(roles, WRITE_ROLES.tariffs);
  const { run, busy } = useAction();
  const list = useCoreQuery<Tariff[]>(() => coreAdmin.tariffs(), []);
  const tariffs = useMemo(() => [...(list.data || [])].sort((a, b) => (b.version || 0) - (a.version || 0)), [list.data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [config, setConfig] = useState<TariffConfig | null>(null);
  const [notes, setNotes] = useState("");
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [serverErrors, setServerErrors] = useState<FieldError[]>([]);
  const [results, setResults] = useState<Record<string, TariffPreview | { error: string }>>({});
  const [publishOpen, setPublishOpen] = useState(false);
  const [retireOpen, setRetireOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const selected = tariffs.find((t) => t.id === selectedId) || null;
  useEffect(() => {
    if (!selectedId && tariffs.length) setSelectedId((tariffs.find((t) => t.effectiveNow) || tariffs[0]).id);
  }, [tariffs, selectedId]);
  useEffect(() => {
    if (!selected) return;
    setConfig(selected.config ? JSON.parse(JSON.stringify(selected.config)) : null);
    setNotes(selected.notes || "");
    setInvalid(new Set());
    setServerErrors([]);
    setResults({});
  }, [selected]);

  const readOnly = !canWrite || selected?.status !== "DRAFT";
  const clientErrors = useMemo(() => (config ? clientValidate(config) : {}), [config]);
  const errorFor = (path: string) => clientErrors[path] || serverErrors.find((f) => f.field === path || f.field === `config.${path}`)?.message || (serverErrors.find((f) => f.field === path || f.field === `config.${path}`) ? "Invalid (server)" : undefined);

  // Live server validation of drafts (debounced).
  useEffect(() => {
    if (!config || readOnly) return;
    const t = setTimeout(() => {
      coreAdmin.validateTariff(config).then((r) => setServerErrors(r.valid ? [] : r.fieldErrors || [])).catch(() => {});
    }, 700);
    return () => clearTimeout(t);
  }, [config, readOnly]);

  const dirty = !!selected && (JSON.stringify(selected.config) !== JSON.stringify(config) || notes !== (selected.notes || ""));
  const hasErrors = invalid.size > 0 || Object.keys(clientErrors).length > 0 || serverErrors.length > 0;
  const body = () => ({
    code: selected?.code || "STANDARD",
    ...(selected?.operatorId ? { operatorId: selected.operatorId } : {}),
    ...(selected?.routeId ? { routeId: selected.routeId } : {}),
    config,
    ...(notes.trim() ? { notes: notes.trim() } : {}),
  });

  const save = async () => {
    if (!selected || !config) return;
    const r = await run(() => coreAdmin.updateTariff(selected.id, body()), { success: "Draft saved" });
    if (r) { await list.reload(); setSelectedId(r.id); }
  };
  const createDraft = async () => {
    if (!config) return;
    const r = await run(() => coreAdmin.createTariff(body()), { success: (t) => `Draft v${t.version ?? ""} created` });
    if (r) { await list.reload(); setSelectedId(r.id); }
  };
  const runExamples = async () => {
    if (!selected) return;
    const out: Record<string, TariffPreview | { error: string }> = {};
    await Promise.all(EXAMPLES.map(async (ex) => {
      try {
        out[ex.id] = await coreAdmin.previewTariff(selected.id, { declaredWeightGrams: ex.declared, actualWeightGrams: ex.actual });
      } catch (e: any) {
        out[ex.id] = { error: e?.message || "Preview failed" };
      }
    }));
    setResults(out);
  };
  const fromIso = istLocalToISO(from);
  const toIso = to ? istLocalToISO(to) : null;
  const publish = async (reason: string) => {
    if (!selected || !fromIso) return;
    const r = await run(() => coreAdmin.publishTariff(selected.id, { effectiveFrom: fromIso, ...(toIso ? { effectiveTo: toIso } : {}), reason }), { success: (t) => `Tariff v${t.version ?? ""} published` });
    if (r) { setPublishOpen(false); list.reload(); }
  };
  const retire = async (reason: string) => {
    if (!selected || !toIso) return;
    const r = await run(() => coreAdmin.retireTariff(selected.id, { effectiveTo: toIso, reason }), { success: "Tariff retired" });
    if (r) { setRetireOpen(false); list.reload(); }
  };

  return (
    <>
      <ErrorBanner error={list.error} onRetry={list.reload} />
      <DataTable caption="Tariff versions (newest first)" rowKey={(t) => t.id} data={tariffs} loading={list.loading && !list.data} emptyMessage="No tariffs"
        onRowClick={(t) => setSelectedId(t.id)} rowClassName={(t) => (t.effectiveNow ? "bg-success/[0.06]" : t.id === selectedId ? "dz-row-highlight" : undefined)}
        columns={[
          { key: "v", label: "Version", render: (t: Tariff) => <span className="font-semibold">{t.code} v{t.version}</span> },
          { key: "status", label: "Status", render: (t: Tariff) => <span className="flex flex-wrap gap-1">{t.status && <StatusBadge status={t.status} kind="generic" />}{t.effectiveNow && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success"><CheckCircle2 className="w-3 h-3" aria-hidden />Effective now</span>}</span> },
          { key: "scope", label: "Scope", render: (t: Tariff) => (t.routeId ? "Route" : t.operatorId ? "Operator" : "Global") },
          { key: "from", label: "Effective from", render: (t: Tariff) => formatIST(t.effectiveFrom) },
          { key: "to", label: "Effective to", render: (t: Tariff) => formatIST(t.effectiveTo) },
          { key: "published", label: "Published", render: (t: Tariff) => formatIST(t.publishedAt) },
          { key: "sel", label: "", render: (t: Tariff) => (t.id === selectedId ? <span className="text-[11px] font-semibold text-ink-soft">Selected</span> : null) },
        ]} />

      {selected && config && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <Card title={`${selected.code} v${selected.version} — ${humanize(selected.status)}`} actions={
              canWrite && (
                <>
                  {selected.status === "DRAFT" && <button className={btnPrimary} disabled={busy || !dirty || hasErrors} onClick={save}><Save className="w-4 h-4" aria-hidden />Save draft</button>}
                  {selected.status === "DRAFT" && <button className={btnOutline} disabled={busy || dirty || hasErrors} onClick={() => { setFrom(isoToISTLocal(Date.now() + 10 * 60000)); setTo(""); setPublishOpen(true); }}><Send className="w-4 h-4" aria-hidden />Publish</button>}
                  {selected.status !== "DRAFT" && <button className={btnOutline} disabled={busy} onClick={createDraft}><Plus className="w-4 h-4" aria-hidden />New draft from this version</button>}
                  {selected.status === "PUBLISHED" && <button className={btnOutline} disabled={busy} onClick={() => { setTo(isoToISTLocal(Date.now() + 10 * 60000)); setRetireOpen(true); }}><Ban className="w-4 h-4" aria-hidden />Retire</button>}
                </>
              )
            }>
              {readOnly && <Notice tone="info">{selected.status === "DRAFT" ? "Read-only: only an admin can edit tariffs." : "Published and retired versions are read-only. Create a new draft to change prices."}</Notice>}
              {dirty && selected.status === "DRAFT" && <p className="mt-2 text-[12px] text-warning">Unsaved changes — save the draft before previewing or publishing.</p>}
              {serverErrors.length > 0 && <div className="mt-2"><Notice tone="danger" title="The server rejected this configuration">{serverErrors.map((f) => `${f.field}: ${f.message || f.rule}`).join("; ")}</Notice></div>}
              <p className="mt-2 text-[12px] text-ink-soft">Schema v{config.schemaVersion} · currency {config.currency}{selected.configHash ? ` · hash ${selected.configHash.slice(0, 12)}…` : ""}</p>
            </Card>
            {SECTIONS.map((sec) => (
              <Card key={sec.title} title={sec.title}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sec.fields.map((f) => (
                    <div key={f.path} className={f.unit === "textarea" || f.unit === "categories" ? "md:col-span-2" : undefined}>
                      <ConfigField def={f} value={getPath(config, f.path)} readOnly={readOnly} error={errorFor(f.path)}
                        onChange={(v, valid) => {
                          setInvalid((s) => { const n = new Set(s); if (valid) n.delete(f.path); else n.add(f.path); return n; });
                          if (valid) setConfig((c) => (c ? setPath(c, f.path, v) : c));
                        }} />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
            <Card title="Notes"><TextAreaField label="Internal notes" value={notes} onChange={setNotes} maxLength={500} disabled={readOnly} rows={2} /></Card>
          </div>

          <div className="space-y-4">
            <Card title="Worked examples (PRICING.md §6)" actions={<button className={btnOutline} onClick={runExamples} disabled={dirty}><Play className="w-4 h-4" aria-hidden />Run preview</button>}>
              <p className="text-[12px] text-ink-soft mb-2">Each example is calculated by the server with {selected.code} v{selected.version} (POST /admin/tariffs/{"{id}"}/preview). “Seed v1” shows the reference values of the seeded tariff.</p>
              <table className="rb-table">
                <thead><tr><th scope="col">Ex.</th><th scope="col">Declared → actual</th><th scope="col">Server result</th><th scope="col">Seed v1</th></tr></thead>
                <tbody>
                  {EXAMPLES.map((ex) => {
                    const r = results[ex.id];
                    const err = r && "error" in r ? r.error : null;
                    const p = r && !("error" in r) ? r : null;
                    const total = p ? p.surcharge?.totalPaise ?? 0 : null;
                    const match = p ? total === ex.seed.total && p.evaluation?.outcome === ex.seed.outcome : null;
                    return (
                      <tr key={ex.id}>
                        <td className="font-semibold">{ex.id}</td>
                        <td className="text-[12px] tabular-nums">{formatKg(ex.declared)} → {formatKg(ex.actual)}</td>
                        <td className="text-[12px]">
                          {err ? <span className="text-danger">{err}</span> : p ? (
                            <span className="flex flex-col gap-0.5">
                              {p.evaluation?.outcome && <StatusBadge status={p.evaluation.outcome} kind="generic" />}
                              <span className="tabular-nums">Surcharge {formatPaise(total)} · {p.evaluation?.extraUnits ?? 0} unit(s)</span>
                              <span className="tabular-nums text-ink-soft">Base fare {p.baseFare?.totalDisplay || formatPaise(p.baseFare?.totalPaise)}</span>
                            </span>
                          ) : <span className="text-ink-faint">Not run</span>}
                        </td>
                        <td className="text-[12px]">
                          <span className="tabular-nums">{formatPaise(ex.seed.total)}</span>
                          {match !== null && (match ? <span className="flex items-center gap-1 text-success"><CheckCircle2 className="w-3 h-3" aria-hidden />matches</span> : <span className="flex items-center gap-1 text-warning"><XCircle className="w-3 h-3" aria-hidden />differs</span>)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}

      <ReasonDialog open={publishOpen} title={`Publish ${selected?.code} v${selected?.version}`} busy={busy} onClose={() => setPublishOpen(false)} confirmLabel="Publish tariff"
        canConfirm={!!fromIso && new Date(fromIso).getTime() >= Date.now() && (!to || (!!toIso && new Date(toIso) > new Date(fromIso)))}
        summary={<>New bookings quoted from the effective time use this tariff. Existing bookings keep their tariff snapshot. Tariffs cannot be published retroactively.</>}
        onConfirm={publish}>
        <TextField label="Effective from (IST)" type="datetime-local" value={from} onChange={setFrom} required
          error={fromIso && new Date(fromIso).getTime() < Date.now() ? "Must be now or later." : undefined} />
        <TextField label="Effective to (IST, optional)" type="datetime-local" value={to} onChange={setTo} />
      </ReasonDialog>
      <ReasonDialog open={retireOpen} title={`Retire ${selected?.code} v${selected?.version}`} busy={busy} onClose={() => setRetireOpen(false)} confirmLabel="Retire tariff" danger
        canConfirm={!!toIso && new Date(toIso).getTime() >= Date.now()} summary="The tariff stops applying to new quotes at the time below." onConfirm={retire}>
        <TextField label="Effective to (IST)" type="datetime-local" value={to} onChange={setTo} required />
      </ReasonDialog>
    </>
  );
}

/** P12 — tariff versions, config editor, validation, worked examples, publish/retire (admin; ops/finance read-only). */
export default function TariffsPage() {
  return (
    <CorePage title="Tariffs" description="Effective-dated tariff versions with worked-example previews (FR-ADM-003, PRICING.md)" roles={PAGE_ROLES.tariffs}>
      <TariffsBody />
    </CorePage>
  );
}
