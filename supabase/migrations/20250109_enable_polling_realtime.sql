-- =============================================================================
-- ENABLE SUPABASE REALTIME FOR LIVE POLL TABLES
-- =============================================================================
-- This migration enables real-time subscriptions for Live Poll tables
-- Required for live distribution updates and participant synchronization
-- =============================================================================

-- Enable realtime for poll_responses (critical for host view updates)
ALTER PUBLICATION supabase_realtime ADD TABLE poll_responses;

-- Enable realtime for poll_participants (for participant count updates)
ALTER PUBLICATION supabase_realtime ADD TABLE poll_participants;

-- Enable realtime for poll_sessions (for status changes: pause/resume)
ALTER PUBLICATION supabase_realtime ADD TABLE poll_sessions;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Realtime enabled for Live Poll tables!';
  RAISE NOTICE 'Enabled tables: poll_responses, poll_participants, poll_sessions';
  RAISE NOTICE 'Hosts will receive real-time distribution updates';
  RAISE NOTICE 'Participants will receive real-time session status changes';
END $$;
