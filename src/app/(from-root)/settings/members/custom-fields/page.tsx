"use client"

import { useState } from "react"

import { Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MembersHeader } from "@/components/settings/MembersHeader"
import { MembersSidebar } from "@/components/settings/MembersSidebar"

export default function CustomFieldsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [fieldName, setFieldName] = useState("")
  const [fieldType, setFieldType] = useState("")
  const [isRequired, setIsRequired] = useState(false)

  const handleAdd = () => {
    // TODO: Handle add custom field logic
    console.log("Add field:", { fieldName, fieldType, isRequired })
    setIsDialogOpen(false)
    // Reset form
    setFieldName("")
    setFieldType("")
    setIsRequired(false)
  }

  const handleCancel = () => {
    setIsDialogOpen(false)
    // Reset form
    setFieldName("")
    setFieldType("")
    setIsRequired(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <MembersHeader activeTab="custom-fields" />

      {/* Main Content */}
      <div className="flex flex-1 w-full">
        {/* Left Sidebar */}
        <MembersSidebar activeItem="profile-fields" />

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Member Profiles Section */}
          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900">MEMBER PROFILES</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Add or edit custom fields that appear on member profiles.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Button
                  type="button"
                  variant="default"
                  className="bg-black hover:bg-slate-900 text-white whitespace-nowrap font-semibold shadow-md"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add custom field
                </Button>
              </div>
            </div>

            {/* Table Headers */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Field
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Created by
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Created on
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Empty State */}
                  <tr>
                    <td colSpan={3} className="px-4 py-16">
                      <div className="flex flex-col items-center justify-center">
                        {/* Illustration */}
                        <div className="mb-4 relative">
                          <div className="w-24 h-24 bg-slate-50 rounded-lg flex items-center justify-center">
                            <Sparkles className="h-12 w-12 text-slate-400" />
                          </div>
                          {/* Sparkling lines effect */}
                          <div className="absolute -top-2 -right-2 w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                          <div className="absolute top-1/2 -right-4 w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 mb-2">
                          Add custom profile fields
                        </h3>
                        <p className="text-sm text-slate-600 text-center max-w-md">
                          Create new fields to add to member profiles.
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Field Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add custom field</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Field name */}
            <div className="space-y-2">
              <Label htmlFor="field-name">Field name</Label>
              <Input
                id="field-name"
                type="text"
                placeholder="Enter field name"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
              />
            </div>

            {/* Field type */}
            <div className="space-y-2">
              <Label htmlFor="field-type">Field type</Label>
              <Select value={fieldType} onValueChange={setFieldType}>
                <SelectTrigger id="field-type" className="w-full">
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Required checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={isRequired}
                onCheckedChange={(checked) => setIsRequired(checked === true)}
              />
              <Label
                htmlFor="required"
                className="text-sm font-normal cursor-pointer"
              >
                Required
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAdd}
              className="bg-black hover:bg-slate-900 text-white"
              disabled={!fieldName || !fieldType}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

