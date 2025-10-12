import { customerInsightsData } from "./data"
import { DashboardCard } from "@/components/dashboard-card"
import { CustomerInsightList } from "./customer-insight-list"
import { Crown } from "@/components/icons/lucide-exports"
import type { CustomerInsightsType } from "./types"
import { useCustomerInsights } from "./useCustomerInsights"

// Accept optional data prop. If not provided, fallback to live data via hook.
export function CustomerInsights({ data }: { data?: CustomerInsightsType }) {
  const live = useCustomerInsights()
  const display = data ?? (live as unknown as CustomerInsightsType) ?? customerInsightsData

  return (
    <DashboardCard
      title="Customer Insights"
      value={0}
      description={display.period}
      icon={Crown}
      iconClass="h-8 w-8"
      loading={false}
    >
      <CustomerInsightList data={display} />
    </DashboardCard>
  )
}
