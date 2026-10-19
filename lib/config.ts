// Build-time configuration (NEXT_PUBLIC_* values are inlined by Next.js at build time).

/** Core (PRD v2.0) mode. Off by default: the portal then behaves exactly as before. */
export const CORE_API = process.env.NEXT_PUBLIC_CORE_API === "true";

/** API base URL including the /api/v1 prefix. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://18.60.129.43:8080/api/v1").replace(/\/+$/, "");

/** Origin of the API (signed evidence URLs and checkout paths are relative to it). */
export const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return "";
  }
})();
