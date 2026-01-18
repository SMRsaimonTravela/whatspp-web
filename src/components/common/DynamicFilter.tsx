import React, { useState } from "react";
import { APIFilters, FilterDefinition, mapAPIFiltersToDefinitions } from "../../types/common";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface DynamicFilterProps {
  filters: APIFilters;
  values: Record<string, string | number | boolean | { from: string; to: string }>;
  onChange: (values: Record<string, string | number | boolean | { from: string; to: string }>) => void;
}

const DynamicFilter: React.FC<DynamicFilterProps> = ({ filters, values, onChange }) => {
  const filterDefs: FilterDefinition[] = mapAPIFiltersToDefinitions(filters);
  // Track open dropdowns by filter name
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleChange = (name: string, value: any) => {
    onChange({ ...values, [name]: value });
  };

  return (
    <div className="flex flex-wrap gap-4 mb-4">
      {filterDefs.map((filter) => {
        if (filter.type === "select" && filter.options) {
          const selected = filter.options.find(opt => opt.value === values[filter.name]);
          return (
            <div key={filter.name} className="flex flex-col min-w-[180px] relative">
              <label className="text-xs font-medium mb-1">{filter.label}</label>
              <button
                type="button"
                className="dropdown-toggle px-2 py-1 border rounded bg-white text-left flex justify-between items-center"
                onClick={() => setOpenDropdown(openDropdown === filter.name ? null : filter.name)}
              >
                <span>{selected ? selected.label : filter.placeholder || "Select"}</span>
                <span className="ml-2">▼</span>
              </button>
              <Dropdown isOpen={openDropdown === filter.name} onClose={() => setOpenDropdown(null)}>
                <DropdownItem onClick={() => { handleChange(filter.name, ""); setOpenDropdown(null); }}>
                  All
                </DropdownItem>
                {filter.options.map(opt => (
                  <DropdownItem
                    key={opt.value}
                    onClick={() => { handleChange(filter.name, opt.value); setOpenDropdown(null); }}
                  >
                    {opt.label}
                  </DropdownItem>
                ))}
              </Dropdown>
            </div>
          );
        }
        if (filter.type === "text") {
          return (
            <div key={filter.name} className="flex flex-col min-w-[180px]">
              <label className="text-xs font-medium mb-1">{filter.label}</label>
              <input
                className="px-2 py-1 border rounded bg-white"
                type="text"
                value={values[filter.name] ?? ""}
                onChange={(e) => handleChange(filter.name, e.target.value)}
                placeholder={filter.placeholder}
              />
            </div>
          );
        }
        if (filter.type === "daterange") {
          const val = values[filter.name] as { from?: string; to?: string } || {};
          return (
            <div key={filter.name} className="flex flex-col min-w-[220px]">
              <label className="text-xs font-medium mb-1">{filter.label}</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="px-2 py-1 border rounded bg-white"
                  value={val.from || ""}
                  onChange={e => handleChange(filter.name, { ...val, from: e.target.value })}
                  placeholder="From"
                />
                <input
                  type="date"
                  className="px-2 py-1 border rounded bg-white"
                  value={val.to || ""}
                  onChange={e => handleChange(filter.name, { ...val, to: e.target.value })}
                  placeholder="To"
                />
              </div>
            </div>
          );
        }
        // Add more types as needed
        return null;
      })}
    </div>
  );
};

export default DynamicFilter;
