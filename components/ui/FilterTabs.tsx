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
    <div className="inline-flex gap-1 p-1 rounded-lg bg-gray-100">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-all duration-200",
            activeTab === tab.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold",
              activeTab === tab.value ? "bg-red-50 text-red-600" : "bg-gray-200 text-gray-500"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
