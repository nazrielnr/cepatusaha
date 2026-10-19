import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serviceCode = readFileSync(new URL('../src/features/publications/service.ts', import.meta.url), 'utf8');
const vercelCode = readFileSync(new URL('../src/features/publications/vercel.ts', import.meta.url), 'utf8');
const routesCode = readFileSync(new URL('../src/features/publications/routes.ts', import.meta.url), 'utf8');

// Verify vercel.ts includes domain resolution, binary asset resolution, and strips ssoProtection
assert.match(vercelCode, /ssoProtection:\s*null/);
assert.match(vercelCode, /passwordProtection:\s*null/);
assert.match(vercelCode, /resolveFileBase64/);
assert.match(vercelCode, /ASSETS_BUCKET/);
assert.match(vercelCode, /resolveProjectDomain/);
assert.match(vercelCode, /domainUrl/);

// Verify service.ts reuses deployment, handles AI updates, locks race conditions, and disables direct workers
assert.match(serviceCode, /inFlightPublishes/);
assert.match(serviceCode, /projectLockKey/);
assert.match(serviceCode, /slugLockKey/);
assert.match(serviceCode, /conflictingRows/);
assert.match(serviceCode, /and p\.project_id != \$\{projectId\}/);
assert.match(serviceCode, /reused:\s*Boolean\(existing\?\.id\)/);
assert.match(serviceCode, /deploymentStatus:\s*'vercel_success'/);
assert.match(serviceCode, /Direct worker hosting dinonaktifkan/);
assert.match(serviceCode, /normalizeAssetReferences/);
assert.match(serviceCode, /\.gitkeep/);
assert.match(serviceCode, /package\.json/);
assert.match(serviceCode, /public\//);
assert.match(serviceCode, /deleteVercelProject/);

// Verify vercel.ts includes project isolation, domain resolution, binary asset resolution, and strips ssoProtection
assert.match(vercelCode, /ssoProtection:\s*null/);
assert.match(vercelCode, /passwordProtection:\s*null/);
assert.match(vercelCode, /resolveFileBase64/);
assert.match(vercelCode, /ASSETS_BUCKET/);
assert.match(vercelCode, /resolveProjectDomain/);
assert.match(vercelCode, /domainUrl/);
assert.match(vercelCode, /getVercelProject/);
assert.match(vercelCode, /deleteVercelProject/);

// Verify routes.ts has direct worker hosting disabled
assert.match(routesCode, /Direct worker publication hosting is disabled/);

console.log('publications.test: all assertions passed');
