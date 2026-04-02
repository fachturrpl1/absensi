import { createAdminClient } from './src/utils/supabase/admin';

async function test() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('organization_members').select('id, user_id').limit(10);
  console.log('Members:', JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);
}

test();
