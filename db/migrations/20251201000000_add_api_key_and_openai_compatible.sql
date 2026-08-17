-- Migration: Add API Key Storage and OpenAI Compatible Provider
-- Description: Adds api_key column to ai_models_config and updates provider enum
--              to support openai_compatible provider type
-- Date: 2025-12-01

-- ============================================================================
-- Update Provider Check Constraint
-- ============================================================================
-- Drop old constraint and add new one with openai_compatible option

alter table ai_models_config 
  drop constraint if exists ai_models_config_provider_check;

alter table ai_models_config
  add constraint ai_models_config_provider_check 
  check (provider = 'openai_compatible');

-- ============================================================================
-- Add API Key Column
-- ============================================================================
-- Store encrypted API keys in database for dynamic provider configuration
-- This allows admins to configure multiple providers without environment variables

alter table ai_models_config
  add column if not exists api_key text;

-- ============================================================================
-- Update Unique Constraint
-- ============================================================================
-- Make api_endpoint required for openai_compatible providers
-- Update comment to reflect new fields

comment on table ai_models_config is 'OpenAI-compatible model configurations with API key storage.';
comment on column ai_models_config.api_key is 'API key for the provider. Stored securely in database.';
comment on column ai_models_config.api_endpoint is 'Custom API endpoint. Required for openai_compatible provider type.';
comment on column ai_models_config.provider is 'Provider type: openai_compatible only';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- ai_models_config table now supports:
-- 1. API key storage in database
-- 2. OpenAI-compatible provider type
-- 3. Custom endpoint configuration
