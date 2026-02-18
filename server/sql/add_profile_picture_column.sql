-- Add profile_picture column to users table
-- This allows both buyers and sellers to have profile pictures

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture TEXT DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN users.profile_picture IS 'URL or path to user profile picture (for both buyers and sellers)';

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'profile_picture';
