"use client";

import { cn } from "@/lib/utils";

interface FilterTab {
  label: string;
  value: string;
  count?: number;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export default function FilterTabs({ tabs, activeTab, onChange, ariaLabel = "Filter" }: FilterTabsProps) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-surface-alt border border-line" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={activeTab === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70",
            activeTab === tab.value
              ? "bg-surface text-gold ring-1 ring-gold/40 shadow-[inset_0_-2px_0_#F5C451]"
              : "text-ink-soft hover:text-ink hover:bg-surface-raised"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
              activeTab === tab.value ? "bg-gold/15 text-gold" : "bg-line text-ink-soft"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
