-- Battle Cat AI — Supabase Database Schema
-- Run this in the Supabase SQL editor to initialize the database.

-- Submissions: raw SMS ingestions
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  raw_message text not null,
  url text not null,
  source_type text not null check (source_type in ('tiktok', 'article', 'tweet', 'youtube', 'pdf', 'linkedin')),
  status text not null default 'received' check (status in ('received', 'extracting', 'processing', 'published', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

-- Tutorials: processed, published content
create table if not exists tutorials (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  body text not null,
  maturity_level smallint not null check (maturity_level between 0 and 4),
  level_relation text not null check (level_relation in ('level-up', 'level-practice', 'cross-level')),
  topics text[] not null default '{}',
  tags text[] not null default '{}',
  tools_mentioned text[] not null default '{}',
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  action_items text[] not null default '{}',
  source_urls text[] not null default '{}',
  source_count integer not null default 1,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sources: links between submissions and tutorials
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  tutorial_id uuid references tutorials(id) on delete set null,
  url text not null,
  source_type text not null,
  raw_text text,
  extracted_at timestamptz,
  created_at timestamptz not null default now()
);

-- User progress: bookmarks, completion, notes
create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- null for anonymous users tracked via local storage
  tutorial_id uuid not null references tutorials(id) on delete cascade,
  bookmarked boolean not null default false,
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, tutorial_id)
);

-- Indexes for common queries
create index if not exists idx_tutorials_level on tutorials(maturity_level);
create index if not exists idx_tutorials_slug on tutorials(slug);
create index if not exists idx_tutorials_published on tutorials(is_published);
create index if not exists idx_tutorials_topics on tutorials using gin(topics);
create index if not exists idx_tutorials_tags on tutorials using gin(tags);
create index if not exists idx_submissions_status on submissions(status);
create index if not exists idx_sources_tutorial on sources(tutorial_id);

-- Full-text search index on tutorials
alter table tutorials add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'C')
  ) stored;

create index if not exists idx_tutorials_fts on tutorials using gin(fts);

-- Auto-update updated_at on tutorials
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger tutorials_updated_at
  before update on tutorials
  for each row execute function update_updated_at();

create or replace trigger user_progress_updated_at
  before update on user_progress
  for each row execute function update_updated_at();
