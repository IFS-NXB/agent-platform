# Clerk Authentication Migration Guide

This guide covers the complete migration from better-auth to Clerk authentication for the agent-platform project.

## Overview

This migration involves:

- Replacing better-auth with Clerk authentication
- Updating authentication middleware
- Modifying database schema
- Updating UI components and pages
- Integrating Clerk's user management system

## Prerequisites

- Clerk account and application set up
- Environment variables configured
- Database ready for schema changes

## 1. Installation

### Remove better-auth dependencies

```bash
yarn remove better-auth
```

### Install Clerk

```bash
yarn add @clerk/nextjs@latest
```

## 2. Environment Variables

### Remove better-auth variables

Remove or comment out these variables from `.env`:

```env
# Remove these better-auth variables
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISABLE_SIGN_UP=
NO_HTTPS=
```

### Add Clerk variables

Add these to your `.env`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

also remember to update .env.example!

## 3. Middleware Replacement

### Replace `src/middleware.ts`

Replace the entire contents with:

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

## 4. Provider Updates

### Update `src/app/providers.tsx`

Add ClerkProvider to the providers:

```typescript
"use client";

import {
  ThemeProvider,
  ThemeStyleProvider,
} from "@/components/layouts/theme-provider";
import { HeroUIProvider } from "@heroui/react";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        themes={["light", "dark"]}
        storageKey="app-theme"
        disableTransitionOnChange
      >
        <ThemeStyleProvider>
          <HeroUIProvider>
            <div id="root">
              {children}
              <Toaster richColors />
            </div>
          </HeroUIProvider>
        </ThemeStyleProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
```

## 5. Authentication Library Replacement

### Replace `src/lib/auth/client.ts`

```typescript
"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export const useAuthClient = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return {
    user,
    signOut: handleSignOut,
  };
};
```

### Replace `src/lib/auth/server.ts`

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const getSession = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return { userId };
};

export const getCurrentUser = async () => {
  const { userId } = await auth();
  return userId;
};
```

## 6. Database Schema Updates

### Remove better-auth tables

Remove these schemas from `src/lib/db/pg/schema.pg.ts`:

- `SessionSchema`
- `AccountSchema`
- `VerificationSchema`

### Update UserSchema

Modify the UserSchema to work with Clerk:

```typescript
export const UserSchema = pgTable("user", {
  id: text("id").primaryKey().notNull(), // Clerk user ID
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  preferences: json("preferences").default({}).$type<UserPreferences>(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

## 7. API Routes Updates

### Replace `src/app/api/auth/[...all]/route.ts`

This file is no longer needed with Clerk. Delete it.

### Update `src/app/api/auth/actions.ts`

Replace with Clerk-compatible actions:

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { userRepository } from "lib/db/repository";

export async function syncUserAction() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Sync user data from Clerk to local database
  // This will be called from webhook or client-side
  return userId;
}
```

## 8. Authentication Pages

### Replace `src/app/(auth)/sign-in/page.tsx`

```typescript
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-background border-none shadow-none",
          },
        }}
      />
    </div>
  );
}
```

### Replace `src/app/(auth)/sign-up/page.tsx`

```typescript
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-background border-none shadow-none",
          },
        }}
      />
    </div>
  );
}
```

## 9. Update Auth Layout

### Update `src/app/(auth)/layout.tsx`

```typescript
import { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
```

## 10. User Management Integration

Since you're using **Supabase** (I can see from your connection string), you can use Supabase's built-in Clerk integration! This is much simpler than webhooks.

### Option 1: Use Supabase + Clerk Integration (Recommended)

Supabase has native Clerk integration that handles user sync automatically:

1. **Enable Clerk Integration in Supabase Dashboard:**
   - Go to Authentication > Settings > Auth Providers
   - Enable "Clerk" provider
   - Add your Clerk configuration

2. **Configure Clerk to use Supabase:**
   - In your Clerk dashboard, go to Configure > Integrations
   - Add Supabase integration
   - Provide your Supabase URL and anon key

3. **Update your auth code to use Supabase client:**

   ```typescript
   // You might need to adjust your queries to use Supabase client
   // instead of direct database queries for user management
   ```

## 11. Component Updates

### Update user-related components

Replace any `authClient` usage with Clerk hooks:

```typescript
// Instead of:
// import { authClient } from "auth/client";

// Use:
import { useUser, useAuth } from "@clerk/nextjs";

// In components:
const { user } = useUser();
const { signOut } = useAuth();
```

### Update sidebar user component

In `src/components/layouts/app-sidebar-user.tsx`:

```typescript
import { UserButton, useUser } from "@clerk/nextjs";

export function AppSidebarUser() {
  const { user } = useUser();

  return (
    <div className="flex items-center gap-2 p-2">
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
          },
        }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{user?.fullName || "User"}</span>
        <span className="text-xs text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</span>
      </div>
    </div>
  );
}
```

## 13. Migration Steps

### Step 1: Backup

1. Create database backup
2. Commit current code state

### Step 2: Install and Configure

1. Install Clerk package
2. Set up environment variables
3. Configure Clerk dashboard

### Step 3: Update Code

1. Replace middleware
2. Update layout with ClerkProvider
3. Replace auth library files
4. Update database schema
5. Replace auth pages

### Step 4: Clean up

1. Remove better-auth files
2. Remove unused dependencies
3. Update documentation
