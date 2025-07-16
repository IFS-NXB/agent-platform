-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (for Clerk users)
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = id);

-- Create chat_threads table
CREATE TABLE chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on chat_threads
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own threads" ON chat_threads
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can create own threads" ON chat_threads
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own threads" ON chat_threads
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own threads" ON chat_threads
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  parts JSONB NOT NULL,
  attachments JSONB,
  annotations JSONB,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own threads" ON chat_messages
  FOR SELECT USING (
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can create messages in own threads" ON chat_messages
  FOR INSERT WITH CHECK (
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Create mcp_servers table
CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCP servers are global, no RLS needed for now
-- But we can add user-specific servers later if needed

-- Create mcp_tool_customizations table
CREATE TABLE mcp_tool_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  mcp_server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tool_name, mcp_server_id)
);

-- Enable RLS on mcp_tool_customizations
ALTER TABLE mcp_tool_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tool customizations" ON mcp_tool_customizations
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can create own tool customizations" ON mcp_tool_customizations
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own tool customizations" ON mcp_tool_customizations
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own tool customizations" ON mcp_tool_customizations
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Create mcp_server_customizations table
CREATE TABLE mcp_server_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mcp_server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
  prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mcp_server_id)
);

-- Enable RLS on mcp_server_customizations
ALTER TABLE mcp_server_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own server customizations" ON mcp_server_customizations
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can create own server customizations" ON mcp_server_customizations
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own server customizations" ON mcp_server_customizations
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own server customizations" ON mcp_server_customizations
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Create workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT DEFAULT '0.1.0',
  name TEXT NOT NULL,
  icon JSONB,
  description TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'readonly')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on workflows
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workflows" ON workflows
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id OR visibility = 'public');

CREATE POLICY "Users can create own workflows" ON workflows
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own workflows" ON workflows
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own workflows" ON workflows
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Create workflow_nodes table
CREATE TABLE workflow_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT DEFAULT '0.1.0',
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  ui_config JSONB DEFAULT '{}',
  node_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on workflow_nodes.kind
CREATE INDEX IF NOT EXISTS workflow_node_kind_idx ON workflow_nodes(kind);

-- Enable RLS on workflow_nodes
ALTER TABLE workflow_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view nodes from own workflows" ON workflow_nodes
  FOR SELECT USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.jwt() ->> 'sub' OR visibility = 'public'
    )
  );

CREATE POLICY "Users can create nodes in own workflows" ON workflow_nodes
  FOR INSERT WITH CHECK (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update nodes in own workflows" ON workflow_nodes
  FOR UPDATE USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can delete nodes from own workflows" ON workflow_nodes
  FOR DELETE USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

-- Create workflow_edges table
CREATE TABLE workflow_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT DEFAULT '0.1.0',
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  source UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  target UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  ui_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on workflow_edges
ALTER TABLE workflow_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view edges from own workflows" ON workflow_edges
  FOR SELECT USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.jwt() ->> 'sub' OR visibility = 'public'
    )
  );

CREATE POLICY "Users can create edges in own workflows" ON workflow_edges
  FOR INSERT WITH CHECK (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update edges in own workflows" ON workflow_edges
  FOR UPDATE USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can delete edges from own workflows" ON workflow_edges
  FOR DELETE USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_servers_updated_at BEFORE UPDATE ON mcp_servers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_tool_customizations_updated_at BEFORE UPDATE ON mcp_tool_customizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_server_customizations_updated_at BEFORE UPDATE ON mcp_server_customizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_nodes_updated_at BEFORE UPDATE ON workflow_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
