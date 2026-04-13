"use client"

import { use, useEffect, useState } from "react"
import { getProjectWithMembers } from "@/action/projects"

export default function ProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const [project, setProject] = useState<any>(null)

    useEffect(() => {
        getProjectWithMembers(id).then((res) => {
            if (res.success) {
                setProject(res.data)
            }
        })
    }, [id])

    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight">{project?.name || "Project Details"}</h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    )
}
