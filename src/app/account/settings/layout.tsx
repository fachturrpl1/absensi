// import { Separator } from "@/components/ui/separator"
import { UserSettingsSidebar } from "@/components/settings/UserSettingsSidebar"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    User,
    Settings,
    CreditCard,
} from "lucide-react"


const sidebarNavItems = [
    {
        title: "Profile Settings",
        href: "/account/settings", // Default active
        icon: <User className="h-4 w-4" />,
    },
    {
        title: "Account Settings",
        href: "/account/settings/account",
        icon: <Settings className="h-4 w-4" />,
    },
    {
        title: "Billing",
        href: "/account/settings/billing",
        icon: <CreditCard className="h-4 w-4" />,
    },
]

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="hidden space-y-6 px-6 pt-1 pb-16 md:block">
            <div className="flex flex-col space-y-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your account settings and set e-mail preferences.
                    </p>
                </div>
            </div>
            {/* <Separator className="my-4" /> */}
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-8 lg:space-y-0">
                <aside className="lg:w-1/4 xl:w-1/5">
                    <Card className="h-fit">
                        <CardContent className="p-1">
                            <UserSettingsSidebar items={sidebarNavItems} />
                        </CardContent>
                    </Card>
                </aside>
                <main className="flex-1">
                    <Card className="h-full">
                        <CardContent className="p-6">
                            {children}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}
