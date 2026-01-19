-- Add phone column to member_invitations table
-- This allows storing phone number directly instead of embedding it in message field

ALTER TABLE member_invitations
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

COMMENT ON COLUMN member_invitations.phone IS 'Phone number of the invited member';


