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
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === tab.value
              ? "bg-brand-600 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "ml-2 px-1.5 py-0.5 rounded-full text-xs",
                activeTab === tab.value
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600"
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
