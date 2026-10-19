"use client";

import Link from "next/link";
import { Boxes, Hourglass, TimerOff, RefreshCw, Gavel, Search, Warehouse, IndianRupee, Landmark, XCircle } from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { Card, CorePage, ErrorBanner, LastSynced } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import { formatPaise } from "@/lib/format";
import { PAGE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useCoreQuery } from "@/lib/use-core";
import { SHIPMENT_STATES } from "@/lib/core-types";

function Tile({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
      {children}
    </Link>
  );
}

/** P2 — operational KPIs (GET /admin/dashboard/summary, 30 s). */
function DashboardBody() {
  const { roles } = useAuth();
  const q = useCoreQuery(() => coreAdmin.dashboard(), [], { pollMs: 30000 });
  const d = q.data;
  const byState = d?.activeShipmentsByState || {};
  const activeTotal = Object.values(byState).reduce((a, b) => a + (Number(b) || 0), 0);
  const ageing = d?.warehouseHoldsByAgeBucket || {};
  const today = d?.todayCollections || {};
  const can = (r: readonly typeof roles[number][]) => hasAnyRole(roles, r);
  const n = (v: number | undefined) => (v === undefined || v === null ? "—" : v);

  return (
    <>
      <div className="flex justify-end -mt-2"><LastSynced at={d?.serverTime || q.syncedAt} onRefresh={q.reload} /></div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile href={can(PAGE_ROLES.shipments) ? "/shipments" : undefined}><StatsCard title="Active shipments" value={d ? activeTotal : "—"} icon={Boxes} iconColor="text-blue-600" iconBg="bg-blue-50" /></Tile>
        <Tile href="/weight-exceptions"><StatsCard title="Unpaid before cutoff" value={n(d?.unpaidSurchargeBeforeCutoff)} icon={Hourglass} iconColor="text-amber-600" iconBg="bg-amber-50" /></Tile>
        <Tile href="/weight-exceptions?status=CUTOFF_PASSED_UNPAID"><StatsCard title="Cutoff passed (unpaid)" value={n(d?.unpaidSurchargeCutoffPassed)} icon={TimerOff} /></Tile>
        <Tile href="/weight-exceptions?status=PAYMENT_PENDING_VERIFICATION"><StatsCard title="Pending verification" value={n(d?.paymentsPendingVerification)} icon={RefreshCw} iconColor="text-amber-600" iconBg="bg-amber-50" /></Tile>
        <Tile href={can(PAGE_ROLES.disputes) ? "/disputes" : undefined}><StatsCard title="Open disputes" value={n(d?.openDisputes)} icon={Gavel} iconColor="text-purple-600" iconBg="bg-purple-50" /></Tile>
        <Tile href="/weight-exceptions?status=IN_REVIEW"><StatsCard title="Open weight reviews" value={n(d?.openWeightReviews)} icon={Search} iconColor="text-purple-600" iconBg="bg-purple-50" /></Tile>
        <Tile href={can(PAGE_ROLES.finance) ? "/finance/reconciliation" : undefined}><StatsCard title="Recon exceptions" value={n(d?.openReconExceptions)} icon={Landmark} /></Tile>
        <Tile href={can(PAGE_ROLES.system) ? "/system" : undefined}><StatsCard title="Dead outbox events" value={n(d?.outboxDead)} icon={XCircle} /></Tile>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Active shipments by state">
          {activeTotal === 0 ? (
            <p className="text-[13px] text-gray-500">{d ? "No active shipments." : "Loading…"}</p>
          ) : (
            <ul className="space-y-1.5">
              {SHIPMENT_STATES.filter((s) => byState[s]).map((s) => (
                <li key={s} className="flex items-center justify-between gap-3">
                  {can(PAGE_ROLES.shipments) ? (
                    <Link href={`/shipments?state=${s}`} className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"><StatusBadge status={s} kind="shipmentState" /></Link>
                  ) : (
                    <StatusBadge status={s} kind="shipmentState" />
                  )}
                  <span className="text-[13px] font-semibold tabular-nums">{byState[s]}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Warehouse holds by age" actions={<Warehouse className="w-4 h-4 text-gray-400" aria-hidden />}>
          <dl className="grid grid-cols-2 gap-3 text-[13px]">
            {([["Under 24 h", ageing.lt24h], ["1–3 days", ageing.d1to3], ["3–7 days", ageing.d3to7], ["Over 7 days", ageing.gt7d]] as const).map(([k, v], i) => (
              <div key={k} className={`rounded-lg border px-3 py-2 ${i === 3 && (v || 0) > 0 ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
                <dt className="text-[11px] text-gray-500 uppercase tracking-wider">{k}</dt>
                <dd className="text-[18px] font-bold text-gray-900 tabular-nums">{n(v)}</dd>
              </div>
            ))}
          </dl>
          <Link href="/warehouse/inventory" className="mt-3 inline-block text-[12px] font-semibold text-[#D82C2C] hover:underline">Open inventory</Link>
        </Card>

        <Card title="Today's collections (IST)" actions={<IndianRupee className="w-4 h-4 text-gray-400" aria-hidden />}>
          <dl className="space-y-2 text-[13px]">
            <div className="flex justify-between"><dt className="text-gray-600">Base fares</dt><dd className="font-semibold tabular-nums">{formatPaise(today.baseFarePaise)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-600">Weight surcharges</dt><dd className="font-semibold tabular-nums">{formatPaise(today.surchargePaise)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-600">Refunds</dt><dd className="font-semibold tabular-nums">{formatPaise(today.refundsPaise)}</dd></div>
            <div className="flex justify-between border-t pt-2"><dt className="text-gray-600">Unpaid surcharges outstanding</dt><dd className="font-semibold tabular-nums">{formatPaise(d?.unpaidSurchargeAmountPaise)}</dd></div>
          </dl>
        </Card>
      </div>
    </>
  );
}

export default function CoreDashboard() {
  return (
    <CorePage title="Operations Dashboard"
      description="Live KPIs for shipments, surcharges, warehouses and finance (PRD §25)"
      roles={PAGE_ROLES.dashboard}>
      <DashboardBody />
    </CorePage>
  );
}
