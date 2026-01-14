-- Add is_activated column to milestones table
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS is_activated BOOLEAN DEFAULT FALSE;

-- Update existing milestones: those with status=1 should be activated
UPDATE milestones SET is_activated = TRUE WHERE status = 1;
