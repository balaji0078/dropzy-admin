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
}

export default function FilterTabs({ tabs, activeTab, onChange }: FilterTabsProps) {
  return (
    <div
      className="inline-flex gap-1 p-1 rounded-xl"
      style={{ background: "rgba(0, 0, 0, 0.04)" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200",
            activeTab === tab.value
              ? "bg-white text-gray-900 shadow-apple-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                activeTab === tab.value
                  ? "bg-blue-50 text-blue-600"
                  : "bg-black/[0.04] text-gray-400"
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
