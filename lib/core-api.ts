// Dropzy core API client (PRD v2.0, CLIENT_CONTRACTS.md §1 / §4.0).
//
// * Envelope {data, meta}; errors {error:{code,message,details,correlationId}} → CoreApiError.
// * Access token lives ONLY in the module-level `session` singleton below (never React state or Web Storage), so remounting
//   AuthProvider on route changes never loses it. The refresh token is the HttpOnly cookie `dz_rt`; it is never visible to JS.
//   Every call uses credentials:"include"; a page reload calls POST /auth/refresh with an empty body.
// * Single-flight refresh: concurrent 401 UNAUTHENTICATED responses await one shared refresh promise, then retry once.
//   401 SESSION_REVOKED / failed refresh → session ended → /login with "Your session has ended. Please log in again."
// * Idempotency-Key (uuid v4) per user action: the key is created on the first attempt of an action and reused for every
//   retry of the same action (same method + path + payload) until it succeeds; a new action gets a new key.
import { API_URL } from "./config";
import type * as T from "./core-types";

export const SESSION_ENDED_COPY = "Your session has ended. Please log in again.";
export const STAFF_ONLY_COPY = "This portal is for Dropzy staff only.";
export const PORTAL_ROLES: T.Role[] = ["warehouse_staff", "support", "ops_manager", "finance", "admin"];

const HINT_KEY = "dz_portal_session"; // non-secret flag: "a cookie session may exist, try refresh on reload"
const FLASH_KEY = "dz_portal_flash";
const DEVICE_KEY = "dz_portal_device_id";
const TIMEOUT_MS = 20000;

// ───────────────────────────── errors ─────────────────────────────
export class CoreApiError extends Error {
  status: number;
  code: string;
  details: Record<string, any>;
  correlationId?: string;
  network: boolean;
  constructor(init: { status: number; code: string; message: string; details?: Record<string, any>; correlationId?: string; network?: boolean }) {
    super(init.message);
    this.name = "CoreApiError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details || {};
    this.correlationId = init.correlationId;
    this.network = !!init.network;
  }
}

export function isCoreApiError(e: unknown): e is CoreApiError {
  return e instanceof CoreApiError;
}

export function isNetworkError(e: unknown): boolean {
  return e instanceof CoreApiError ? e.network : e instanceof TypeError;
}

// ───────────────────────────── ids ─────────────────────────────
function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(a);
  else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
  return a;
}

/** uuid v4 via crypto.randomUUID() (falls back to getRandomValues where randomUUID is unavailable, e.g. plain-http hosts). */
export function uuidv4(): string {
  if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") return (crypto as any).randomUUID();
  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function correlationId(): string {
  return `corr_${Array.from(randomBytes(10), (x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Stable per-browser device id sent with the OTP verify (not a credential). */
export function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return uuidv4();
  }
}

// ───────────────────────────── session singleton ─────────────────────────────
interface SessionState {
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  me: T.Me | null;
}
const session: SessionState = { accessToken: null, accessTokenExpiresAt: null, me: null };
type Listener = () => void;
const listeners = new Set<Listener>();
let ending = false;

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export const coreSession = {
  get accessToken() {
    return session.accessToken;
  },
  get me() {
    return session.me;
  },
  setMe(me: T.Me | null) {
    session.me = me;
    listeners.forEach((l) => l());
  },
  /** True when this tab may hold a cookie session (set after login, cleared on logout). */
  hasHint(): boolean {
    return storage()?.getItem(HINT_KEY) === "1";
  },
  apply(result: T.AuthResult) {
    if (result.accessToken) {
      session.accessToken = result.accessToken;
      session.accessTokenExpiresAt = result.accessTokenExpiresAt || null;
    }
    // refreshToken is null for the portal (HttpOnly cookie) — never stored or read by JS.
    if (result.user) session.me = result.user;
    storage()?.setItem(HINT_KEY, "1");
    ending = false;
    listeners.forEach((l) => l());
  },
  clear() {
    session.accessToken = null;
    session.accessTokenExpiresAt = null;
    session.me = null;
    storage()?.removeItem(HINT_KEY);
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  /** One-shot message shown on the login page (e.g. after the session ended). */
  takeFlash(): string | null {
    const s = storage();
    const v = s?.getItem(FLASH_KEY) || null;
    if (v) s?.removeItem(FLASH_KEY);
    return v;
  },
  setFlash(msg: string) {
    storage()?.setItem(FLASH_KEY, msg);
  },
};

export function hasPortalRole(me: T.Me | null | undefined): boolean {
  return !!me?.roles?.some((g) => PORTAL_ROLES.includes(g.role));
}

/** Clears the session and returns to /login with a message. Never loops: no redirect when already on /login. */
export function endSession(message = SESSION_ENDED_COPY) {
  coreSession.clear();
  if (typeof window === "undefined") return;
  coreSession.setFlash(message);
  if (ending) return;
  ending = true;
  if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
}

// ───────────────────────────── server clock ─────────────────────────────
let serverOffsetMs = 0;
/** Server-aligned "now" (uses the latest serverTime seen), for countdowns. */
export function serverNow(): number {
  return Date.now() + serverOffsetMs;
}
export function noteServerTime(iso: string | null | undefined) {
  if (!iso) return;
  const t = new Date(iso).getTime();
  if (!Number.isNaN(t)) serverOffsetMs = t - Date.now();
}

// ───────────────────────────── refresh (single flight) ─────────────────────────────
type RefreshOutcome = "ok" | "failed" | "network";
let refreshInFlight: Promise<RefreshOutcome> | null = null;

export function refreshSession(): Promise<RefreshOutcome> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function doRefresh(): Promise<RefreshOutcome> {
  try {
    // Portal: empty body — the server reads the HttpOnly dz_rt cookie (a body token would be rejected).
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { Accept: "application/json", "X-Correlation-Id": correlationId() },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return "failed";
    const json = await res.json().catch(() => null);
    const data: T.AuthResult | undefined = json?.data;
    if (!data?.accessToken) return "failed";
    session.accessToken = data.accessToken;
    session.accessTokenExpiresAt = data.accessTokenExpiresAt || null;
    if (data.user) session.me = data.user;
    return "ok";
  } catch {
    return "network";
  }
}

// ───────────────────────────── idempotency keys per action ─────────────────────────────
const actionKeys = new Map<string, string>();

function bodySignature(body: unknown, form?: FormData): string {
  if (form) {
    const parts: string[] = [];
    form.forEach((v, k) => {
      parts.push(typeof v === "string" ? `${k}=${v}` : `${k}=file:${(v as File).name}:${(v as File).size}:${(v as File).lastModified}`);
    });
    return parts.join("&");
  }
  return body === undefined ? "" : JSON.stringify(body);
}

// ───────────────────────────── request ─────────────────────────────
export type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  query?: Query;
  body?: unknown;
  form?: FormData;
  /** false for public auth endpoints (no bearer, no refresh on 401). */
  auth?: boolean;
  /** explicit key, or false to omit (non-idempotent endpoints such as MFA enrolment-token). */
  idempotencyKey?: string | false;
  accept?: string;
}

export interface Envelope<D> {
  data: D;
  meta?: T.PageMeta;
  replayed: boolean;
  status: number;
}

export function buildUrl(path: string, query?: Query): string {
  const qs = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  return `${API_URL}${path}${qs ? `?${qs}` : ""}`;
}

async function toError(res: Response): Promise<CoreApiError> {
  const json = await res.json().catch(() => null);
  const e = json?.error;
  return new CoreApiError({
    status: res.status,
    code: e?.code || (res.status === 404 ? "NOT_FOUND" : res.status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR"),
    message: e?.message || json?.message || `Request failed (${res.status})`,
    details: e?.details || {},
    correlationId: e?.correlationId || res.headers.get("X-Correlation-Id") || undefined,
  });
}

async function send(method: string, path: string, opts: RequestOptions, idemKey?: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: opts.accept || "application/json", "X-Correlation-Id": correlationId() };
  if (opts.auth !== false && session.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
  if (idemKey) headers["Idempotency-Key"] = idemKey;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
  try {
    return await fetch(buildUrl(path, opts.query), { method, headers, body, credentials: "include", cache: "no-store", signal: ctrl?.signal });
  } catch {
    throw new CoreApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Cannot reach the Dropzy server. Check your connection and try again.",
      network: true,
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Ensures an access token exists (page reload → cookie refresh). */
async function ensureToken(): Promise<void> {
  if (session.accessToken) return;
  const r = await refreshSession();
  if (r === "network") throw new CoreApiError({ status: 0, code: "NETWORK_ERROR", message: "Cannot reach the Dropzy server. Check your connection and try again.", network: true });
  if (r === "failed") {
    endSession();
    throw new CoreApiError({ status: 401, code: "SESSION_REVOKED", message: SESSION_ENDED_COPY });
  }
}

async function execute(method: string, path: string, opts: RequestOptions): Promise<Response> {
  const mutating = method !== "GET" && method !== "HEAD";
  let sig: string | undefined;
  let idemKey: string | undefined;
  if (mutating && opts.idempotencyKey !== false && opts.auth !== false) {
    if (typeof opts.idempotencyKey === "string") idemKey = opts.idempotencyKey;
    else {
      sig = `${method} ${path} ${bodySignature(opts.body, opts.form)}`;
      idemKey = actionKeys.get(sig) || uuidv4();
      actionKeys.set(sig, idemKey);
    }
  }
  if (opts.auth !== false) await ensureToken();

  let res = await send(method, path, opts, idemKey);
  if (res.status === 401 && opts.auth !== false) {
    const err = await toError(res);
    if (err.code === "UNAUTHENTICATED") {
      const r = await refreshSession();
      if (r === "ok") {
        res = await send(method, path, opts, idemKey); // retry once
        if (res.status === 401) {
          const err2 = await toError(res);
          endSession();
          throw err2;
        }
      } else if (r === "network") {
        throw new CoreApiError({ status: 0, code: "NETWORK_ERROR", message: "Cannot reach the Dropzy server. Check your connection and try again.", network: true });
      } else {
        endSession();
        throw err;
      }
    } else {
      // SESSION_REVOKED, MFA_REQUIRED or anything else on an authenticated call: the session cannot continue.
      endSession();
      throw err;
    }
  }
  if (!res.ok) throw await toError(res);
  if (sig) actionKeys.delete(sig); // the action succeeded: the next tap is a new action with a new key
  return res;
}

export async function coreRequest<D>(method: string, path: string, opts: RequestOptions = {}): Promise<Envelope<D>> {
  const res = await execute(method, path, opts);
  const replayed = res.headers.get("Idempotent-Replayed") === "true";
  if (res.status === 204) return { data: undefined as D, replayed, status: 204 };
  const json = await res.json().catch(() => null);
  const data = (json && typeof json === "object" && "data" in json ? json.data : json) as D;
  const st = (data as any)?.serverTime || (data as any)?.shipment?.serverTime;
  if (typeof st === "string") noteServerTime(st);
  return { data, meta: json?.meta, replayed, status: res.status };
}

const get = async <D>(path: string, query?: Query) => (await coreRequest<D>("GET", path, { query })).data;
const list = async <D>(path: string, query?: Query) => {
  const env = await coreRequest<D[]>("GET", path, { query });
  return { data: Array.isArray(env.data) ? env.data : [], meta: env.meta };
};
const post = async <D>(path: string, body?: unknown, opts: RequestOptions = {}) =>
  (await coreRequest<D>("POST", path, { ...opts, body: body ?? opts.body })).data;
const patch = async <D>(path: string, body: unknown) => (await coreRequest<D>("PATCH", path, { body })).data;
const del = async (path: string) => {
  await coreRequest<void>("DELETE", path);
};

/** Authenticated file download (CSV reports). */
export async function coreDownload(path: string, query: Query, fallbackName: string): Promise<{ blob: Blob; filename: string }> {
  const res = await execute("GET", path, { query, accept: "text/csv" });
  const cd = res.headers.get("Content-Disposition") || "";
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
  return { blob: await res.blob(), filename: m ? decodeURIComponent(m[1]) : fallbackName };
}

export type ListResult<D> = { data: D[]; meta?: T.PageMeta };
const id = encodeURIComponent;

// ───────────────────────────── auth ─────────────────────────────
export const coreAuth = {
  requestOtp: (phone: string) => post<T.OtpChallenge>("/auth/otp/request", { phone }, { auth: false }),
  verifyOtp: (challengeId: string, phone: string, code: string) =>
    post<T.AuthResult>(
      "/auth/otp/verify",
      {
        challengeId,
        phone,
        code,
        appVariant: "portal",
        device: { deviceId: deviceId(), platform: "web", name: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 120) : "web" },
      },
      { auth: false },
    ),
  verifyMfa: (mfaToken: string, code: string) => post<T.AuthResult>("/auth/mfa/verify", { mfaToken, code }, { auth: false }),
  enrollMfa: (mfaToken: string, enrolmentToken: string) => post<T.MfaEnrolment>("/auth/mfa/enroll", { mfaToken, enrolmentToken }, { auth: false }),
  confirmMfaEnrolment: (mfaToken: string, enrolmentToken: string, code: string) =>
    post<T.AuthResult>("/auth/mfa/enroll/confirm", { mfaToken, enrolmentToken, code }, { auth: false }),
  me: () => get<T.Me>("/me"),
  /** Restores the session after a reload from the HttpOnly cookie. */
  restore: async (): Promise<T.Me | null> => {
    if (!session.accessToken) {
      const r = await refreshSession();
      if (r !== "ok") return null;
    }
    const me = await get<T.Me>("/me");
    session.me = me;
    return me;
  },
  logout: async (message?: string) => {
    try {
      if (session.accessToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.accessToken}`, "X-Correlation-Id": correlationId() },
          credentials: "include",
        });
      }
    } catch {
      /* best effort: the local session is cleared regardless */
    }
    coreSession.clear();
    if (message) coreSession.setFlash(message);
  },
};

// ───────────────────────────── me / inbox ─────────────────────────────
export const coreInbox = {
  list: (q: { page?: number; limit?: number; unreadOnly?: boolean }) => list<T.CoreNotification>("/me/notifications", q),
  unreadCount: () => get<{ unread: number }>("/me/notifications/unread-count"),
  markRead: (nid: string) => post<T.CoreNotification>(`/me/notifications/${id(nid)}/read`),
  readAll: () => post<{ marked: number }>("/me/notifications/read-all"),
};

// ───────────────────────────── shipments (role-shaped) ─────────────────────────────
export const coreShipments = {
  get: (sid: string) => get<T.ShipmentView>(`/shipments/${id(sid)}`),
  eligibility: (sid: string) => get<T.GateReport>(`/shipments/${id(sid)}/release-eligibility`),
  scan: (q: { qr?: string; dcn?: string }) => get<T.ShipmentView>("/scan/resolve", q),
  issueReceiverOtp: (sid: string, purpose?: "STOP_HANDOVER" | "WAREHOUSE_PICKUP" | "RETURN_TO_SENDER") =>
    post<T.ReceiverOtpIssued>(`/shipments/${id(sid)}/receiver-otp`, purpose ? { purpose } : {}),
  placeStaffHold: (sid: string, body: { type: "IDENTITY" | "SAFETY"; reasonCode: string; reason: string; evidenceId?: string; deviceTime?: string }) =>
    post<T.Hold>(`/shipments/${id(sid)}/holds`, body),
  receive: (sid: string, body: Record<string, unknown>) => coreRequest<T.CommandResult>("POST", `/shipments/${id(sid)}/warehouse-receipts`, { body }),
  relocate: (sid: string, body: { warehouseId: string; toBinCode: string; reason?: string }) =>
    post<T.InventoryItem>(`/shipments/${id(sid)}/warehouse-relocations`, body),
  release: (sid: string, body: Record<string, unknown>) => coreRequest<T.CommandResult>("POST", `/shipments/${id(sid)}/warehouse-release`, { body }),
  openDispute: (sid: string, body: { quoteId: string; reasonCode: string; description: string; evidenceIds?: string[] }) =>
    post<T.Dispute>(`/shipments/${id(sid)}/disputes`, body),
};

export const coreWarehouses = {
  list: () => get<T.Warehouse[]>("/warehouses"),
  inventory: (wid: string, q: Query) => list<T.InventoryItem>(`/warehouses/${id(wid)}/inventory`, q),
};

export const coreEvidence = {
  upload: (file: File, kind: string, shipmentId?: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    if (shipmentId) form.append("shipmentId", shipmentId);
    form.append("capturedAtDevice", new Date(file.lastModified || Date.now()).toISOString());
    return coreRequest<T.Evidence>("POST", "/evidence", { form }).then((e) => e.data);
  },
  get: (eid: string) => get<T.Evidence>(`/evidence/${id(eid)}`),
};

export const coreSupport = {
  list: (q: Query) => list<T.Ticket>("/support/tickets", q),
  get: (tid: string) => get<T.TicketDetail>(`/support/tickets/${id(tid)}`),
  create: (body: Record<string, unknown>) => post<T.Ticket>("/support/tickets", body),
  update: (tid: string, body: Record<string, unknown>) => patch<T.Ticket>(`/support/tickets/${id(tid)}`, body),
  addMessage: (tid: string, body: { body: string; visibility: "CUSTOMER" | "INTERNAL"; evidenceIds?: string[] }) =>
    post<T.TicketMessage>(`/support/tickets/${id(tid)}/messages`, body),
};

// ───────────────────────────── admin ─────────────────────────────
const S = (sid: string) => `/admin/shipments/${id(sid)}`;
export const coreAdmin = {
  dashboard: () => get<T.DashboardSummary>("/admin/dashboard/summary"),
  searchShipments: (q: Query) => list<T.AdminShipmentRow>("/admin/shipments", q),
  shipment: (sid: string) => get<T.AdminShipmentDetail>(S(sid)),
  weightExceptions: (q: Query) => list<T.WeightExceptionRow>("/admin/weight-exceptions", q),
  unpaidHolds: (q: Query) => list<T.UnpaidHoldRow>("/admin/unpaid-holds", q),
  placeHold: (sid: string, body: { type: string; reasonCode: string; reason: string; evidenceId?: string }) => post<T.Hold>(`${S(sid)}/holds`, body),
  clearHold: (sid: string, holdId: string, body: { reason: string; expectedVersion?: number }) =>
    post<T.CommandResult>(`${S(sid)}/holds/${id(holdId)}/clear`, body),
  waive: (sid: string, holdId: string, body: { reason: string; reasonCode: string; expectedVersion?: number }) =>
    post<T.CommandResult>(`${S(sid)}/holds/${id(holdId)}/waive`, body),
  loadExemption: (sid: string, holdId: string, body: { reason: string; expectedVersion?: number }) =>
    post<T.Hold>(`${S(sid)}/holds/${id(holdId)}/load-exemption`, body),
  extendCutoff: (sid: string, body: { newCutoffAt: string; reason: string; expectedVersion?: number }) => post<T.CommandResult>(`${S(sid)}/cutoff-extension`, body),
  reassignTrip: (sid: string, body: { tripId: string; reason: string }) => post<T.CommandResult>(`${S(sid)}/reassign-trip`, body),
  resolveWeightReview: (sid: string, body: { resolution: string; reason: string; expectedVersion?: number }) =>
    post<T.CommandResult>(`${S(sid)}/weight-review/resolve`, body),
  startReturn: (sid: string, body: { reason: string; expectedVersion?: number }) => post<T.CommandResult>(`${S(sid)}/returns`, body),
  completeReturn: (sid: string, body: { collectorName: string; otpCode: string; evidenceId?: string; notes?: string }) =>
    post<T.CommandResult>(`${S(sid)}/returns/complete`, body),
  cancel: (sid: string, body: { reason: string; refundOverridePaise?: number | null; expectedVersion?: number }) => post<T.CommandResult>(`${S(sid)}/cancel`, body),
  divertToWarehouse: (sid: string, body: { reason: string; expectedVersion?: number }) => post<T.CommandResult>(`${S(sid)}/warehouse-diversion`, body),

  disputes: (q: Query) => list<T.Dispute>("/admin/disputes", q),
  dispute: (did: string) => get<T.Dispute>(`/admin/disputes/${id(did)}`),
  assignDispute: (did: string, assigneeId: string) => post<T.Dispute>(`/admin/disputes/${id(did)}/assign`, { assigneeId }),
  resolveDispute: (did: string, body: Record<string, unknown>) => post<T.Dispute>(`/admin/disputes/${id(did)}/resolve`, body),

  tariffs: (q?: Query) => get<T.Tariff[]>("/admin/tariffs", q),
  tariff: (tid: string) => get<T.Tariff>(`/admin/tariffs/${id(tid)}`),
  createTariff: (body: Record<string, unknown>) => post<T.Tariff>("/admin/tariffs", body),
  updateTariff: (tid: string, body: Record<string, unknown>) => patch<T.Tariff>(`/admin/tariffs/${id(tid)}`, body),
  // validate/preview are pure calculations: no Idempotency-Key (openapi conventions).
  validateTariff: (config: T.TariffConfig) =>
    post<{ valid: boolean; fieldErrors?: T.FieldError[] }>("/admin/tariffs/validate", { config }, { idempotencyKey: false }),
  previewTariff: (tid: string, body: { declaredWeightGrams: number; actualWeightGrams?: number }) =>
    post<T.TariffPreview>(`/admin/tariffs/${id(tid)}/preview`, body, { idempotencyKey: false }),
  publishTariff: (tid: string, body: { effectiveFrom: string; effectiveTo?: string | null; reason: string }) => post<T.Tariff>(`/admin/tariffs/${id(tid)}/publish`, body),
  retireTariff: (tid: string, body: { effectiveTo: string; reason: string }) => post<T.Tariff>(`/admin/tariffs/${id(tid)}/retire`, body),

  operators: () => get<T.Operator[]>("/admin/operators"),
  createOperator: (body: Record<string, unknown>) => post<T.Operator>("/admin/operators", body),
  updateOperator: (oid: string, body: Record<string, unknown>) => patch<T.Operator>(`/admin/operators/${id(oid)}`, body),
  stops: () => get<T.Stop[]>("/admin/stops"),
  createStop: (body: Record<string, unknown>) => post<T.Stop>("/admin/stops", body),
  updateStop: (sid: string, body: Record<string, unknown>) => patch<T.Stop>(`/admin/stops/${id(sid)}`, body),
  routes: () => get<T.Route[]>("/admin/routes"),
  createRoute: (body: Record<string, unknown>) => post<T.Route>("/admin/routes", body),
  updateRoute: (rid: string, body: Record<string, unknown>) => patch<T.Route>(`/admin/routes/${id(rid)}`, body),
  trips: (q: Query) => list<T.Trip>("/admin/trips", q),
  createTrip: (body: Record<string, unknown>) => post<T.Trip>("/admin/trips", body),
  updateTrip: (tid: string, body: Record<string, unknown>) => patch<T.Trip>(`/admin/trips/${id(tid)}`, body),
  assignTrip: (tid: string, body: { userId: string; assignmentRole: "DRIVER" | "ATTENDANT" }) => post<T.TripAssignment>(`/admin/trips/${id(tid)}/assignments`, body),
  unassignTrip: (tid: string, userId: string) => del(`/admin/trips/${id(tid)}/assignments/${id(userId)}`),
  warehouses: () => get<T.Warehouse[]>("/admin/warehouses"),
  createWarehouse: (body: Record<string, unknown>) => post<T.Warehouse>("/admin/warehouses", body),
  updateWarehouse: (wid: string, body: Record<string, unknown>) => patch<T.Warehouse>(`/admin/warehouses/${id(wid)}`, body),

  users: (q: Query) => list<T.AdminUser>("/admin/users", q),
  user: (uid: string) => get<T.AdminUser>(`/admin/users/${id(uid)}`),
  createUser: (body: Record<string, unknown>) => post<T.AdminUser>("/admin/users", body),
  updateUser: (uid: string, body: Record<string, unknown>) => patch<T.AdminUser>(`/admin/users/${id(uid)}`, body),
  grantRole: (uid: string, body: { role: T.Role; operatorId?: string; warehouseId?: string }) => post<T.AdminUser>(`/admin/users/${id(uid)}/roles`, body),
  revokeRole: (uid: string, roleId: string) => del(`/admin/users/${id(uid)}/roles/${id(roleId)}`),
  revokeSessions: (uid: string, reason: string) => post<{ revoked: number }>(`/admin/users/${id(uid)}/sessions/revoke`, { reason }),
  // No Idempotency-Key: the response carries a one-time secret that must never be replayed (openapi).
  mfaEnrolmentToken: (uid: string, body: { reason: string; reset: boolean }) =>
    post<{ userId: string; enrolmentToken: string; expiresAt: string }>(`/admin/users/${id(uid)}/mfa/enrolment-token`, body, { idempotencyKey: false }),

  payments: (q: Query) => list<T.PaymentIntent>("/admin/finance/payments", q),
  ledgerTransactions: (q: Query) => list<T.LedgerTransaction>("/admin/finance/ledger/transactions", q),
  ledgerBalances: (q: Query) => get<{ asOf?: string; balanced?: boolean; accounts?: T.LedgerBalance[] }>("/admin/finance/ledger/balances", q),
  reconRuns: (q: Query) => list<T.ReconRun>("/admin/finance/reconciliation/runs", q),
  runRecon: (businessDate: string) => post<T.ReconRun>("/admin/finance/reconciliation/runs", { businessDate }),
  reconItems: (q: Query) => list<T.ReconItem>("/admin/finance/reconciliation/items", q),
  resolveReconItem: (iid: string, note: string) => post<T.ReconItem>(`/admin/finance/reconciliation/items/${id(iid)}/resolve`, { note }),
  settlements: (q: Query) => list<T.Settlement>("/admin/finance/settlements", q),
  settlement: (sid: string) => get<T.Settlement>(`/admin/finance/settlements/${id(sid)}`),
  generateSettlement: (body: { operatorId: string; periodStart: string; periodEnd: string }) => post<T.Settlement>("/admin/finance/settlements", body),
  approveSettlement: (sid: string) => post<T.Settlement>(`/admin/finance/settlements/${id(sid)}/approve`),
  markSettlementPaid: (sid: string, payoutReference: string) => post<T.Settlement>(`/admin/finance/settlements/${id(sid)}/mark-paid`, { payoutReference }),
  voidSettlement: (sid: string, reason: string) => post<T.Settlement>(`/admin/finance/settlements/${id(sid)}/void`, { reason }),

  report: (type: string, q: Query) => coreDownload(`/admin/reports/${id(type)}`, { ...q, format: "csv" }, `${type}-${q.from}-${q.to}.csv`),
  auditLogs: (q: Query) => list<T.AuditLog>("/admin/audit-logs", q),
  notifications: (q: Query) => list<T.CoreNotification>("/admin/notifications", q),
  health: () => get<T.SystemHealth>("/admin/system/health"),
  outbox: (q: Query) => list<T.OutboxEvent>("/admin/system/outbox", q),
  retryOutbox: (oid: string) => post<T.OutboxEvent>(`/admin/system/outbox/${id(oid)}/retry`),
};
