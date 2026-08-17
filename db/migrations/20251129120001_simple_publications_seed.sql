-- Simple Publications Seed
-- Insert 5 sample publications for testing

-- Get first 5 projects
WITH sample_projects AS (
  SELECT id, title, created_at, updated_at
  FROM projects
  LIMIT 5
)
INSERT INTO publications (project_id, published_url, published_at, metadata)
SELECT 
  id,
  'https://' || LOWER(REPLACE(title, ' ', '-')) || '.vercel.app',
  created_at + INTERVAL '2 hours',
  '{"vercelProjectId": "prj_test123", "deploymentStatus": "READY", "framework": "html"}'::jsonb
FROM sample_projects;

-- Verify
SELECT COUNT(*) as total_publications FROM publications;
