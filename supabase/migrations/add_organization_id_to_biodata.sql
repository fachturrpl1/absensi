-- Add organization_id column to biodata table
-- This creates a direct relationship between biodata and organizations
-- allowing biodata records to be associated with a specific organization

-- Add organization_id column (nullable to handle existing data)
ALTER TABLE public.biodata
ADD COLUMN IF NOT EXISTS organization_id INTEGER NULL;

-- Add foreign key constraint
-- ON DELETE CASCADE: Jika organization dihapus, semua biodata dengan organization_id tersebut juga akan terhapus
-- Ini aman karena organization_members juga menggunakan ON DELETE CASCADE ke organizations,
-- jadi ketika organization dihapus, semua member terhapus, dan biodata yang hanya digunakan oleh organization tersebut
-- juga tidak diperlukan lagi
ALTER TABLE public.biodata
ADD CONSTRAINT biodata_organization_id_fkey 
  FOREIGN KEY (organization_id) 
  REFERENCES public.organizations(id) 
  ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_biodata_organization_id 
  ON public.biodata(organization_id) 
  TABLESPACE pg_default;

-- Add comment for documentation
COMMENT ON COLUMN public.biodata.organization_id IS 'Foreign key reference to organizations table. Links biodata to a specific organization.';

