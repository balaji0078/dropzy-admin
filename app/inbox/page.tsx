"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Circle } from "lucide-react";
import { CheckboxField, CorePage, ErrorBanner, LastSynced, btnOutline } from "@/components/core/ui";
import { coreInbox } from "@/lib/core-api";
import type { CoreNotification } from "@/lib/core-types";
import { formatIST } from "@/lib/format";
import { PAGE_ROLES } from "@/lib/roles";
import { useAction, useCoreQuery } from "@/lib/use-core";

function InboxBody() {
  const router = useRouter();
  const { run, busy } = useAction();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const q = useCoreQuery(() => coreInbox.list({ unreadOnly, page, limit: 30 }), [unreadOnly, page], { pollMs: 30000 });
  const items = q.data?.data || [];

  const open = async (n: CoreNotification) => {
    if (!n.readAt) await run(() => coreInbox.markRead(n.id));
    const screen = n.data?.screen;
    const sid = (n.data?.shipmentId as string | undefined) || n.shipmentId;
    if (sid && (screen === "adminShipment" || screen === "shipment" || !screen)) router.push(`/shipments/${sid}`);
    else q.reload();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 -mt-2">
        <CheckboxField label="Unread only" checked={unreadOnly} onChange={(v) => { setUnreadOnly(v); setPage(1); }} />
        <div className="flex items-center gap-2">
          <LastSynced at={q.syncedAt} onRefresh={q.reload} />
          <button className={btnOutline} disabled={busy || !items.some((n) => !n.readAt)} onClick={async () => { const r = await run(() => coreInbox.readAll(), { success: (x) => `${x.marked} marked as read` }); if (r) q.reload(); }}>
            <CheckCheck className="w-4 h-4" aria-hidden />Mark all read
          </button>
        </div>
      </div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <ul className="rb-card-flat divide-y divide-gray-100" aria-label="Notifications">
        {q.loading && !q.data && <li className="p-6 text-center text-[13px] text-gray-500">Loading…</li>}
        {q.data && items.length === 0 && <li className="p-6 text-center text-[13px] text-gray-500">No notifications</li>}
        {items.map((n) => (
          <li key={n.id}>
            <button onClick={() => open(n)} className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-red-50 focus:outline-none focus-visible:bg-red-50 ${n.readAt ? "" : "bg-blue-50/40"}`}>
              <Circle className={`w-2.5 h-2.5 mt-1.5 flex-shrink-0 ${n.readAt ? "text-transparent" : "text-[#D82C2C] fill-[#D82C2C]"}`} aria-hidden />
              <span className="flex-1">
                <span className="flex justify-between gap-3"><span className={`text-[13px] ${n.readAt ? "text-gray-800" : "font-semibold text-gray-900"}`}>{n.title}</span><span className="text-[11px] text-gray-500 whitespace-nowrap">{formatIST(n.createdAt)}</span></span>
                <span className="block text-[12px] text-gray-600 mt-0.5">{n.body}</span>
                <span className="sr-only">{n.readAt ? "Read" : "Unread"}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {(q.data?.meta?.totalPages || 1) > 1 && (
        <div className="flex justify-end gap-2 text-[12px]">
          <button className={btnOutline} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <button className={btnOutline} disabled={page >= (q.data?.meta?.totalPages || 1)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </>
  );
}

/** Staff in-app inbox (GET /me/notifications) — the "+ notifications" item of the warehouse sidebar. */
export default function InboxPage() {
  return (
    <CorePage title="Notifications" description="Your in-app notifications and role broadcasts" roles={PAGE_ROLES.inbox}>
      <InboxBody />
    </CorePage>
  );
}
