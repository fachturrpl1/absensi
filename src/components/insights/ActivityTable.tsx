import React from "react"

export interface ColumnDef<T> {
    header: string
    accessorKey?: keyof T
    cell?: (item: T, idx: number) => React.ReactNode
    className?: string
}

export interface ActivityTableProps<T> {
    data: T[]
    columns: ColumnDef<T>[]
    isLoading: boolean
    emptyMessage?: string
    loadingMessage?: string
    keyExtractor?: (item: T, idx: number) => string | number
}

export function ActivityTable<T>({ 
    data, 
    columns, 
    isLoading,
    emptyMessage = "No data found",
    loadingMessage = "Loading data...",
    keyExtractor
}: ActivityTableProps<T>) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="border-t border-b">
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} className={`p-4 ${col.className || ''}`}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {data.map((row, idx) => {
                        const rowKey = keyExtractor ? keyExtractor(row, idx) : idx
                        return (
                            <tr
                                key={rowKey}
                                className={`transition-colors ${idx % 2 === 1 ? '' : ''}`}
                            >
                                {columns.map((col, i) => {
                                    let content: React.ReactNode = null
                                    if (col.cell) {
                                        content = col.cell(row, idx)
                                    } else if (col.accessorKey) {
                                        content = String(row[col.accessorKey] ?? '')
                                    }

                                    return (
                                        <td key={i} className={`p-4 ${col.className || ''}`}>
                                            {content}
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                    {data.length === 0 && !isLoading && (
                        <tr>
                            <td colSpan={columns.length} className="p-8 text-center">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                    {isLoading && (
                        <tr>
                            <td colSpan={columns.length} className="p-8 text-center animate-pulse font-medium">
                                {loadingMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
