import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // File type variants - matching the exact styling you love
        contrato: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        oferta: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        camara: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        "respuesta-abogado": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
        "respuesta-usuario": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
        firma: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        devuelto: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        otrosi: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        // Status variants
        pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-600",
        aprobado: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-600",
        rechazado: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
