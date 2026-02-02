"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AuthorData {
    name: string
    initials: string
    color?: string
    avatarUrl?: string
}

interface AuditLogAuthorCellProps {
    author: AuthorData
    className?: string
    avatarClassName?: string
    showRing?: boolean
    showName?: boolean
}

export function AuditLogAuthorCell({ author, className, avatarClassName, showRing = true, showName = true }: AuditLogAuthorCellProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Avatar className={cn("h-8 w-8", showRing && "ring-1 ring-white", avatarClassName)}>
                {/* Changed to ring-1 for subtle outline as seen in some designs, or user can override. 
                    User mentioned "outline", usually ring-2 ring-white is for overlap. 
                    If single avatar on white bg, ring might be redundant unless it's for consistency.
                    Let's use ring-1 ring-gray-100 or ring-white depending on bg.
                    Given user mentioned "perbedaan", I will standardize.
                */}
                <AvatarFallback className={cn("text-xs text-white", author.color || "bg-gray-400")}>
                    {author.initials}
                </AvatarFallback>
            </Avatar>
            {showName && <span className="font-medium text-gray-900">{author.name}</span>}
        </div>
    )
}
