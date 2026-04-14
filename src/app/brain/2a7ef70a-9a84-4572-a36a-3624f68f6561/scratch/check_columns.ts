import { createAdminClient } from "@/utils/supabase/admin";

async function checkColumns() {
  const admin = createAdminClient();
  const { data, error } = await admin.from("organization_members").select("*").limit(1);
  if (error) {
    console.error("Error:", error);
    return;
  }
  if (data && data[0]) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data found to inspect columns.");
  }
}

checkColumns();
