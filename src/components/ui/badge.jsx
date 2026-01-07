import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gray-900 text-white hover:bg-gray-800",
        secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
        coral: "border-transparent bg-coral-100 text-coral-700",
        teal: "border-transparent bg-teal-100 text-teal-700",
        violet: "border-transparent bg-violet-100 text-violet-700",
        outline: "text-gray-900 border-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
