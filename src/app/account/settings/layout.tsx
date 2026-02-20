import { Metadata } from "next"


// import { Separator } from "@/components/ui/separator"
import { UserSettingsSidebar } from "@/components/settings/UserSettingsSidebar"
import {
    Card,
    CardContent,
} from "@/components/ui/card"

export const metadata: Metadata = {
    title: "Forms",
    description: "Advanced form example using react-hook-form and Zod.",
}

const sidebarNavItems = [
    {
        title: "Profile",
        href: "/account/settings", // Default active
    },
    {
        title: "Account",
        href: "/account/settings/account",
    },
    {
        title: "Billing",
        href: "/account/settings/billing",
    },
    {
        title: "Appearance",
        href: "/account/settings/appearance",
    },
    {
        title: "Notifications",
        href: "/account/settings/notifications",
    },
    {
        title: "Display",
        href: "/account/settings/display",
    },
]

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="hidden space-y-6 px-6 pt-1 pb-16 md:block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            {/* <Separator className="my-4" /> */}
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-8 lg:space-y-0">
                <aside className="lg:w-1/4 xl:w-1/5">
                    <Card>
                        <CardContent className="p-1">
                            <UserSettingsSidebar items={sidebarNavItems} />
                        </CardContent>
                    </Card>
                </aside>
                <div className="flex-1">{children}</div>
            </div>
        </div>
    )
}
