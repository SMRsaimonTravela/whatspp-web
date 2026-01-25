type FilterType = "string" | "number" | "select" | "daterange";

type FilterValueOption = {
    label: string;
    value: string | number;
};

type BaseFilter = {
    label: string;
    placeholder: string;
    type: FilterType;
};

type StringFilter = BaseFilter & {
    type: "string";
};

type NumberFilter = BaseFilter & {
    type: "number";
};

type DateRangeFilter = BaseFilter & {
    type: "daterange";
};

type MultiSelectFilter = BaseFilter & {
    type: "multiselect";
};
type RadioFilter = BaseFilter & {
    type: "radio";
};


type SelectFilter = BaseFilter & {
    type: "select";
} & (
    | {
    values: FilterValueOption[];
    data?: never;
    resource?: never;
}
    | {
    data: "internal" | "external";
    resource: string;
    values?: never;
}
    );

export type ICommonFilters = Record<string, StringFilter | NumberFilter | DateRangeFilter | SelectFilter | MultiSelectFilter | RadioFilter>;


export type IBookingFilters = {
    search: StringFilter;
    paymentStatus: SelectFilter;
    created_at: DateRangeFilter;
    hostId: NumberFilter;
    userId: SelectFilter;
    hostName: StringFilter;
    hostPhone: StringFilter;
    sort_by: SelectFilter;
    sort_order: SelectFilter;
};