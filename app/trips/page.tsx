"use client";

import { useState } from "react";
import { Plus, UserPlus, X } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { ConfirmDialog, CorePage, ErrorBanner, Notice, ReasonDialog, SelectField, TextField, btnOutline, btnPrimary, rowAction } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import type { AdminUser, Route, Trip } from "@/lib/core-types";
import { formatIST, formatKg, humanize, istDate, istLocalToISO, parseWeightToGrams } from "@/lib/format";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

function CapacityBar({ used, total, label }: { used?: number; total?: number; label: string }) {
  const pct = total ? Math.min(100, Math.round(((used || 0) / total) * 100)) : 0;
  return (
    <div className="w-40">
      <div className="flex justify-between text-[11px] text-gray-600"><span>{label}</span><span>{pct}%</span></div>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-100" role="progressbar" aria-label={`${label} used`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? "#DC2626" : "#D82C2C" }} />
      </div>
    </div>
  );
}

function TripForm({ routes, onClose, onSaved }: { routes: Route[]; onClose: () => void; onSaved: () => void }) {
  const { run, busy } = useAction();
  const [routeId, setRouteId] = useState("");
  const [departure, setDeparture] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [capKg, setCapKg] = useState("");
  const [capParcels, setCapParcels] = useState("");
  const grams = capKg ? parseWeightToGrams(capKg, "kg") : null;
  const parcels = /^\d{1,5}$/.test(capParcels) ? Number(capParcels) : null;
  const dep = istLocalToISO(departure);
  const valid = !!routeId && !!dep && grams !== null && parcels !== null;
  const save = async () => {
    const r = await run(() => coreAdmin.createTrip({ routeId, departureAt: dep, capacityGrams: grams, capacityParcels: parcels, ...(vehicle.trim() ? { vehicleReg: vehicle.trim().toUpperCase() } : {}) }), { success: "Trip created" });
    if (r) onSaved();
  };
  return (
    <Modal open onClose={onClose} title="New trip">
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (valid) save(); }}>
        <SelectField label="Route" value={routeId} onChange={setRouteId} placeholder="Select…" required options={routes.map((r) => ({ value: r.id, label: r.name || r.code || r.id }))} />
        <TextField label="Departure at origin (IST)" type="datetime-local" value={departure} onChange={setDeparture} required hint="Arrival and booking close default from the route offsets and tariff policy." />
        <TextField label="Vehicle registration" value={vehicle} onChange={setVehicle} maxLength={20} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Capacity (weight)" value={capKg} onChange={setCapKg} suffix="kg" inputMode="decimal" required error={capKg && grams === null ? "Up to 3 decimals" : undefined} />
          <TextField label="Capacity (parcels)" value={capParcels} onChange={(v) => setCapParcels(v.replace(/\D/g, ""))} inputMode="numeric" required />
        </div>
        <div className="flex justify-end gap-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary} disabled={!valid || busy}>Create trip</button></div>
      </form>
    </Modal>
  );
}

type Dlg = { kind: "edit" | "delay" | "cancel" | "assign"; trip: Trip } | { kind: "unassign"; trip: Trip; userId: string; name: string };

function TripsBody() {
  const { roles } = useAuth();
  const canWrite = hasAnyRole(roles, WRITE_ROLES.trips);
  const { run, busy } = useAction();
  const [routeId, setRouteId] = useState("");
  const [date, setDate] = useState(istDate());
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [capKg, setCapKg] = useState("");
  const [capParcels, setCapParcels] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [delay, setDelay] = useState("");
  const [userId, setUserId] = useState("");
  const [assignmentRole, setAssignmentRole] = useState<"DRIVER" | "ATTENDANT">("DRIVER");
  const routes = useCoreQuery<Route[]>(() => coreAdmin.routes(), [], { silent: true });
  const drivers = useCoreQuery<AdminUser[]>(() => coreAdmin.users({ role: "driver", status: "ACTIVE", limit: 100 }).then((r) => r.data), [], { silent: true });
  const q = useCoreQuery(() => coreAdmin.trips({ routeId: routeId || undefined, date: date || undefined, status: status || undefined, page, limit: 50 }), [routeId, date, status, page]);

  const done = () => { setDlg(null); q.reload(); };
  const patch = async (t: Trip, body: Record<string, unknown>, success: string, ctx?: "trip") => {
    const r = await run(() => coreAdmin.updateTrip(t.id, { ...body, expectedVersion: t.version }), { success, errorContext: ctx });
    if (r) done();
  };

  const columns = [
    { key: "dep", label: "Departure", render: (t: Trip) => <div><p className="font-medium">{formatIST(t.departureAt)}</p><p className="text-[11px] text-gray-500">Arrives {formatIST(t.arrivalAt)} · booking closes {formatIST(t.bookingClosesAt)}</p></div> },
    { key: "route", label: "Route", render: (t: Trip) => t.routeName || "—" },
    { key: "vehicle", label: "Vehicle", render: (t: Trip) => <span className="font-mono text-[12px]">{t.vehicleReg || "—"}</span> },
    { key: "status", label: "Status", render: (t: Trip) => <span className="flex flex-col gap-1">{t.status && <StatusBadge status={t.status} kind="generic" />}{t.delayMinutes ? <span className="text-[11px] text-amber-700 font-semibold">Delayed {t.delayMinutes} min</span> : null}</span> },
    { key: "cap", label: "Capacity", render: (t: Trip) => (
      <div className="space-y-1">
        <CapacityBar label={`${formatKg(t.reservedGrams)} / ${formatKg(t.capacityGrams)}`} used={t.reservedGrams} total={t.capacityGrams} />
        <CapacityBar label={`${t.reservedParcels ?? 0} / ${t.capacityParcels ?? 0} parcels`} used={t.reservedParcels} total={t.capacityParcels} />
      </div>) },
    { key: "crew", label: "Assigned crew", render: (t: Trip) => (
      <div className="flex flex-col gap-1">
        {(t.assignments || []).length === 0 && <span className="text-gray-400 text-[12px]">None</span>}
        {(t.assignments || []).map((a) => (
          <span key={a.userId} className="inline-flex items-center gap-1 text-[12px]">{a.userName || a.userId} <span className="text-gray-500">({humanize(a.assignmentRole)})</span>
            {canWrite && <button className="p-0.5 rounded hover:bg-red-50 text-red-600" aria-label={`Unassign ${a.userName || a.userId}`} onClick={() => setDlg({ kind: "unassign", trip: t, userId: a.userId, name: a.userName || a.userId })}><X className="w-3 h-3" /></button>}
          </span>
        ))}
      </div>) },
    { key: "ops", label: "Operations", render: (t: Trip) => (canWrite && !["CANCELLED", "COMPLETED"].includes(t.status || "") ? (
      <div className="flex flex-wrap gap-1">
        <button className={rowAction("indigo")} onClick={() => { setUserId(""); setAssignmentRole("DRIVER"); setDlg({ kind: "assign", trip: t }); }}><UserPlus className="w-3.5 h-3.5" aria-hidden />Assign</button>
        <button className={rowAction("gray")} onClick={() => { setCapKg(t.capacityGrams !== undefined ? String(t.capacityGrams / 1000) : ""); setCapParcels(String(t.capacityParcels ?? "")); setVehicle(t.vehicleReg || ""); setDlg({ kind: "edit", trip: t }); }}>Edit</button>
        <button className={rowAction("amber")} onClick={() => { setDelay(String(t.delayMinutes || "")); setDlg({ kind: "delay", trip: t }); }}>Report delay</button>
        <button className={rowAction("red")} onClick={() => setDlg({ kind: "cancel", trip: t })}>Cancel trip</button>
      </div>) : <span className="text-gray-400">—</span>) },
  ];

  const editGrams = capKg ? parseWeightToGrams(capKg, "kg") : null;
  const editParcels = /^\d{1,5}$/.test(capParcels) ? Number(capParcels) : null;
  const delayMin = /^\d{1,4}$/.test(delay) ? Number(delay) : null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 -mt-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-60"><SelectField label="Route" value={routeId} onChange={(v) => { setRouteId(v); setPage(1); }} placeholder="All routes" options={(routes.data || []).map((r) => ({ value: r.id, label: r.name || r.code || r.id }))} /></div>
          <div className="w-44"><TextField label="Service date (IST)" type="date" value={date} onChange={(v) => { setDate(v); setPage(1); }} /></div>
          <div className="w-44"><SelectField label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} placeholder="Any" options={["SCHEDULED", "BOARDING", "DEPARTED", "ARRIVED", "COMPLETED", "CANCELLED"].map((s) => ({ value: s, label: humanize(s) }))} /></div>
        </div>
        {canWrite && <button className={btnPrimary} onClick={() => setCreating(true)}><Plus className="w-4 h-4" aria-hidden />New trip</button>}
      </div>
      {!canWrite && <Notice tone="info">Read-only access.</Notice>}
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Trips" rowKey={(t) => t.id} data={q.data?.data || []} loading={q.loading && !q.data} emptyMessage="No trips for these filters" columns={columns}
        page={q.data?.meta?.page || page} totalPages={q.data?.meta?.totalPages || 1} onPageChange={setPage} />
      {creating && <TripForm routes={routes.data || []} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); q.reload(); }} />}

      {dlg?.kind === "assign" && (
        <ReasonDialog open title="Assign crew" requireReason={false} busy={busy} onClose={() => setDlg(null)} confirmLabel="Assign" canConfirm={!!userId}
          summary={<>Assign a driver or attendant to the {formatIST(dlg.trip.departureAt)} trip.</>}
          onConfirm={async () => { const r = await run(() => coreAdmin.assignTrip(dlg.trip.id, { userId, assignmentRole }), { success: "Crew assigned" }); if (r) done(); }}>
          {drivers.data && drivers.data.length > 0 ? (
            <SelectField label="Driver" value={userId} onChange={setUserId} placeholder="Select a driver…" required options={drivers.data.map((u) => ({ value: u.id, label: `${u.name || u.phone}${u.phone ? ` · ${u.phone}` : ""}` }))} />
          ) : <TextField label="User ID" value={userId} onChange={setUserId} required hint="No driver list available; enter the user ID." />}
          <SelectField label="Role on this trip" value={assignmentRole} onChange={(v) => setAssignmentRole(v as "DRIVER" | "ATTENDANT")} options={[{ value: "DRIVER", label: "Driver" }, { value: "ATTENDANT", label: "Attendant" }]} />
        </ReasonDialog>
      )}
      {dlg?.kind === "unassign" && (
        <ConfirmDialog open title="Unassign crew" busy={busy} confirmLabel="Unassign" danger onClose={() => setDlg(null)}
          message={`Remove ${dlg.name} from the ${formatIST(dlg.trip.departureAt)} trip?`}
          onConfirm={async () => { const ok = await run(() => coreAdmin.unassignTrip(dlg.trip.id, dlg.userId).then(() => true), { success: "Crew unassigned" }); if (ok) done(); }} />
      )}
      {dlg?.kind === "edit" && (
        <ReasonDialog open title="Edit trip" busy={busy} onClose={() => setDlg(null)} confirmLabel="Save" canConfirm={editGrams !== null && editParcels !== null}
          onConfirm={(reason) => patch(dlg.trip, { capacityGrams: editGrams, capacityParcels: editParcels, ...(vehicle.trim() ? { vehicleReg: vehicle.trim().toUpperCase() } : {}), reason }, "Trip updated")}>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Capacity (weight)" value={capKg} onChange={setCapKg} suffix="kg" inputMode="decimal" />
            <TextField label="Capacity (parcels)" value={capParcels} onChange={(v) => setCapParcels(v.replace(/\D/g, ""))} inputMode="numeric" />
          </div>
          <TextField label="Vehicle registration" value={vehicle} onChange={setVehicle} maxLength={20} />
        </ReasonDialog>
      )}
      {dlg?.kind === "delay" && (
        <ReasonDialog open title="Report delay" busy={busy} onClose={() => setDlg(null)} confirmLabel="Report delay" canConfirm={delayMin !== null}
          summary="A delay does not move payment deadlines."
          onConfirm={(reason) => patch(dlg.trip, { delayMinutes: delayMin, reason }, "Delay reported")}>
          <TextField label="Delay" value={delay} onChange={(v) => setDelay(v.replace(/\D/g, ""))} suffix="minutes" inputMode="numeric" required />
        </ReasonDialog>
      )}
      {dlg?.kind === "cancel" && (
        <ReasonDialog open title="Cancel trip" busy={busy} danger onClose={() => setDlg(null)} confirmLabel="Cancel trip"
          summary="Cancel this trip? Parcels not yet accepted will be put on hold for reassignment."
          onConfirm={(reason) => patch(dlg.trip, { status: "CANCELLED", reason }, "Trip cancelled", "trip")} />
      )}
    </>
  );
}

/** P13 — trips with capacity bars, crew assignment, delay and cancellation (ops_manager and admin write). */
export default function TripsPage() {
  return (
    <CorePage title="Trips" description="Scheduled trips, capacity, crew and delays" roles={PAGE_ROLES.catalog}>
      <TripsBody />
    </CorePage>
  );
}
