"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { IOrganization_member } from "@/interface";

export function MembersList() {
  const [members, setMembers] = useState<IOrganization_member[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // 1. Retrieve the logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Find the organization_id for this user
      const { data: member } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!member) return;

      // 3. Fetch all members in the organization
      const { data } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", member.organization_id)
        .order("created_at", { ascending: true });

      if (data) setMembers(data as IOrganization_member[]);
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Organization Members</h2>
      <pre>{JSON.stringify(members, null, 2)}</pre>
    </div>
  );
}
