"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, X, Search, Check } from "lucide-react";

interface SearchableDropdownProps {
  options: { label: string; value: string; sublabel?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  allowClear?: boolean;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  className = "",
  allowClear = true,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    if (!search) return options.slice(0, 50);
    const q = search.toLowerCase();
    return options
      .filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          opt.value.toLowerCase().includes(q) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [options, search]);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] transition-all duration-200"
        style={{
          background: "rgba(255, 255, 255, 0.8)",
          border: isOpen ? "1px solid rgba(216, 44, 44, 0.3)" : "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow: isOpen ? "0 0 0 3px rgba(216, 44, 44, 0.08)" : "none",
        }}
      >
        <span className={selectedOption ? "text-gray-900 font-medium" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {allowClear && value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setSearch("");
              }}
              className="p-0.5 hover:bg-black/[0.04] rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1.5 w-full overflow-hidden animate-scale-in"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "14px",
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.5) inset",
          }}
        >
          <div className="p-2" style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.05)" }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-8 pr-3 py-1.5 text-[13px] rounded-lg focus:outline-none"
                style={{
                  background: "rgba(0, 0, 0, 0.03)",
                  border: "1px solid rgba(0, 0, 0, 0.04)",
                }}
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-[13px] text-gray-400 text-center">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors duration-150 flex items-center justify-between ${
                    opt.value === value
                      ? "bg-red-50 text-[#D82C2C]"
                      : "text-gray-700 hover:bg-black/[0.03]"
                  }`}
                >
                  <div>
                    <div className={opt.value === value ? "font-medium" : ""}>{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-[11px] text-gray-400 mt-0.5">{opt.sublabel}</div>
                    )}
                  </div>
                  {opt.value === value && <Check className="w-4 h-4 text-[#D82C2C]" />}
                </button>
              ))
            )}
            {filteredOptions.length === 50 && search === "" && (
              <div className="px-3 py-2 text-[11px] text-gray-400 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                Type to search more results...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
