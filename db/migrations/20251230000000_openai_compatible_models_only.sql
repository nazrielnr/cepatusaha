alter table ai_models_config
  drop constraint if exists ai_models_config_provider_check;

alter table ai_models_config
  add constraint ai_models_config_provider_check
  check (provider = 'openai_compatible');

insert into ai_models_config (
  provider, model_name, model_identifier, api_endpoint, priority, is_active, capabilities, created_by
) values (
  'openai_compatible', 'Default model', 'gpt-4o-mini', 'https://api.openai.com/v1', 10, true, '{}'::jsonb, 'migration'
)
on conflict (provider, model_identifier) do nothing;

comment on table ai_models_config is 'OpenAI-compatible model configurations managed by admin dashboard.';
comment on column ai_models_config.provider is 'Provider type: openai_compatible only.';
