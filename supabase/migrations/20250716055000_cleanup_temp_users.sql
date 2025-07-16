-- Clean up temporary users created by the old ensureUserExists function
-- These users have emails ending with @temp.com and name = 'User'

-- First, let's identify these users (for logging purposes)
DO $$
DECLARE
  temp_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO temp_user_count
  FROM users
  WHERE email LIKE '%@temp.com' AND name = 'User';

  IF temp_user_count > 0 THEN
    RAISE NOTICE 'Found % temporary user records to clean up', temp_user_count;
  END IF;
END $$;

-- Delete temporary users
-- Note: This will cascade delete their threads and messages due to foreign key constraints
DELETE FROM users
WHERE email LIKE '%@temp.com' AND name = 'User';

-- Add a comment to document this cleanup
COMMENT ON TABLE users IS 'Users table synced from Clerk. No temporary users should be created directly.';
