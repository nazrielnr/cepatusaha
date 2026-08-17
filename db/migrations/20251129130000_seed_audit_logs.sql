-- Migration: Seed Audit Logs
-- Description: Add sample audit log data for testing admin dashboard
-- Date: 2025-11-29

-- Insert sample audit logs
-- Note: Using the first user as admin for demo purposes

DO $$
DECLARE
  admin_id uuid;
  user_id uuid;
  session_id uuid;
  project_id uuid;
BEGIN
  -- Get first user as admin
  SELECT id INTO admin_id FROM users LIMIT 1;
  
  -- Get a sample user, session, and project for reference
  SELECT id INTO user_id FROM users ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO session_id FROM sessions ORDER BY started_at DESC LIMIT 1;
  SELECT id INTO project_id FROM projects ORDER BY created_at DESC LIMIT 1;

  -- Only proceed if we have an admin user
  IF admin_id IS NOT NULL THEN
    -- User management actions
    INSERT INTO admin_action_logs (admin_user_id, action_type, resource_type, resource_id, action_details, ip_address, user_agent, timestamp)
    VALUES 
      (admin_id, 'user_view', 'user', user_id::text, '{"action": "viewed_user_details"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '2 hours'),
      (admin_id, 'users_list', 'user', NULL, '{"filters": {"search": ""}, "limit": 50}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '3 hours'),
      (admin_id, 'user_sessions_view', 'user', user_id::text, '{"action": "viewed_user_sessions"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '4 hours');

    -- Chat monitoring actions
    IF session_id IS NOT NULL THEN
      INSERT INTO admin_action_logs (admin_user_id, action_type, resource_type, resource_id, action_details, ip_address, user_agent, timestamp)
      VALUES 
        (admin_id, 'chat_view', 'session', session_id::text, '{"action": "viewed_chat_session"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '5 hours'),
        (admin_id, 'chats_list', 'session', NULL, '{"filters": {}, "limit": 50}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '6 hours');
    END IF;

    -- System monitoring actions
    INSERT INTO admin_action_logs (admin_user_id, action_type, resource_type, resource_id, action_details, ip_address, user_agent, timestamp)
    VALUES 
      (admin_id, 'statistics_view', 'system', NULL, '{"action": "viewed_system_statistics"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '1 hour'),
      (admin_id, 'health_check', 'system', NULL, '{"action": "checked_system_health"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '30 minutes'),
      (admin_id, 'audit_logs_view', 'system', NULL, '{"filters": {}, "limit": 50}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '15 minutes');

    -- Token analytics actions
    INSERT INTO admin_action_logs (admin_user_id, action_type, resource_type, resource_id, action_details, ip_address, user_agent, timestamp)
    VALUES 
      (admin_id, 'tokens_view', 'analytics', NULL, '{"action": "viewed_token_usage"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '7 hours'),
      (admin_id, 'tokens_export', 'analytics', NULL, '{"format": "csv", "date_range": "last_7_days"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '8 hours');

    -- Storage management actions
    INSERT INTO admin_action_logs (admin_user_id, action_type, resource_type, resource_id, action_details, ip_address, user_agent, timestamp)
    VALUES 
      (admin_id, 'storage_view', 'storage', NULL, '{"action": "viewed_storage_metrics"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '9 hours'),
      (admin_id, 'assets_list', 'storage', NULL, '{"filters": {}, "limit": 50}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '10 hours');

    -- Model configuration actions
    INSERT INTO admin_action_logs (admin_user_id, action_type, resource_type, resource_id, action_details, ip_address, user_agent, timestamp)
    VALUES 
      (admin_id, 'models_view', 'ai_model', NULL, '{"action": "viewed_model_configuration"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '11 hours'),
      (admin_id, 'model_health_check', 'ai_model', NULL, '{"action": "checked_model_health"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '12 hours');

    -- Analytics actions
    INSERT INTO admin_action_logs (admin_user_id, action_type, resource_type, resource_id, action_details, ip_address, user_agent, timestamp)
    VALUES 
      (admin_id, 'analytics_view', 'analytics', NULL, '{"action": "viewed_user_analytics"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '13 hours'),
      (admin_id, 'functions_view', 'analytics', NULL, '{"action": "viewed_function_logs"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '14 hours'),
      (admin_id, 'dependencies_view', 'analytics', NULL, '{"action": "viewed_dependencies"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '15 hours'),
      (admin_id, 'publications_view', 'analytics', NULL, '{"action": "viewed_publications"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '16 hours');

    -- Add some older logs for timeline
    INSERT INTO admin_action_logs (admin_user_id, action_type, resource_type, resource_id, action_details, ip_address, user_agent, timestamp)
    VALUES 
      (admin_id, 'statistics_view', 'system', NULL, '{"action": "viewed_system_statistics"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '1 day'),
      (admin_id, 'users_list', 'user', NULL, '{"filters": {}, "limit": 50}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '2 days'),
      (admin_id, 'chats_list', 'session', NULL, '{"filters": {}, "limit": 50}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '3 days'),
      (admin_id, 'tokens_view', 'analytics', NULL, '{"action": "viewed_token_usage"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '4 days'),
      (admin_id, 'storage_view', 'storage', NULL, '{"action": "viewed_storage_metrics"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '5 days'),
      (admin_id, 'models_view', 'ai_model', NULL, '{"action": "viewed_model_configuration"}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '6 days'),
      (admin_id, 'audit_logs_view', 'system', NULL, '{"filters": {}, "limit": 50}'::jsonb, '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '7 days');

    RAISE NOTICE 'Successfully seeded % audit log entries', (SELECT COUNT(*) FROM admin_action_logs);
  ELSE
    RAISE NOTICE 'No users found - skipping audit log seed';
  END IF;
END $$;
