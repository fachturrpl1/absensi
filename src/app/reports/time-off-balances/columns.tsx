"use client"

import { ColumnDef } from "@tanstack/react-table"
import { TimeOffBalance } from "@/lib/data/dummy-data"

export const columns: ColumnDef<TimeOffBalance>[] = [
    {
        accessorKey: "policyName",
        header: () => <div className="font-bold text-black">Policy</div>,
        cell: ({ row }) => {
            const policy = row.original.policyName
            return (
                <div className="font-medium text-gray-900">{policy}</div>
            )
        }
    },
    {
        accessorKey: "used",
        header: () => <div className="text-right font-bold text-black">Used</div>,
        cell: ({ row }) => <div className="text-justify-center text-gray-500">{row.original.used > 0 ? `${row.original.used} ${row.original.unit}` : "-"}</div>
    },
    {
        accessorKey: "pending",
        header: () => <div className="text-right font-bold text-black">Pending</div>,
        cell: ({ row }) => {
            const val = row.original.pending
            return (
                <div className="text-justify-center text-gray-500">
                    {val > 0 ? `${val} ${row.original.unit}` : "-"}
                </div>
            )
        }
    },
    {
        accessorKey: "balance",
        header: () => <div className="text-right font-bold text-black">Balance</div>,
        cell: ({ row }) => {
            const val = row.original.balance
            return (
                <div className="text-justify-center text-gray-700">
                    {val.toFixed(2)}
                </div>
            )
        }
    },
    {
        id: "reason",
        header: () => <div className="font-bold text-black">Reason</div>,
        cell: () => <div className="text-gray-500"></div>
    }
]
