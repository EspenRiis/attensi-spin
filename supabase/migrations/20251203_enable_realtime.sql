-- =============================================================================
-- ENABLE REALTIME FOR QUIZ RACE TABLES
-- =============================================================================
-- This enables real-time subscriptions for the Quiz Race feature tables

-- Enable realtime for session_participants table
ALTER PUBLICATION supabase_realtime ADD TABLE session_participants;

-- Enable realtime for quiz_sessions table (for status changes)
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_sessions;

-- Verify realtime is enabled
DO $$
BEGIN
  RAISE NOTICE 'Realtime enabled for: session_participants, quiz_sessions';
END $$;
