// Display formatting for core (PRD v2.0) data. CLIENT_CONTRACTS.md §1.8, PRICING.md §4.5.
// Money is always formatted from integer paise supplied by the server; nothing here derives amounts.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const IST_OFFSET_MIN = 330;

const pad2 = (n: number) => String(n).padStart(2, "0");
const pad3 = (n: number) => String(n).padStart(3, "0");

function groupIndian(n: number): string {
  const s = String(n);
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${parts.join(",")},${last3}`;
}

/** 4720 → "₹47.20", 181900 → "₹1,819.00", 10000000 → "₹1,00,000.00". */
export function formatPaise(paise: number | null | undefined): string {
  if (paise === null || paise === undefined || typeof paise !== "number" || !Number.isFinite(paise)) return "—";
  const p = Math.trunc(paise);
  const abs = Math.abs(p);
  const rupees = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${p < 0 ? "−" : ""}₹${groupIndian(rupees)}.${pad2(rem)}`;
}

/** 500 → "0.50 kg", 1250 → "1.25 kg", 1251 → "1.251 kg" (PRICING.md §4.5 FormatKg). */
export function formatKg(grams: number | null | undefined): string {
  if (grams === null || grams === undefined || typeof grams !== "number" || !Number.isFinite(grams)) return "—";
  const g = Math.abs(Math.trunc(grams));
  const kg = Math.floor(g / 1000);
  const rem = g % 1000;
  const body = rem % 10 === 0 ? `${kg}.${pad2(rem / 10)} kg` : `${kg}.${pad3(rem)} kg`;
  return grams < 0 ? `−${body}` : body;
}

/** Signed difference: "+0.30 kg", "−0.30 kg" (U+2212), "0.00 kg". */
export function formatSignedKg(grams: number | null | undefined): string {
  if (grams === null || grams === undefined || typeof grams !== "number" || !Number.isFinite(grams)) return "—";
  if (grams > 0) return `+${formatKg(grams)}`;
  if (grams < 0) return `−${formatKg(-grams)}`;
  return formatKg(0);
}

/** Grams as an integer with unit, e.g. tolerance "50 g". */
export function formatGrams(grams: number | null | undefined): string {
  if (grams === null || grams === undefined || !Number.isFinite(grams)) return "—";
  return `${groupIndian(Math.trunc(grams))} g`;
}

function toDate(v: string | number | Date | null | undefined): Date | null {
  if (v === null || v === undefined || v === "") return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function istParts(v: string | number | Date) {
  const d = toDate(v)!;
  const s = new Date(d.getTime() + IST_OFFSET_MIN * 60000);
  const h = s.getUTCHours();
  return {
    y: s.getUTCFullYear(),
    mo: s.getUTCMonth(),
    d: s.getUTCDate(),
    h,
    mi: s.getUTCMinutes(),
    h12: h % 12 || 12,
    ap: h >= 12 ? "PM" : "AM",
  };
}

/** IST "dd MMM, hh:mm a" — e.g. "19 Oct, 03:35 PM". */
export function formatIST(v: string | number | Date | null | undefined): string {
  if (!toDate(v)) return "—";
  const p = istParts(v as string);
  return `${pad2(p.d)} ${MONTHS[p.mo]}, ${pad2(p.h12)}:${pad2(p.mi)} ${p.ap}`;
}

/** IST "hh:mm a" — e.g. "03:35 PM". */
export function formatISTTime(v: string | number | Date | null | undefined): string {
  if (!toDate(v)) return "—";
  const p = istParts(v as string);
  return `${pad2(p.h12)}:${pad2(p.mi)} ${p.ap}`;
}

/** Business date "19 Oct 2026" (accepts "YYYY-MM-DD" or an instant). */
export function formatISTDate(v: string | null | undefined): string {
  if (!v) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (m) return `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  if (!toDate(v)) return "—";
  const p = istParts(v);
  return `${pad2(p.d)} ${MONTHS[p.mo]} ${p.y}`;
}

/** Countdown copy: "{h} h {m} min", under 1 h "{m} min", under 1 min "less than a minute". */
export function formatCountdown(ms: number): string {
  if (ms < 60000) return "less than a minute";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

/** Age from hours: "5 h", "2 d 3 h". */
export function formatAgeHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || !Number.isFinite(hours)) return "—";
  if (hours < 24) return `${hours} h`;
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  return h ? `${d} d ${h} h` : `${d} d`;
}

/** Seconds → "45 s", "12 min", "3 h 5 min". */
export function formatDurationSeconds(sec: number | null | undefined): string {
  if (sec === null || sec === undefined || !Number.isFinite(sec)) return "—";
  if (sec < 60) return `${sec} s`;
  return formatCountdown(sec * 1000);
}

/** "2026-10-19T15:35" (IST wall clock, datetime-local value) → RFC 3339 UTC. */
export function istLocalToISO(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const utc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])) - IST_OFFSET_MIN * 60000;
  return new Date(utc).toISOString();
}

/** Instant → IST datetime-local value "YYYY-MM-DDTHH:mm". */
export function isoToISTLocal(v: string | number | Date | null | undefined): string {
  if (!toDate(v)) return "";
  const p = istParts(v as string);
  return `${p.y}-${pad2(p.mo + 1)}-${pad2(p.d)}T${pad2(p.h)}:${pad2(p.mi)}`;
}

/** IST calendar date "YYYY-MM-DD" for an instant (default now), shifted by `days`. */
export function istDate(days = 0, at: number = Date.now()): string {
  const p = istParts(at + days * 86400000);
  return `${p.y}-${pad2(p.mo + 1)}-${pad2(p.d)}`;
}

/** IST date "YYYY-MM-DD" → instant at IST midnight (start) or end of day. */
export function istDayBoundaryISO(date: string, end = false): string | null {
  const iso = istLocalToISO(`${date}T00:00`);
  if (!iso) return null;
  return end ? new Date(new Date(iso).getTime() + 86400000 - 1).toISOString() : iso;
}

/**
 * Parse a rupee amount typed by staff ("49", "49.5", "1,819.00") into integer paise using string arithmetic only.
 * Returns null when the text is not a valid non-negative amount with at most 2 decimals.
 */
export function parseRupeesToPaise(text: string): number | null {
  const t = text.replace(/[₹,\s]/g, "");
  const m = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(t);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] || "").padEnd(2, "0"));
}

/** Integer paise → editable rupee text "49.00". */
export function paiseToRupeesInput(paise: number | null | undefined): string {
  if (paise === null || paise === undefined || !Number.isFinite(paise)) return "";
  const abs = Math.abs(Math.trunc(paise));
  return `${paise < 0 ? "-" : ""}${Math.floor(abs / 100)}.${pad2(abs % 100)}`;
}

/** Percentage text ("18", "18.5", "18.00") → basis points (1800). */
export function parsePercentToBps(text: string): number | null {
  const m = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(text.trim());
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] || "").padEnd(2, "0"));
}

/** Basis points → editable percentage text ("18.00"). */
export function bpsToPercentInput(bps: number | null | undefined): string {
  if (bps === null || bps === undefined || !Number.isFinite(bps)) return "";
  return `${Math.floor(bps / 100)}.${pad2(bps % 100)}`;
}

/** Basis points → "18%" / "12.5%". */
export function formatBps(bps: number | null | undefined): string {
  if (bps === null || bps === undefined || !Number.isFinite(bps)) return "—";
  const whole = Math.floor(bps / 100);
  const rem = bps % 100;
  return rem ? `${whole}.${pad2(rem).replace(/0$/, "")}%` : `${whole}%`;
}

/**
 * Weight typed by staff → grams (PRICING.md §3 ParseWeight rules, string arithmetic only).
 * g: ^[0-9]{1,6}$ ; kg: ^[0-9]{1,3}(\.[0-9]{1,3})?$
 */
export function parseWeightToGrams(value: string, unit: "g" | "kg"): number | null {
  if (unit === "g") return /^[0-9]{1,6}$/.test(value) ? Number(value) : null;
  const m = /^([0-9]{1,3})(?:\.([0-9]{1,3}))?$/.exec(value);
  if (!m) return null;
  return Number(m[1]) * 1000 + Number((m[2] || "").padEnd(3, "0"));
}

/** Humanise an enum code: "READY_FOR_PICKUP" → "Ready for pickup". */
export function humanize(code: string | null | undefined): string {
  if (!code) return "—";
  const s = code.replace(/[_-]+/g, " ").toLowerCase().trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Short id for display ("7c1e0f3a…"). */
export function shortId(id: string | null | undefined): string {
  if (!id) return "—";
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}
