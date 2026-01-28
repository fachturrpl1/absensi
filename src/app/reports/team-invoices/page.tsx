"use client"

import { DataReportPage } from "@/components/report/data-report-page"
import { DUMMY_INVOICES } from "@/lib/data/dummy-data"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
}

export default function TeamInvoicesPage() {
    const teamInvoices = useMemo(() => {
        return DUMMY_INVOICES.filter(inv => inv.type === 'team')
    }, [])

    const summaryCards = useMemo(() => {
        const total = teamInvoices.reduce((sum, inv) => sum + inv.amount, 0)
        const paid = teamInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)
        const outstanding = teamInvoices.filter(inv => ['sent', 'draft'].includes(inv.status)).reduce((sum, inv) => sum + inv.amount, 0)
        const invoiceCount = teamInvoices.length

        return [
            { label: "Total Invoiced", value: total, format: 'currency' as const },
            { label: "Paid", value: paid, format: 'currency' as const },
            { label: "Outstanding", value: outstanding, format: 'currency' as const },
            { label: "Invoices", value: invoiceCount },
        ]
    }, [teamInvoices])

    return (
        <DataReportPage
            title="Team invoices"
            data={teamInvoices}
            getRowKey={(row) => row.id}
            searchKeys={['entityName', 'invoiceNumber']}
            searchPlaceholder="Search member or invoice #..."
            filterOptions={[
                {
                    key: 'status',
                    label: 'Status',
                    dataKey: 'status',
                    options: [
                        { value: 'draft', label: 'Draft' },
                        { value: 'sent', label: 'Sent' },
                        { value: 'paid', label: 'Paid' },
                    ]
                }
            ]}
            columns={[
                { key: 'invoiceNumber', label: 'Invoice #' },
                { key: 'entityName', label: 'Team Member' },
                { key: 'issueDate', label: 'Issue Date' },
                { key: 'dueDate', label: 'Due Date' },
                {
                    key: 'amount',
                    label: 'Amount',
                    align: 'right',
                    render: (val) => <span className="font-medium">{formatCurrency(val as number)}</span>
                },
                {
                    key: 'status',
                    label: 'Status',
                    align: 'center',
                    render: (val) => {
                        const status = val as string
                        return (
                            <span className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                status === 'paid' && "bg-green-100 text-green-800",
                                status === 'sent' && "bg-blue-100 text-blue-800",
                                status === 'draft' && "bg-gray-100 text-gray-800",
                            )}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                        )
                    }
                },
            ]}
            summaryCards={summaryCards}
            exportFilename="team-invoices"
        />
    )
}
