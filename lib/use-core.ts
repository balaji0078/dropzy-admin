"use client";

// React hooks for core data: queries with visibility-aware polling + back-off (CLIENT_CONTRACTS.md §1.9) and
// actions that toast the §6 copy on failure (§4.0 ".catch on every call with toast").
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { isNetworkError, serverNow } from "./core-api";
import { CORE_API } from "./config";
import { errorCopy, type CopyVars, type ErrorContext } from "./core-errors";

export function useErrorToast() {
  const toast = useToast();
  return useCallback(
    (err: unknown, ctx: ErrorContext = "default", vars: CopyVars = {}) => {
      const c = errorCopy(err, ctx, vars);
      toast(c.body ? `${c.title} ${c.body}` : c.title, "error", { detail: c.correlationId ? `Ref: ${c.correlationId}` : undefined });
      return c;
    },
    [toast],
  );
}

export interface QueryState<D> {
  data: D | undefined;
  error: unknown;
  loading: boolean;
  /** Time of the last successful fetch (server-aligned). */
  syncedAt: number | null;
  reload: () => Promise<void>;
  setData: (fn: (d: D | undefined) => D | undefined) => void;
}

/**
 * Loads data on mount and whenever `deps` change; polls every `pollMs` while the tab is visible (pauses when hidden,
 * resumes with one immediate fetch). Consecutive network errors back off ×2 up to 60 s. Errors toast once per failure streak.
 */
export function useCoreQuery<D>(
  fetcher: () => Promise<D>,
  deps: unknown[],
  opts: { pollMs?: number | null; enabled?: boolean; errorContext?: ErrorContext; silent?: boolean } = {},
): QueryState<D> {
  const { pollMs = null, errorContext = "default", silent = false } = opts;
  // Core endpoints are never called with the flag off (legacy mode keeps working exactly as before).
  const enabled = CORE_API && opts.enabled !== false;
  const [data, setDataState] = useState<D | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [syncedAt, setSyncedAt] = useState<number | null>(null);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;
  const pollRef = useRef(pollMs);
  pollRef.current = pollMs;
  const showError = useErrorToast();
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;
  const tickRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    let streakToasted = false;
    let running = false;

    const schedule = () => {
      const ms = pollRef.current;
      if (cancelled || !ms || (typeof document !== "undefined" && document.visibilityState === "hidden")) return;
      const delay = failures > 0 ? Math.min(ms * 2 ** failures, 60000) : ms;
      timer = setTimeout(tick, delay);
    };
    const tick = async () => {
      if (timer) clearTimeout(timer);
      if (running || cancelled) return;
      running = true;
      try {
        const d = await fetchRef.current();
        if (cancelled) return;
        setDataState(d);
        setError(null);
        setSyncedAt(serverNow());
        failures = 0;
        streakToasted = false;
      } catch (e) {
        if (cancelled) return;
        setError(e);
        if (isNetworkError(e)) failures = Math.min(failures + 1, 6);
        if (!streakToasted && !silent) {
          showErrorRef.current(e, errorContext);
          streakToasted = true;
        }
      } finally {
        running = false;
        if (!cancelled) {
          setLoading(false);
          schedule();
        }
      }
    };
    tickRef.current = tick;
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
      else if (timer) clearTimeout(timer);
    };
    setLoading(true);
    tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  const reload = useCallback(async () => {
    await tickRef.current();
  }, []);
  const setData = useCallback((fn: (d: D | undefined) => D | undefined) => setDataState(fn), []);
  return { data, error, loading, syncedAt, reload, setData };
}

/**
 * Wraps a user action: shows the §6 copy on failure (with correlation id), optional success toast.
 * Returns the result, or undefined when the action failed. Retrying the same action reuses its Idempotency-Key
 * (handled in lib/core-api.ts).
 */
export function useAction() {
  const toast = useToast();
  const showError = useErrorToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <R,>(fn: () => Promise<R>, o: { success?: string | ((r: R) => string); errorContext?: ErrorContext; vars?: CopyVars; onError?: (e: unknown) => boolean | void } = {}) => {
      setBusy(true);
      try {
        const r = await fn();
        if (o.success) toast(typeof o.success === "function" ? o.success(r) : o.success);
        return r;
      } catch (e) {
        const handled = o.onError?.(e);
        if (!handled) showError(e, o.errorContext, o.vars);
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [toast, showError],
  );
  return { run, busy };
}

/** Re-renders every `ms` (for countdowns); returns server-aligned now. */
export function useNow(ms = 30000): number {
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    const t = setInterval(() => setNow(serverNow()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Reads a query-string parameter once on mount (avoids useSearchParams Suspense requirements). */
export function useQueryParam(name: string): string | null {
  const [v, setV] = useState<string | null>(null);
  useEffect(() => {
    setV(new URLSearchParams(window.location.search).get(name));
  }, [name]);
  return v;
}
