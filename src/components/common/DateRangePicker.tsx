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
  onChange,
  className = "mx-auto w-60",
}: {
  label?: string;
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
}) {
  const [date, setDate] = React.useState<DateRange | undefined>(value)

  // Sync local state with value prop only when value changes
  React.useEffect(() => {
    setDate(value)
  }, [value])

  return (
    <Field className={className}>
      <FieldLabel htmlFor="date-picker-range">{label}</FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" id="date-picker-range" className="justify-start px-2.5 font-normal">
            <CalendarIcon data-icon="inline-start" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={range => {
              setDate(range)
              if (onChange) onChange(range)
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}
