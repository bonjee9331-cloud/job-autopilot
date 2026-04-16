-- Job Autopilot database schema.
-- Run this in the Supabase SQL editor against your project.
-- Safe to re-run... all statements use IF NOT EXISTS / ALTER IF NOT EXISTS.

create table if not exists jobs (
  id text primary key,
  title text not null,
  company text not null,
  location text,
  remote boolean default true,
  salary text,
  source text,
  source_id text,
  source_url text,
  fit_score integer,
  status text default 'discovered',
  jd_summary text,
  posted_at timestamptz,
  ingested_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Backfill new columns if the table already exists from an older deploy.
alter table jobs add column if not exists source_id text;
alter table jobs add column if not exists source_url text;
alter table jobs add column if not exists posted_at timestamptz;
alter table jobs add column if not exists ingested_at timestamptz default now();

-- Enforce one row per (source, source_id) so reruns idempotently upsert.
create unique index if not exists jobs_source_source_id_idx
  on jobs (source, source_id);

create index if not exists jobs_ingested_at_idx on jobs (ingested_at desc);
create index if not exists jobs_status_idx on jobs (status);

create table if not exists applications (
  id text primary key,
  job_id text references jobs(id) on delete set null,
  status text not null,
  applied_at timestamptz,
  follow_up_due_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create index if not exists applications_job_id_idx on applications (job_id);
create index if not exists applications_status_idx on applications (status);

create table if not exists interviews (
  id text primary key,
  application_id text references applications(id) on delete set null,
  title text not null,
  interview_at timestamptz,
  prep_pack text,
  calendar_event_id text,
  created_at timestamptz default now()
);

create index if not exists interviews_application_id_idx on interviews (application_id);

-- Analyses produced by /api/brain/analyze. One row per LLM run.
create table if not exists job_analyses (
  id uuid primary key default gen_random_uuid(),
  job_title text not null,
  company text not null,
  job_description text not null,
  keywords jsonb,
  strengths jsonb,
  gaps jsonb,
  tailored_summary text,
  tailored_skills jsonb,
  tailored_experience_bullets jsonb,
  resume_version_name text,
  resume_snapshot text,
  cover_letter text,
  fit_score integer,
  application_status text default 'draft',
  created_at timestamptz default now()
);

create index if not exists job_analyses_created_at_idx on job_analyses (created_at desc);
create index if not exists job_analyses_company_idx on job_analyses (company);
