-- Fix RLS policies to use official Clerk third-party auth integration
-- Following official Supabase documentation: https://supabase.com/docs/guides/auth/third-party-auth/clerk

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can create own threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can update own threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can delete own threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can view messages from own threads" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in own threads" ON chat_messages;
DROP POLICY IF EXISTS "Users can update messages in own threads" ON chat_messages;

-- Create new policies using official Clerk integration
CREATE POLICY "Users can view own threads" ON chat_threads
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can create own threads" ON chat_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can update own threads" ON chat_threads
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can delete own threads" ON chat_threads
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can view messages from own threads" ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM chat_threads
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can create messages in own threads" ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    thread_id IN (
      SELECT id FROM chat_threads
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can update messages in own threads" ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM chat_threads
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

-- Fix other table policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.jwt()->>'sub'));

-- Fix users table policies
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;

CREATE POLICY "Users can view own record" ON users
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can update own record" ON users
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.jwt()->>'sub'));

-- Allow users to insert their own record (for user sync)
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.jwt()->>'sub'));

-- Add comment to document the fix
COMMENT ON TABLE chat_threads IS 'Chat threads table with official Clerk third-party auth integration';
COMMENT ON TABLE chat_messages IS 'Chat messages table with official Clerk third-party auth integration';
COMMENT ON TABLE projects IS 'Projects table with official Clerk third-party auth integration';
COMMENT ON TABLE users IS 'Users table with official Clerk third-party auth integration';
