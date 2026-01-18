export interface IPagination {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
}

export interface FilterDefinition {
  name: string;
  label: string;
  type: 'select' | 'text' | 'daterange' | string;
  options?: FilterOption[];
  placeholder?: string;
}

export type APIFilterValue = FilterOption;

export type APIFilter = {
  label: string;
  placeholder?: string;
  type: 'string' | 'select' | 'daterange' | string;
  values?: APIFilterValue[];
};

export type APIFilters = Record<string, APIFilter>;

export function mapAPIFiltersToDefinitions(apiFilters: APIFilters): FilterDefinition[] {
  return Object.entries(apiFilters).map(([name, filter]) => {
    const type: FilterDefinition['type'] = filter.type === 'string' ? 'text' : filter.type;
    return {
      name,
      label: filter.label,
      type,
      options: filter.values,
      placeholder: filter.placeholder,
    };
  });
}

export function normalizePagination(pagination: IPagination) {
  return {
    page: pagination.current_page,
    totalPages: pagination.last_page,
    total: pagination.total,
    limit: pagination.per_page,
  };
}
