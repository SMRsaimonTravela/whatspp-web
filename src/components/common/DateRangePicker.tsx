import * as React from "react"
import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { Field, FieldLabel } from "../ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import {  format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

export function DateRangePicker({
  label = "Date Picker Range",
  value,
  onSelect,
  className = "mx-auto w-60",
}: {
  label?: string;
  value?: DateRange;
  onSelect?: (range: DateRange | undefined) => void;
  className?: string;
}) {
  return (
    <Field className={className}>
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
          <Calendar
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={range => {
              if (value && value.from && value.to && range) {
                if (range.from !== value.from) {
                  // Clicked before current from, set new start
                  onSelect({ from: range.from, to: undefined });
                } else if (range.to && range.to > value.to) {
                  // Clicked after current to, set new start
                  onSelect({ from: range.to, to: undefined });
                } else {
                  // Clicked between or on to, set end
                  onSelect(range);
                }
              } else {
                onSelect(range);
              }
            }}
            numberOfMonths={2}

          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}
