import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
    // Test 1: Check team_projects
    console.log("=== team_projects ===");
    const { data: tp } = await supabase.from("team_projects").select("*").limit(5);
    console.log(JSON.stringify(tp, null, 2));

    // Test 2: Check team_members with org members
    console.log("\n=== team_members with org_members ===");
    const { data: tm, error: tme } = await supabase
        .from("team_members")
        .select(`
            id, team_id, organization_member_id,
            organization_members(id, user_id,
                user_profiles:user_profiles!organization_members_user_id_fkey(first_name, last_name)
            )
        `)
        .limit(3);
    console.log(JSON.stringify(tm, null, 2));
    if (tme) console.error("Error:", tme);

    // Test 3: Deep join from projects
    console.log("\n=== projects deep join ===");
    const { data: proj, error: pe } = await supabase
        .from("projects")
        .select(`
            id, name,
            team_projects(
                team_id,
                teams(id, name, team_members(id, organization_members(id, user_profiles:user_profiles!organization_members_user_id_fkey(first_name, last_name))))
            )
        `)
        .eq("id", 17); // pj1 (Hubstaff like project)
    console.log(JSON.stringify(proj, null, 2));
    if (pe) console.error("Error:", pe);
}

test();
