import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Guard against missing env vars: createClient throws if URL/key are undefined
export const supabaseAvailable = !!(url && anonKey);

export const supabase = supabaseAvailable
  ? createClient(url, anonKey, { auth: { persistSession: false } })
  : (null as unknown as SupabaseClient); // callers must check supabaseAvailable before using
