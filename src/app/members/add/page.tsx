

"use client"

import { ContentLayout } from "@/components/admin-panel/content-layout";
import  MembersForm  from "@/components/form/members-form";


export default function AddOrganizationPage() {
    
    return (
        <ContentLayout title="Add Member">
          
            <div className="w-full max-w-6xl mx-auto p-4">
         
                <MembersForm formType="add" />
              
            </div>
        </ContentLayout>

    )
}