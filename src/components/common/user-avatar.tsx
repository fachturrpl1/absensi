'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfilePhotoUrl } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    name: string;
    photoUrl?: string | null;
    userId?: string;
    className?: string;
    size?: number; // Tailwind size like h-8 w-8
}

function initialsFromName(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return (first + second).toUpperCase();
}

export function UserAvatar({ name, photoUrl: rawPhotoUrl, userId, className, size }: UserAvatarProps) {
    const photoUrl = useProfilePhotoUrl(rawPhotoUrl ?? undefined, userId);
    const sz = size ? `h-${size} w-${size}` : "h-8 w-8";

    return (
        <Avatar className={cn(sz, className)}>
            {photoUrl && <AvatarImage src={photoUrl} alt={name} className="object-cover" />}
            <AvatarFallback className="text-[10px] bg-gray-100 text-gray-700">
                {initialsFromName(name)}
            </AvatarFallback>
        </Avatar>
    );
}
