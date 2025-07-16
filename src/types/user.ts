import { z } from "zod";
import { Database } from "../../supabase/types";

// Database User type (from Supabase schema)
export type DatabaseUser = Database["public"]["Tables"]["users"]["Row"];
export type DatabaseUserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type DatabaseUserUpdate = Database["public"]["Tables"]["users"]["Update"];

// User preferences stored in JSON field
export type UserPreferences = {
  displayName?: string;
  profession?: string; // User's job or profession
  responseStyleExample?: string; // Example of preferred response style
};

// Application User type (combines database user with typed preferences)
export type AppUser = Omit<DatabaseUser, 'preferences'> & {
  preferences?: UserPreferences;
};

// Clerk user sync data (what we get from Clerk)
export type ClerkUserData = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};


// Zod schemas for validation
export const UserZodSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const UserPreferencesZodSchema = z.object({
  displayName: z.string().optional(),
  profession: z.string().optional(),
  responseStyleExample: z.string().optional(),
});

export const ClerkUserDataZodSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().nullable(),
});
