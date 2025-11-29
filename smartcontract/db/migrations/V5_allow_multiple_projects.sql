-- Add onchain project ID column
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS onchain_project_id BIGINT;

-- Drop old unique constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_escrow_address_key'
  ) THEN
    ALTER TABLE projects DROP CONSTRAINT projects_escrow_address_key;
  END IF;
END$$;

-- Add composite unique index
CREATE UNIQUE INDEX IF NOT EXISTS ux_projects_escrow_projectid
ON projects (escrow_address, onchain_project_id);
