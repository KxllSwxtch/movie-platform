"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-[28px] w-[52px] shrink-0 cursor-pointer items-center rounded-full border border-white/10 p-[3px] transition-all duration-200",
      "bg-[rgba(10,6,22,0.72)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.28)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C70F4F]/50 focus-visible:ring-offset-0",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-[#C70F4F]/50 data-[state=checked]:bg-[linear-gradient(90deg,#C70F4F_0%,#911782_58%,#0F66EB_100%)]",
      "data-[state=checked]:shadow-[0_0_16px_rgba(199,15,79,0.28),0_0_20px_rgba(15,102,235,0.14)]",
      "data-[state=unchecked]:border-[#4B3864]/80 data-[state=unchecked]:bg-[rgba(12,7,26,0.72)]",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-[20px] w-[20px] rounded-full transition-transform duration-200",
        "bg-[#E8DDE8] shadow-[0_2px_8px_rgba(0,0,0,0.45)]",
        "data-[state=checked]:translate-x-[24px] data-[state=unchecked]:translate-x-0",
        "data-[state=checked]:bg-white"
      )}
    />
  </SwitchPrimitives.Root>
))

Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }