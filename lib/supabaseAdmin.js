import { createClient } from '@supabase/supabase-js';

let client;

export function getSupabaseAdmin() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  client = createClient(url, key, {
    auth: { persistSession: false }
  });

  return client;
}
