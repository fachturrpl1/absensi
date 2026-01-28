import Link from "next/link"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReportCardProps {
    title: string
    description: string
    href: string
    icon?: React.ReactNode
    isPopular?: boolean
    isStarred?: boolean
    hideStar?: boolean
    className?: string
    target?: string
}

export function ReportCard({
    title,
    description,
    href,
    icon,
    isPopular,
    isStarred,
    hideStar,
    className,
    target
}: ReportCardProps) {
    return (
        <Link
            href={href}
            target={target}
            className={cn(
                "group relative flex flex-col rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-blue-400 hover:shadow-sm",
                isPopular && "min-h-[200px]",
                className
            )}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Illustration for Popular Reports */}
                    {isPopular && icon ? (
                        <div className="mb-2">
                            {icon}
                        </div>
                    ) : (
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {title}
                        </h3>
                    )}
                </div>

                {!hideStar && (
                    <button className="text-gray-300 hover:text-yellow-400 transition-colors">
                        <Star className={cn("h-4 w-4", isStarred && "fill-yellow-400 text-yellow-400")} />
                    </button>
                )}
            </div>

            {/* Title for Popular Reports (below icon) */}
            {isPopular && (
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                    {title}
                </h3>
            )}

            <p className="text-sm text-gray-500 line-clamp-3">
                {description}
            </p>
        </Link>
    )
}
