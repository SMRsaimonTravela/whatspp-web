import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { Field, FieldLabel } from "../ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import { format, startOfDay } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { BlockedDate } from "../../types/BlockedDate";
import { useMemo } from "react";

export function DateRangePicker({
  label = "Date Picker Range",
  value,
  onSelect,
  className = "mx-auto w-60",
  blockedDates = [],
  checkoutOnlyDates = [],
  loading = false,
  error = null,
  bookingMode = false,
  ...props
}: {
   label?: string;
   value?: DateRange;
   onSelect?: (range: DateRange | undefined) => void;
   className?: string;
   blockedDates?: BlockedDate[];
   checkoutOnlyDates?: string[];
   loading?: boolean;
   error?: string | null;
   bookingMode?: boolean;
} & Omit<React.ComponentPropsWithoutRef<"div">, 'onSelect'>) {
  const DEBUG = false // set to true to enable console logs for checkout-only disabled logic
  // Only apply blocking logic if bookingMode is true
  const blockedSet = useMemo(() => bookingMode && blockedDates.length ? new Set(blockedDates.map(d => d.date)) : undefined, [blockedDates, bookingMode]);
  const checkoutOnlySet = useMemo(() => bookingMode && checkoutOnlyDates.length ? new Set(checkoutOnlyDates) : undefined, [checkoutOnlyDates, bookingMode]);

  // Disabled days for react-day-picker
  const today = startOfDay(new Date()); // start of today to avoid time-of-day issues
  const disabledDays = bookingMode
    ? [
        ...(blockedSet ? [(date: Date) => blockedSet.has(format(date, "yyyy-MM-dd"))] : []),
        (date: Date) => date < today, // block past dates
        ...(checkoutOnlySet ? [
          (date: Date) => {
            // disable checkout-only dates when starting a new selection (i.e., selecting a check-in)
            const key = format(date, "yyyy-MM-dd")
            const isStartingNewSelection = !value?.from || (value?.from && !value?.to)
            if (DEBUG) console.log("checkoutOnly predicate", { key, isStartingNewSelection, checkoutOnlyHas: checkoutOnlySet.has(key) })
            return isStartingNewSelection && checkoutOnlySet.has(key)
          }
        ] : []),
      ]
    : []; // no disabled days in filter mode

  // Modifiers for checkout-only and past dates
  const modifiers = bookingMode
    ? {
        checkoutOnly: checkoutOnlySet ? (date: Date) => checkoutOnlySet.has(format(date, "yyyy-MM-dd")) : undefined,
        blocked: blockedSet ? (date: Date) => blockedSet.has(format(date, "yyyy-MM-dd")) : undefined,
        past: (date: Date) => date < today,
      }
    : {
        past: (date: Date) => date < today,
      };

  // Add custom className for past dates (low opacity)
  // In Calendar.tsx, ensure 'past' modifier is styled with low opacity

  // Custom onSelect handler
  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      if (onSelect) onSelect(undefined);
      return;
    }
    const { from, to } = range;
    if (bookingMode) {
      // Determine the actual clicked date: if 'to' is present it's the clicked date when finishing a range, otherwise 'from' is the clicked date when starting.
      const clickedDate = to ?? from
      const clickedKey = clickedDate ? format(clickedDate, "yyyy-MM-dd") : null
      const isStartingNewSelection = !value?.from || (value?.from && !value?.to)
      if (clickedKey && isStartingNewSelection && checkoutOnlySet && checkoutOnlySet.has(clickedKey)) {
        // Prevent selecting a checkout-only date as check-in
        return
      }
      // If both are set, next click resets and sets new check-in
      if (value?.from && value?.to) {
        if (from && (!to || from.getTime() === to?.getTime())) {
          // Reset and set new check-in
          if (blockedSet && blockedSet.has(format(from, "yyyy-MM-dd"))) return;
          if (checkoutOnlySet && checkoutOnlySet.has(format(from, "yyyy-MM-dd"))) return;
          if (onSelect) onSelect({ from, to: undefined });
          return;
        }
      }
      // Prevent check-in on blocked/checkout-only
      if (!to) {
        // Selecting check-in
        if (from && blockedSet && blockedSet.has(format(from, "yyyy-MM-dd"))) return;
        if (from && checkoutOnlySet && checkoutOnlySet.has(format(from, "yyyy-MM-dd"))) return;
        if (from && from < today) return;
        if (onSelect) onSelect({ from, to: undefined });
        return;
      }
      // Selecting checkout
      if (from && blockedSet && blockedSet.has(format(from, "yyyy-MM-dd"))) return;
      if (to && blockedSet && blockedSet.has(format(to, "yyyy-MM-dd"))) return;
      if (to && to < today) return;
      // Allow checkout-only only as checkout
      if (to && checkoutOnlySet && checkoutOnlySet.has(format(to, "yyyy-MM-dd"))) {
        if (onSelect) onSelect({ from, to });
        return;
      }
      // Prevent checkout-only as check-in
      if (from && checkoutOnlySet && checkoutOnlySet.has(format(from, "yyyy-MM-dd"))) return;
      if (onSelect) onSelect(range);
      return;
    } else {
      // Filter mode: allow all dates
      if (onSelect) onSelect(range);
    }
  };

  return (
    <Field className={className} {...props}>
      <FieldLabel htmlFor="date-picker-range">{label}</FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" id="date-picker-range" className="justify-start px-2.5 font-normal">
            <CalendarIcon data-icon="inline-start" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {loading && <div className="p-2 text-sm text-gray-500">Loading blocked dates...</div>}
          {error && <div className="p-2 text-sm text-red-500">{error}</div>}
          <Calendar
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={disabledDays}
            modifiers={modifiers}
          />
          <div className="flex items-center justify-between p-2">
            {bookingMode && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-100 border border-red-400" />
                  <span>Blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300" />
                  <span>Checkout-only</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-200 opacity-40" />
                  <span>Past</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-600" />
                  <span>Today</span>
                </div>
              </div>
            )}
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSelect && onSelect(undefined)}
              >
                Reset
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  )
}
