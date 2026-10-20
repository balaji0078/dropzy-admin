"use client";

import type { ReactNode } from "react";

export interface TimelineItem {
  key: string;
  title: ReactNode;
  /** Secondary line (timestamp, actor, reason …). */
  subtitle?: ReactNode;
  /** Extra content under the subtitle. */
  detail?: ReactNode;
  /** Completed steps render green; pending steps grey. Defaults to true. */
  completed?: boolean;
  /** Optional highlight for warnings/rejections. */
  tone?: "default" | "warning" | "danger";
}

/**
 * Vertical numbered timeline (extracted from the parcels ParcelDetailModal "Delivery Timeline").
 * Used by the legacy parcels page and the core shipment detail (transitions / custody).
 */
export default function Timeline({ items, emptyMessage = "No events yet" }: { items: TimelineItem[]; emptyMessage?: string }) {
  if (!items.length) return <p className="text-ink-soft text-[13px]">{emptyMessage}</p>;
  return (
    <ol className="relative" aria-label="Timeline">
      {items.map((item, index) => {
        const completed = item.completed !== false;
        const color = item.tone === "danger" ? "var(--dz-danger)" : item.tone === "warning" ? "var(--dz-warning)" : "var(--dz-success)";
        return (
          <li key={item.key} className="flex gap-4 mb-4 last:mb-0">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: completed ? color : "var(--dz-surface-alt)",
                  color: completed ? "var(--dz-bg)" : "var(--dz-ink-faint)",
                  border: completed ? "none" : "1px solid var(--dz-line-strong)",
                }}
                aria-hidden
              >
                {index + 1}
              </div>
              {index < items.length - 1 && (
                <div className="w-0.5 flex-1 min-h-[2rem]" style={{ backgroundColor: completed ? color : "var(--dz-line)", opacity: completed ? 0.55 : 1 }} />
              )}
            </div>
            <div className="flex-1 pt-1 pb-1">
              <p className="font-medium text-ink text-[13px]">{item.title}</p>
              {item.subtitle && <p className="text-[12px] text-ink-soft">{item.subtitle}</p>}
              {item.detail && <div className="mt-1 text-[12px] text-ink-soft">{item.detail}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
