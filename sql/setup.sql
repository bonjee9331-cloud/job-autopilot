create extension if not exists pgcrypto;

create table if not exists job_analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  job_title text,
  company text,
  job_description text,
  source text,
  apply_url text,
  location text,
  salary_text text,
  remote boolean default false,
  matched_title text,
  keywords jsonb default '[]'::jsonb,
  strengths jsonb default '[]'::jsonb,
  gaps jsonb default '[]'::jsonb,
  tailored_summary text,
  tailored_skills jsonb default '[]'::jsonb,
  tailored_experience_bullets jsonb default '[]'::jsonb,
  resume_version_name text,
  resume_snapshot text,
  cover_letter text,
  fit_score integer default 0,
  pipeline_status text default 'new',
  application_status text default 'draft',
  applied_at timestamptz,
  follow_up_due_at timestamptz,
  follow_up_status text default 'not_scheduled',
  notes text,
  attachments jsonb default '[]'::jsonb
);

create table if not exists saved_search_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  target_titles jsonb default '[]'::jsonb,
  preferred_locations jsonb default '[]'::jsonb,
  location text,
  min_salary integer default 0,
  remote_only boolean default true,
  excluded_keywords jsonb default '[]'::jsonb,
  strict_mode boolean default false,
  source_preferences jsonb default '[]'::jsonb
);

create table if not exists followup_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  trigger_type text not null,
  subject_template text not null,
  body_template text not null,
  days_after integer default 3,
  active boolean default true
);

insert into followup_templates (name, trigger_type, subject_template, body_template, days_after)
select 'Post interview follow-up', 'post_interview', 'Following up on our conversation for {{job_title}}',
'Hi {{company}},\n\nThank you again for the conversation regarding the {{job_title}} role. I remain highly interested in the opportunity and believe my background aligns strongly with the outcomes discussed.\n\nPlease let me know if there is any update on next steps.\n\nBest regards,\n{{candidate_name}}', 3
where not exists (select 1 from followup_templates where name = 'Post interview follow-up');
