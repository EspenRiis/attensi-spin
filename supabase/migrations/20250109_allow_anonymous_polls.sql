-- =============================================================================
-- ALLOW ANONYMOUS POLLS
-- =============================================================================
-- Makes user_id nullable for instant polls without authentication
-- =============================================================================

-- Make user_id nullable in polls table
ALTER TABLE polls
  ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN polls.user_id IS 'Poll creator (nullable for anonymous instant polls)';

-- Make host_user_id nullable in poll_sessions table
ALTER TABLE poll_sessions
  ALTER COLUMN host_user_id DROP NOT NULL;

COMMENT ON COLUMN poll_sessions.host_user_id IS 'Session host (nullable for anonymous sessions)';

-- Update RLS policies to allow anonymous poll creation
DROP POLICY IF EXISTS "Users can create their own polls" ON polls;
CREATE POLICY "Users can create their own polls" ON polls
  FOR INSERT
  WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can view their own polls" ON polls;
CREATE POLICY "Users can view their own polls" ON polls
  FOR SELECT
  USING (
    user_id IS NULL OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own polls" ON polls;
CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE
  USING (
    user_id IS NULL OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete their own polls" ON polls;
CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE
  USING (
    user_id IS NULL OR user_id = auth.uid()
  );

-- Allow anonymous users to view all polls (for instant poll page)
DROP POLICY IF EXISTS "Anyone can view polls" ON polls;
CREATE POLICY "Anyone can view polls" ON polls
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to create sessions
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON poll_sessions;
CREATE POLICY "Anyone can create sessions" ON poll_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to view sessions
DROP POLICY IF EXISTS "Anyone can view sessions" ON poll_sessions;
CREATE POLICY "Anyone can view sessions" ON poll_sessions
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to update sessions (for host controls)
DROP POLICY IF EXISTS "Hosts can update their sessions" ON poll_sessions;
CREATE POLICY "Anyone can update sessions" ON poll_sessions
  FOR UPDATE
  TO anon
  USING (true);
