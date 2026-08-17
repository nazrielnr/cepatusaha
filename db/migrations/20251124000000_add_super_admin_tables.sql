-- Migration: Add Super Admin Dashboard Tables
-- Description: Creates tables for super admin functionality including model configuration,
--              role management, token tracking, error logging, and audit logging
-- Date: 2025-11-24

-- ============================================================================
-- AI Models Configuration Table
-- ============================================================================
-- Stores dynamic AI model configurations that can be managed through the admin dashboard
-- without requiring code changes or redeployment

create table if not exists ai_models_config (
  id uuid primary key default gen_random_uuid(),
  provider varchar(50) not null check (provider = 'openai_compatible'),
  model_name varchar(255) not null,
  model_identifier varchar(255) not null,
  api_endpoint varchar(1000),
  priority integer not null default 5,
  is_active boolean not null default true,
  capabilities jsonb not null,
  rate_limits jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by varchar(255) not null,
  constraint unique_provider_model unique(provider, model_identifier)
);

-- Indexes for efficient querying
create index idx_ai_models_config_provider on ai_models_config(provider);
create index idx_ai_models_config_is_active on ai_models_config(is_active);
create index idx_ai_models_config_priority on ai_models_config(priority desc);






-- Table comment
comment on table ai_models_config is 'Dynamic AI model configurations managed through admin dashboard';

-- ============================================================================
-- Super Admin Roles Table
-- ============================================================================
-- Tracks which users have super admin privileges for dashboard access

create table if not exists super_admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  clerk_user_id varchar(255) not null,
  granted_at timestamptz not null default now(),
  granted_by varchar(255) not null,
  constraint unique_super_admin_user unique(user_id)
);

-- Indexes for efficient lookups
create index idx_super_admin_roles_user_id on super_admin_roles(user_id);
create index idx_super_admin_roles_clerk_user_id on super_admin_roles(clerk_user_id);



-- Table comment
comment on table super_admin_roles is 'Tracks users with super admin privileges';

-- ============================================================================
-- Token Usage Tracking Table
-- ============================================================================
-- Tracks token consumption for AI model interactions for cost monitoring and analytics

create table if not exists token_usage (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  message_id uuid references chat_messages(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  model_id uuid references ai_models_config(id) on delete set null,
  model_name varchar(255) not null,
  role varchar(20) not null check (role in ('user', 'ai', 'tool')),
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null,
  estimated_cost decimal(10, 6),
  timestamp timestamptz not null default now()
);

-- Indexes for efficient querying and aggregation
create index idx_token_usage_session_id on token_usage(session_id);
create index idx_token_usage_user_id on token_usage(user_id);
create index idx_token_usage_project_id on token_usage(project_id);
create index idx_token_usage_model_id on token_usage(model_id);
create index idx_token_usage_timestamp on token_usage(timestamp desc);
create index idx_token_usage_user_timestamp on token_usage(user_id, timestamp desc);




-- Table comment
comment on table token_usage is 'Tracks token usage per message for cost monitoring and analytics';

-- ============================================================================
-- System Error Logs Table
-- ============================================================================
-- Tracks all system errors for monitoring, debugging, and health metrics

create table if not exists system_error_logs (
  id uuid primary key default gen_random_uuid(),
  error_type varchar(100) not null,
  error_code varchar(50) not null,
  error_message text not null,
  stack_trace text,
  user_id uuid references users(id) on delete set null,
  session_id uuid references sessions(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  endpoint varchar(255),
  http_status integer,
  request_details jsonb,
  timestamp timestamptz not null default now()
);

-- Indexes for efficient querying and filtering
create index idx_system_error_logs_error_type on system_error_logs(error_type);
create index idx_system_error_logs_error_code on system_error_logs(error_code);
create index idx_system_error_logs_timestamp on system_error_logs(timestamp desc);
create index idx_system_error_logs_user_id on system_error_logs(user_id);
create index idx_system_error_logs_session_id on system_error_logs(session_id);




-- Table comment
comment on table system_error_logs is 'Tracks all system errors for monitoring and debugging';

-- ============================================================================
-- Admin Action Logs Table
-- ============================================================================
-- Audit trail for all administrative actions performed through the dashboard

create table if not exists admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references users(id) on delete cascade,
  action_type varchar(100) not null,
  resource_type varchar(100) not null,
  resource_id varchar(255),
  action_details jsonb not null,
  ip_address varchar(45),
  user_agent text,
  timestamp timestamptz not null default now()
);

-- Indexes for efficient querying and audit trail analysis
create index idx_admin_action_logs_admin_user_id on admin_action_logs(admin_user_id);
create index idx_admin_action_logs_action_type on admin_action_logs(action_type);
create index idx_admin_action_logs_resource_type on admin_action_logs(resource_type);
create index idx_admin_action_logs_timestamp on admin_action_logs(timestamp desc);




-- Table comment
comment on table admin_action_logs is 'Audit trail for all administrative actions';

-- ============================================================================
-- Update Trigger for ai_models_config
-- ============================================================================
-- Automatically updates the updated_at timestamp when a model configuration is modified

create or replace function update_ai_models_config_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger ai_models_config_updated_at
  before update on ai_models_config
  for each row
  execute function update_ai_models_config_updated_at();

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All super admin dashboard tables have been created with appropriate indexes,
