"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { CheckboxField, CorePage, ErrorBanner, Notice, TextField, btnOutline, btnPrimary, rowAction } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import type { Stop } from "@/lib/core-types";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

const DEC = /^-?\d{1,3}(\.\d{1,8})?$/;

function StopForm({ stop, onClose, onSaved }: { stop: Stop | null; onClose: () => void; onSaved: () => void }) {
  const { run, busy } = useAction();
  const [f, setF] = useState({ code: stop?.code || "", cityCode: stop?.cityCode || "", cityName: stop?.cityName || "", name: stop?.name || "", address: stop?.address || "", latitude: stop?.latitude || "", longitude: stop?.longitude || "", active: stop?.active ?? true });
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const errors = {
    code: f.code && !/^[A-Z]{3}-[A-Z0-9]{2,12}$/.test(f.code) ? "Format CCC-XXXX, e.g. MAA-CMBT" : undefined,
    city: f.cityCode && !/^[A-Z]{3}$/.test(f.cityCode) ? "3 letters, e.g. MAA" : undefined,
    lat: f.latitude && !DEC.test(f.latitude) ? "Decimal degrees" : undefined,
    lng: f.longitude && !DEC.test(f.longitude) ? "Decimal degrees" : undefined,
  };
  const valid = !!f.code && !!f.cityCode && !!f.cityName.trim() && !!f.name.trim() && !Object.values(errors).some(Boolean);
  const save = async () => {
    const body = { code: f.code, cityCode: f.cityCode, cityName: f.cityName.trim(), name: f.name.trim(), active: f.active,
      ...(f.address.trim() ? { address: f.address.trim() } : {}), ...(f.latitude ? { latitude: f.latitude } : {}), ...(f.longitude ? { longitude: f.longitude } : {}) };
    const r = await run(() => (stop ? coreAdmin.updateStop(stop.id, body) : coreAdmin.createStop(body)), { success: stop ? "Stop updated" : "Stop created" });
    if (r) onSaved();
  };
  return (
    <Modal open onClose={onClose} title={stop ? `Edit ${stop.name}` : "New stop"} size="lg">
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); if (valid) save(); }}>
        <TextField label="Code" value={f.code} onChange={(v) => set("code")(v.toUpperCase())} required error={errors.code} />
        <TextField label="Name" value={f.name} onChange={set("name")} required />
        <TextField label="City code" value={f.cityCode} onChange={(v) => set("cityCode")(v.toUpperCase())} required error={errors.city} maxLength={3} />
        <TextField label="City name" value={f.cityName} onChange={set("cityName")} required />
        <div className="sm:col-span-2"><TextField label="Address" value={f.address} onChange={set("address")} /></div>
        <TextField label="Latitude" value={f.latitude} onChange={set("latitude")} inputMode="decimal" error={errors.lat} />
        <TextField label="Longitude" value={f.longitude} onChange={set("longitude")} inputMode="decimal" error={errors.lng} />
        <CheckboxField label="Active" checked={f.active} onChange={(v) => setF((x) => ({ ...x, active: v }))} />
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary} disabled={!valid || busy}>Save</button></div>
      </form>
    </Modal>
  );
}

function StopsBody() {
  const { roles } = useAuth();
  const canWrite = hasAnyRole(roles, WRITE_ROLES.catalog);
  const q = useCoreQuery<Stop[]>(() => coreAdmin.stops(), []);
  const [editing, setEditing] = useState<Stop | null | "new">(null);
  return (
    <>
      <div className="flex justify-end -mt-2">{canWrite && <button className={btnPrimary} onClick={() => setEditing("new")}><Plus className="w-4 h-4" aria-hidden />New stop</button>}</div>
      {!canWrite && <Notice tone="info">Read-only: only an admin can change stops.</Notice>}
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Stops" rowKey={(s) => s.id} data={q.data || []} loading={q.loading && !q.data} emptyMessage="No stops" columns={[
        { key: "code", label: "Code", render: (s: Stop) => <span className="font-mono text-[12px]">{s.code}</span> },
        { key: "name", label: "Stop", render: (s: Stop) => <div><p className="font-medium">{s.name}</p><p className="text-xs text-gray-500">{s.address || ""}</p></div> },
        { key: "city", label: "City", render: (s: Stop) => `${s.cityName} (${s.cityCode})` },
        { key: "geo", label: "Location", render: (s: Stop) => <span className="text-[12px] font-mono">{s.latitude && s.longitude ? `${s.latitude}, ${s.longitude}` : "—"}</span> },
        { key: "active", label: "Status", render: (s: Stop) => <StatusBadge status={s.active === false ? "DISABLED" : "ACTIVE"} kind="generic" label={s.active === false ? "Inactive" : "Active"} /> },
        { key: "ops", label: "Operations", render: (s: Stop) => (canWrite ? <button className={rowAction("indigo")} onClick={() => setEditing(s)}>Edit</button> : <span className="text-gray-400">—</span>) },
      ]} />
      {editing && <StopForm stop={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); q.reload(); }} />}
    </>
  );
}

/** P13 — stops catalog (admin writes, ops read). */
export default function StopsPage() {
  return (
    <CorePage title="Stops" description="Bus stops usable as origin / destination" roles={PAGE_ROLES.catalog}>
      <StopsBody />
    </CorePage>
  );
}
