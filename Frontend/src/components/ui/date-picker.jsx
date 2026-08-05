import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import Button from "../Button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

export function DatePicker({ date, setDate, minDate, maxDate, className }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
            !date && "text-gray-500 dark:text-gray-400",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-700 dark:text-gray-300" />
          {date ? format(date, "PPP", { locale: es }) : <span>Elige una fecha</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50"
        align="start"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          locale={es}
          captionLayout="dropdown"

          /* Permitir hasta 50 años después del actual */
          endMonth={new Date(new Date().getFullYear() + 50, 11)}

          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}

          className="rounded-md border shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </PopoverContent>
    </Popover>
  )
}