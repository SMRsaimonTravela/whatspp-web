import { ICommonFilters} from "./filters";

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
  type: 'select' | 'text' | 'daterange' | 'number' | 'multiselect' | 'radio' | string;
  options?: FilterOption[];
  values?: FilterOption[]; // for radio, select, multiselect
  placeholder?: string;
  required?: boolean;
  data?: 'external' | string;
  resource?: string;
  // Allow any extra properties for future-proofing
  [key: string]: any;
}



export function mapAPIFiltersToDefinitions(apiFilters: ICommonFilters): FilterDefinition[] {
  return Object.entries(apiFilters).map(([name, filter]) => {
    const type: FilterDefinition['type'] = filter.type === 'string' ? 'text' : filter.type;
    const definition: FilterDefinition = {
      name,
      label: filter.label,
      type,
      placeholder: filter.placeholder,
    };
    if ('values' in filter && Array.isArray(filter.values)) {
      definition.options = filter.values;
    }
    if ('data' in filter && filter.data) {
      definition.data = filter.data;
    }
    if ('resource' in filter && filter.resource) {
      definition.resource = filter.resource;
    }
    return definition;
  });
}

