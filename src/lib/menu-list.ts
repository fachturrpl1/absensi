import {
  Tag,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  List,
  Building2,
  UserCheck,
  Group,
  Calendar,
  ClipboardCheck,
  ShieldCheck,
  Briefcase
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/",
          label: "Dashboard",
          icon: LayoutGrid,
          active: pathname === "/"
        }
      ]
    },

    {
      groupLabel: "GENERAL",
      menus: [
        {
          href: "/department",
          label: "Group",
          icon: Building2,
          active: pathname.includes("/department")
        },
        {
          href: "/position",
          label: "Position",
          icon: Briefcase,
          active: pathname.includes("/position")
        },
        {
          href: "/members",
          label: "Member",
          icon: UserCheck,
          active: pathname.includes("/members")
        },
        {
          href: "/attendance",
          label: "Attendance",
          icon: ClipboardCheck,
          active: pathname.includes("/attendance")
        },

      ]
    },
    {
      groupLabel: "MANAGEMENT",
      menus: [
        {
          href: "/schedule",
          label: "Schedule",
          icon: Calendar,
          active: pathname.includes("/schedule")
        },
        {
          href: "/role",
          label: "Role",
          icon: ShieldCheck,
          active: pathname.includes("/role")
        },
        {
          href: "/permission",
          label: "Permission",
          icon: List,
          active: pathname.includes("/permission")
        },
        {
          href: "/organization/settings",
          label: "Organization Settings",
          icon: Settings,
          active: pathname.includes("/organization/settings")
        }
      ]
    }
  ];
}
