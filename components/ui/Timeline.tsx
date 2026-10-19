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
  if (!items.length) return <p className="text-gray-500 text-[13px]">{emptyMessage}</p>;
  return (
    <ol className="relative" aria-label="Timeline">
      {items.map((item, index) => {
        const completed = item.completed !== false;
        const color = item.tone === "danger" ? "#DC2626" : item.tone === "warning" ? "#D97706" : "#34C759";
        return (
          <li key={item.key} className="flex gap-4 mb-4 last:mb-0">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{
                  backgroundColor: completed ? color : "rgba(0,0,0,0.08)",
                  color: completed ? "white" : "rgba(0,0,0,0.4)",
                }}
                aria-hidden
              >
                {index + 1}
              </div>
              {index < items.length - 1 && (
                <div className="w-0.5 flex-1 min-h-[2rem]" style={{ backgroundColor: completed ? color : "rgba(0,0,0,0.08)" }} />
              )}
            </div>
            <div className="flex-1 pt-1 pb-1">
              <p className="font-medium text-gray-900 text-[13px]">{item.title}</p>
              {item.subtitle && <p className="text-[12px] text-gray-500">{item.subtitle}</p>}
              {item.detail && <div className="mt-1 text-[12px] text-gray-600">{item.detail}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
