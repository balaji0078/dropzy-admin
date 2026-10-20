"use client";

import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { coreShipments, coreWarehouses } from "@/lib/core-api";
import type { ShipmentView, Warehouse } from "@/lib/core-types";
import { useCoreQuery, useErrorToast } from "@/lib/use-core";
import { SelectField, btnPrimary, inputCls } from "@/components/core/ui";

const WH_KEY = "dz_portal_warehouse";

/** Warehouses visible to the caller (GET /warehouses; warehouse_staff = own scope) with a remembered selection. */
export function useWarehouseSelection() {
  const q = useCoreQuery<Warehouse[]>(() => coreWarehouses.list(), []);
  const [selected, setSelected] = useState("");
  useEffect(() => {
    const list = q.data || [];
    if (!list.length) return;
    let saved = "";
    try {
      saved = localStorage.getItem(WH_KEY) || "";
    } catch {
      /* per-viewer convenience only */
    }
    setSelected((cur) => (cur && list.some((w) => w.id === cur) ? cur : list.some((w) => w.id === saved) ? saved : list[0].id));
  }, [q.data]);
  const select = (id: string) => {
    setSelected(id);
    try {
      localStorage.setItem(WH_KEY, id);
    } catch {
      /* ignore */
    }
  };
  const warehouse = (q.data || []).find((w) => w.id === selected) || null;
  const nameOf = (id?: string | null) => (id ? (q.data || []).find((w) => w.id === id)?.name : undefined);
  return { warehouses: q.data || [], loading: q.loading, error: q.error, selected, select, warehouse, nameOf };
}

export function WarehousePicker({ sel }: { sel: ReturnType<typeof useWarehouseSelection> }) {
  if (sel.warehouses.length <= 1) {
    return sel.warehouse ? (
      <p className="text-[13px] text-ink">Warehouse: <strong>{sel.warehouse.name}</strong>{sel.warehouse.address ? ` · ${sel.warehouse.address}` : ""}</p>
    ) : sel.loading ? <p className="text-[13px] text-ink-soft">Loading warehouses…</p> : <p className="text-[13px] text-danger">No warehouse is assigned to your account.</p>;
  }
  return (
    <div className="w-72">
      <SelectField label="Warehouse" value={sel.selected} onChange={sel.select} options={sel.warehouses.map((w) => ({ value: w.id, label: `${w.name || w.code}${w.code ? ` (${w.code})` : ""}` }))} />
    </div>
  );
}

/**
 * Scanner-friendly input: USB/camera scanners type the QR token (dzq1.…) or the DCN and press Enter.
 * Resolves through GET /scan/resolve?qr= or ?dcn=.
 */
export function ScanInput({ onResolved, label = "Scan QR or enter DCN", autoFocusKey }: { onResolved: (s: ShipmentView) => void; label?: string; autoFocusKey?: unknown }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const showError = useErrorToast();
  useEffect(() => {
    ref.current?.focus();
  }, [autoFocusKey]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    setBusy(true);
    setError(null);
    try {
      const s = await coreShipments.scan(/^dzq1\./.test(v) ? { qr: v } : { dcn: v.toUpperCase() });
      setValue("");
      onResolved(s);
    } catch (err: any) {
      if (err?.code === "NOT_FOUND") setError("Parcel not found. Check the code.");
      else if (err?.code === "TRIP_ASSIGNMENT_MISMATCH" || err?.code === "FORBIDDEN") setError("You are not assigned to this warehouse.");
      else showError(err);
      ref.current?.select();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-1" role="search" aria-label="Scan parcel">
      <label htmlFor="scan" className="block text-[12px] font-semibold text-ink-soft">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" aria-hidden />
          <input id="scan" ref={ref} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" spellCheck={false}
            placeholder="dzq1.… or DCN-MAA-BLR-…" className={`${inputCls} pl-9 font-mono`} aria-invalid={!!error} aria-describedby={error ? "scan-error" : undefined} />
        </div>
        <button type="submit" disabled={busy || !value.trim()} className={btnPrimary}>{busy ? "Looking up…" : "Find"}</button>
      </div>
      {error && <p id="scan-error" className="text-[12px] text-danger" role="alert">{error}</p>}
    </form>
  );
}
