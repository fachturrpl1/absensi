"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { useMounted } from "@/hooks/use-mounted"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  const mounted = useMounted()
  
  if (!mounted) {
    return <div data-slot="collapsible" suppressHydrationWarning />
  }
  
  return <CollapsiblePrimitive.Root data-slot="collapsible" suppressHydrationWarning {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      suppressHydrationWarning
      {...props}
    />
  )
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      suppressHydrationWarning
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
