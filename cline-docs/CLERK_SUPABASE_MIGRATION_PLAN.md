# Clerk + Supabase Migration Plan

## Overview

The database has been migrated from PostgreSQL to Supabase, and authentication is being migrated from better-auth to Clerk. However, there are inconsistencies in the session object structure throughout the codebase that need to be resolved.

## Current Issue

**CRITICAL**: The database schema still uses the old better-auth structure with UUID-based user IDs, but the code is trying to use Clerk (which uses text-based user IDs). This causes multiple issues:

1. The `getSession()` function returns `{ userId }` (text), but the codebase expects `{ user: { id } }`
2. Table names in the database don't match what the repositories expect
3. The `user.id` column is UUID but Clerk provides text IDs
4. Old better-auth tables (`account`, `session`, `verification`) still exist and need cleanup

**Database Schema Issues:**

- `chat_message` table (code expects `chat_messages`)
- `chat_thread` table (code expects `chat_threads`)
- `mcp_server` table (code expects `mcp_servers`)
- `mcp_server_custom_instructions` table (code expects `mcp_server_customizations`)
- `mcp_server_tool_custom_instructions` table (code expects `mcp_tool_customizations`)
- All user_id columns are UUID (should be TEXT for Clerk)

## Migration Plan

### Phase 0: Database Schema Fix (CRITICAL - MUST FIX FIRST)

**⚠️ CRITICAL: The database schema has major issues that must be resolved before anything else will work!**

#### 0.1 Fix Table Names in Database

The current database table names don't match what the repositories expect:

**Required Database Changes:**

```sql
-- Fix table names to match repository expectations
ALTER TABLE chat_message RENAME TO chat_messages;
ALTER TABLE chat_thread RENAME TO chat_threads;
ALTER TABLE mcp_server RENAME TO mcp_servers;
ALTER TABLE mcp_server_custom_instructions RENAME TO mcp_server_customizations;
ALTER TABLE mcp_server_tool_custom_instructions RENAME TO mcp_tool_customizations;
ALTER TABLE project RENAME TO projects;
ALTER TABLE workflow RENAME TO workflows;
ALTER TABLE workflow_node RENAME TO workflow_nodes;
ALTER TABLE workflow_edge RENAME TO workflow_edges;
```

#### 0.2 Fix User ID Column Types for Clerk Integration

**CRITICAL**: All user_id columns are UUID but Clerk uses text-based user IDs:

```sql
-- Change user table primary key to TEXT for Clerk
ALTER TABLE user ALTER COLUMN id TYPE TEXT;

-- Update all foreign key references to use TEXT
ALTER TABLE chat_threads ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE projects ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE workflows ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE mcp_server_customizations ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE mcp_tool_customizations ALTER COLUMN user_id TYPE TEXT;

-- Update foreign key constraints
ALTER TABLE chat_threads DROP CONSTRAINT chat_thread_user_id_user_id_fk;
ALTER TABLE chat_threads ADD CONSTRAINT chat_threads_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES "user"(id);

ALTER TABLE projects DROP CONSTRAINT project_user_id_user_id_fk;
ALTER TABLE projects ADD CONSTRAINT projects_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES "user"(id);

ALTER TABLE workflows DROP CONSTRAINT workflow_user_id_user_id_fk;
ALTER TABLE workflows ADD CONSTRAINT workflows_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES "user"(id);

ALTER TABLE mcp_server_customizations DROP CONSTRAINT mcp_server_custom_instructions_user_id_user_id_fk;
ALTER TABLE mcp_server_customizations ADD CONSTRAINT mcp_server_customizations_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES "user"(id);

ALTER TABLE mcp_tool_customizations DROP CONSTRAINT mcp_server_tool_custom_instructions_user_id_user_id_fk;
ALTER TABLE mcp_tool_customizations ADD CONSTRAINT mcp_tool_customizations_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES "user"(id);
```

#### 0.3 Clean Up Old Better-Auth Tables

**Remove old authentication tables that are no longer needed:**

```sql
-- Drop old better-auth tables
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS verification;
```

#### 0.4 Update Repository Table Names

**Update `src/lib/supabase/repositories.ts` to use correct table names:**

The current repositories are using plural table names, but your database has singular names (now fixed in 0.1). After running the SQL above, the repositories should work correctly.

### Phase 1: Fix Session Structure (CRITICAL - IMMEDIATE)

#### 1.1 Update `src/lib/auth/server.ts`

**Current:**

```typescript
export const getSession = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return { userId };
};
```

**Update to:**

```typescript
export const getSession = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return { user: { id: userId } };
};
```

#### 1.2 Add Missing Import in `src/app/api/chat/route.ts`

**Add this import:**

```typescript
import { getSession } from "lib/auth/server";
```

### Phase 2: Update All Repository Calls

#### 2.1 Fix Repository Method Names in API Routes

The following files need to be updated to use the new Supabase repository methods:

**Files to Update:**

- `src/app/api/chat/route.ts`
- `src/app/api/chat/actions.ts`
- `src/app/api/workflow/route.ts`
- `src/app/api/workflow/[id]/route.ts`
- `src/app/api/workflow/[id]/structure/route.ts`
- `src/app/api/workflow/[id]/execute/route.ts`
- `src/app/api/thread/route.ts`
- `src/app/api/user/preferences/route.ts`

**Repository Method Changes:**

- `chatRepository.selectThreadDetails()` → `chatRepository.getThread()`
- `chatRepository.insertThread()` → `chatRepository.createThread()`
- `chatRepository.insertMessage()` → `chatRepository.createMessage()`
- `chatRepository.upsertMessage()` → `chatRepository.createMessage()`
- `workflowRepository.selectAll()` → `workflowRepository.getWorkflows()`
- `workflowRepository.selectStructureById()` → `workflowRepository.selectStructureById()` (already exists)
- `workflowRepository.selectToolByIds()` → needs to be added to Supabase repositories

### Phase 3: Missing Repository Methods

#### 3.1 Add Missing Methods to `src/lib/supabase/repositories.ts`

**Add these methods to chatRepository:**

```typescript
async selectThreadDetails(threadId: string) {
  const supabase = createServerSupabaseClient();
  const { data: thread, error: threadError } = await supabase
    .from("chat_threads")
    .select("*, messages:chat_messages(*)")
    .eq("id", threadId)
    .single();

  if (threadError) {
    console.error("Error fetching thread details:", threadError);
    return null;
  }

  return thread;
},

async insertThread(thread: { id: string; title: string; userId: string; projectId?: string | null }) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({
      id: thread.id,
      title: thread.title,
      user_id: thread.userId,
      project_id: thread.projectId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error inserting thread:", error);
    throw error;
  }

  return data;
},

async insertMessage(message: any) {
  return this.createMessage(message);
},

async upsertMessage(message: any) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .upsert({
      id: message.id,
      thread_id: message.threadId,
      role: message.role,
      parts: message.parts,
      attachments: message.attachments,
      annotations: message.annotations,
      model: message.model,
    })
    .select()
    .single();

  if (error) {
    console.error("Error upserting message:", error);
    throw error;
  }

  return data;
},

async selectThreadInstructionsByProjectId(userId: string, projectId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("instructions")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching project instructions:", error);
    return null;
  }

  return data?.instructions;
},

async selectThreadInstructions(userId: string, threadId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("chat_threads")
    .select("project_id, projects(instructions)")
    .eq("id", threadId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching thread instructions:", error);
    return null;
  }

  return data?.projects?.instructions;
},
```

**Add these methods to workflowRepository:**

```typescript
async selectAll(userId: string) {
  return this.getWorkflows(userId);
},

async selectToolByIds(workflowIds: string[]) {
  if (workflowIds.length === 0) return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .in("id", workflowIds);

  if (error) {
    console.error("Error fetching workflow tools:", error);
    return [];
  }

  return data || [];
},
```

#### 3.2 Add Missing Methods to `src/lib/supabase/repositories.ts` - MCP

**Add these methods to mcpRepository:**

```typescript
async selectAllWithCustomizations(userId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("mcp_servers")
    .select(`
      *,
      customizations:mcp_server_customizations(*)
    `)
    .eq("customizations.user_id", userId);

  if (error) {
    console.error("Error fetching MCP servers with customizations:", error);
    return [];
  }

  return data || [];
},
```

### Phase 4: Update Specific API Routes

#### 4.1 `src/app/api/chat/route.ts`

**Issues to fix:**

1. Add missing `getSession` import
2. Update `chatRepository.selectThreadDetails()` calls
3. Update `chatRepository.insertThread()` calls
4. Update `chatRepository.insertMessage()` calls
5. Update `chatRepository.upsertMessage()` calls

#### 4.2 `src/app/api/workflow/route.ts`

**Issues to fix:**

1. Update `workflowRepository.selectAll()` calls
2. Update `workflowRepository.checkAccess()` calls

#### 4.3 `src/app/api/user/preferences/route.ts`

**Issues to fix:**

1. Update to use `session.user.id` instead of `session?.userId`

#### 4.4 `src/app/api/thread/route.ts`

**Issues to fix:**

1. Update `chatRepository.getThreads()` calls
2. Update parameter structure

#### 4.5 All MCP API routes

**Issues to fix:**

1. Update repository method calls
2. Ensure proper error handling
3. Update caching keys

### Phase 5: Database Schema Validation

#### 5.1 Verify Supabase Schema in `supabase/migrations/001_initial_schema.sql`

**Ensure these tables exist:**

- `users` (with Clerk user_id as primary key)
- `chat_threads`
- `chat_messages`
- `workflows`
- `workflow_nodes`
- `workflow_edges`
- `mcp_servers`
- `mcp_server_customizations`
- `mcp_tool_customizations`
- `projects`

#### 5.2 Update Row Level Security (RLS) Policies

**Ensure all tables have proper RLS policies:**

```sql
-- Example for chat_threads
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own threads"
ON chat_threads
FOR SELECT
TO authenticated
USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create their own threads"
ON chat_threads
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.jwt() ->> 'sub');
```

### Phase 6: Frontend Component Updates

#### 6.1 Update Components Using Auth

**Files to check:**

- `src/components/layouts/app-sidebar-user.tsx`
- `src/components/chat-preferences-content.tsx`
- `src/components/chat-greeting.tsx`
- Any other components using `useUser` from Clerk

### Phase 7: Environment Variables

#### 7.1 Verify Environment Variables in `.env`

**Required for Clerk:**

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

**Required for Supabase:**

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Phase 8: Testing & Validation

#### 8.1 Test Critical User Flows

1. **Authentication Flow:**
   - Sign in/sign up with Clerk
   - Session persistence
   - Redirect handling

2. **Chat Flow:**
   - Create new chat thread
   - Send messages
   - View chat history

3. **Workflow Flow:**
   - Create workflow
   - Execute workflow
   - View workflow results

4. **MCP Flow:**
   - Configure MCP servers
   - Use MCP tools
   - Customize MCP settings

#### 8.2 Database Integration Testing

1. **User Data Sync:**
   - Verify Clerk user data syncs to Supabase
   - Test user preferences
   - Test user-specific data isolation

2. **RLS Testing:**
   - Verify users can only access their own data
   - Test cross-user data isolation
   - Test admin/public access patterns

## Implementation Priority

### 🚨 CRITICAL PRIORITY (Fix FIRST - nothing will work without this)

1. **Run Phase 0 Database Schema Fixes** - Fix table names and user ID column types
2. **Update Supabase migration file** - Ensure schema is correct for future deploys

### HIGH PRIORITY (Fix immediately after database)

1. Fix `getSession()` structure in `src/lib/auth/server.ts`
2. Add missing import in `src/app/api/chat/route.ts`
3. Update repository method calls in chat API routes

### MEDIUM PRIORITY (Fix within 1-2 days)

1. Add missing repository methods
2. Update all workflow API routes
3. Fix MCP API routes

### LOW PRIORITY (Fix within 1 week)

1. Update frontend components
2. Comprehensive testing
3. Documentation updates

## Files That Need Updates

### Critical (Fix First)

- `src/lib/auth/server.ts` - Fix session structure
- `src/app/api/chat/route.ts` - Add import, update repository calls
- `src/lib/supabase/repositories.ts` - Add missing methods

### API Routes (Fix Second)

- `src/app/api/chat/actions.ts`
- `src/app/api/workflow/route.ts`
- `src/app/api/workflow/[id]/route.ts`
- `src/app/api/workflow/[id]/structure/route.ts`
- `src/app/api/workflow/[id]/execute/route.ts`
- `src/app/api/thread/route.ts`
- `src/app/api/user/preferences/route.ts`
- `src/app/api/mcp/route.ts`
- `src/app/api/mcp/server-customizations/[server]/route.ts`
- `src/app/api/mcp/tool-customizations/[server]/route.ts`
- `src/app/api/mcp/tool-customizations/[server]/[tool]/route.ts`
- `src/app/api/chat/[threadId]/route.ts`
- `src/app/api/chat/temporary/route.ts`
- `src/app/api/chat/openai-realtime/route.ts`

### Database & Schema (Fix Third)

- `supabase/migrations/001_initial_schema.sql` - Verify schema
- Add RLS policies as needed

### Frontend Components (Fix Fourth)

- `src/components/layouts/app-sidebar-user.tsx`
- `src/components/chat-preferences-content.tsx`
- `src/components/chat-greeting.tsx`

### Configuration (Verify)

- `.env` - Verify all required variables
- `.env.example` - Update with new variables
- `src/middleware.ts` - Verify Clerk middleware

## Success Criteria

1. ✅ All API routes return proper responses
2. ✅ Chat functionality works end-to-end
3. ✅ Workflow functionality works end-to-end
4. ✅ MCP functionality works end-to-end
5. ✅ User authentication works with Clerk
6. ✅ Database operations work with Supabase
7. ✅ RLS policies protect user data
8. ✅ No authentication errors in console
9. ✅ No database errors in console
10. ✅ Frontend components render correctly
