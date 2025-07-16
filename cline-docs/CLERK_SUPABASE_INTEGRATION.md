# Clerk + Supabase Integration Guide

This document outlines the completed integration between Clerk authentication and Supabase database.

## Overview

The application now uses:

- **Clerk** for authentication (sign-in/sign-up, user management, session handling)
- **Supabase** for database operations with Row Level Security (RLS)
- **Official Clerk-Supabase integration** for seamless token passing

## Setup Complete

### 1. Environment Variables

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_KEY=your-anon-key
```

### 2. Supabase Client Configuration

#### Client-side Usage

```typescript
import { useSupabaseClient } from '@/lib/supabase/client'

function MyComponent() {
  const supabase = useSupabaseClient()

  // Use supabase client with automatic Clerk token authentication
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
}
```

#### Server-side Usage

```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = createServerSupabaseClient()

  // Use supabase client with automatic Clerk token authentication
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
}
```

## Migration Status: COMPLETED ✅

### ✅ 1. Import Paths Fixed

All import statements have been updated from `lib/db/repository` to `lib/supabase/repositories`:

- ✅ `src/app/api/workflow/route.ts`
- ✅ `src/app/(chat)/mcp/modify/[id]/page.tsx`
- ✅ `src/app/api/workflow/[id]/execute/route.ts`
- ✅ `src/app/api/workflow/[id]/route.ts`
- ✅ `src/app/api/mcp/server-customizations/[server]/route.ts`
- ✅ `src/app/api/workflow/[id]/structure/route.ts`
- ✅ `src/app/api/chat/temporary/route.ts`
- ✅ `src/app/api/mcp/tool-customizations/[server]/[tool]/route.ts`
- ✅ `src/app/api/mcp/tool-customizations/[server]/route.ts`
- ✅ `src/app/api/chat/[threadId]/route.ts`
- ✅ `src/app/api/chat/openai-realtime/route.ts`

### ✅ 2. Repository Methods Completed

All missing repository methods have been implemented:

**workflowRepository:**

- ✅ `selectAll()` - alias for `getWorkflows()`
- ✅ `save()` - upsert workflow data
- ✅ `selectById()` - alias for `getWorkflow()`
- ✅ `delete()` - delete workflow
- ✅ `saveStructure()` - save workflow nodes and edges

**chatRepository:**

- ✅ `selectThread()` - alias for `getThread()`
- ✅ `insertThread()` - insert new thread
- ✅ `insertMessages()` - batch insert messages
- ✅ `selectThreadInstructionsByProjectId()` - get project instructions
- ✅ `selectThreadInstructions()` - get thread instructions

**mcpServerCustomizationRepository:**

- ✅ `selectByUserIdAndMcpServerId()` - compatibility method
- ✅ `upsertMcpServerCustomization()` - compatibility method
- ✅ `deleteMcpServerCustomizationByMcpServerIdAndUserId()` - compatibility method

**mcpMcpToolCustomizationRepository:**

- ✅ `selectByUserIdAndMcpServerId()` - compatibility method
- ✅ `select()` - get specific tool customization
- ✅ `upsertToolCustomization()` - compatibility method
- ✅ `deleteToolCustomization()` - delete tool customization

### ✅ 3. TypeScript Errors Fixed

All TypeScript compilation errors have been resolved:

- ✅ Fixed missing methods in repository interfaces
- ✅ Fixed type errors with optional prompt fields
- ✅ Added proper error handling for database operations

### ✅ 4. Database Integration Complete

The application now uses:

- **Clerk** for authentication (sign-in/sign-up, user management, session handling)
- **Supabase** for database operations with Row Level Security (RLS)
- **Supabase repositories** for all database interactions

## Next Steps

### 1. Configure Clerk + Supabase Integration

1. **In Clerk Dashboard:**
   - Navigate to [Supabase integration setup](https://dashboard.clerk.com/setup/supabase)
   - Select your configuration options
   - Click **Activate Supabase integration**
   - Save the **Clerk domain**

2. **In Supabase Dashboard:**
   - Go to [Authentication > Sign In / Up](https://supabase.com/dashboard/project/_/auth/third-party)
   - Select **Add provider** and choose **Clerk**
   - Paste your **Clerk domain**

### 2. Set Up Row Level Security (RLS)

Create tables with RLS policies that use Clerk user IDs:

```sql
-- Example: Create a table with user_id that defaults to Clerk user ID
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub'
);

-- Enable RLS
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "User can view their own tasks"
ON "public"."tasks"
FOR SELECT
TO authenticated
USING (
  ((SELECT auth.jwt()->>'sub') = (user_id)::text)
);

CREATE POLICY "Users must insert their own tasks"
ON "public"."tasks"
AS permissive
FOR INSERT
TO authenticated
WITH CHECK (
  ((SELECT auth.jwt()->>'sub') = (user_id)::text)
);
```

### 3. Update Your Database Schema

You can now use Supabase for your database operations while keeping Clerk for authentication. The existing database schema (using Drizzle) can coexist with direct Supabase queries.

### 4. Example Implementation

```typescript
// Client-side component
'use client'
import { useSupabaseClient } from '@/lib/supabase/client'
import { useUser } from '@clerk/nextjs'

export default function TasksComponent() {
  const supabase = useSupabaseClient()
  const { user } = useUser()

  const loadTasks = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('tasks')
      .select('*')

    if (error) {
      console.error('Error loading tasks:', error)
      return
    }

    // Handle data
  }

  const createTask = async (name: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ name })

    if (error) {
      console.error('Error creating task:', error)
      return
    }

    // Handle success
  }
}
```

## Benefits of This Integration

1. **Seamless Authentication**: Clerk handles all authentication flows
2. **Secure Database Access**: Supabase RLS policies automatically use Clerk user IDs
3. **No Manual Token Management**: Clerk tokens are automatically passed to Supabase
4. **Scalable**: Both services handle scaling automatically
5. **Developer Experience**: Clean APIs for both authentication and database operations

## Migration Notes

- The existing Drizzle setup can continue to be used alongside Supabase queries
- Clerk user IDs are strings, so database user_id columns should be TEXT type
- RLS policies automatically restrict data based on the authenticated Clerk user
- No need for manual user synchronization between Clerk and Supabase
