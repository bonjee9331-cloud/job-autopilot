import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('saved_search_profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, profiles: data || [] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to load search profiles' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();
    const payload = {
      name: body.name || 'Sniper profile',
      target_titles: body.targetTitles || [],
      preferred_locations: body.preferredLocations || [],
      location: body.location || '',
      min_salary: body.minSalary || 0,
      remote_only: body.remoteOnly ?? true,
      excluded_keywords: body.excludedKeywords || [],
      strict_mode: body.strictMode ?? false,
      source_preferences: body.sourcePreferences || []
    };
    const { data, error } = await supabase.from('saved_search_profiles').insert(payload).select().single();
    if (error) throw error;
    return NextResponse.json({ ok: true, profile: data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || 'Failed to save search profile' }, { status: 500 });
  }
}
