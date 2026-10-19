"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { CheckboxField, CorePage, ErrorBanner, Notice, SelectField, TextField, btnOutline, btnPrimary, rowAction } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import type { Stop, Warehouse } from "@/lib/core-types";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

function WarehouseForm({ wh, stops, onClose, onSaved }: { wh: Warehouse | null; stops: Stop[]; onClose: () => void; onSaved: () => void }) {
  const { run, busy } = useAction();
  const [f, setF] = useState({
    code: wh?.code || "", name: wh?.name || "", stopId: wh?.stopId || "", cityCode: wh?.cityCode || "", address: wh?.address || "",
    openingHours: wh?.openingHours || "", phone: wh?.phone?.replace(/^\+91/, "") || "", latitude: wh?.latitude || "", longitude: wh?.longitude || "", active: wh?.active ?? true,
  });
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const errors = {
    city: f.cityCode && !/^[A-Z]{3}$/.test(f.cityCode) ? "3 letters" : undefined,
    phone: f.phone && !/^[6-9][0-9]{9}$/.test(f.phone) ? "10-digit Indian mobile" : undefined,
  };
  const valid = !!f.code.trim() && !!f.name.trim() && !!f.cityCode && !!f.address.trim() && !!f.openingHours.trim() && !Object.values(errors).some(Boolean);
  const save = async () => {
    const body = {
      code: f.code.trim(), name: f.name.trim(), cityCode: f.cityCode, address: f.address.trim(), openingHours: f.openingHours.trim(), active: f.active,
      ...(f.stopId ? { stopId: f.stopId } : {}), ...(f.phone ? { phone: f.phone } : {}), ...(f.latitude ? { latitude: f.latitude } : {}), ...(f.longitude ? { longitude: f.longitude } : {}),
    };
    const r = await run(() => (wh ? coreAdmin.updateWarehouse(wh.id, body) : coreAdmin.createWarehouse(body)), { success: wh ? "Warehouse updated" : "Warehouse created" });
    if (r) onSaved();
  };
  return (
    <Modal open onClose={onClose} title={wh ? `Edit ${wh.name}` : "New warehouse"} size="lg">
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); if (valid) save(); }}>
        <TextField label="Code" value={f.code} onChange={(v) => set("code")(v.toUpperCase())} required />
        <TextField label="Name" value={f.name} onChange={set("name")} required />
        <SelectField label="Stop" value={f.stopId} onChange={set("stopId")} placeholder="No stop" options={stops.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))} />
        <TextField label="City code" value={f.cityCode} onChange={(v) => set("cityCode")(v.toUpperCase())} required maxLength={3} error={errors.city} />
        <div className="sm:col-span-2"><TextField label="Address" value={f.address} onChange={set("address")} required /></div>
        <TextField label="Opening hours" value={f.openingHours} onChange={set("openingHours")} required placeholder="Mon–Sat 9:00–20:00" />
        <TextField label="Phone" value={f.phone} onChange={set("phone")} prefix="+91" inputMode="tel" error={errors.phone} />
        <TextField label="Latitude" value={f.latitude} onChange={set("latitude")} inputMode="decimal" />
        <TextField label="Longitude" value={f.longitude} onChange={set("longitude")} inputMode="decimal" />
        <CheckboxField label="Active" checked={f.active} onChange={(v) => setF((x) => ({ ...x, active: v }))} />
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary} disabled={!valid || busy}>Save</button></div>
      </form>
    </Modal>
  );
}

function WarehousesBody() {
  const { roles } = useAuth();
  const canWrite = hasAnyRole(roles, WRITE_ROLES.catalog);
  const q = useCoreQuery<Warehouse[]>(() => coreAdmin.warehouses(), []);
  const stops = useCoreQuery<Stop[]>(() => coreAdmin.stops(), [], { silent: true });
  const [editing, setEditing] = useState<Warehouse | null | "new">(null);
  const stopName = (id?: string | null) => (id ? stops.data?.find((s) => s.id === id)?.name || "—" : "—");
  return (
    <>
      <div className="flex justify-end -mt-2">{canWrite && <button className={btnPrimary} onClick={() => setEditing("new")}><Plus className="w-4 h-4" aria-hidden />New warehouse</button>}</div>
      {!canWrite && <Notice tone="info">Read-only: only an admin can change warehouses.</Notice>}
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Warehouses" rowKey={(w) => w.id} data={q.data || []} loading={q.loading && !q.data} emptyMessage="No warehouses" columns={[
        { key: "name", label: "Warehouse", render: (w: Warehouse) => <div><p className="font-medium">{w.name}</p><p className="text-xs text-gray-500 font-mono">{w.code} · {w.cityCode}</p></div> },
        { key: "address", label: "Address", render: (w: Warehouse) => <span className="text-[12px]">{w.address}</span> },
        { key: "hours", label: "Opening hours", render: (w: Warehouse) => w.openingHours || "—" },
        { key: "stop", label: "Stop", render: (w: Warehouse) => stopName(w.stopId) },
        { key: "phone", label: "Phone", render: (w: Warehouse) => w.phone || "—" },
        { key: "active", label: "Status", render: (w: Warehouse) => <StatusBadge status={w.active === false ? "DISABLED" : "ACTIVE"} kind="generic" label={w.active === false ? "Inactive" : "Active"} /> },
        { key: "ops", label: "Operations", render: (w: Warehouse) => (canWrite ? <button className={rowAction("indigo")} onClick={() => setEditing(w)}>Edit</button> : <span className="text-gray-400">—</span>) },
      ]} />
      {editing && <WarehouseForm wh={editing === "new" ? null : editing} stops={stops.data || []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); q.reload(); }} />}
    </>
  );
}

/** P13 — warehouses catalog (admin writes, ops read). */
export default function WarehousesPage() {
  return (
    <CorePage title="Warehouses" description="Destination warehouses for held parcels and pickups" roles={PAGE_ROLES.catalog}>
      <WarehousesBody />
    </CorePage>
  );
}
