
import { ContentLayout } from "@/components/admin-panel/content-layout";
import OrganizationForm from "@/components/form/organization-form";

import TopBar from "@/components/top-bar";

export default function AddOrganizationPage() {
    return (
        <ContentLayout title="Add Organization">
       
            <div className="w-full max-w-6xl mx-auto p-4">
              
                <OrganizationForm formType="add" />
               
            </div>
        </ContentLayout>

    )
}