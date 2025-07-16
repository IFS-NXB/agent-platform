import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

// Server-side authenticated Supabase client using official Clerk integration
export function createServerSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      const { getToken } = await auth();
      return await getToken();
    },
  });
}

// Basic Supabase client (for unauthenticated requests)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
