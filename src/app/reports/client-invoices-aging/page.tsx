"use client"

import { ReportPageLayout } from "@/components/report/report-page-layout"
import { DUMMY_INVOICES } from "@/lib/data/dummy-data"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
}

export default function ClientInvoicesAgingPage() {
    const agingData = useMemo(() => {
        const clientInvoices = DUMMY_INVOICES.filter(inv => inv.type === 'client')

        // Group by client
        const clientMap: Record<string, {
            entityName: string
            current: number
            days30: number
            days60: number
            days90: number
            total: number
        }> = {}

        clientInvoices.forEach(inv => {
            if (!clientMap[inv.entityId]) {
                clientMap[inv.entityId] = {
                    entityName: inv.entityName,
                    current: 0,
                    days30: 0,
                    days60: 0,
                    days90: 0,
                    total: 0,
                }
            }

            const entry = clientMap[inv.entityId]!

            // Simulate aging based on status
            if (inv.status === 'sent') {
                entry.current += inv.amount
            } else if (inv.status === 'overdue') {
                // Distribute overdue amounts across aging buckets
                const daysOverdue = Math.floor(Math.random() * 120)
                if (daysOverdue < 30) {
                    entry.current += inv.amount
                } else if (daysOverdue < 60) {
                    entry.days30 += inv.amount
                } else if (daysOverdue < 90) {
                    entry.days60 += inv.amount
                } else {
                    entry.days90 += inv.amount
                }
            }
            entry.total = entry.current + entry.days30 + entry.days60 + entry.days90
        })

        return Object.entries(clientMap)
            .filter(([_, data]) => data.total > 0)
            .map(([id, data]) => ({ id, ...data }))
    }, [])

    const totals = useMemo(() => {
        return agingData.reduce((acc, client) => ({
            current: acc.current + client.current,
            days30: acc.days30 + client.days30,
            days60: acc.days60 + client.days60,
            days90: acc.days90 + client.days90,
            total: acc.total + client.total,
        }), { current: 0, days30: 0, days60: 0, days90: 0, total: 0 })
    }, [agingData])

    return (
        <ReportPageLayout
            title="Client invoices aging"
            breadcrumbs={[
                { label: "Reports", href: "/reports/all" },
                { label: "Client invoices aging" }
            ]}
            actions={
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                </Button>
            }
        >
            <style jsx global>{`
                html body .custom-hover-row:hover,
                html body .custom-hover-row:hover > td {
                    background-color: #d1d5db !important;
                }
            `}</style>

            <div className="bg-white border rounded-lg shadow-sm">
                {/* Summary */}
                <div className="grid grid-cols-5 divide-x border-b bg-gray-50/50">
                    <div className="p-4">
                        <p className="text-sm font-medium text-gray-500">Current</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.current)}</p>
                    </div>
                    <div className="p-4">
                        <p className="text-sm font-medium text-gray-500">1-30 Days</p>
                        <p className="text-xl font-bold text-yellow-600">{formatCurrency(totals.days30)}</p>
                    </div>
                    <div className="p-4">
                        <p className="text-sm font-medium text-gray-500">31-60 Days</p>
                        <p className="text-xl font-bold text-orange-600">{formatCurrency(totals.days60)}</p>
                    </div>
                    <div className="p-4">
                        <p className="text-sm font-medium text-gray-500">61-90+ Days</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(totals.days90)}</p>
                    </div>
                    <div className="p-4">
                        <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.total)}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="p-4">Client</th>
                                <th className="p-4 text-right">Current</th>
                                <th className="p-4 text-right">1-30 Days</th>
                                <th className="p-4 text-right">31-60 Days</th>
                                <th className="p-4 text-right">61-90+ Days</th>
                                <th className="p-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {agingData.map((client, idx) => (
                                <tr
                                    key={client.id}
                                    style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                    className="transition-colors custom-hover-row"
                                >
                                    <td className="p-4 font-medium text-gray-900">{client.entityName}</td>
                                    <td className="p-4 text-right">{client.current > 0 ? formatCurrency(client.current) : '-'}</td>
                                    <td className="p-4 text-right text-yellow-600">{client.days30 > 0 ? formatCurrency(client.days30) : '-'}</td>
                                    <td className="p-4 text-right text-orange-600">{client.days60 > 0 ? formatCurrency(client.days60) : '-'}</td>
                                    <td className="p-4 text-right text-red-600">{client.days90 > 0 ? formatCurrency(client.days90) : '-'}</td>
                                    <td className="p-4 text-right font-bold">{formatCurrency(client.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ReportPageLayout>
    )
}
