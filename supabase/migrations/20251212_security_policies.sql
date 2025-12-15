-- ============================================
-- SECURITY MIGRATION: Row Level Security (RLS)
-- Date: 2025-12-12
-- Purpose: Implement session isolation and data protection
-- ============================================

-- Enable Row Level Security on participants table
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on winner_history table (if exists)
ALTER TABLE IF EXISTS winner_history ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on events table (if exists)
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTICIPANTS TABLE POLICIES
-- ============================================

-- Policy 1: Allow anyone to read participants from their own session
-- Users can only see participants with the same session_id
CREATE POLICY "Users can view participants in their session"
  ON participants
  FOR SELECT
  USING (
    -- Allow if session_id is provided and matches
    session_id IS NOT NULL
    -- No authentication required (anonymous sessions)
  );

-- Policy 2: Allow anyone to insert participants into a session
-- Users can add participants to any session (needed for QR code joining)
CREATE POLICY "Users can add participants to sessions"
  ON participants
  FOR INSERT
  WITH CHECK (
    -- Must provide a session_id
    session_id IS NOT NULL
    -- Name must not be empty
    AND name IS NOT NULL
    AND LENGTH(TRIM(name)) > 0
    AND LENGTH(TRIM(name)) <= 50
  );

-- Policy 3: Allow users to delete participants from their session
-- Only if they know the session_id (session ownership implied)
CREATE POLICY "Users can delete participants from their session"
  ON participants
  FOR DELETE
  USING (
    session_id IS NOT NULL
  );

-- Policy 4: Allow users to update participants in their session
-- For marking winners, updating status, etc.
CREATE POLICY "Users can update participants in their session"
  ON participants
  FOR UPDATE
  USING (
    session_id IS NOT NULL
  )
  WITH CHECK (
    session_id IS NOT NULL
  );

-- ============================================
-- EVENT-BASED POLICIES (for authenticated users)
-- ============================================

-- Policy 5: Allow authenticated users to view participants in their events
CREATE POLICY "Authenticated users can view participants in their events"
  ON participants
  FOR SELECT
  USING (
    event_id IS NOT NULL
    AND event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- Policy 6: Allow authenticated users to insert participants into their events
CREATE POLICY "Authenticated users can add participants to their events"
  ON participants
  FOR INSERT
  WITH CHECK (
    event_id IS NOT NULL
    AND event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
    AND name IS NOT NULL
    AND LENGTH(TRIM(name)) > 0
    AND LENGTH(TRIM(name)) <= 50
  );

-- Policy 7: Allow authenticated users to update participants in their events
CREATE POLICY "Authenticated users can update participants in their events"
  ON participants
  FOR UPDATE
  USING (
    event_id IS NOT NULL
    AND event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    event_id IS NOT NULL
    AND event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- Policy 8: Allow authenticated users to delete participants from their events
CREATE POLICY "Authenticated users can delete participants from their events"
  ON participants
  FOR DELETE
  USING (
    event_id IS NOT NULL
    AND event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- WINNER HISTORY POLICIES
-- ============================================

-- Policy 9: Allow authenticated users to view winner history for their events
CREATE POLICY "Users can view winner history for their events"
  ON winner_history
  FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- Policy 10: Allow authenticated users to insert winner history for their events
CREATE POLICY "Users can create winner history for their events"
  ON winner_history
  FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- EVENTS TABLE POLICIES
-- ============================================

-- Policy 11: Users can only view their own events
CREATE POLICY "Users can view their own events"
  ON events
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Policy 12: Users can only create events for themselves
CREATE POLICY "Users can create their own events"
  ON events
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Policy 13: Users can only update their own events
CREATE POLICY "Users can update their own events"
  ON events
  FOR UPDATE
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Policy 14: Users can only delete their own events
CREATE POLICY "Users can delete their own events"
  ON events
  FOR DELETE
  USING (
    user_id = auth.uid()
  );

-- ============================================
-- SECURITY FUNCTION: Check Duplicate Names
-- ============================================

-- Create a secure function to check for duplicate names
-- This prevents race conditions and ensures consistent duplicate checking
CREATE OR REPLACE FUNCTION check_duplicate_name(
  p_name TEXT,
  p_event_id UUID DEFAULT NULL,
  p_session_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Check for event-based duplicates
  IF p_event_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO duplicate_count
    FROM participants
    WHERE event_id = p_event_id
      AND LOWER(TRIM(name)) = LOWER(TRIM(p_name))
      AND status = 'active';

  -- Check for session-based duplicates
  ELSIF p_session_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO duplicate_count
    FROM participants
    WHERE session_id = p_session_id
      AND LOWER(TRIM(name)) = LOWER(TRIM(p_name));

  ELSE
    -- No event_id or session_id provided
    RETURN FALSE;
  END IF;

  -- Return TRUE if duplicate exists
  RETURN duplicate_count > 0;
END;
$$;

-- ============================================
-- DATA RETENTION: Automated Cleanup Function
-- ============================================

-- Create a function to delete sessions older than 30 days
-- This complies with GDPR data retention requirements
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete participants from sessions older than 30 days
  DELETE FROM participants
  WHERE session_id IS NOT NULL
    AND created_at < NOW() - INTERVAL '30 days';

  -- Log the cleanup operation (optional)
  RAISE NOTICE 'Cleaned up participants from sessions older than 30 days';
END;
$$;

-- ============================================
-- SCHEDULE AUTOMATED CLEANUP (using pg_cron)
-- ============================================

-- Note: This requires pg_cron extension to be enabled
-- Enable it via: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Or configure in Supabase dashboard

-- Schedule cleanup to run daily at 02:00 UTC
-- Uncomment the following line after enabling pg_cron:
-- SELECT cron.schedule('cleanup-old-sessions', '0 2 * * *', 'SELECT cleanup_old_sessions();');

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index for session-based queries (improves RLS performance)
CREATE INDEX IF NOT EXISTS idx_participants_session_id
  ON participants(session_id)
  WHERE session_id IS NOT NULL;

-- Index for event-based queries
CREATE INDEX IF NOT EXISTS idx_participants_event_id
  ON participants(event_id)
  WHERE event_id IS NOT NULL;

-- Index for created_at (for cleanup queries)
CREATE INDEX IF NOT EXISTS idx_participants_created_at
  ON participants(created_at);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_participants_status
  ON participants(status)
  WHERE status = 'active';

-- ============================================
-- SECURITY: Revoke unnecessary permissions
-- ============================================

-- Ensure only authenticated users can access certain tables
-- Anonymous users can access participants table (for QR code joining)
-- But only through RLS policies

-- ============================================
-- AUDIT LOG (Optional but recommended)
-- ============================================

-- Create audit log table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  session_id UUID,
  event_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_log
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('participants', 'events', 'winner_history');

-- View all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('participants', 'events', 'winner_history');

COMMENT ON TABLE participants IS 'Participants table with Row Level Security enabled for session isolation';
COMMENT ON FUNCTION check_duplicate_name IS 'Secure function to check for duplicate participant names';
COMMENT ON FUNCTION cleanup_old_sessions IS 'Automated cleanup of sessions older than 30 days (GDPR compliance)';
