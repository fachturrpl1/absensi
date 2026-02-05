"use client"

import { ColumnDef } from "@tanstack/react-table"
import { TimeOffTransaction } from "@/lib/data/dummy-data"

export const columns: ColumnDef<TimeOffTransaction>[] = [
    {
        accessorKey: "date",
        header: () => <div className="font-bold text-black">Date</div>,
        cell: ({ row }) => {
            const date = new Date(row.getValue("date"))
            return (
                <div className="text-gray-500">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
            )
        },
    },
    {
        accessorKey: "transactionType",
        header: () => <div className="font-bold text-black">Transaction Type</div>,
        cell: ({ row }) => {
            const type = row.original.transactionType
            return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                    ${type === 'accrual' ? 'bg-green-100 text-green-800' :
                        type === 'usage' ? 'bg-red-100 text-red-800' :
                            type === 'adjustment' ? 'bg-blue-100 text-blue-800' :
                                type === 'cancellation' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'}`}>
                    {type}
                </span>
            )
        }
    },
    {
        accessorKey: "amount",
        header: () => <div className="text-right font-bold text-black">Amount</div>,
        cell: ({ row }) => {
            const amount = row.original.amount
            return (
                <div className={`text-right font-medium ${amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {amount > 0 ? "+" : ""}{amount}
                </div>
            )
        }
    },
    {
        accessorKey: "balanceAfter",
        header: () => <div className="text-right font-bold text-black">Balance After</div>,
        cell: ({ row }) => {
            const balance = row.original.balanceAfter
            return (
                <div className="text-right text-gray-900 font-medium">
                    {balance}
                </div>
            )
        }
    },
    {
        accessorKey: "notes",
        header: () => <div className="font-bold text-black">Notes</div>,
        cell: ({ row }) => {
            return (
                <div className="text-gray-500 truncate max-w-[200px]" title={row.original.notes}>
                    {row.original.notes || "-"}
                </div>
            )
        }
    },
]
