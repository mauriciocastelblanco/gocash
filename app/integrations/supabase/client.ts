import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://pzjpzvtenbxyonmmochl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6anB6dnRlbmJ4eW9ubW1vY2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNjA5ODYsImV4cCI6MjA2NDgzNjk4Nn0.a9W5R0Tz6YynicSaOlY_HNvdmEfxlmKKuiK7m5Z4MJk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
