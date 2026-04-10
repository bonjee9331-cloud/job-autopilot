create table if not exists jobs (
  id text primary key,
  title text not null,
  company text not null,
  location text,
  remote boolean default true,
  salary text,
  source text,
  fit_score integer,
  status text default 'new',
  jd_summary text,
  created_at timestamptz default now()
);

create table if not exists applications (
  id text primary key,
  job_id text references jobs(id),
  status text not null,
  applied_at timestamptz,
  follow_up_due_at timestamptz,
  notes text
);

create table if not exists interviews (
  id text primary key,
  application_id text references applications(id),
  title text not null,
  interview_at timestamptz,
  prep_pack text,
  calendar_event_id text
);
