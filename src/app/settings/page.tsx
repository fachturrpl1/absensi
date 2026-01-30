'use client';

import Link from 'next/link';
import {
  Building2,
  Users,
  Calendar,
  Activity,
  Lightbulb,
  FileText,
  Search,
} from 'lucide-react';

interface SettingsCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: {
    label: string;
    href?: string;
  }[];
  badge?: string;
}

function SettingsCard({ title, icon: Icon, items, badge }: SettingsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="h-5 w-5 text-slate-700" />
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {badge && (
          <span className="ml-auto px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index}>
            {item.href ? (
              <Link
                href={item.href}
                className="text-sm text-slate-600 hover:text-slate-800 hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm text-slate-600 cursor-pointer hover:text-slate-800 hover:underline">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SettingsPage() {
  const settingsCards: SettingsCardProps[] = [
    {
      title: 'Project',
      icon: Building2,
      items: [
        { label: 'Projects & taks', href: '/settings/project&task' },
      ],
    },
    {
      title: 'Members',
      icon: Users,
      items: [
        { label: 'Custom fields', href: '/settings/members/custom-fields' },
        { label: 'Work time limits', href: '/settings/work-time-limit' },
        { label: 'Payments', href: '/settings/payments' },
        { label: 'Achievements', href: '/settings/Achievements' },
      ],
    },
    {
      title: 'Schedules',
      icon: Calendar,
      items: [
        { label: 'Calendar', href: '/settings/Calender' },
        { label: 'Job sites', href: '/settings/Job-sites' },
        { label: 'Map', href: '/settings/Map' },
      ],
    },
    {
      title: 'Activity & tracking',
      icon: Activity,
      items: [
        { label: 'Activity', href: '/settings/Activity/track-apps-urls' },
        { label: 'Timesheets', href: '/settings/Timesheet' },
        { label: 'Time & tracking', href: '/settings/tracking/allowed-apps' },
        { label: 'Screenshots', href: '/settings/screenshot' },
      ],
    },
    {
      title: 'Insights',
      icon: Lightbulb,
      badge: 'Add-on',
      items: [
        { label: 'Apps/URLs classifications', href: '/settings/app-url' },
      ],
    },
    {
      title: 'Policies',
      icon: FileText,
      items: [
        { label: 'Time off', href: '/settings/Policies' },
        { label: 'Work breaks', href: '/settings/Policies/work-breaks' },
        { label: 'Overtime', href: '/settings/Policies/overtime' },
      ],
    },
  ];

  return (
    <div className="flex flex-1 flex-col bg-white min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search settings"
              className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {settingsCards.map((card, index) => (
            <SettingsCard key={index} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}
