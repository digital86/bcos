// Re-export the main Supabase client from supabase.ts to avoid multiple instances
// This ensures we only have ONE Supabase client instance in the entire app
import { supabase } from './supabase';

export { supabase };
export default supabase;
