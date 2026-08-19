-- Migration: Plan subscription + monthly token quota + usage logs
-- Strategy: monthly hard cap (lazy reset on first use after UTC month rollover) + per-run cap enforced server-side.
-- Schema change note: for later billing, add a payments table and a webhook; quota columns below are the enforcement core.

alter table users
  add column if not exists plan text not null default 'free' check (plan in ('free', 'pro')),
  add column if not exists tokens_used_month bigint not null default 0,
  add column if not exists plan_period_start timestamptz not null default now();

create index if not exists idx_users_plan on users(plan);

create table if not exists token_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  run_id text,
  model varchar(255),
  prompt_tokens bigint not null default 0,
  completion_tokens bigint not null default 0,
  total_tokens bigint not null default 0,
  cost_usd numeric(12, 8) not null default 0,
  stopped_by_quota boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_token_usage_logs_user_id on token_usage_logs(user_id, created_at desc);
create index if not exists idx_token_usage_logs_session_id on token_usage_logs(session_id);
create index if not exists idx_token_usage_logs_created_at on token_usage_logs(created_at desc);
