import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-lg",
        "bg-gray-300 dark:bg-gray-700",
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-white/50 before:to-transparent",
        "dark:before:via-gray-500/50",
        "isolate",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
