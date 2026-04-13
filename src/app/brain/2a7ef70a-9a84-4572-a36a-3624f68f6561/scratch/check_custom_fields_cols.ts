import { createAdminClient } from "./src/utils/supabase/admin";

async function checkColumns() {
  const admin = createAdminClient();
  
  console.log("Checking organizations columns...");
  const { data: orgData, error: orgError } = await admin.from("organizations").select("*").limit(1);
  if (orgError) {
    console.error("Org Error:", orgError);
  } else if (orgData && orgData[0]) {
    console.log("Org Columns:", Object.keys(orgData[0]));
  }

  console.log("\nChecking organization_members columns...");
  const { data: memberData, error: memberError } = await admin.from("organization_members").select("*").limit(1);
  if (memberError) {
    console.error("Member Error:", memberError);
  } else if (memberData && memberData[0]) {
    console.log("Member Columns:", Object.keys(memberData[0]));
  }
}

checkColumns();
