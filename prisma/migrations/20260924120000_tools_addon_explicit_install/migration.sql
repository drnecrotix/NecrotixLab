-- Existing deployments without an explicit Tools record previously treated it as enabled.
-- A fresh database has no SiteSettings row yet, so it remains opt-in after seeding.
INSERT INTO "Page" ("id", "slug", "title", "status", "content", "createdAt", "updatedAt")
SELECT 'legacy-tools-addon-20260924', '__service-tools-config', 'Tools addon configuration', 'DRAFT',
       '{"version":8,"installed":true,"active":true,"packageVersion":"1.3.71"}'::jsonb,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "SiteSettings" WHERE "id" = 'default')
ON CONFLICT ("slug") DO NOTHING;
