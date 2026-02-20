import * as React from "react"
import { cn } from "@/lib/utils"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

/**
 * CardTable
 * A wrapper around the Table component that applies a card-like styling
 * (white background, border, shadow, rounded corners) and specific
 * row striping/hover effects as seen in the Attendance Locations page.
 */

const CardTable = React.forwardRef<
    HTMLTableElement,
    React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full">
        <div className="overflow-x-auto">
            <Table ref={ref} className={cn("w-full", className)} {...props} />
        </div>
    </div>
))
CardTable.displayName = "CardTable"

const CardTableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <TableHeader ref={ref} className={cn("bg-gray-50 border-b border-gray-200", className)} {...props} />
))
CardTableHeader.displayName = "CardTableHeader"

const CardTableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
    <TableRow
        ref={ref}
        className={cn(
            "even:bg-gray-50 hover:!bg-gray-200 transition-colors border-b border-gray-100 last:border-0",
            className
        )}
        {...props}
    />
))
CardTableRow.displayName = "CardTableRow"

const CardTableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <TableHead
        ref={ref}
        className={cn(
            "font-semibold text-gray-600 h-10 px-4 text-left align-middle [&:has([role=checkbox])]:pr-0",
            className
        )}
        {...props}
    />
))
CardTableHead.displayName = "CardTableHead"

const CardTableBody = TableBody
const CardTableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <TableCell
        ref={ref}
        className={cn("text-gray-600", className)}
        {...props}
    />
))
CardTableCell.displayName = "CardTableCell"

export {
    CardTable,
    CardTableHeader,
    CardTableBody,
    CardTableHead,
    CardTableRow,
    CardTableCell,
}
