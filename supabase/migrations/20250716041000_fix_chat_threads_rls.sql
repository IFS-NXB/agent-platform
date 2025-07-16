-- Fix RLS policies for chat_threads to work with Clerk authentication
-- This addresses the issue where chat threads are created but can't be fetched due to RLS policy problems

-- Drop existing policies for chat_threads
DROP POLICY IF EXISTS "Users can view own threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can create own threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can update own threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can delete own threads" ON chat_threads;

-- Create new policies following Clerk + Supabase integration pattern
CREATE POLICY "Users can view own threads" ON chat_threads
  FOR SELECT
  TO authenticated
  USING (
    ((SELECT auth.jwt()->>'sub') = (user_id)::text)
  );

CREATE POLICY "Users can create own threads" ON chat_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ((SELECT auth.jwt()->>'sub') = (user_id)::text)
  );

CREATE POLICY "Users can update own threads" ON chat_threads
  FOR UPDATE
  TO authenticated
  USING (
    ((SELECT auth.jwt()->>'sub') = (user_id)::text)
  );

CREATE POLICY "Users can delete own threads" ON chat_threads
  FOR DELETE
  TO authenticated
  USING (
    ((SELECT auth.jwt()->>'sub') = (user_id)::text)
  );

-- Also fix chat_messages policies to ensure consistency
DROP POLICY IF EXISTS "Users can view messages from own threads" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in own threads" ON chat_messages;

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

-- Add policy for updating messages
CREATE POLICY "Users can update messages in own threads" ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    thread_id IN (
      SELECT id FROM chat_threads
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

-- Add comment to document the fix
COMMENT ON TABLE chat_threads IS 'Chat threads table with fixed RLS policies for Clerk integration';
COMMENT ON TABLE chat_messages IS 'Chat messages table with fixed RLS policies for Clerk integration';
