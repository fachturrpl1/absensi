'use client'
import { motion } from 'framer-motion'
import { LiveAttendanceTable } from '@/components/root/dashboard/live-table-logic'

export function LiveTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="lg:col-span-1"
    >
      <LiveAttendanceTable
        autoRefresh={true}
        refreshInterval={60000}
        pageSize={5}
      />
    </motion.div>
  )
}
