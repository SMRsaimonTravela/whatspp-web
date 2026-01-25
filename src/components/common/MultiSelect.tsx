import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";

interface Option {
  label: string;
  value: string | number | boolean;
}

interface MultiSelectProps {
  label?: string;
  options: Option[];
  value: (string | number | boolean)[];
  onChange: (value: (string | number | boolean)[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "min-w-[180px]",
}) => {
  const [open, setOpen] = React.useState(false);

  const handleToggle = (optionValue: string | number | boolean) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectedLabels = options.filter(opt => value.includes(opt.value)).map(opt => opt.label);

  return (
    <div className={className}>
      {label && <label className="text-xs font-medium mb-1 block">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="truncate text-left flex-1">
              {selectedLabels.length > 0 ? selectedLabels.join(", ") : <span className="text-gray-400">{placeholder}</span>}
            </span>
            <ChevronDown size={16} className="ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 flex flex-col gap-1">
          {options.map(opt => (
            <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-100">
              <Checkbox
                checked={value.includes(opt.value)}
                onCheckedChange={() => handleToggle(opt.value)}
                id={`multi-${opt.value}`}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
};
