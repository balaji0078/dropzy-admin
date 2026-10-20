"use client";

import { useState } from "react";
import { Plus, KeyRound, LogOut, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { CheckboxField, ConfirmDialog, CorePage, ErrorBanner, Notice, ReasonDialog, SelectField, TextField, btnOutline, btnPrimary } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import type { AdminUser, Operator, Role, RoleGrant, Warehouse } from "@/lib/core-types";
import { formatIST } from "@/lib/format";
import { PAGE_ROLES, ROLE_LABEL, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

const ROLES: Role[] = ["customer", "driver", "warehouse_staff", "support", "ops_manager", "finance", "admin"];

/** Role + scope picker: driver requires an operator, warehouse_staff requires a warehouse (§4.1 P14). */
function RoleScope({ role, setRole, operatorId, setOperatorId, warehouseId, setWarehouseId, operators, warehouses }: {
  role: Role | ""; setRole: (r: Role) => void; operatorId: string; setOperatorId: (v: string) => void; warehouseId: string; setWarehouseId: (v: string) => void;
  operators: Operator[]; warehouses: Warehouse[];
}) {
  return (
    <div className="space-y-3">
      <SelectField label="Role" value={role} onChange={(v) => setRole(v as Role)} placeholder="Select a role…" required options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
      {role === "driver" && <SelectField label="Operator (required for drivers)" value={operatorId} onChange={setOperatorId} placeholder="Select…" required options={operators.map((o) => ({ value: o.id, label: o.displayName || o.code || o.id }))} />}
      {role === "warehouse_staff" && <SelectField label="Warehouse (required for warehouse staff)" value={warehouseId} onChange={setWarehouseId} placeholder="Select…" required options={warehouses.map((w) => ({ value: w.id, label: w.name || w.code || w.id }))} />}
    </div>
  );
}
const scopeOk = (role: Role | "", operatorId: string, warehouseId: string) => !!role && (role !== "driver" || !!operatorId) && (role !== "warehouse_staff" || !!warehouseId);
const scopeBody = (role: Role, operatorId: string, warehouseId: string) => ({ role, ...(role === "driver" ? { operatorId } : {}), ...(role === "warehouse_staff" ? { warehouseId } : {}) });

function UserDetail({ user, onClose, onChanged, operators, warehouses }: { user: AdminUser; onClose: () => void; onChanged: (u?: AdminUser) => void; operators: Operator[]; warehouses: Warehouse[] }) {
  const { me, roles } = useAuth();
  const canWrite = hasAnyRole(roles, WRITE_ROLES.users);
  const { run, busy } = useAction();
  const [role, setRole] = useState<Role | "">("");
  const [operatorId, setOperatorId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [revoking, setRevoking] = useState<RoleGrant | null>(null);
  const [sessions, setSessions] = useState(false);
  const [statusTo, setStatusTo] = useState<"" | "ACTIVE" | "SUSPENDED" | "DISABLED">("");
  const [mfaOpen, setMfaOpen] = useState(false);
  const [reset, setReset] = useState(false);
  const [mfaCode, setMfaCode] = useState<{ token: string; expiresAt: string } | null>(null);
  const opName = (id?: string | null) => operators.find((o) => o.id === id)?.displayName;
  const whName = (id?: string | null) => warehouses.find((w) => w.id === id)?.name;
  const isSelf = me?.id === user.id;

  const grant = async () => {
    if (!role || !scopeOk(role, operatorId, warehouseId)) return;
    const r = await run(() => coreAdmin.grantRole(user.id, scopeBody(role, operatorId, warehouseId)), { success: `${ROLE_LABEL[role]} granted — the user's sessions were revoked` });
    if (r) { setRole(""); onChanged(r); }
  };

  return (
    <Modal open onClose={onClose} title={user.name || user.phone || "User"} size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 text-[13px]">
          {user.status && <StatusBadge status={user.status} kind="generic" />}
          <span className="text-ink-soft">{user.phone}</span>
          <span className="text-ink-soft">MFA {user.mfaEnabled ? "enabled" : "not set up"}</span>
          <span className="text-ink-soft">Last login {formatIST(user.lastLoginAt)}</span>
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-ink mb-2">Roles</h3>
          <ul className="space-y-1">
            {(user.roles || []).length === 0 && <li className="text-[13px] text-ink-soft">No roles.</li>}
            {(user.roles || []).map((g) => (
              <li key={g.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[13px]">
                <span><strong>{ROLE_LABEL[g.role] || g.role}</strong>{g.operatorId && ` · operator ${opName(g.operatorId) || g.operatorId}`}{g.warehouseId && ` · warehouse ${whName(g.warehouseId) || g.warehouseId}`}<span className="text-ink-faint"> · since {formatIST(g.grantedAt)}</span></span>
                {canWrite && <button className="p-1 rounded hover:bg-danger/10 text-danger" aria-label={`Revoke ${ROLE_LABEL[g.role]}`} onClick={() => setRevoking(g)}><Trash2 className="w-4 h-4" /></button>}
              </li>
            ))}
          </ul>
        </div>
        {canWrite && (
          <form className="rounded-lg border border-line p-3 space-y-3" onSubmit={(e) => { e.preventDefault(); grant(); }}>
            <h3 className="text-[13px] font-bold text-ink">Grant a role</h3>
            <RoleScope role={role} setRole={setRole} operatorId={operatorId} setOperatorId={setOperatorId} warehouseId={warehouseId} setWarehouseId={setWarehouseId} operators={operators} warehouses={warehouses} />
            <p className="text-[11px] text-ink-soft">Granting or revoking a role signs the user out of every session.</p>
            <div className="flex justify-end"><button type="submit" className={btnPrimary} disabled={!scopeOk(role, operatorId, warehouseId) || busy}>Grant role</button></div>
          </form>
        )}
        {canWrite && (
          <div className="flex flex-wrap gap-2">
            <button className={btnOutline} onClick={() => setSessions(true)}><LogOut className="w-4 h-4" aria-hidden />Revoke sessions</button>
            {user.status !== "ACTIVE" && <button className={btnOutline} onClick={() => setStatusTo("ACTIVE")}>Activate</button>}
            {user.status !== "SUSPENDED" && !isSelf && <button className={btnOutline} onClick={() => setStatusTo("SUSPENDED")}>Suspend</button>}
            {user.status !== "DISABLED" && !isSelf && <button className={btnOutline} onClick={() => setStatusTo("DISABLED")}>Disable</button>}
            {!isSelf && <button className={btnOutline} onClick={() => { setReset(false); setMfaOpen(true); }}><KeyRound className="w-4 h-4" aria-hidden />Issue MFA setup code</button>}
          </div>
        )}
        {!canWrite && <Notice tone="info">Read-only: only an admin can change users and roles.</Notice>}
      </div>

      <ConfirmDialog open={!!revoking} title="Revoke role" danger busy={busy} confirmLabel="Revoke" onClose={() => setRevoking(null)}
        message={`Revoke ${revoking ? ROLE_LABEL[revoking.role] : ""} from ${user.name || user.phone}? Their sessions are revoked.`}
        onConfirm={async () => { if (!revoking) return; const ok = await run(() => coreAdmin.revokeRole(user.id, revoking.id).then(() => true), { success: "Role revoked" }); setRevoking(null); if (ok) onChanged(); }} />
      <ReasonDialog open={sessions} title="Revoke all sessions" busy={busy} danger onClose={() => setSessions(false)} confirmLabel="Revoke sessions"
        summary={`Sign ${user.name || user.phone} out of every device?`}
        onConfirm={async (reason) => { const r = await run(() => coreAdmin.revokeSessions(user.id, reason), { success: (x) => `${x.revoked} session(s) revoked` }); if (r) setSessions(false); }} />
      <ReasonDialog open={!!statusTo} title={`Set status: ${statusTo.toLowerCase()}`} busy={busy} danger={statusTo !== "ACTIVE"} onClose={() => setStatusTo("")} confirmLabel="Update status"
        summary={statusTo === "ACTIVE" ? "Allow this user to sign in again." : "Suspended or disabled users are signed out of every session."}
        onConfirm={async (reason) => { const r = await run(() => coreAdmin.updateUser(user.id, { status: statusTo, reason }), { success: "Status updated" }); setStatusTo(""); if (r) onChanged(r); }} />
      <ReasonDialog open={mfaOpen} title="Issue MFA setup code" busy={busy} onClose={() => setMfaOpen(false)} confirmLabel="Issue code"
        summary="A single-use code lets this user set up two-factor authentication at their next login. Any previous code is revoked."
        onConfirm={async (reason) => { const r = await run(() => coreAdmin.mfaEnrolmentToken(user.id, { reason, reset })); if (r) { setMfaOpen(false); setMfaCode({ token: r.enrolmentToken, expiresAt: r.expiresAt }); } }}>
        <CheckboxField label="Reset the existing authenticator (signs the user out)" checked={reset} onChange={setReset} />
      </ReasonDialog>
      <Modal open={!!mfaCode} onClose={() => setMfaCode(null)} title="MFA setup code" size="sm">
        <div className="space-y-3 text-[13px]">
          <p>Give this one-time code to {user.name || user.phone} in person or by phone. It expires at {formatIST(mfaCode?.expiresAt)}.</p>
          <p className="font-mono text-[15px] font-bold tracking-wider break-all select-all rounded-lg bg-surface-alt border border-line px-3 py-2">{mfaCode?.token}</p>
          <p className="text-[11px] text-ink-soft">The code is shown only once.</p>
          <div className="flex justify-end"><button className={btnPrimary} data-autofocus onClick={() => setMfaCode(null)}>Done</button></div>
        </div>
      </Modal>
    </Modal>
  );
}

function NewUser({ onClose, onCreated, operators, warehouses }: { onClose: () => void; onCreated: (u: AdminUser) => void; operators: Operator[]; warehouses: Warehouse[] }) {
  const { run, busy } = useAction();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [operatorId, setOperatorId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const phoneOk = /^[6-9][0-9]{9}$/.test(phone);
  const valid = phoneOk && !!name.trim() && scopeOk(role, operatorId, warehouseId);
  return (
    <Modal open onClose={onClose} title="New staff user">
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault();
        if (!valid || !role) return;
        const r = await run(() => coreAdmin.createUser({ phone, name: name.trim(), roles: [scopeBody(role, operatorId, warehouseId)] }), { success: "User created" });
        if (r) onCreated(r);
      }}>
        <TextField label="Mobile number" value={phone} onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))} prefix="+91" inputMode="tel" required error={phone && !phoneOk ? "10-digit Indian mobile" : undefined} />
        <TextField label="Name" value={name} onChange={setName} required maxLength={120} />
        <RoleScope role={role} setRole={setRole} operatorId={operatorId} setOperatorId={setOperatorId} warehouseId={warehouseId} setWarehouseId={setWarehouseId} operators={operators} warehouses={warehouses} />
        <div className="flex justify-end gap-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary} disabled={!valid || busy}>Create user</button></div>
      </form>
    </Modal>
  );
}

function UsersBody() {
  const { roles } = useAuth();
  const canWrite = hasAnyRole(roles, WRITE_ROLES.users);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const q = useCoreQuery(() => coreAdmin.users({ phone: phone.trim() || undefined, role: role || undefined, status: status || undefined, page, limit: 50 }), [phone, role, status, page]);
  const ops = useCoreQuery<Operator[]>(() => coreAdmin.operators(), [], { silent: true });
  const whs = useCoreQuery<Warehouse[]>(() => coreAdmin.warehouses(), [], { silent: true });
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 -mt-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48"><TextField label="Phone" value={phone} onChange={(v) => { setPhone(v); setPage(1); }} inputMode="tel" /></div>
          <div className="w-48"><SelectField label="Role" value={role} onChange={(v) => { setRole(v); setPage(1); }} placeholder="Any role" options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} /></div>
          <div className="w-40"><SelectField label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} placeholder="Any" options={["ACTIVE", "SUSPENDED", "DISABLED"].map((s) => ({ value: s, label: s.toLowerCase() }))} /></div>
        </div>
        {canWrite && <button className={btnPrimary} onClick={() => setCreating(true)}><Plus className="w-4 h-4" aria-hidden />New user</button>}
      </div>
      {!canWrite && <Notice tone="info">Read-only: only an admin can change users and roles.</Notice>}
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Users" rowKey={(u) => u.id} data={q.data?.data || []} loading={q.loading && !q.data} emptyMessage="No users" onRowClick={setOpen}
        page={q.data?.meta?.page || page} totalPages={q.data?.meta?.totalPages || 1} onPageChange={setPage}
        columns={[
          { key: "name", label: "User", render: (u: AdminUser) => <div><p className="font-medium text-ink">{u.name || "—"}</p><p className="text-xs text-ink-soft">{u.phone}</p></div> },
          { key: "roles", label: "Roles", render: (u: AdminUser) => <span className="text-[12px]">{(u.roles || []).map((g) => ROLE_LABEL[g.role] || g.role).join(", ") || "—"}</span> },
          { key: "status", label: "Status", render: (u: AdminUser) => (u.status ? <StatusBadge status={u.status} kind="generic" /> : "—") },
          { key: "mfa", label: "MFA", render: (u: AdminUser) => (u.mfaEnabled ? "Enabled" : "Not set up") },
          { key: "login", label: "Last login", render: (u: AdminUser) => <span className="text-[12px]">{formatIST(u.lastLoginAt)}</span> },
        ]} />
      {open && <UserDetail user={open} operators={ops.data || []} warehouses={whs.data || []} onClose={() => setOpen(null)} onChanged={(u) => { if (u) setOpen(u); q.reload(); }} />}
      {creating && <NewUser operators={ops.data || []} warehouses={whs.data || []} onClose={() => setCreating(false)} onCreated={(u) => { setCreating(false); q.reload(); setOpen(u); }} />}
    </>
  );
}

/** P14 — users & roles (admin writes; ops_manager read-only). */
export default function CoreUsersRoles() {
  return (
    <CorePage title="Users & Roles" description="Staff accounts, scoped role grants, sessions and MFA setup codes (FR-ADM-004)" roles={PAGE_ROLES.users}>
      <UsersBody />
    </CorePage>
  );
}
