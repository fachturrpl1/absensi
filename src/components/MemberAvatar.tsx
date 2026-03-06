"use client"

import React from "react"
import { User } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface MemberAvatarProps {
    src?: string | null
    name?: string
    className?: string
    fallbackClassName?: string
}

export function MemberAvatar({ src, name, className, fallbackClassName }: MemberAvatarProps) {
    return (
        <Avatar className={cn("w-8 h-8 rounded-full border border-gray-200 shrink-0", className)}>
            <AvatarImage
                src={src || undefined}
                alt={name || "Member"}
                className="object-cover"
            />
            <AvatarFallback className={cn("bg-gray-100", fallbackClassName)}>
                <User className="w-4 h-4 text-gray-500" />
            </AvatarFallback>
        </Avatar>
    )
}
