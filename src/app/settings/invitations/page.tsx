import { Metadata } from "next";
import InvitationsClient from "./invitations-client";

export const metadata: Metadata = {
  title: "Manage Invitations",
  description: "View and manage member invitations",
};

export default function InvitationsPage() {
  return (
    <div className="container mx-auto py-6">
      <InvitationsClient />
    </div>
  );
}
