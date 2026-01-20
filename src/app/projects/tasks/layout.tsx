"use client"

import { useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

const tabs = [
    { value: "list", label: "List", href: "/projects/tasks/list" },
    { value: "kanban", label: "Kanban", href: "/projects/tasks/kanban" },
    { value: "timeline", label: "Timeline", href: "/projects/tasks/timeline" },
]

export default function TasksLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const activeTab = (tabs.find((tab) => pathname?.includes(tab.value)) ?? tabs[0]) as (typeof tabs)[number]

    const handleTabClick =
        (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault()
            if (pathname === href) {
                return
            }

            startTransition(() => router.push(href))
        }

    return (
        <div className="flex flex-1 flex-col gap-6 p-6 md:p-10 w-full bg-slate-50 min-h-screen">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-light tracking-tight text-foreground">Tasks</h1>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 px-5 py-2">
                                Add integration
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Integration 1</DropdownMenuItem>
                            <DropdownMenuItem>Integration 2</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center justify-center">
                    <Tabs value={activeTab.value} className="bg-gray-200 rounded-full px-1 py-0.5 shadow-sm">
                        <TabsList className="grid grid-cols-3 gap-1 bg-gray-200 rounded-full p-0.5">
                            {tabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="rounded-full py-1.5 px-5 text-sm font-medium transition-all duration-200 ease-in-out"
                                    asChild
                                >
                                    <Link href={tab.href} onClick={handleTabClick(tab.href)} className="w-full">
                                        {tab.label}
                                    </Link>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                    {isPending && (
                        <span className="ml-4 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                            Loading
                        </span>
                    )}
                </div>
            </div>

            {children}
        </div>
    )
}

