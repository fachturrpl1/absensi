"use client"

import { useEffect, useState } from "react"
import { checkDatabaseCounts } from "@/action/debug"

export default function DebugPage() {
    const [debugData, setDebugData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDebug = async () => {
            const data = await checkDatabaseCounts()
            setDebugData(data)
            setLoading(false)
        }
        fetchDebug()
    }, [])

    if (loading) return <div>Loading debug data...</div>

    return (
        <div className="p-8 font-mono text-xs whitespace-pre">
            <h1 className="text-xl font-bold mb-4 whitespace-normal">Database Debug Info</h1>
            {JSON.stringify(debugData, null, 2)}
        </div>
    )
}
