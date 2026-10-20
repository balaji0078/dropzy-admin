"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Lock, MessageSquare, AlertTriangle } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { CheckboxField, CorePage, ErrorBanner, LastSynced, Notice, SelectField, TextAreaField, TextField, btnOutline, btnPrimary, rowAction } from "@/components/core/ui";
import { Deadline } from "@/components/core/domain";
import { coreShipments, coreSupport } from "@/lib/core-api";
import type { Ticket, TicketCategory, TicketStatus } from "@/lib/core-types";
import { formatIST, humanize, shortId } from "@/lib/format";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

const STATUS_TABS = [
  { label: "Open", value: "OPEN" }, { label: "Assigned", value: "ASSIGNED" }, { label: "Investigating", value: "INVESTIGATING" },
  { label: "Waiting customer", value: "WAITING_CUSTOMER" }, { label: "Resolved", value: "RESOLVED" }, { label: "Closed", value: "CLOSED" }, { label: "All", value: "" },
];
const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "WEIGHT_DISPUTE", label: "Weight dispute" }, { value: "PAYMENT", label: "Payment" }, { value: "DAMAGE", label: "Damage" }, { value: "LOSS", label: "Loss" },
  { value: "DELAY", label: "Delay" }, { value: "PICKUP", label: "Pickup" }, { value: "OTHER", label: "Other" },
];
const PRIORITIES = ["P1", "P2", "P3", "P4"].map((p) => ({ value: p, label: p }));
const STATUSES: { value: TicketStatus; label: string }[] = STATUS_TABS.filter((t) => t.value).map((t) => ({ value: t.value as TicketStatus, label: t.label }));

function TicketDrawer({ ticketId, onClose, onChanged }: { ticketId: string; onClose: () => void; onChanged: () => void }) {
  const { me, roles } = useAuth();
  const { run, busy } = useAction();
  const q = useCoreQuery(() => coreSupport.get(ticketId), [ticketId], { pollMs: 30000 });
  const t = q.data;
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState("");
  const [resolution, setResolution] = useState("");
  const canWrite = hasAnyRole(roles, WRITE_ROLES.tickets);
  useEffect(() => {
    if (t) {
      setStatus((s) => s || t.status || "");
      setPriority((p) => p || t.priority || "");
    }
  }, [t]);

  const send = async () => {
    if (!body.trim()) return;
    const r = await run(() => coreSupport.addMessage(ticketId, { body: body.trim(), visibility: internal ? "INTERNAL" : "CUSTOMER" }), { success: internal ? "Internal note added" : "Reply sent" });
    if (r) {
      setBody("");
      q.reload();
    }
  };
  const needsResolution = status === "RESOLVED" || status === "CLOSED";
  const update = async () => {
    if (!t) return;
    const patch: Record<string, unknown> = {};
    if (status && status !== t.status) patch.status = status;
    if (priority && priority !== t.priority) patch.priority = priority;
    if (needsResolution) patch.resolution = resolution.trim();
    if (!Object.keys(patch).length) return;
    const r = await run(() => coreSupport.update(ticketId, patch), { success: "Ticket updated" });
    if (r) {
      q.reload();
      onChanged();
    }
  };
  const assignToMe = async () => {
    if (!me) return;
    const r = await run(() => coreSupport.update(ticketId, { ownerId: me.id, ...(t?.status === "OPEN" ? { status: "ASSIGNED" } : {}) }), { success: "Assigned to you" });
    if (r) {
      q.reload();
      onChanged();
    }
  };

  return (
    <Modal open onClose={onClose} title={t ? `${t.ticketNumber} · ${t.subject}` : "Ticket"} size="xl">
      <ErrorBanner error={q.error} onRetry={q.reload} />
      {!t ? <p className="text-[13px] text-ink-soft">Loading…</p> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            <ol className="space-y-2 max-h-[45vh] overflow-y-auto pr-1" aria-label="Ticket thread">
              {(t.messages || []).length === 0 && <li className="text-[13px] text-ink-soft">No messages yet.</li>}
              {(t.messages || []).map((m) => (
                <li key={m.id} className={`rounded-lg border p-3 text-[13px] ${m.visibility === "INTERNAL" ? "bg-warning/10 border-warning/35" : m.authorRole === "customer" ? "bg-surface border-line" : "bg-info/10 border-info/25"}`}>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-ink-soft mb-1">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      {m.visibility === "INTERNAL" ? <><Lock className="w-3 h-3" aria-hidden />Internal note</> : <><MessageSquare className="w-3 h-3" aria-hidden />{m.authorRole === "customer" ? "Customer" : "Reply to customer"}</>}
                      {" · "}{m.authorName || humanize(m.authorRole)}
                    </span>
                    <span>{formatIST(m.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-ink">{m.body}</p>
                </li>
              ))}
            </ol>
            {canWrite && (
              <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <TextAreaField label={internal ? "Internal note (not visible to the customer)" : "Reply to the customer"} value={body} onChange={setBody} maxLength={4000} rows={3} />
                <div className="flex items-center justify-between">
                  <CheckboxField label="Internal note" checked={internal} onChange={setInternal} />
                  <button type="submit" className={btnPrimary} disabled={!body.trim() || busy}>{internal ? "Add note" : "Send reply"}</button>
                </div>
              </form>
            )}
          </div>
          <div className="space-y-3 text-[13px]">
            <div className="flex flex-wrap gap-1">{t.status && <StatusBadge status={t.status} kind="generic" />}{t.priority && <StatusBadge status={t.priority} kind="generic" />}{t.category && <StatusBadge status={t.category} kind="generic" label={humanize(t.category)} />}</div>
            <p><span className="text-ink-soft">SLA due:</span> {t.slaBreached ? <span className="inline-flex items-center gap-1 font-semibold text-danger"><AlertTriangle className="w-3.5 h-3.5" aria-hidden />Breached</span> : null} <Deadline at={t.slaDueAt} compact /></p>
            <p><span className="text-ink-soft">Owner:</span> {t.ownerId ? (t.ownerId === me?.id ? "Me" : shortId(t.ownerId)) : "Unassigned"}</p>
            {t.shipmentId && <p><span className="text-ink-soft">Shipment:</span> <Link className="font-mono text-primary-light hover:text-gold hover:underline" href={`/shipments/${t.shipmentId}`}>{t.dcn || shortId(t.shipmentId)}</Link></p>}
            {t.disputeId && <p><span className="text-ink-soft">Dispute:</span> <Link className="text-primary-light hover:text-gold hover:underline" href={`/disputes/${t.disputeId}`}>Open dispute</Link></p>}
            {canWrite && (
              <>
                {t.ownerId !== me?.id && <button className={btnOutline} onClick={assignToMe} disabled={busy}>Assign to me</button>}
                <SelectField label="Status" value={status} onChange={(v) => setStatus(v as TicketStatus)} options={STATUSES} />
                <SelectField label="Priority" value={priority} onChange={setPriority} options={PRIORITIES} />
                {needsResolution && <TextAreaField label="Resolution" value={resolution} onChange={setResolution} required maxLength={1000} rows={2} />}
                <button className={btnPrimary} onClick={update} disabled={busy || (needsResolution && !resolution.trim())}>Update ticket</button>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function NewTicket({ onClose, onCreated }: { onClose: () => void; onCreated: (t: Ticket) => void }) {
  const { run, busy } = useAction();
  const [category, setCategory] = useState<TicketCategory>("OTHER");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("P3");
  const [dcn, setDcn] = useState("");
  const submit = async () => {
    const r = await run(async () => {
      let shipmentId: string | undefined;
      if (dcn.trim()) shipmentId = (await coreShipments.scan({ dcn: dcn.trim().toUpperCase() })).id;
      return coreSupport.create({ category, subject: subject.trim(), message: message.trim(), priority, ...(shipmentId ? { shipmentId } : {}) });
    }, { success: (t) => `Ticket ${t.ticketNumber || ""} created` });
    if (r) onCreated(r);
  };
  return (
    <Modal open onClose={onClose} title="New support ticket">
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <SelectField label="Category" value={category} onChange={(v) => setCategory(v as TicketCategory)} options={CATEGORIES} required />
        <TextField label="Subject" value={subject} onChange={setSubject} required maxLength={200} error={subject && subject.trim().length < 3 ? "At least 3 characters." : undefined} />
        <TextAreaField label="Message" value={message} onChange={setMessage} required maxLength={4000} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Priority" value={priority} onChange={setPriority} options={PRIORITIES} />
          <TextField label="Shipment DCN (optional)" value={dcn} onChange={setDcn} />
        </div>
        <div className="flex justify-end gap-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary} disabled={busy || subject.trim().length < 3 || !message.trim()}>Create ticket</button></div>
      </form>
    </Modal>
  );
}

function SupportBody() {
  const { me, roles } = useAuth();
  const { run } = useAction();
  const [status, setStatus] = useState("OPEN");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [mine, setMine] = useState(false);
  const [breached, setBreached] = useState(false);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const canWrite = hasAnyRole(roles, WRITE_ROLES.tickets);
  const q = useCoreQuery(
    () => coreSupport.list({ status: status || undefined, category: category || undefined, priority: priority || undefined, ownerId: mine ? me?.id : undefined, slaBreached: breached || undefined, page, limit: 50 }),
    [status, category, priority, mine, breached, page],
    { pollMs: 30000 },
  );
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("ticket");
    if (t) setOpenId(t);
  }, []);
  const assignToMe = async (t: Ticket) => {
    if (!me) return;
    const r = await run(() => coreSupport.update(t.id, { ownerId: me.id, ...(t.status === "OPEN" ? { status: "ASSIGNED" } : {}) }), { success: `${t.ticketNumber} assigned to you` });
    if (r) q.reload();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 -mt-2">
        <FilterTabs ariaLabel="Ticket status" tabs={STATUS_TABS} activeTab={status} onChange={(v) => { setStatus(v); setPage(1); }} />
        <div className="flex items-center gap-3">
          <LastSynced at={q.syncedAt} onRefresh={q.reload} />
          {canWrite && <button className={btnPrimary} onClick={() => setCreating(true)}><Plus className="w-4 h-4" aria-hidden />New ticket</button>}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48"><SelectField label="Category" value={category} onChange={(v) => { setCategory(v); setPage(1); }} placeholder="Any" options={CATEGORIES} /></div>
        <div className="w-32"><SelectField label="Priority" value={priority} onChange={(v) => { setPriority(v); setPage(1); }} placeholder="Any" options={PRIORITIES} /></div>
        <CheckboxField label="Mine" checked={mine} onChange={(v) => { setMine(v); setPage(1); }} />
        <CheckboxField label="SLA breached" checked={breached} onChange={(v) => { setBreached(v); setPage(1); }} />
      </div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Support tickets" rowKey={(t) => t.id} data={q.data?.data || []} loading={q.loading && !q.data} emptyMessage="No tickets"
        onRowClick={(t) => setOpenId(t.id)} rowClassName={(t) => (t.slaBreached ? "dz-row-highlight" : undefined)}
        page={q.data?.meta?.page || page} totalPages={q.data?.meta?.totalPages || 1} onPageChange={setPage}
        columns={[
          { key: "no", label: "Ticket", render: (t: Ticket) => <span className="font-mono text-xs">{t.ticketNumber || shortId(t.id)}</span> },
          { key: "subject", label: "Subject", render: (t: Ticket) => <span className="text-ink">{t.subject}</span> },
          { key: "category", label: "Category", render: (t: Ticket) => humanize(t.category) },
          { key: "priority", label: "Priority", render: (t: Ticket) => (t.priority ? <StatusBadge status={t.priority} kind="generic" /> : "—") },
          { key: "status", label: "Status", render: (t: Ticket) => (t.status ? <StatusBadge status={t.status} kind="generic" /> : "—") },
          { key: "dcn", label: "DCN", render: (t: Ticket) => <span className="font-mono text-[11px]">{t.dcn || "—"}</span> },
          { key: "owner", label: "Owner", render: (t: Ticket) => (t.ownerId ? (t.ownerId === me?.id ? "Me" : <span className="font-mono text-[11px]">{shortId(t.ownerId)}</span>) : <span className="text-ink-faint">Unassigned</span>) },
          { key: "sla", label: "SLA due", render: (t: Ticket) => (
            <span className="flex flex-col">{t.slaBreached && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-danger"><AlertTriangle className="w-3 h-3" aria-hidden />SLA breached</span>}<Deadline at={t.slaDueAt} /></span>) },
          { key: "ops", label: "Operations", render: (t: Ticket) => (canWrite && t.ownerId !== me?.id && !["RESOLVED", "CLOSED"].includes(t.status || "") ? (
            <button className={rowAction("indigo")} onClick={(e) => { e.stopPropagation(); assignToMe(t); }}>Assign to me</button>) : <span className="text-ink-faint">—</span>) },
        ]} />
      {!canWrite && <Notice tone="info">Read-only access.</Notice>}
      {openId && <TicketDrawer ticketId={openId} onClose={() => setOpenId(null)} onChanged={q.reload} />}
      {creating && <NewTicket onClose={() => setCreating(false)} onCreated={(t) => { setCreating(false); q.reload(); setOpenId(t.id); }} />}
    </>
  );
}

/** P11 — support ticket queue (30 s) with SLA, assign to me, thread and internal notes. */
export default function CoreSupport() {
  return (
    <CorePage title="Support Tickets" description="Queue with SLA due/breached, assignment, customer replies and internal notes (FR-SUP-001)" roles={PAGE_ROLES.support}>
      <SupportBody />
    </CorePage>
  );
}
