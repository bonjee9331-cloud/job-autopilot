import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

export function getSupabase() {
  if (!supabaseClient) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

              if (!url || !key) {
                    throw new Error('Missing Supabase environment variables');
                        }

                            supabaseClient = createClient(url, key);
                              }

                                return supabaseClient;
                                }
