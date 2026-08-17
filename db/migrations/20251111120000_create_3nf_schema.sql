-- Migration: Create 3NF normalized schema for CepatUsaha
-- This migration creates a fresh normalized database schema following Third Normal Form (3NF)
-- Requirements: 2.1, 2.2, 2.3, 2.4, 2.5

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) unique not null,
  name varchar(255),
  clerk_user_id varchar(255) unique not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_clerk_user_id on users(clerk_user_id);
create index if not exists idx_users_email on users(email);




-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title varchar(255) not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_projects_updated_at on projects(updated_at desc);






-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_project_id on sessions(project_id);
create index if not exists idx_sessions_started_at on sessions(started_at desc);





-- ============================================================================
-- CHAT_MESSAGES TABLE
-- ============================================================================
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  role varchar(20) not null check (role in ('user', 'ai', 'tool')),
  content text not null,
  timestamp timestamptz not null default now()
);

create index if not exists idx_chat_messages_session_id on chat_messages(session_id);
create index if not exists idx_chat_messages_timestamp on chat_messages(timestamp);




-- ============================================================================
-- FILES TABLE
-- ============================================================================
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  file_path varchar(500) not null,
  file_type varchar(50) not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_project_file_path unique(project_id, file_path)
);

create index if not exists idx_files_project_id on files(project_id);
create index if not exists idx_files_session_id on files(session_id);
create index if not exists idx_files_updated_at on files(updated_at desc);






-- ============================================================================
-- ASSETS TABLE
-- ============================================================================
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  asset_type varchar(50) not null,
  file_path varchar(500) not null,
  storage_url varchar(1000) not null,
  context text,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_assets_project_id on assets(project_id);
create index if not exists idx_assets_asset_type on assets(asset_type);
create index if not exists idx_assets_uploaded_at on assets(uploaded_at desc);





-- ============================================================================
-- PUBLICATIONS TABLE
-- ============================================================================
create table if not exists publications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  published_url varchar(1000) not null,
  published_at timestamptz not null default now(),
  metadata jsonb
);

create index if not exists idx_publications_project_id on publications(project_id);
create index if not exists idx_publications_published_at on publications(published_at desc);




-- ============================================================================
-- DEPENDENCIES TABLE
-- ============================================================================
create table if not exists dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  dep_type varchar(50) not null,
  dep_name varchar(255) not null,
  version varchar(50),
  added_at timestamptz not null default now(),
  constraint unique_project_dependency unique(project_id, dep_type, dep_name)
);

create index if not exists idx_dependencies_project_id on dependencies(project_id);
create index if not exists idx_dependencies_dep_type on dependencies(dep_type);





-- ============================================================================
-- ANALYTICS TABLE
-- ============================================================================
create table if not exists analytics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  event_type varchar(100) not null,
  detail jsonb,
  timestamp timestamptz not null default now()
);

create index if not exists idx_analytics_project_id on analytics(project_id);
create index if not exists idx_analytics_user_id on analytics(user_id);
create index if not exists idx_analytics_event_type on analytics(event_type);
create index if not exists idx_analytics_timestamp on analytics(timestamp desc);




-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update projects.updated_at when files are modified
create or replace function update_project_timestamp()
returns trigger as $$
begin
  update projects
  set updated_at = now()
  where id = new.project_id;
  return new;
end;
$$ language plpgsql;

create trigger files_update_project_timestamp
after insert or update on files
for each row execute function update_project_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table users is 'User accounts linked to Clerk authentication';
comment on table projects is 'User projects/websites being built';
comment on table sessions is 'Chat sessions for project work';
comment on table chat_messages is 'Individual messages within chat sessions';
comment on table files is 'Project files with version history';
comment on table assets is 'Uploaded assets (images, fonts, etc.)';
comment on table publications is 'Published website deployments';
comment on table dependencies is 'Project dependencies (npm packages, CDN links)';
comment on table analytics is 'User action and system event tracking';
