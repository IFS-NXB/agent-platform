-- Fix Clerk user synchronization and foreign key constraints
-- This migration ensures proper user sync between Clerk and Supabase

-- Drop any duplicate user tables that might exist
DROP TABLE IF EXISTS "user" CASCADE;

-- Ensure users table has correct structure for Clerk
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create policies for Clerk authentication
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = id);

-- Ensure all foreign key constraints reference the correct users table
ALTER TABLE chat_threads DROP CONSTRAINT IF EXISTS chat_threads_user_id_fkey;
ALTER TABLE chat_threads ADD CONSTRAINT chat_threads_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE mcp_tool_customizations DROP CONSTRAINT IF EXISTS mcp_tool_customizations_user_id_fkey;
ALTER TABLE mcp_tool_customizations ADD CONSTRAINT mcp_tool_customizations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE mcp_server_customizations DROP CONSTRAINT IF EXISTS mcp_server_customizations_user_id_fkey;
ALTER TABLE mcp_server_customizations ADD CONSTRAINT mcp_server_customizations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workflows DROP CONSTRAINT IF EXISTS workflows_user_id_fkey;
ALTER TABLE workflows ADD CONSTRAINT workflows_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Ensure updated_at trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment to document the changes
COMMENT ON TABLE users IS 'Users table for Clerk integration with TEXT-based user IDs and proper constraints';
