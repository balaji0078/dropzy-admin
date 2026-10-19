// Client-side CSV export helpers (extracted from app/settlements/page.tsx so the legacy and core pages share them).

/** Triggers a browser download of a Blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Builds CSV text from a header row and data rows (values are quoted when needed). */
export function toCsv(header: string[], rows: unknown[][]): string {
  return [header.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))].join("\n");
}

/** Exports rows as a CSV file download. */
export function downloadCsv(filename: string, header: string[], rows: unknown[][]) {
  downloadBlob(new Blob([toCsv(header, rows)], { type: "text/csv" }), filename);
}
