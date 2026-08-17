create table if not exists agent_skill_refs (
  skill_id text not null references agent_skills(id) on delete cascade,
  path text not null,
  title text not null default '',
  description text not null default '',
  content text not null,
  size_chars int not null,
  updated_at timestamptz not null default now(),
  primary key (skill_id, path)
);

create index if not exists idx_agent_skill_refs_skill_id on agent_skill_refs(skill_id);
create index if not exists idx_agent_skill_refs_size on agent_skill_refs(size_chars);
