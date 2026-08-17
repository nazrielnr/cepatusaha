-- Seed Publications Data
-- This migration adds sample publication data for testing the admin dashboard

-- Insert sample publications for existing projects
INSERT INTO publications (project_id, published_url, published_at, metadata)
SELECT 
  p.id,
  'https://' || LOWER(REPLACE(p.title, ' ', '-')) || '-' || SUBSTRING(p.id::text, 1, 8) || '.vercel.app',
  p.created_at + INTERVAL '1 hour',
  jsonb_build_object(
    'vercelProjectId', 'prj_' || SUBSTRING(MD5(p.id::text), 1, 24),
    'vercelDeploymentId', 'dpl_' || SUBSTRING(MD5(p.id::text || p.created_at::text), 1, 24),
    'deploymentStatus', 'READY',
    'framework', 'html',
    'buildTime', FLOOR(RANDOM() * 60 + 30)::int,
    'customDomain', NULL
  )
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM publications pub WHERE pub.project_id = p.id
)
LIMIT 20;

-- Add some additional publications for projects that have been published multiple times
INSERT INTO publications (project_id, published_url, published_at, metadata)
SELECT 
  p.id,
  'https://' || LOWER(REPLACE(p.title, ' ', '-')) || '-' || SUBSTRING(p.id::text, 1, 8) || '.vercel.app',
  p.updated_at,
  jsonb_build_object(
    'vercelProjectId', 'prj_' || SUBSTRING(MD5(p.id::text), 1, 24),
    'vercelDeploymentId', 'dpl_' || SUBSTRING(MD5(p.id::text || p.updated_at::text), 1, 24),
    'deploymentStatus', 'READY',
    'framework', 'html',
    'buildTime', FLOOR(RANDOM() * 60 + 30)::int,
    'customDomain', NULL,
    'isUpdate', true
  )
FROM projects p
WHERE p.updated_at > p.created_at + INTERVAL '1 hour'
  AND EXISTS (SELECT 1 FROM publications pub WHERE pub.project_id = p.id)
LIMIT 10;

-- Add some publications with custom domains
UPDATE publications
SET metadata = metadata || jsonb_build_object('customDomain', 'example-' || SUBSTRING(id::text, 1, 8) || '.com')
WHERE id IN (
  SELECT id FROM publications ORDER BY RANDOM() LIMIT 3
);

-- Add some recent publications (last 7 days)
INSERT INTO publications (project_id, published_url, published_at, metadata)
SELECT 
  p.id,
  'https://' || LOWER(REPLACE(p.title, ' ', '-')) || '-' || SUBSTRING(p.id::text, 1, 8) || '.vercel.app',
  NOW() - (INTERVAL '1 day' * FLOOR(RANDOM() * 7)),
  jsonb_build_object(
    'vercelProjectId', 'prj_' || SUBSTRING(MD5(p.id::text), 1, 24),
    'vercelDeploymentId', 'dpl_' || SUBSTRING(MD5(RANDOM()::text), 1, 24),
    'deploymentStatus', 'READY',
    'framework', 'html',
    'buildTime', FLOOR(RANDOM() * 60 + 30)::int,
    'customDomain', NULL,
    'isRecent', true
  )
FROM projects p
WHERE EXISTS (SELECT 1 FROM publications pub WHERE pub.project_id = p.id)
ORDER BY RANDOM()
LIMIT 5;

-- Verify the data
DO $$
DECLARE
  pub_count INTEGER;
  project_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pub_count FROM publications;
  SELECT COUNT(DISTINCT project_id) INTO project_count FROM publications;
  
  RAISE NOTICE 'Publications seeded successfully!';
  RAISE NOTICE 'Total publications: %', pub_count;
  RAISE NOTICE 'Projects with publications: %', project_count;
END $$;
