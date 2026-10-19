"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { Card, CorePage, ErrorBanner } from "@/components/core/ui";
import { ScanInput, WarehousePicker, useWarehouseSelection } from "@/components/core/warehouse";
import { coreWarehouses } from "@/lib/core-api";
import type { InventoryItem } from "@/lib/core-types";
import { formatAgeHours, formatIST } from "@/lib/format";
import { PAGE_ROLES } from "@/lib/roles";
import { useCoreQuery } from "@/lib/use-core";

function ReleaseEntryBody() {
  const router = useRouter();
  const sel = useWarehouseSelection();
  const q = useCoreQuery(
    () => (sel.selected ? coreWarehouses.inventory(sel.selected, { status: "ACTIVE", state: "READY_FOR_PICKUP", limit: 50 }) : Promise.resolve({ data: [] as InventoryItem[], meta: undefined })),
    [sel.selected],
    { pollMs: 30000 },
  );
  return (
    <>
      <WarehousePicker sel={sel} />
      <Card>
        <ScanInput label="Scan the parcel QR or enter the DCN to release" onResolved={(s) => router.push(`/warehouse/release/${s.id}`)} />
      </Card>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <h2 className="text-[14px] font-bold text-gray-900">Ready for pickup</h2>
      <DataTable caption="Parcels ready for pickup" rowKey={(i) => i.shipmentId} data={q.data?.data || []} loading={q.loading && !q.data} emptyMessage="No parcels are ready for pickup"
        onRowClick={(i) => router.push(`/warehouse/release/${i.shipmentId}`)}
        columns={[
          { key: "dcn", label: "DCN", render: (i: InventoryItem) => <Link href={`/warehouse/release/${i.shipmentId}`} className="font-mono text-xs text-blue-700 hover:underline">{i.dcn}</Link> },
          { key: "state", label: "State", render: (i: InventoryItem) => (i.shipmentState ? <StatusBadge status={i.shipmentState} kind="shipmentState" /> : "—") },
          { key: "receiver", label: "Receiver", render: (i: InventoryItem) => `${i.receiver?.name || "—"} ${i.receiver?.phone || ""}` },
          { key: "bin", label: "Bin", render: (i: InventoryItem) => <span className="font-mono">{i.binCode}</span> },
          { key: "received", label: "Received", render: (i: InventoryItem) => formatIST(i.receivedAt) },
          { key: "age", label: "Age", render: (i: InventoryItem) => <span className={i.overMaxHold ? "text-red-700 font-semibold" : ""}>{formatAgeHours(i.ageHours)}</span> },
        ]} />
    </>
  );
}

/** P9 entry — find the parcel to release (scanner input) or pick from READY_FOR_PICKUP inventory. */
export default function WarehouseReleaseEntryPage() {
  return (
    <CorePage title="Warehouse Release" description="Scan a parcel to start a release" roles={PAGE_ROLES.warehouseRelease}>
      <ReleaseEntryBody />
    </CorePage>
  );
}
