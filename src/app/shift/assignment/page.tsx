"use client"

import { Card, CardContent } from "@/components/ui/card"

export default function ShiftAssignmentPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <Card className="border-0 shadow-none">
        <CardContent className="p-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Shift Assignment</h1>
            <p className="text-sm text-muted-foreground">
              Assign members into shifts and handle conflicts.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
