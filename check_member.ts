import { createAdminClient } from './src/utils/supabase/admin';

async function checkMember() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('organization_members').select('*').eq('id', 4).maybeSingle();
    console.log('Member 4:', JSON.stringify(data));
    console.log('Error:', JSON.stringify(error));
    
    if (!data) {
      console.log('Searching for any member...');
      const { data: anyMember } = await supabase.from('organization_members').select('id').limit(1).maybeSingle();
      console.log('Found ID:', anyMember?.id);
    }
  } catch (e) {
    console.error('Test failed:', e);
  }
}

checkMember();
