import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/user-store';
import { createClient } from '@/utils/supabase/client';

/**
 * Custom hook to fetch and cache organization name for current user
 */
export function useOrganizationName() {
  const user = useAuthStore((state) => state.user);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrganizationName() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        
        const { data } = await supabase
          .from('organization_members')
          .select('organization_id, organizations(name)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          const orgName = (data.organizations as any)?.name || null;
          setOrganizationName(orgName);
        }
      } catch (error) {
        console.error('Error fetching organization name:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizationName();
  }, [user?.id]);

  return { organizationName, loading };
}
