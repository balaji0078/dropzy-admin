"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { Card, CorePage, KV, Notice, SelectField, TextAreaField, TextField, btnOutline, btnPrimary } from "@/components/core/ui";
import { PhotoInput } from "@/components/core/domain";
import { ScanInput, WarehousePicker, useWarehouseSelection } from "@/components/core/warehouse";
import { coreAdmin, coreEvidence, coreShipments, isCoreApiError } from "@/lib/core-api";
import type { ShipmentView, TripAssignment } from "@/lib/core-types";
import { errorCopy } from "@/lib/core-errors";
import { formatIST, formatKg, formatPaise, humanize } from "@/lib/format";
import { PAGE_ROLES } from "@/lib/roles";
import { useAction } from "@/lib/use-core";
import { useToast } from "@/components/ui/Toast";

const CONDITIONS = [
  { value: "GOOD", label: "Good" }, { value: "DAMAGED", label: "Damaged" }, { value: "WET", label: "Wet" }, { value: "OPENED", label: "Opened" }, { value: "OTHER", label: "Other" },
];

function ReceiveBody() {
  const sel = useWarehouseSelection();
  const toast = useToast();
  const { run, busy } = useAction();
  const [parcel, setParcel] = useState<ShipmentView | null>(null);
  const [bin, setBin] = useState("");
  const [condition, setCondition] = useState("GOOD");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [needDriver, setNeedDriver] = useState(false);
  const [drivers, setDrivers] = useState<TripAssignment[] | null>(null);
  const [driverId, setDriverId] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "danger" | "warning"; text: string } | null>(null);
  const [scanKey, setScanKey] = useState(0);
  // Captured once per receive action so retries send the same payload (same Idempotency-Key).
  const [deviceTime, setDeviceTime] = useState("");

  const reset = () => {
    setParcel(null);
    setBin("");
    setCondition("GOOD");
    setNotes("");
    setPhoto(null);
    setNeedDriver(false);
    setDrivers(null);
    setDriverId("");
    setScanKey((k) => k + 1);
  };

  // Driver picker (§6.6): the trip's assigned users. Warehouse staff may not be able to list trips; then a user id is typed.
  useEffect(() => {
    if (!needDriver || !parcel?.route?.routeId || drivers) return;
    const day = parcel.route.plannedDepartureAt?.slice(0, 10);
    coreAdmin
      .trips({ routeId: parcel.route.routeId, date: day, limit: 100 })
      .then((r) => setDrivers(r.data.find((t) => t.id === parcel.route?.tripId)?.assignments || []))
      .catch(() => setDrivers([]));
  }, [needDriver, parcel, drivers]);

  const lookup = (kind: "warehouse" | "settlement", id: string) => (kind === "warehouse" ? sel.nameOf(id) : undefined);

  const receive = async () => {
    if (!parcel || !sel.selected || !bin.trim()) return;
    setMessage(null);
    const result = await run(
      async () => {
        let conditionEvidenceId: string | undefined;
        if (photo) conditionEvidenceId = (await coreEvidence.upload(photo, "CONDITION_PHOTO", parcel.id)).id;
        return coreShipments.receive(parcel.id, {
          warehouseId: sel.selected,
          binCode: bin.trim(),
          condition,
          ...(notes.trim() ? { conditionNotes: notes.trim() } : {}),
          ...(conditionEvidenceId ? { conditionEvidenceId } : {}),
          ...(driverId ? { deliveredByUserId: driverId } : {}),
          deviceTime: deviceTime || new Date().toISOString(),
          expectedVersion: parcel.version,
        });
      },
      {
        onError: (e) => {
          const c = errorCopy(e, "receipt", { lookup });
          if (isCoreApiError(e) && e.code === "VALIDATION_ERROR" && c.title.startsWith("Select the driver")) setNeedDriver(true);
          if (isCoreApiError(e) && e.code === "SHIPMENT_STATE_CONFLICT" && e.details?.reason !== "NORMAL_HANDOVER_AVAILABLE")
            coreShipments.get(parcel.id).then(setParcel).catch(() => {});
          setMessage({ tone: "danger", text: c.body ? `${c.title} ${c.body}` : c.title });
          return true;
        },
      },
    );
    if (!result) return;
    const inv = result.data.shipment?.warehouse?.inventory;
    if (result.data.result === "DUPLICATE_IGNORED") {
      setMessage({ tone: "warning", text: `Already received at ${formatIST(inv?.receivedAt)} (bin ${inv?.binCode || "—"}).` });
      setParcel(result.data.shipment);
      return;
    }
    toast(`${parcel.dcn} received into bin ${bin.trim()}`);
    setMessage({ tone: "success", text: `${parcel.dcn} received — now ${result.data.shipment?.stateLabel || humanize(result.data.shipment?.state)}.` });
    setParcel(result.data.shipment);
  };

  const holds = (parcel?.holds || []).filter((h) => h.status === "ACTIVE");
  const received = parcel?.warehouse?.inventory?.status === "ACTIVE";

  return (
    <div className="space-y-5">
      <WarehousePicker sel={sel} />
      <Card>
        <ScanInput autoFocusKey={scanKey} onResolved={(s) => { setParcel(s); setDeviceTime(new Date().toISOString()); setMessage(null); setBin(""); setNotes(""); setPhoto(null); setNeedDriver(false); setDrivers(null); setDriverId(""); }} />
      </Card>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      {parcel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title={<span className="font-mono">{parcel.dcn}</span>} actions={<StatusBadge status={parcel.state} kind="shipmentState" />}>
            <KV cols={2} items={[
              ["Declared weight", parcel.parcel?.declaredWeightDisplay || formatKg(parcel.parcel?.declaredWeightGrams)],
              ["Actual weight", parcel.weight?.latestMeasurement ? formatKg(parcel.weight.latestMeasurement.actualWeightGrams) : "Not measured"],
              ["Hold reason", holds.length ? <span key="h" className="flex flex-wrap gap-1">{holds.map((h) => <StatusBadge key={h.id} status={h.type} kind="hold" />)}</span> : parcel.warehouseRequired ? humanize(parcel.warehouseRequiredReason) : "None"],
              ["Amount due", <strong key="a">{parcel.surcharge?.amountDueDisplay || formatPaise(parcel.surcharge?.amountDuePaise ?? 0)}</strong>],
              ["Payment", parcel.surcharge ? <StatusBadge key="p" status={parcel.surcharge.driverLabel} kind="driverLabel" /> : "—"],
              ["Destination", parcel.route?.destination?.name],
              ["Receiver", `${parcel.parties?.receiver?.name || "—"} ${parcel.parties?.receiver?.phone || ""}`],
              ["Trip", `${parcel.route?.routeName || ""} ${formatIST(parcel.route?.plannedArrivalAt)}`],
            ]} />
            {parcel.state === "READY_FOR_PICKUP" && (
              <Link href={`/warehouse/release/${parcel.id}`} className={`${btnOutline} mt-4`}>Go to release</Link>
            )}
          </Card>
          <Card title="Receive into hold">
            {received ? (
              <Notice tone="info">This parcel is already in inventory (bin {parcel.warehouse?.inventory?.binCode}, received {formatIST(parcel.warehouse?.inventory?.receivedAt)}).</Notice>
            ) : (
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); receive(); }}>
                <TextField label="Bin code" value={bin} onChange={(v) => setBin(v.toUpperCase())} required maxLength={32} placeholder="e.g. A-12" autoFocus />
                <SelectField label="Condition" value={condition} onChange={setCondition} options={CONDITIONS} required />
                <TextAreaField label="Condition notes" value={notes} onChange={setNotes} maxLength={500} rows={2} />
                <PhotoInput label="Condition photo (optional)" file={photo} onChange={setPhoto} />
                {needDriver && (
                  drivers && drivers.length > 0 ? (
                    <SelectField label="Driver handing over" value={driverId} onChange={setDriverId} placeholder="Select the driver…" required
                      options={drivers.map((a) => ({ value: a.userId, label: `${a.userName || a.userId} (${humanize(a.assignmentRole)})` }))} />
                  ) : (
                    <TextField label="Driver handing over (user ID)" value={driverId} onChange={setDriverId} required
                      hint="The driver has not recorded a warehouse handoff. Enter the user ID of the driver assigned to this trip." />
                  )
                )}
                <div className="flex justify-end gap-2">
                  <button type="button" className={btnOutline} onClick={reset}>Next parcel</button>
                  <button type="submit" className={btnPrimary} disabled={busy || !bin.trim() || !sel.selected || (needDriver && !driverId)}>{busy ? "Receiving…" : "Receive into hold"}</button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

/** P7 — scan & receive into warehouse hold (warehouse_staff). */
export default function WarehouseReceivePage() {
  return (
    <CorePage title="Scan & Receive" description="Scan the parcel QR (USB/camera scanner) or type the DCN, then receive it into a bin (T23)" roles={PAGE_ROLES.warehouseReceive}>
      <ReceiveBody />
    </CorePage>
  );
}
