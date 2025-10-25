"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getOrganizationMembersById } from "@/action/members"
import MembersForm from "@/components/form/members-form"
import { IOrganization_member } from "@/interface";
import { ContentLayout } from "@/components/admin-panel/content-layout"


export default function EditOrganizationMembersPage() {
    const params = useParams()
    const id = params.id as string

    const [org, setOrg] = useState<Partial<IOrganization_member> | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { success, data } = await getOrganizationMembersById(id)
            if (success) {
                setOrg(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [id])

    if (loading) {
        return (
            <ContentLayout title="Edit Member">
                <div className="w-full max-w-6xl mx-auto p-4">
                    <div className="space-y-6">
                        {/* Form Title Skeleton */}
                        <div className="space-y-2">
                            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
                        </div>

                        {/* Form Fields Skeleton */}
                        <div className="space-y-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons Skeleton */}
                        <div className="flex gap-4">
                            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
                            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </ContentLayout>
        )
    }
    if (!org) return (
        <ContentLayout title="Edit Member">
            <div className="w-full max-w-6xl mx-auto p-4">
                <p className="text-center text-muted-foreground">Member not found</p>
            </div>
        </ContentLayout>
    )

    return (
        <ContentLayout title="Edit Member">
         
                        <div className="w-full max-w-6xl mx-auto p-4">
               
            <MembersForm formType="edit" initialValues={org}  rfidInitial={org.rfid_cards || undefined}/>
           
            </div>
        </ContentLayout>
    )
}
