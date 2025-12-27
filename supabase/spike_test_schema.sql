-- =============================================================================
-- SPIKE TEST SCHEMA - Minimal tables to validate WebSocket architecture
-- =============================================================================
-- This is a simplified schema to test the core WebSocket functionality
-- Before building the full Quiz Race feature
-- =============================================================================

-- Test Sessions Table (simplified quiz_sessions)
CREATE TABLE IF NOT EXISTS test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  join_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_test_sessions_join_code ON test_sessions(join_code);

-- Test Participants Table (simplified session_participants)
CREATE TABLE IF NOT EXISTS test_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  participant_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_test_participants_session ON test_participants(test_session_id);
CREATE INDEX idx_test_participants_token ON test_participants(participant_token);

-- Test Messages Table (for WebSocket testing)
CREATE TABLE IF NOT EXISTS test_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES test_participants(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_test_messages_session ON test_messages(test_session_id);

-- =============================================================================
-- RLS POLICIES (Permissive for spike testing)
-- =============================================================================

ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view test sessions"
  ON test_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create test sessions"
  ON test_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update test sessions"
  ON test_sessions FOR UPDATE
  USING (true);

ALTER TABLE test_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage test participants"
  ON test_participants FOR ALL
  USING (true);

ALTER TABLE test_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage test messages"
  ON test_messages FOR ALL
  USING (true);

-- =============================================================================
-- RPC FUNCTION - Generate Join Code (for spike)
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_test_join_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 6-digit code
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Check if exists
    SELECT EXISTS (
      SELECT 1 FROM test_sessions WHERE join_code = code
    ) INTO code_exists;

    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TEST DATA (Optional - for manual testing)
-- =============================================================================

-- Uncomment to insert test data:
-- INSERT INTO test_sessions (join_code, status) VALUES ('123456', 'lobby');
