import React from "react"
import { IconCheck } from "@tabler/icons-react"
import { cn } from "../../lib/utils"

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => (
  <div
    ref={ref}
    role="checkbox"
    aria-checked={checked}
    tabIndex={0}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer transition-colors duration-200 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      checked && "bg-blue-600 border-blue-600 text-white",
      className
    )}
    onClick={() => onCheckedChange?.(!checked)}
    onKeyDown={(e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        onCheckedChange?.(!checked)
      }
    }}
    {...props}
  >
    {checked && (
      <IconCheck className="h-3 w-3 text-white" />
    )}
  </div>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
