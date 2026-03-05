'use client'
import { motion } from 'framer-motion'
import { ActivityTimeline } from '@/components/root/dashboard/activity-timeline'

export function RecentActivity() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <ActivityTimeline limit={10} autoRefresh={true} />
    </motion.div>
  )
}
