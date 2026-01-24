-- Remove pg_net extension from public schema to satisfy linter (unused in this app)
DROP EXTENSION IF EXISTS pg_net CASCADE;