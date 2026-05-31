import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

// Validate if real environment variables are provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl.trim() && 
  supabaseAnonKey.trim() &&
  supabaseUrl !== "your_supabase_project_url" &&
  supabaseAnonKey !== "your_supabase_publishable_key"
);

// Instantiate Supabase client only if it is fully configured
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
