import React from 'react'
import Skeleton from './skeleton'

export default function FullCardSkeleton() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-start gap-3 p-4 bg-card/40">
      <div className="w-36 h-4"><Skeleton className="w-full h-4 rounded"/></div>
      <div className="w-full h-10 mt-2"><Skeleton className="w-full h-10 rounded"/></div>
      <div className="w-3/4 h-4 mt-2"><Skeleton className="w-full h-4 rounded"/></div>
      <div className="w-1/2 h-4 mt-auto"><Skeleton className="w-full h-4 rounded"/></div>
    </div>
  )
}
