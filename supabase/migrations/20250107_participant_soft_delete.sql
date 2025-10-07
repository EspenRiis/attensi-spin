-- ============================================
-- Participant Soft Delete (Archive System)
-- ============================================
-- Add status field to track active vs archived participants
-- Preserves complete history while allowing "Start Empty" to clear the wheel

-- Add status column (active or archived)
ALTER TABLE public.participants
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
CHECK (status IN ('active', 'archived'));

-- Add archived_at timestamp
ALTER TABLE public.participants
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Set all existing participants to active
UPDATE public.participants
SET status = 'active'
WHERE status IS NULL;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_event_status ON public.participants(event_id, status);

-- ============================================
-- NOTES:
-- ============================================
-- This allows "Start Empty" to archive participants instead of deleting them
-- Dashboard can show all participants (active + archived) for complete history
-- Wheel only loads active participants
-- Archived participants remain in database with all their data intact
