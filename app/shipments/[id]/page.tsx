"use client";

import CoreShipmentDetail from "@/components/core/pages/ShipmentDetail";

/** P4 — shipment detail (core mode; the CorePage wrapper shows a notice when NEXT_PUBLIC_CORE_API is off). */
export default function ShipmentDetailPage({ params }: { params: { id: string } }) {
  return <CoreShipmentDetail id={decodeURIComponent(params.id)} />;
}
