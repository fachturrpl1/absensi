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

    if (loading) return <div className="loader"></div>
    if (!org) return <p>Members not found</p>

    return (
        <ContentLayout title="Edit Member">
         
                        <div className="w-full max-w-6xl mx-auto p-4">
               
            <MembersForm formType="edit" initialValues={org}  rfidInitial={org.rfid_cards || undefined}/>
           
            </div>
        </ContentLayout>
    )
}
