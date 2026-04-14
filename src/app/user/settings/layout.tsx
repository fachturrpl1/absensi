import { UserSettingsSidebar } from "@/components/profile&image/user-settings-sidebar"
import { CardContent } from "@/components/ui/card"
import { User, Settings, CreditCard } from "lucide-react"

const sidebarNavItems = [
    {
        title: "Profile Settings",
        href: "/user/settings/general",
        icon: <User className="h-4 w-4" />,
    },
    {
        title: "Account Settings",
        href: "/user/settings/account",
        icon: <Settings className="h-4 w-4" />,
    },
    {
        title: "Billing",
        href: "/user/settings/billing",
        icon: <CreditCard className="h-4 w-4" />,
    },
    {
        title: "Appearance",
        href: "/user/settings/appearance",
        icon: <Settings className="h-4 w-4" />,
    },
]

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">Account Settings</h1>
            <div className="flex flex-col gap-4 md:flex-row">
                <aside className="w-full md:w-52 shrink-0">
                    <div className="border rounded-sm">
                        <CardContent className="p-1">
                            <UserSettingsSidebar items={sidebarNavItems} />
                        </CardContent>
                    </div>
                </aside>
                <main className="flex-1 min-w-0">
                    <div className="border rounded-sm">
                        <CardContent className="p-6">
                            {children}
                        </CardContent>
                    </div>
                </main>
            </div>
        </div>
    )
}