-- CRITICAL MIGRATION: Clerk + Supabase Schema Fix
-- This migration handles existing database schema and ensures compatibility

-- Create the workflow_node_kind_idx index if it doesn't exist
CREATE INDEX IF NOT EXISTS workflow_node_kind_idx ON workflow_nodes(kind);

-- Ensure users table exists with proper structure for Clerk
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

-- Drop existing policies if they exist and recreate them
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

-- Clean up old better-auth tables if they exist
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS verification CASCADE;

-- Ensure proper column types for Clerk integration
DO $$
BEGIN
    -- Check if user table exists with UUID and convert to TEXT
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user') THEN
        -- If old user table exists, migrate it to users table
        INSERT INTO users (id, email, name, image, preferences, created_at, updated_at)
        SELECT
            id::TEXT,
            COALESCE(email, ''),
            COALESCE(name, ''),
            image,
            preferences,
            created_at,
            updated_at
        FROM "user"
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            image = EXCLUDED.image,
            preferences = EXCLUDED.preferences,
            updated_at = EXCLUDED.updated_at;

        -- Drop the old user table
        DROP TABLE "user" CASCADE;
    END IF;
END $$;

-- Add comment to document the changes
COMMENT ON TABLE users IS 'Users table for Clerk integration with TEXT-based user IDs';
