create table if not exists agent_designs (
  id text primary key,
  name text not null,
  description text not null default '',
  content text not null,
  size_chars integer not null,
  total_lines integer not null,
  source_url text not null,
  updated_at timestamptz not null default now()
);

create index if not exists agent_designs_name_idx on agent_designs (name);
