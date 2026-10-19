"use client";

import { useState } from "react";
import { Plus, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { CheckboxField, CorePage, ErrorBanner, Notice, RadioGroup, SelectField, TextField, btnOutline, btnPrimary, inputCls, rowAction } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import type { Operator, Route, Stop } from "@/lib/core-types";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

type Gate = "inherit" | "on" | "off";
interface StopRow { stopId: string; offsetMinutes: string; allowsOrigin: boolean; allowsDestination: boolean }
const gateOf = (v: boolean | null | undefined): Gate => (v === null || v === undefined ? "inherit" : v ? "on" : "off");
const gateValue = (g: Gate) => (g === "inherit" ? null : g === "on");

function RouteForm({ route, stops, operators, onClose, onSaved }: { route: Route | null; stops: Stop[]; operators: Operator[]; onClose: () => void; onSaved: () => void }) {
  const { run, busy } = useAction();
  const [operatorId, setOperatorId] = useState(route?.operatorId || "");
  const [code, setCode] = useState(route?.code || "");
  const [name, setName] = useState(route?.name || "");
  const [active, setActive] = useState(route?.active ?? true);
  const [gate, setGate] = useState<Gate>(gateOf(route?.loadGateEnabled));
  const [reason, setReason] = useState("");
  const [rows, setRows] = useState<StopRow[]>(
    (route?.stops || [])
      .slice()
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
      .map((s) => ({ stopId: s.stop?.id || "", offsetMinutes: String(s.offsetMinutes ?? 0), allowsOrigin: !!s.allowsOrigin, allowsDestination: !!s.allowsDestination })),
  );
  const gateChanged = gate !== gateOf(route?.loadGateEnabled);
  const offsets = rows.map((r) => (/^\d{1,5}$/.test(r.offsetMinutes) ? Number(r.offsetMinutes) : NaN));
  const stopErrors = (() => {
    if (rows.length < 2) return "A route needs at least two stops.";
    if (rows.some((r) => !r.stopId)) return "Select a stop in every row.";
    if (new Set(rows.map((r) => r.stopId)).size !== rows.length) return "A stop can appear only once.";
    if (offsets.some((o) => Number.isNaN(o))) return "Offsets must be whole minutes.";
    if (offsets.some((o, i) => i > 0 && o < offsets[i - 1])) return "Offsets must not decrease along the route.";
    if (!rows.some((r) => r.allowsOrigin) || !rows.some((r) => r.allowsDestination)) return "Mark at least one origin and one destination stop.";
    return null;
  })();
  const valid = !!operatorId && !!code.trim() && !!name.trim() && !stopErrors && (!gateChanged || reason.trim().length >= 5);
  const update = (i: number, patch: Partial<StopRow>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) => setRows((r) => { const n = [...r]; const j = i + d; if (j < 0 || j >= n.length) return r; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const save = async () => {
    const body: Record<string, unknown> = {
      operatorId, code: code.trim(), name: name.trim(), active, loadGateEnabled: gateValue(gate),
      stops: rows.map((r, i) => ({ stopId: r.stopId, sequence: i + 1, offsetMinutes: Number(r.offsetMinutes), allowsOrigin: r.allowsOrigin, allowsDestination: r.allowsDestination })),
      ...(reason.trim() ? { reason: reason.trim() } : {}),
    };
    const r = await run(() => (route ? coreAdmin.updateRoute(route.id, body) : coreAdmin.createRoute(body)), { success: route ? "Route updated" : "Route created" });
    if (r) onSaved();
  };
  return (
    <Modal open onClose={onClose} title={route ? `Edit ${route.name}` : "New route"} size="xl">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valid) save(); }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SelectField label="Operator" value={operatorId} onChange={setOperatorId} placeholder="Select…" required options={operators.map((o) => ({ value: o.id, label: o.displayName || o.code || o.id }))} />
          <TextField label="Code" value={code} onChange={(v) => setCode(v.toUpperCase())} required />
          <TextField label="Name" value={name} onChange={setName} required />
        </div>
        <CheckboxField label="Active" checked={active} onChange={setActive} />
        <fieldset className="space-y-2">
          <legend className="text-[12px] font-semibold text-gray-600">Stops (in travel order)</legend>
          <div className="overflow-x-auto">
            <table className="rb-table">
              <thead><tr><th scope="col">#</th><th scope="col">Stop</th><th scope="col">Offset (minutes)</th><th scope="col">Origin</th><th scope="col">Destination</th><th scope="col"><span className="sr-only">Order</span></th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td><select aria-label={`Stop ${i + 1}`} value={r.stopId} onChange={(e) => update(i, { stopId: e.target.value })} className={inputCls}><option value="">Select…</option>{stops.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}</select></td>
                    <td><input aria-label={`Offset for stop ${i + 1}`} value={r.offsetMinutes} inputMode="numeric" onChange={(e) => update(i, { offsetMinutes: e.target.value.replace(/\D/g, "") })} className={`${inputCls} w-24`} /></td>
                    <td><input type="checkbox" aria-label={`Stop ${i + 1} allows origin`} checked={r.allowsOrigin} onChange={(e) => update(i, { allowsOrigin: e.target.checked })} className="w-4 h-4 accent-[#D82C2C]" /></td>
                    <td><input type="checkbox" aria-label={`Stop ${i + 1} allows destination`} checked={r.allowsDestination} onChange={(e) => update(i, { allowsDestination: e.target.checked })} className="w-4 h-4 accent-[#D82C2C]" /></td>
                    <td className="whitespace-nowrap">
                      <button type="button" className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move stop ${i + 1} up`}><ArrowUp className="w-4 h-4" /></button>
                      <button type="button" className="p-1 rounded hover:bg-gray-100 disabled:opacity-30" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label={`Move stop ${i + 1} down`}><ArrowDown className="w-4 h-4" /></button>
                      <button type="button" className="p-1 rounded hover:bg-red-50 text-red-600" onClick={() => setRows((x) => x.filter((_, j) => j !== i))} aria-label={`Remove stop ${i + 1}`}><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className={btnOutline} onClick={() => setRows((r) => [...r, { stopId: "", offsetMinutes: r.length ? r[r.length - 1].offsetMinutes : "0", allowsOrigin: r.length === 0, allowsDestination: r.length > 0 }])}><Plus className="w-4 h-4" aria-hidden />Add stop</button>
          {stopErrors && <p className="text-[12px] text-red-700" role="alert">{stopErrors}</p>}
        </fieldset>
        <RadioGroup<Gate> legend="Load gate (payment must be verified before loading)" value={gate} onChange={setGate} options={[
          { value: "inherit", label: "Inherit tariff policy", hint: route ? `Currently effective: ${route.effectiveLoadGateEnabled ? "on" : "off"}` : undefined },
          { value: "on", label: "On" }, { value: "off", label: "Off", hint: "Parcels travel with the unpaid hold; the destination cutoff is the final control." },
        ]} />
        {gateChanged && <TextField label="Reason for changing the load gate (min 5 characters, audited)" value={reason} onChange={setReason} required maxLength={500} error={reason && reason.trim().length < 5 ? "Enter at least 5 characters." : undefined} />}
        <div className="flex justify-end gap-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary} disabled={!valid || busy}>Save route</button></div>
      </form>
    </Modal>
  );
}

function RoutesBody() {
  const { roles } = useAuth();
  const canWrite = hasAnyRole(roles, WRITE_ROLES.catalog);
  const q = useCoreQuery<Route[]>(() => coreAdmin.routes(), []);
  const stops = useCoreQuery<Stop[]>(() => coreAdmin.stops(), [], { silent: true });
  const ops = useCoreQuery<Operator[]>(() => coreAdmin.operators(), [], { silent: true });
  const [editing, setEditing] = useState<Route | null | "new">(null);
  return (
    <>
      <div className="flex justify-end -mt-2">{canWrite && <button className={btnPrimary} onClick={() => setEditing("new")}><Plus className="w-4 h-4" aria-hidden />New route</button>}</div>
      {!canWrite && <Notice tone="info">Read-only: only an admin can change routes.</Notice>}
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Routes" rowKey={(r) => r.id} data={q.data || []} loading={q.loading && !q.data} emptyMessage="No routes" columns={[
        { key: "name", label: "Route", render: (r: Route) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-gray-500 font-mono">{r.code}</p></div> },
        { key: "op", label: "Operator", render: (r: Route) => r.operatorName || "—" },
        { key: "stops", label: "Stops", render: (r: Route) => <span className="text-[12px]">{(r.stops || []).slice().sort((a, b) => (a.sequence || 0) - (b.sequence || 0)).map((s) => `${s.stop?.name || "?"} (+${s.offsetMinutes ?? 0} min)`).join(" → ") || "—"}</span> },
        { key: "gate", label: "Load gate", render: (r: Route) => <span className="text-[12px]">{gateOf(r.loadGateEnabled) === "inherit" ? "Inherit" : gateOf(r.loadGateEnabled) === "on" ? "On" : "Off"} · effective <strong>{r.effectiveLoadGateEnabled ? "on" : "off"}</strong></span> },
        { key: "active", label: "Status", render: (r: Route) => <StatusBadge status={r.active === false ? "DISABLED" : "ACTIVE"} kind="generic" label={r.active === false ? "Inactive" : "Active"} /> },
        { key: "ops", label: "Operations", render: (r: Route) => (canWrite ? <button className={rowAction("indigo")} onClick={() => setEditing(r)}>Edit</button> : <span className="text-gray-400">—</span>) },
      ]} />
      {editing && <RouteForm route={editing === "new" ? null : editing} stops={stops.data || []} operators={ops.data || []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); q.reload(); }} />}
    </>
  );
}

/** P13 — routes with ordered stops, offsets, origin/destination flags and load-gate override. */
export default function RoutesPage() {
  return (
    <CorePage title="Routes" description="Ordered stops, offsets and the load gate (inherit / on / off)" roles={PAGE_ROLES.catalog}>
      <RoutesBody />
    </CorePage>
  );
}
