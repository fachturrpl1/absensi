"use client"

import { Card, CardContent } from "@/components/ui/card"

export default function ShiftManagementPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <Card className="border-0 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Shift Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage shift definitions (name, start/end time, rules).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
