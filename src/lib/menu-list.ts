import {
  Tag,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  List,
  Building2,
  UserCheck,
  Group,
  Calendar,
  ClipboardCheck,
  ShieldCheck,
  Briefcase,
} from "@/components/icons/lucide-exports";
import type { LucideIcon } from "@/components/icons/lucide-exports";

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
      groupLabel: "General",
      menus: [
        {
          href: "/group",
          label: "Group",
          icon: Group,
          active: pathname.includes("/group")
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
      groupLabel: "Managment",
      menus: [
        {
          href: "/schedule",
          label: "Schedule",
          icon: Calendar,
          active: pathname.includes("/schedule")
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
