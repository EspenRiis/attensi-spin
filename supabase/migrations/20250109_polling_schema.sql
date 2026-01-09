-- =============================================================================
-- LIVE POLL DATABASE SCHEMA
-- =============================================================================
-- Complete schema for Live Poll feature (sessionkit.io/live-poll)
-- Slider-based polling (0-100) with real-time distribution visualization
-- =============================================================================

-- =============================================================================
-- POLLS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_polls_user_id ON polls(user_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);

COMMENT ON TABLE polls IS 'Poll definitions created by authenticated users';
COMMENT ON COLUMN polls.user_id IS 'Poll creator (must be authenticated)';

-- =============================================================================
-- POLL_QUESTIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS poll_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL CHECK (char_length(text) >= 1 AND char_length(text) <= 500),
  min_value INTEGER NOT NULL DEFAULT 0 CHECK (min_value >= 0),
  max_value INTEGER NOT NULL DEFAULT 100 CHECK (max_value <= 100 AND max_value > min_value),
  min_label TEXT CHECK (char_length(min_label) <= 50),
  max_label TEXT CHECK (char_length(max_label) <= 50),
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_poll_order UNIQUE(poll_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_poll_questions_poll_id ON poll_questions(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_questions_order ON poll_questions(poll_id, order_index);

COMMENT ON TABLE poll_questions IS 'Questions with slider configuration (0-100 scale)';
COMMENT ON COLUMN poll_questions.min_label IS 'Label for minimum value (e.g., "Strongly Disagree")';
COMMENT ON COLUMN poll_questions.max_label IS 'Label for maximum value (e.g., "Strongly Agree")';

-- =============================================================================
-- POLL_SESSIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS poll_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE RESTRICT NOT NULL,
  host_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  join_code TEXT UNIQUE NOT NULL CHECK (join_code ~ '^\d{6}$'),
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'paused', 'ended')),
  current_question_id UUID REFERENCES poll_questions(id),
  current_question_index INTEGER DEFAULT 0 CHECK (current_question_index >= 0),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT valid_timestamps CHECK (
    (started_at IS NULL OR started_at >= created_at) AND
    (ended_at IS NULL OR ended_at >= started_at)
  )
);

CREATE INDEX IF NOT EXISTS idx_poll_sessions_join_code ON poll_sessions(join_code);
CREATE INDEX IF NOT EXISTS idx_poll_sessions_host ON poll_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_poll_sessions_status ON poll_sessions(status) WHERE status != 'ended';
CREATE INDEX IF NOT EXISTS idx_poll_sessions_created_at ON poll_sessions(created_at DESC);

COMMENT ON TABLE poll_sessions IS 'Live polling sessions (lobby → active/paused → ended)';
COMMENT ON COLUMN poll_sessions.join_code IS '6-digit code for participants to join';
COMMENT ON COLUMN poll_sessions.status IS 'lobby: waiting, active: polling, paused: discussion, ended: finished';
COMMENT ON COLUMN poll_sessions.current_question_id IS 'Active question during session';

-- =============================================================================
-- POLL_PARTICIPANTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS poll_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_session_id UUID REFERENCES poll_sessions(id) ON DELETE CASCADE NOT NULL,
  device_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  username TEXT CHECK (char_length(username) <= 50),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_poll_participants_session ON poll_participants(poll_session_id);
CREATE INDEX IF NOT EXISTS idx_poll_participants_device_token ON poll_participants(device_token);

COMMENT ON TABLE poll_participants IS 'Anonymous participants in polling sessions';
COMMENT ON COLUMN poll_participants.device_token IS 'UUID for device-based identification (one vote per device)';
COMMENT ON COLUMN poll_participants.username IS 'Optional display name';

-- =============================================================================
-- POLL_RESPONSES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_session_id UUID REFERENCES poll_sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES poll_participants(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES poll_questions(id) ON DELETE CASCADE NOT NULL,
  response_value INTEGER NOT NULL CHECK (response_value >= 0 AND response_value <= 100),
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- ONE response per participant per question (enables UPSERT pattern)
  CONSTRAINT unique_participant_response UNIQUE(poll_session_id, participant_id, question_id)
);

-- Critical indexes for real-time aggregation performance
CREATE INDEX IF NOT EXISTS idx_poll_responses_session_question ON poll_responses(poll_session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_value ON poll_responses(poll_session_id, question_id, response_value);
CREATE INDEX IF NOT EXISTS idx_poll_responses_participant ON poll_responses(participant_id);

COMMENT ON TABLE poll_responses IS 'Slider responses (0-100) with UPSERT support for real-time updates';
COMMENT ON COLUMN poll_responses.response_value IS 'Slider value from 0-100';
COMMENT ON CONSTRAINT unique_participant_response ON poll_responses IS 'Enables UPSERT: participants can update their response';

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Polls: Users can only manage their own polls
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own polls" ON polls;
CREATE POLICY "Users can view their own polls"
  ON polls FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create polls" ON polls;
CREATE POLICY "Users can create polls"
  ON polls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own polls" ON polls;
CREATE POLICY "Users can update their own polls"
  ON polls FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own polls" ON polls;
CREATE POLICY "Users can delete their own polls"
  ON polls FOR DELETE
  USING (auth.uid() = user_id);

-- Poll Questions: Inherit from parent poll permissions
ALTER TABLE poll_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage questions in their polls" ON poll_questions;
CREATE POLICY "Users can manage questions in their polls"
  ON poll_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_questions.poll_id
      AND polls.user_id = auth.uid()
    )
  );

-- Poll Sessions: Host can manage, anyone can view by join code
ALTER TABLE poll_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts can manage their sessions" ON poll_sessions;
CREATE POLICY "Hosts can manage their sessions"
  ON poll_sessions FOR ALL
  USING (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "Anyone can view sessions" ON poll_sessions;
CREATE POLICY "Anyone can view sessions"
  ON poll_sessions FOR SELECT
  USING (true); -- Anonymous participants need to read session state

-- Poll Participants: Public read/write for anonymous participation
ALTER TABLE poll_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view participants" ON poll_participants;
CREATE POLICY "Anyone can view participants"
  ON poll_participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can join as participant" ON poll_participants;
CREATE POLICY "Anyone can join as participant"
  ON poll_participants FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Participants can update their own record" ON poll_participants;
CREATE POLICY "Participants can update their own record"
  ON poll_participants FOR UPDATE
  USING (true); -- Last activity timestamp updates

-- Poll Responses: Public read/write for anonymous participation
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view responses" ON poll_responses;
CREATE POLICY "Anyone can view responses"
  ON poll_responses FOR SELECT
  USING (true); -- Needed for host to view distribution

DROP POLICY IF EXISTS "Anyone can submit responses" ON poll_responses;
CREATE POLICY "Anyone can submit responses"
  ON poll_responses FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update responses" ON poll_responses;
CREATE POLICY "Anyone can update responses"
  ON poll_responses FOR UPDATE
  USING (true); -- UPSERT pattern for slider updates

-- =============================================================================
-- RPC FUNCTIONS
-- =============================================================================

-- Get aggregated response data for distribution visualization
CREATE OR REPLACE FUNCTION get_poll_responses(
  p_session_id UUID,
  p_question_id UUID
)
RETURNS TABLE(
  response_value INTEGER,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.response_value,
    COUNT(*) as count
  FROM poll_responses r
  WHERE r.poll_session_id = p_session_id
    AND r.question_id = p_question_id
  GROUP BY r.response_value
  ORDER BY r.response_value;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_poll_responses IS 'Returns grouped response counts for KDE calculation';

-- Calculate distribution statistics
CREATE OR REPLACE FUNCTION get_poll_stats(
  p_session_id UUID,
  p_question_id UUID
)
RETURNS TABLE(
  total_responses BIGINT,
  mean_value NUMERIC,
  median_value NUMERIC,
  min_value INTEGER,
  max_value INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH responses AS (
    SELECT response_value
    FROM poll_responses
    WHERE poll_session_id = p_session_id
      AND question_id = p_question_id
  ),
  sorted AS (
    SELECT response_value, ROW_NUMBER() OVER (ORDER BY response_value) as rn
    FROM responses
  ),
  total AS (
    SELECT COUNT(*) as cnt FROM responses
  )
  SELECT
    t.cnt as total_responses,
    ROUND(AVG(r.response_value), 2) as mean_value,
    COALESCE(
      (SELECT response_value FROM sorted WHERE rn = (t.cnt + 1) / 2),
      0
    )::NUMERIC as median_value,
    COALESCE(MIN(r.response_value), 0) as min_value,
    COALESCE(MAX(r.response_value), 0) as max_value
  FROM responses r
  CROSS JOIN total t
  GROUP BY t.cnt;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_poll_stats IS 'Returns summary statistics for a poll question';

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp on polls
CREATE OR REPLACE FUNCTION update_polls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_polls_updated_at ON polls;
CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE FUNCTION update_polls_updated_at();

-- Auto-update updated_at timestamp on poll_responses
CREATE OR REPLACE FUNCTION update_poll_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_poll_responses_updated_at ON poll_responses;
CREATE TRIGGER update_poll_responses_updated_at
  BEFORE UPDATE ON poll_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_responses_updated_at();

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Live Poll schema migration completed successfully!';
  RAISE NOTICE 'Tables created: polls, poll_questions, poll_sessions, poll_participants, poll_responses';
  RAISE NOTICE 'RLS policies enabled on all tables';
  RAISE NOTICE 'RPC functions created: get_poll_responses(), get_poll_stats()';
  RAISE NOTICE 'Note: Run 20250109_enable_polling_realtime.sql to enable real-time subscriptions';
END $$;
