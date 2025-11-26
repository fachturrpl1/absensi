"use client";

import { useMemo, useState } from "react";

import type { CheckedState } from "@radix-ui/react-checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type NotificationCategory = "attendance" | "leaves" | "schedule";
type NotificationFilter = "all" | NotificationCategory;

type NotificationItem = {
  id: number;
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  category: NotificationCategory;
  unread?: boolean;
  selected?: boolean;
};

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    sender: "System",
    subject: "New attendance record",
    snippet: "John Doe checked in at 09:00 AM",
    date: "2 minutes ago",
    category: "attendance",
    unread: true,
  },
  {
    id: 2,
    sender: "Scheduling",
    subject: "Shift swap request",
    snippet: "Sarah Connor requested to swap Friday evening shift",
    date: "10 minutes ago",
    category: "schedule",
    unread: true,
  },
  {
    id: 3,
    sender: "Leaves",
    subject: "Leave approval",
    snippet: "Mark Lee's annual leave was approved",
    date: "1 hour ago",
    category: "leaves",
    unread: false,
  },
];

const categoryTabs: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "All notif" },
  { value: "attendance", label: "Attendance" },
  { value: "schedule", label: "Schedule" },
  { value: "leaves", label: "Leaves" },
];

const categoryBadgeMeta: Record<
  NotificationCategory,
  { label: string; className: string }
> = {
  attendance: {
    label: "Attendance",
    className:
      "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-400/10 dark:text-blue-200",
  },
  schedule: {
    label: "Schedule",
    className:
      "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-400/10 dark:text-purple-200",
  },
  leaves: {
    label: "Leave",
    className:
      "bg-green-50 text-green-800 border-green-200 dark:bg-green-400/10 dark:text-green-200",
  },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [activeCategory, setActiveCategory] = useState<NotificationFilter>("all");

  const filteredNotifications = useMemo(() => {
    if (activeCategory === "all") return notifications;
    return notifications.filter((notification) => notification.category === activeCategory);
  }, [activeCategory, notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    [notifications],
  );

  const selectedCount = useMemo(
    () => filteredNotifications.filter((notification) => notification.selected).length,
    [filteredNotifications],
  );

  const selectAllState: CheckedState =
    filteredNotifications.length === 0
      ? false
      : filteredNotifications.every((notification) => notification.selected)
        ? true
        : filteredNotifications.some((notification) => notification.selected)
          ? "indeterminate"
          : false;

  const toggleSelection = (id: number, checked: CheckedState) => {
    const isChecked = checked === true;
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, selected: isChecked } : notification,
      ),
    );
  };

  const toggleSelectAll = (checked: CheckedState) => {
    const isChecked = checked === true;
    setNotifications((prev) =>
      prev.map((notification) =>
        activeCategory === "all" || notification.category === activeCategory
          ? { ...notification, selected: isChecked }
          : notification,
      ),
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1 px-4 pt-6 sm:px-6 lg:px-10">
        <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          View every alert sent to your organization in a Gmail-inspired layout.
        </p>
      </div>

      <Card className="rounded-none border-x-0 shadow-sm sm:rounded-2xl sm:border sm:mx-4 lg:mx-10">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectAllState}
              onCheckedChange={toggleSelectAll}
              className="size-4"
            />
            <span>{selectedCount > 0 ? `${selectedCount} selected` : "Select"}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{notifications.length}</span>
            <span>total</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-medium text-foreground">{unreadCount}</span>
            <span>unread</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b px-4 py-3">
          {categoryTabs.map((tab) => (
            <Button
              key={tab.value}
              size="sm"
              variant={tab.value === activeCategory ? "secondary" : "ghost"}
              className={cn(
                "rounded-full px-4 text-xs font-medium",
                tab.value === activeCategory && "shadow-sm",
              )}
              onClick={() => setActiveCategory(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="divide-y">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-center gap-4 px-4 py-4 text-sm transition-colors hover:bg-muted/40",
                notification.unread && "bg-muted/40 font-medium shadow-[inset_0_1px_0_var(--border)]",
              )}
            >
              <Checkbox
                checked={notification.selected}
                onCheckedChange={(value) => toggleSelection(notification.id, value)}
                className="size-4 shrink-0"
              />
              <Avatar>
                <AvatarFallback className="text-xs font-semibold uppercase">
                  {notification.sender.slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold">{notification.sender}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-wide",
                      categoryBadgeMeta[notification.category]?.className,
                    )}
                  >
                    {categoryBadgeMeta[notification.category]?.label}
                  </Badge>
                </div>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="truncate text-foreground">{notification.subject}</span>
                  <span className="text-muted-foreground">— {notification.snippet}</span>
                </p>
              </div>

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {notification.date}
              </span>
            </div>
          ))}

          {filteredNotifications.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No notifications in this category yet.
            </div>
          ) : null}
        </div>
      </Card>

      <Separator className="mx-4 lg:mx-10" />
      <p className="px-4 pb-6 text-xs text-muted-foreground sm:px-6 lg:px-10">
        Simulated data for design preview. Connect to live notification sources to populate this
        view automatically.
      </p>
    </div>
  );
}


