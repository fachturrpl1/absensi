import {
  Tag,
  Users,
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
  ShieldCheck
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
          href: "",
          label: "Organization",
          icon: Building2,
          submenus: [

            {
              href: "/organization",
              label: "All Organization"
            },
            {
              href: "/department",
              label: "Department"
            },
            {
              href: "/position",
              label: "Position"
            },
          ]
        },

        {
          href: "/members",
          label: "Member",
          icon: UserCheck
        },
        {
          href: "/attendance",
          label: "Attendance",
          icon: ClipboardCheck
        },

      ]
    },
    {
      groupLabel: "MANAGEMENT",
      menus: [
        {
          href: "/users",
          label: "Users",
          icon: Users
        },
        {
          href: "/schedule",
          label: "Schedule",
          icon: Calendar
        },
        {
          href: "/role",
          label: "Role",
          icon: ShieldCheck
        },
        {
          href: "/permission",
          label: "Permission",
          icon: List
        }
      ]
    }
  ];
}
