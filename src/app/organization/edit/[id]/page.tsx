"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getOrganizationById } from "@/action/organization"
import OrganizationForm from "@/components/form/organization-form"
import { IOrganization } from "@/interface"
import TopBar from "@/components/top-bar"
import { ContentLayout } from "@/components/admin-panel/content-layout"

export default function EditOrganizationPage() {
    const params = useParams()
    const id = params.id as string

    const [org, setOrg] = useState<Partial<IOrganization> | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { success, data } = await getOrganizationById(id)
            if (success) {
                setOrg(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [id])

    if (loading) return <div className="loader"></div>
    if (!org) return <p>Organization not found</p>

    return (
        <ContentLayout title="Edit Organization">
          
                        <div className="w-full max-w-6xl mx-auto p-4">
                  
            <OrganizationForm formType="edit" initialValues={org} />
            </div>
        </ContentLayout>
    )
}
