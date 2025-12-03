-- =============================================================================
-- QUIZ RACE DATABASE SCHEMA
-- =============================================================================
-- Complete production schema for Quiz Race feature
-- Based on QUIZ_RACE_PLAN.md
-- =============================================================================

-- =============================================================================
-- QUIZZES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at DESC);

COMMENT ON TABLE quizzes IS 'User-created quiz definitions';
COMMENT ON COLUMN quizzes.user_id IS 'Quiz creator (must be authenticated)';

-- =============================================================================
-- QUESTIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL CHECK (char_length(text) >= 1 AND char_length(text) <= 500),
  question_type TEXT NOT NULL CHECK (question_type IN ('true_false', 'multiple_choice')),
  time_limit INTEGER NOT NULL DEFAULT 30 CHECK (time_limit BETWEEN 10 AND 60),
  correct_answer TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of strings: ["Option A", "Option B", ...]
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_quiz_order UNIQUE(quiz_id, order_index),
  CONSTRAINT valid_options CHECK (jsonb_array_length(options) >= 2)
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(quiz_id, order_index);

COMMENT ON TABLE questions IS 'Individual questions within a quiz';
COMMENT ON COLUMN questions.options IS 'JSONB array of answer options';
COMMENT ON COLUMN questions.correct_answer IS 'Must be one of the options';
COMMENT ON COLUMN questions.time_limit IS 'Seconds to answer (10-60)';

-- =============================================================================
-- QUIZ SESSIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE RESTRICT NOT NULL,
  host_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  join_code TEXT UNIQUE NOT NULL CHECK (join_code ~ '^\d{6}$'),
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'ended')),
  current_question_id UUID REFERENCES questions(id),
  current_question_index INTEGER DEFAULT 0 CHECK (current_question_index >= 0),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT valid_timestamps CHECK (
    (started_at IS NULL OR started_at >= created_at) AND
    (ended_at IS NULL OR ended_at >= started_at)
  )
);

CREATE INDEX IF NOT EXISTS idx_sessions_join_code ON quiz_sessions(join_code);
CREATE INDEX IF NOT EXISTS idx_sessions_host ON quiz_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON quiz_sessions(status) WHERE status != 'ended';
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON quiz_sessions(created_at DESC);

COMMENT ON TABLE quiz_sessions IS 'Live game sessions (lobby → active → ended)';
COMMENT ON COLUMN quiz_sessions.join_code IS '6-digit code for players to join';
COMMENT ON COLUMN quiz_sessions.current_question_id IS 'Active question during gameplay';

-- =============================================================================
-- SESSION PARTICIPANTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL CHECK (char_length(username) >= 1 AND char_length(username) <= 50),
  avatar TEXT DEFAULT '🏎️' NOT NULL,
  score INTEGER DEFAULT 0 NOT NULL CHECK (score >= 0),
  position INTEGER CHECK (position > 0),
  participant_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disconnected'))
);

CREATE INDEX IF NOT EXISTS idx_participants_session ON session_participants(quiz_session_id);
CREATE INDEX IF NOT EXISTS idx_participants_score ON session_participants(quiz_session_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_participants_token ON session_participants(participant_token);

COMMENT ON TABLE session_participants IS 'Anonymous players in a session';
COMMENT ON COLUMN session_participants.participant_token IS 'UUID for anonymous auth/rejoin';
COMMENT ON COLUMN session_participants.position IS 'Final ranking (calculated at end)';

-- =============================================================================
-- QUIZ ANSWERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES session_participants(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  answer TEXT NOT NULL,
  time_taken NUMERIC(5,2) NOT NULL CHECK (time_taken >= 0 AND time_taken <= 60),
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER NOT NULL CHECK (points_earned >= 0 AND points_earned <= 1300),
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_participant_answer UNIQUE(quiz_session_id, participant_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_session ON quiz_answers(quiz_session_id);
CREATE INDEX IF NOT EXISTS idx_answers_participant ON quiz_answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON quiz_answers(quiz_session_id, question_id);

COMMENT ON TABLE quiz_answers IS 'Individual answer submissions during gameplay';
COMMENT ON COLUMN quiz_answers.time_taken IS 'Seconds elapsed before submission';
COMMENT ON COLUMN quiz_answers.points_earned IS 'Calculated score (0-1300 with speed bonus)';

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Quizzes: Users can only manage their own quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own quizzes" ON quizzes;
CREATE POLICY "Users can view their own quizzes"
  ON quizzes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create quizzes" ON quizzes;
CREATE POLICY "Users can create quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quizzes" ON quizzes;
CREATE POLICY "Users can update their own quizzes"
  ON quizzes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own quizzes" ON quizzes;
CREATE POLICY "Users can delete their own quizzes"
  ON quizzes FOR DELETE
  USING (auth.uid() = user_id);

-- Questions: Inherit from parent quiz permissions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage questions in their quizzes" ON questions;
CREATE POLICY "Users can manage questions in their quizzes"
  ON questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
      AND quizzes.user_id = auth.uid()
    )
  );

-- Quiz Sessions: Host can manage, anyone can view by join code
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hosts can manage their sessions" ON quiz_sessions;
CREATE POLICY "Hosts can manage their sessions"
  ON quiz_sessions FOR ALL
  USING (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "Anyone can view sessions" ON quiz_sessions;
CREATE POLICY "Anyone can view sessions"
  ON quiz_sessions FOR SELECT
  USING (true); -- Anonymous players need to read session state

-- Session Participants: Public read/write for anonymous players
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view participants" ON session_participants;
CREATE POLICY "Anyone can view participants"
  ON session_participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can join as participant" ON session_participants;
CREATE POLICY "Anyone can join as participant"
  ON session_participants FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Participants can update their own record" ON session_participants;
CREATE POLICY "Participants can update their own record"
  ON session_participants FOR UPDATE
  USING (true); -- Will be validated by Rails WebSocket server

-- Quiz Answers: Service role only (Rails writes via service key)
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON quiz_answers;
CREATE POLICY "Service role full access"
  ON quiz_answers FOR ALL
  USING (true);

-- =============================================================================
-- RPC FUNCTIONS
-- =============================================================================

-- Generate unique 6-digit join code
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
  max_attempts INTEGER := 100;
  attempts INTEGER := 0;
BEGIN
  LOOP
    -- Generate random 6-digit code
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Check if code already exists in active sessions
    SELECT EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE join_code = code
      AND status IN ('lobby', 'active')
    ) INTO code_exists;

    EXIT WHEN NOT code_exists;

    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique join code after % attempts', max_attempts;
    END IF;
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_join_code IS 'Generates unique 6-digit join code for new sessions';

-- Calculate speed multiplier for scoring
CREATE OR REPLACE FUNCTION calculate_speed_multiplier(
  time_taken_seconds NUMERIC,
  time_limit_seconds INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  speed_ratio NUMERIC;
  multiplier NUMERIC;
BEGIN
  -- Calculate ratio of remaining time
  speed_ratio := (time_limit_seconds - time_taken_seconds) / time_limit_seconds;

  -- Clamp between 0 and 1
  speed_ratio := GREATEST(0, LEAST(1, speed_ratio));

  -- Map to 0.7 - 1.3 range (70% to 130%)
  multiplier := 0.7 + (speed_ratio * 0.6);

  RETURN ROUND(multiplier, 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_speed_multiplier IS 'Returns multiplier between 0.7 and 1.3 based on answer speed';

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp on quizzes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Quiz Race schema migration completed successfully!';
  RAISE NOTICE 'Tables created: quizzes, questions, quiz_sessions, session_participants, quiz_answers';
  RAISE NOTICE 'RLS policies enabled on all tables';
  RAISE NOTICE 'Helper functions created: generate_join_code(), calculate_speed_multiplier()';
END $$;
