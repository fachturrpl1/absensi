"use client";

import React, { useState, useEffect } from "react";
import { 
  Trash2, 
  Users,
  ChevronDown,
  Pencil
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  getCustomFieldDefinitions, 
  ICustomFieldDefinition 
} from "@/action/custom-fields";
import { getUserOrganization } from "@/action/organization";
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader";
import type { SidebarItem } from "@/components/settings/SettingsSidebar";

export default function CustomFieldsSettingsPage() {
  const [fields, setFields] = useState<ICustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const orgRes = await getUserOrganization();
      if (orgRes.success && orgRes.data) {
        setOrgId(orgRes.data.id);
        const defs = await getCustomFieldDefinitions(orgRes.data.id);
        setFields(defs);
      } else {
        toast.error("Failed to load organization data");
      }
      setLoading(false);
    }
    init();
  }, []);

  const addField = () => {
    const newId = `field_${Date.now()}`;
    const newField: ICustomFieldDefinition = { id: newId, label: "New Field", type: "text" };
    setFields([...fields, newField]);
    setEditingId(newId);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<ICustomFieldDefinition>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };



  const tabs: SettingTab[] = [
    { label: "EMAIL NOTIFICATIONS", href: '/features/settings/members/email-notifications', active: false },
    { label: "WORK TIME LIMITS", href: '/features/settings/work-time-limit', active: false },
    { label: "PAYMENTS", href: '/features/settings/payments', active: false },
    { label: "ACHIEVEMENTS", href: '/features/settings/Achievements', active: false },
    { label: "CUSTOM FIELDS", href: '/features/settings/custom-fields', active: true },
  ];

  const sidebarItems: SidebarItem[] = [
    { id: "custom-fields", label: "Custom fields", href: "/features/settings/custom-fields" },
  ];

  if (loading && !orgId) {
    return (
      <div className="flex flex-col min-h-screen bg-white w-full">
        <SettingsHeader title="Members" Icon={Users} tabs={tabs} />
        <div className="flex-1 p-8 text-center text-muted-foreground uppercase text-[10px] tracking-widest">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <SettingsHeader
        title="Members"
        Icon={Users}
        tabs={tabs}
        sidebarItems={sidebarItems}
        activeItemId="custom-fields"
      />
      <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="custom-fields">
        {/* Main Content Area */}
        <div className="flex-1 p-6 md:p-10 w-full max-w-6xl">
          <div className="space-y-12">
            {/* Screenshot Header Style */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">MEMBER PROFILES</h2>
                <p className="text-[15px] text-slate-600 font-normal">
                  Add or edit custom fields that appear on member profiles
                </p>
              </div>
              <Button 
                onClick={addField} 
                className="bg-black hover:bg-gray-800 text-white h-10 px-6 rounded-md transition-all font-medium text-sm"
              >
                Add custom field
              </Button>
            </div>

            <div className="w-full">
              {/* Table Header Wrapper */}
              <div className="grid grid-cols-[2fr_1.5fr_1.5fr_100px] gap-4 px-2 py-4 items-center">
                <div className="text-[15px] font-semibold text-slate-800">Field</div>
                <div className="text-[15px] font-semibold text-slate-800">Created by</div>
                <div className="text-[15px] font-semibold text-slate-800">Created on</div>
                <div className="w-[100px]" />
              </div>
              <div className="h-[1px] w-full bg-slate-100 mb-2" />

              {/* List or Empty State */}
              <div className="min-h-[300px]">
                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative mb-6">
                      <div className="absolute -inset-4 bg-blue-50/50 rounded-full blur-2xl opacity-50" />
                      <div className="relative bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-100">
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="12" y="24" width="40" height="28" rx="2" fill="#e2e8f0" />
                          <path d="M12 24L32 12L52 24" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <rect x="24" y="32" width="16" height="12" rx="1" fill="#cbd5e1" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Add custom profile fields</h3>
                    <p className="text-[15px] text-slate-500 font-normal max-w-sm">
                      Create new fields to add to member profiles
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {fields.map((field) => (
                      <div key={field.id} className="grid grid-cols-[2fr_1.5fr_1.5fr_100px] gap-4 px-2 py-6 items-center hover:bg-slate-50/30 transition-colors group">
                        <div className="text-[15px] font-normal text-slate-900">
                          {editingId === field.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                autoFocus
                                value={field.label}
                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                onBlur={() => setEditingId(null)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                                className="h-9 text-[15px] border-slate-200 focus:ring-slate-900 max-w-xs"
                              />
                              <Select
                                value={field.type}
                                onValueChange={(val: any) => updateField(field.id, { type: val })}
                              >
                                <SelectTrigger className="w-24 h-9 text-xs border-slate-200 uppercase">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-slate-200">
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer group/label"
                              onClick={() => setEditingId(field.id)}
                            >
                              <span className="text-slate-900 group-hover/label:text-blue-600 transition-colors">{field.label || "(No label)"}</span>
                              <span className="ml-2 text-[10px] text-slate-300 font-normal uppercase">{field.type}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[15px] font-normal text-slate-600">kipli kah</div>
                        <div className="text-[15px] font-normal text-slate-600">
                          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="h-9 px-3 text-sm flex items-center gap-2 border-slate-200 text-slate-600 font-normal hover:bg-slate-50 rounded-md">
                                Actions <ChevronDown size={14} className="text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 border-slate-200 shadow-xl">
                              <DropdownMenuItem 
                                onClick={() => setEditingId(field.id)}
                                className="text-sm py-2"
                              >
                                <Pencil className="mr-2 h-4 w-4 text-slate-400" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => removeField(field.id)}
                                className="text-sm py-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                    

                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SettingsContentLayout>
    </div>
  );
}
