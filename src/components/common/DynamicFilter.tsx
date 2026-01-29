import React, { useEffect } from "react";
import { FilterDefinition, mapAPIFiltersToDefinitions } from "../../types/common";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { DateRangePicker } from "./DateRangePicker";
import { MultiSelect } from "./MultiSelect";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { adminService } from "../../services/adminService";
import { useQueries, UseQueryResult } from "@tanstack/react-query";
import { ICommonFilters } from "../../types/filters";

interface DynamicFilterProps {
  filters: ICommonFilters;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}

// Define a type for external resource options
interface ExternalOption {
  id: string | number;
  name?: string;
  label?: string;
  email?: string;
  value?: string | number;
}

// Define a type for external resource fetchers
type ExternalResourceFetcher<T> = (params?: Record<string, unknown>) => Promise<{ data: T[] }>;

// Map resource names to their fetchers with proper types
const externalResourceMap: Record<string, ExternalResourceFetcher<{ id: string; name: string; email: string }>> = {
  users: adminService.getHostUsers as ExternalResourceFetcher<{ id: string; name: string; email: string }>,
  // Add more resources as needed
};

const DEFAULT_GRID =
    "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-4 items-end";

const getDefaultValues = (defs: FilterDefinition[]): Record<string, unknown> => {
  const defaults: Record<string, unknown> = {};
  defs.forEach((def) => {
    if (def.type === "daterange") {
      defaults[def.name] = { from: "", to: "" };
    } else if (def.type === "multiselect") {
      defaults[def.name] = [];
    } else if (def.type === "number") {
      defaults[def.name] = "";
    } else {
      defaults[def.name] = "";
    }
  });
  return defaults;
};

const DynamicFilter: React.FC<DynamicFilterProps> = ({ filters, values, onChange }) => {
  const filterDefs: FilterDefinition[] = mapAPIFiltersToDefinitions(filters);

  // Local state for filter values
  const [localValues, setLocalValues] = React.useState<Record<string, unknown>>(() => ({
    ...getDefaultValues(filterDefs),
    ...values,
  }));

  useEffect(() => {
    setLocalValues((prev) => ({ ...prev, ...values }));
  }, [values]);

  // Prepare external queries for select/multiselect with data: 'external'
  const externalFilterDefs = filterDefs.filter(
      (filter) =>
          (filter.type === "select" || filter.type === "multiselect") &&
          filter.data === "external" &&
          filter.resource &&
          externalResourceMap[filter.resource as keyof typeof externalResourceMap]
  );

  const externalQueries = useQueries({
    queries: externalFilterDefs.map((filter) => ({
      queryKey: ["external-options", filter.resource],
      queryFn: () =>
          externalResourceMap[filter.resource as keyof typeof externalResourceMap](),
    })),
  });

  // Map external options and loading state by filter name
  const externalOptions: Record<string, ExternalOption[]> = {};
  const loadingExternal: Record<string, boolean> = {};

  externalFilterDefs.forEach((filter, idx) => {
    const query = externalQueries[idx] as UseQueryResult<{ data: ExternalOption[] }>;
    const rawOptions = query.data?.data || [];
    externalOptions[filter.name] = rawOptions;
    loadingExternal[filter.name] = query.isLoading;
  });

  const handleChange = (name: string, value: unknown) => {
    setLocalValues((prev) => ({ ...prev, [name]: value }));
  };

  // On submit, pass all filter values to parent for API call
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onChange(localValues);
  };

  const handleClear = () => {
    const cleared = getDefaultValues(filterDefs);
    setLocalValues(cleared);
    onChange(cleared);
  };

  return (
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className={DEFAULT_GRID} style={{ alignItems: 'end' }}>
          {filterDefs.map((filter) => {
            // Multiselect
            if (filter.type === "multiselect") {
              let options = filter.options || [];
              if (
                  filter.data === "external" &&
                  filter.resource &&
                  externalOptions[filter.name]
              ) {
                options = externalOptions[filter.name].map((item: ExternalOption) => ({
                  label: item.name || item.email || item.label || String(item.id) || 'Unknown',
                  value: item.id ?? item.value ?? '',
                }));
              }
              return (
                  <div key={filter.name} className="flex flex-col gap-2 min-w-[220px] w-full">
                    <label className="text-sm font-medium">{filter.label}</label>
                    <MultiSelect
                        options={options}
                        value={(localValues[filter.name] as (string | number | boolean)[]) || []}
                        onChange={(val) => handleChange(filter.name, val)}
                        placeholder={filter.placeholder}
                        className="min-w-[220px] w-full"
                    />
                  </div>
              );
            }

            // Radio
            if (filter.type === "radio" && Array.isArray(filter.options)) {
              return (
                  <div key={filter.name} className="flex flex-col gap-2 min-w-[220px] w-full">
                    <label className="text-sm font-medium">{filter.label}</label>
                    <RadioGroup
                        value={(localValues[filter.name] as string) || ""}
                        onValueChange={(val) => handleChange(filter.name, val)}
                        className="flex gap-4"
                    >
                      {filter.options.map((opt) => (
                          <div key={String(opt.value)} className="flex items-center gap-2">
                            <RadioGroupItem value={String(opt.value)} id={`${filter.name}-${opt.value}`} />
                            <label htmlFor={`${filter.name}-${opt.value}`}>{opt.label}</label>
                          </div>
                      ))}
                    </RadioGroup>
                  </div>
              );
            }

            // Select
            if (
                filter.type === "select" &&
                (filter.options || (filter.data === "external" && filter.resource))
            ) {
              let options = filter.options || [];
              let isExternal = false;
              let externalError = false;
              if (
                  filter.data === "external" &&
                  filter.resource &&
                  externalOptions[filter.name]
              ) {
                isExternal = true;
                const queryIdx = externalFilterDefs.findIndex(f => f.name === filter.name);
                const query = externalQueries[queryIdx] as UseQueryResult<{ data: ExternalOption[] }>;
                externalError = !!query.error;
                options = externalOptions[filter.name].map((item: ExternalOption) => ({
                  label: item.name || item.email || item.label || String(item.id) || 'Unknown',
                  value: item.id ?? item.value ?? '',
                }));
              }
              return (
                  <div key={filter.name} className="flex flex-col gap-2 min-w-[220px] w-full">
                    <label className="text-sm font-medium">{filter.label}</label>
                    <Select
                        value={(localValues[filter.name] as string) || ""}
                        onValueChange={(val) => handleChange(filter.name, val)}
                    >
                      <SelectTrigger className="min-w-[220px] w-full">
                        <SelectValue placeholder={filter.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((opt) => (
                            <SelectItem key={String(opt.value)} value={String(opt.value)}>
                              {opt.label}
                            </SelectItem>
                        ))}
                        {loadingExternal[filter.name] && (
                            <SelectItem value="loading" disabled>
                              Loading...
                            </SelectItem>
                        )}
                        {isExternal && !loadingExternal[filter.name] && !externalError && options.length === 0 && (
                            <SelectItem value="no-users" disabled>
                              No users found
                            </SelectItem>
                        )}
                        {isExternal && externalError && (
                            <SelectItem value="error" disabled>
                              Failed to load users
                            </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
              );
            }

            // Number
            if (filter.type === "number") {
              return (
                  <div key={filter.name} className="flex flex-col gap-2 min-w-[220px] w-full">
                    <label className="text-sm font-medium">{filter.label}</label>
                    <input
                        type="number"
                        value={(localValues[filter.name] as string) || ""}
                        onChange={(e) =>
                            handleChange(
                                filter.name,
                                e.target.value === "" ? "" : Number(e.target.value)
                            )
                        }
                        placeholder={filter.placeholder}
                        className="border rounded px-3 py-2 min-w-[220px] w-full"
                    />
                  </div>
              );
            }

            // Text
            if (filter.type === "text" || filter.type === "string") {
              return (
                  <div key={filter.name} className="flex flex-col gap-2 min-w-[220px] w-full">
                    <label className="text-sm font-medium">{filter.label}</label>
                    <input
                        type="text"
                        value={(localValues[filter.name] as string) || ""}
                        onChange={(e) => handleChange(filter.name, e.target.value)}
                        placeholder={filter.placeholder}
                        className="border rounded px-3 py-2 min-w-[220px] w-full"
                    />
                  </div>
              );
            }

            // Daterange
            if (filter.type === "daterange") {
              const val =
                  (localValues[filter.name] as { from: string; to: string }) || {
                    from: "",
                    to: "",
                  };
              const pickerValue =
                  val.from && val.to
                      ? { from: new Date(val.from), to: new Date(val.to) }
                      : undefined;

              return (
                  <div key={filter.name} className="flex flex-col gap-2 min-w-[220px] w-full">
                    <DateRangePicker
                        value={pickerValue}
                        label={filter.label}
                        onChange={(range) => {
                          handleChange(filter.name, {
                            from: range?.from ? range.from.toISOString().slice(0, 10) : "",
                            to: range?.to ? range.to.toISOString().slice(0, 10) : "",
                          });
                        }}
                        className="min-w-[220px] w-full"
                    />
                  </div>
              );
            }

            return null;
          })}
        </div>

        <div className="flex gap-4 justify-end">
          <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Filter
          </button>
          <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      </form>
  );
};

export default DynamicFilter;
