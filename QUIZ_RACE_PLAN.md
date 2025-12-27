# Quiz Race Implementation Plan

**Last Updated:** 2025-11-21
**Status:** Planning Phase
**Estimated Effort:** 28-36 hours
**Target Launch:** TBD

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [Rails WebSocket Server](#rails-websocket-server)
5. [Frontend Components](#frontend-components)
6. [WebSocket Message Protocol](#websocket-message-protocol)
7. [Implementation Phases](#implementation-phases)
8. [Risk Mitigation](#risk-mitigation)
9. [Deployment Guide](#deployment-guide)
10. [Testing Strategy](#testing-strategy)

---

## Executive Summary

### Goal
Add live quiz game feature to Attensi Spin platform, enabling hosts to create interactive quiz sessions with real-time gameplay, synchronized timers, and engaging leaderboards.

### Key Features
- **Quiz Builder**: WYSIWYG editor for creating quizzes with multiple question types
- **Host View**: Control panel with live leaderboard, answer statistics, and game controls
- **Player View**: Mobile-optimized gameplay with synchronized timers and instant feedback
- **Real-time Gameplay**: Sub-100ms latency using Rails ActionCable WebSockets
- **Anonymous Players**: Join via QR code/join code without registration
- **Authenticated Hosts**: Must sign in to create and manage quizzes

### Success Metrics
- 50+ concurrent players per session
- Timer sync within ±1 second across all devices
- <100ms answer submission latency
- Smooth leaderboard animations (60fps)
- Mobile-responsive player experience

---

## Architecture Overview

### Tech Stack Decision

**Hybrid Architecture: Supabase + Rails WebSocket**

```
┌─────────────────────────────────────────────────────────┐
│                   React Frontend (Vite)                 │
│  - Quiz Builder UI                                      │
│  - Host & Player Views                                  │
│  - Lobby Management                                     │
└────────────┬─────────────────────────┬──────────────────┘
             │                         │
             │                         │
      ┌──────▼──────┐          ┌──────▼───────────┐
      │  Supabase   │          │ Rails WebSocket  │
      │             │          │     Server       │
      │ - Auth      │          │                  │
      │ - Quiz CRUD │          │ - ActionCable    │
      │ - Session   │◄─────────┤ - Game Logic     │
      │   Setup     │   Reads/ │ - Timer Sync     │
      │ - History   │   Writes │ - Scoring        │
      └──────┬──────┘          └──────┬───────────┘
             │                        │
             └────────┬───────────────┘
                      │
              ┌───────▼────────┐
              │   PostgreSQL   │
              │  (Supabase)    │
              └────────────────┘
```

### Why This Architecture?

**Supabase Handles:**
- ✅ User authentication (existing system)
- ✅ Quiz CRUD operations (RLS for security)
- ✅ Session setup and persistence
- ✅ Historical data and analytics
- ✅ Easy React integration

**Rails WebSocket Handles:**
- ✅ Real-time gameplay (low latency required)
- ✅ Timer synchronization (server-authoritative)
- ✅ Answer validation and scoring
- ✅ Live leaderboard updates
- ✅ Team has Rails expertise

**Why Not Supabase Realtime Alone?**
- ❌ 50-200ms latency (too high for quiz gameplay)
- ❌ Rate limits on free tier (200 concurrent connections)
- ❌ Not optimized for high-frequency game state updates
- ❌ Timer sync would be unreliable

**Why Not Full Rails Backend?**
- Would require migrating existing Wheel & Squad Scramble features
- Lose Supabase RLS benefits
- More complex deployment
- Longer development time (+20 hours)

### Data Flow

**Quiz Creation:**
1. Host logs in via Supabase Auth
2. Creates quiz via direct Supabase API calls
3. Questions stored in PostgreSQL with RLS policies

**Session Setup:**
1. Host clicks "Start Session" on quiz
2. Supabase creates `quiz_session` record with unique join code
3. Players join via Supabase API (creates `session_participant` record)
4. Lobby shows real-time participant list (Supabase subscription)

**Live Gameplay:**
1. Host starts game → Status changes to "active"
2. Frontend switches to Rails WebSocket connection
3. All gameplay messages flow through ActionCable
4. Rails writes scores/answers back to Supabase database

**Post-Game:**
1. Rails marks session as "ended" in database
2. Frontend queries Supabase for results and history
3. Dashboard shows past sessions

---

## Database Schema

### Tables Overview

```
quizzes
  ├─ questions
  └─ quiz_sessions
       ├─ session_participants
       └─ quiz_answers
```

### Complete SQL Schema

```sql
-- =============================================================================
-- QUIZZES TABLE
-- =============================================================================
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at DESC);

COMMENT ON TABLE quizzes IS 'User-created quiz definitions';
COMMENT ON COLUMN quizzes.user_id IS 'Quiz creator (must be authenticated)';

-- =============================================================================
-- QUESTIONS TABLE
-- =============================================================================
CREATE TABLE questions (
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
  CONSTRAINT valid_options CHECK (jsonb_array_length(options) >= 2),
  CONSTRAINT correct_answer_in_options CHECK (options ? correct_answer)
);

CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_questions_order ON questions(quiz_id, order_index);

COMMENT ON TABLE questions IS 'Individual questions within a quiz';
COMMENT ON COLUMN questions.options IS 'JSONB array of answer options';
COMMENT ON COLUMN questions.correct_answer IS 'Must be one of the options';
COMMENT ON COLUMN questions.time_limit IS 'Seconds to answer (10-60)';

-- =============================================================================
-- QUIZ SESSIONS TABLE
-- =============================================================================
CREATE TABLE quiz_sessions (
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

CREATE INDEX idx_sessions_join_code ON quiz_sessions(join_code);
CREATE INDEX idx_sessions_host ON quiz_sessions(host_user_id);
CREATE INDEX idx_sessions_status ON quiz_sessions(status) WHERE status != 'ended';
CREATE INDEX idx_sessions_created_at ON quiz_sessions(created_at DESC);

COMMENT ON TABLE quiz_sessions IS 'Live game sessions (lobby → active → ended)';
COMMENT ON COLUMN quiz_sessions.join_code IS '6-digit code for players to join';
COMMENT ON COLUMN quiz_sessions.current_question_id IS 'Active question during gameplay';

-- =============================================================================
-- SESSION PARTICIPANTS TABLE
-- =============================================================================
CREATE TABLE session_participants (
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

CREATE INDEX idx_participants_session ON session_participants(quiz_session_id);
CREATE INDEX idx_participants_score ON session_participants(quiz_session_id, score DESC);
CREATE INDEX idx_participants_token ON session_participants(participant_token);

COMMENT ON TABLE session_participants IS 'Anonymous players in a session';
COMMENT ON COLUMN session_participants.participant_token IS 'UUID for anonymous auth/rejoin';
COMMENT ON COLUMN session_participants.position IS 'Final ranking (calculated at end)';

-- =============================================================================
-- QUIZ ANSWERS TABLE
-- =============================================================================
CREATE TABLE quiz_answers (
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

CREATE INDEX idx_answers_session ON quiz_answers(quiz_session_id);
CREATE INDEX idx_answers_participant ON quiz_answers(participant_id);
CREATE INDEX idx_answers_question ON quiz_answers(quiz_session_id, question_id);

COMMENT ON TABLE quiz_answers IS 'Individual answer submissions during gameplay';
COMMENT ON COLUMN quiz_answers.time_taken IS 'Seconds elapsed before submission';
COMMENT ON COLUMN quiz_answers.points_earned IS 'Calculated score (0-1300 with speed bonus)';

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Quizzes: Users can only manage their own quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quizzes"
  ON quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes"
  ON quizzes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quizzes"
  ON quizzes FOR DELETE
  USING (auth.uid() = user_id);

-- Questions: Inherit from parent quiz permissions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Hosts can manage their sessions"
  ON quiz_sessions FOR ALL
  USING (auth.uid() = host_user_id);

CREATE POLICY "Anyone can view sessions"
  ON quiz_sessions FOR SELECT
  USING (true); -- Anonymous players need to read session state

-- Session Participants: Public read/write for anonymous players
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants"
  ON session_participants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join as participant"
  ON session_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Participants can update their own record"
  ON session_participants FOR UPDATE
  USING (participant_token = gen_random_uuid()); -- Will be validated by app

-- Quiz Answers: Service role only (Rails writes via service key)
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Migration Script

Save as `supabase/migrations/YYYYMMDDHHMMSS_create_quiz_tables.sql` and run via Supabase dashboard.

---

## Rails WebSocket Server

### Project Setup

```bash
# Create new Rails API-only app
rails new quiz-websocket-server \
  --api \
  --database=postgresql \
  --skip-test \
  --skip-spring

cd quiz-websocket-server

# Add dependencies
bundle add redis
bundle add rack-cors
bundle add jwt
bundle add puma

bundle install
```

### Configuration Files

#### `config/database.yml`

```yaml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>

development:
  <<: *default
  database: quiz_websocket_development

production:
  <<: *default
  url: <%= ENV['SUPABASE_DIRECT_URL'] %>
  # Important: Use direct connection, not connection pooler for Rails
```

#### `config/cable.yml`

```yaml
development:
  adapter: async

test:
  adapter: test

production:
  adapter: redis
  url: <%= ENV['REDIS_URL'] %>
  channel_prefix: quiz_websocket_production
```

#### `config/environments/production.rb`

```ruby
Rails.application.configure do
  # ActionCable configuration
  config.action_cable.url = ENV.fetch('CABLE_URL') { 'wss://quiz-ws.onrender.com/cable' }

  config.action_cable.allowed_request_origins = [
    ENV['FRONTEND_URL'],
    /https:\/\/.*\.vercel\.app/,
    /http:\/\/localhost:\d+/
  ]

  # Enable CORS
  config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins ENV.fetch('FRONTEND_URL') { 'http://localhost:5173' }
      resource '/cable', headers: :any, methods: [:get, :post, :options]
    end
  end
end
```

#### `config/initializers/cors.rb`

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch('FRONTEND_URL') { 'http://localhost:5173' }

    resource '/cable',
      headers: :any,
      methods: [:get, :post, :options]
  end
end
```

### Models (Read-Only)

**Note:** These models don't need migrations since the tables are created in Supabase.

#### `app/models/quiz.rb`

```ruby
class Quiz < ApplicationRecord
  self.table_name = 'quizzes'

  belongs_to :user, foreign_key: 'user_id'
  has_many :questions, -> { order(:order_index) }, dependent: :destroy
  has_many :quiz_sessions, dependent: :restrict_with_error
end
```

#### `app/models/question.rb`

```ruby
class Question < ApplicationRecord
  self.table_name = 'questions'

  belongs_to :quiz

  TYPES = %w[true_false multiple_choice].freeze

  validates :question_type, inclusion: { in: TYPES }
  validates :time_limit, numericality: { only_integer: true, in: 10..60 }
end
```

#### `app/models/quiz_session.rb`

```ruby
class QuizSession < ApplicationRecord
  self.table_name = 'quiz_sessions'

  belongs_to :quiz
  belongs_to :host_user, class_name: 'User', foreign_key: 'host_user_id'
  belongs_to :current_question, class_name: 'Question', optional: true

  has_many :session_participants, dependent: :destroy
  has_many :quiz_answers, dependent: :destroy

  enum status: { lobby: 'lobby', active: 'active', ended: 'ended' }

  def current_question
    Question.find_by(id: current_question_id)
  end

  def next_question
    quiz.questions.where('order_index > ?', current_question.order_index).first
  end
end
```

#### `app/models/session_participant.rb`

```ruby
class SessionParticipant < ApplicationRecord
  self.table_name = 'session_participants'

  belongs_to :quiz_session
  has_many :quiz_answers, foreign_key: 'participant_id', dependent: :destroy

  scope :active, -> { where(status: 'active') }
  scope :by_score, -> { order(score: :desc) }
end
```

#### `app/models/quiz_answer.rb`

```ruby
class QuizAnswer < ApplicationRecord
  self.table_name = 'quiz_answers'

  belongs_to :quiz_session
  belongs_to :participant, class_name: 'SessionParticipant'
  belongs_to :question

  validates :quiz_session_id, uniqueness: {
    scope: [:participant_id, :question_id],
    message: 'Participant already answered this question'
  }
end
```

### ActionCable Channel

#### `app/channels/quiz_game_channel.rb`

```ruby
class QuizGameChannel < ApplicationCable::Channel
  def subscribed
    session = QuizSession.find_by(id: params[:session_id])
    return reject unless session

    @session_id = session.id
    stream_from "quiz_session_#{@session_id}"

    # Send initial state to connecting client
    transmit({
      type: 'connected',
      session: serialize_session(session),
      participants: serialize_participants(session)
    })

    Rails.logger.info "Client subscribed to session #{@session_id}"
  end

  def unsubscribed
    Rails.logger.info "Client unsubscribed from session #{@session_id}"
  end

  # Player submits answer
  def submit_answer(data)
    participant = SessionParticipant.find_by(id: data['participant_id'])
    return unless participant

    question = Question.find_by(id: data['question_id'])
    return unless question

    session = participant.quiz_session

    # Validate: Question must be current
    unless session.current_question_id == question.id
      transmit_error('Question no longer active')
      return
    end

    # Check for duplicate submission
    existing = QuizAnswer.find_by(
      quiz_session_id: session.id,
      participant_id: participant.id,
      question_id: question.id
    )

    return if existing # Silently ignore duplicates

    # Calculate score
    is_correct = data['answer'] == question.correct_answer
    time_taken = data['time_taken'].to_f
    points = calculate_points(is_correct, time_taken, question.time_limit)

    # Save answer
    QuizAnswer.create!(
      quiz_session_id: session.id,
      participant_id: participant.id,
      question_id: question.id,
      answer: data['answer'],
      time_taken: time_taken,
      is_correct: is_correct,
      points_earned: points
    )

    # Update participant score
    participant.increment!(:score, points)

    # Broadcast updated answer count (not individual answers for privacy)
    broadcast_answer_count(session, question)

    Rails.logger.info "Answer submitted: participant=#{participant.id}, question=#{question.id}, correct=#{is_correct}, points=#{points}"
  end

  # Host reveals answer and shows leaderboard
  def reveal_answer(data)
    session = QuizSession.find(@session_id)
    return unless authorized_host?(session)

    question = session.current_question
    return unless question

    # Calculate current leaderboard
    leaderboard = calculate_leaderboard(session)

    # Get answer statistics
    answer_stats = calculate_answer_stats(session, question)

    # Broadcast reveal to all clients
    ActionCable.server.broadcast("quiz_session_#{@session_id}", {
      type: 'answer_revealed',
      question_id: question.id,
      correct_answer: question.correct_answer,
      leaderboard: leaderboard,
      answer_stats: answer_stats,
      timestamp: Time.current.iso8601(3)
    })

    Rails.logger.info "Answer revealed for session #{@session_id}, question #{question.id}"
  end

  # Host advances to next question
  def next_question(data)
    session = QuizSession.find(@session_id)
    return unless authorized_host?(session)

    next_q = session.next_question

    if next_q
      # Update session state
      session.update!(
        current_question_id: next_q.id,
        current_question_index: session.current_question_index + 1
      )

      # Broadcast next question (without correct answer)
      ActionCable.server.broadcast("quiz_session_#{@session_id}", {
        type: 'next_question',
        question: serialize_question(next_q, include_answer: false),
        question_index: session.current_question_index,
        total_questions: session.quiz.questions.count,
        started_at: Time.current.iso8601(3) # High precision for timer sync
      })

      Rails.logger.info "Advanced to question #{session.current_question_index + 1}"
    else
      # Game ended
      end_game(session)
    end
  end

  private

  def calculate_points(is_correct, time_taken, time_limit)
    return 0 unless is_correct

    base_points = 1000.0

    # Speed ratio: 0 (slowest) to 1 (fastest)
    speed_ratio = [0, (time_limit - time_taken) / time_limit].max

    # Multiplier: 0.7 (slowest correct) to 1.3 (instant correct)
    multiplier = 0.7 + (speed_ratio * 0.6)

    (base_points * multiplier).round
  end

  def calculate_leaderboard(session)
    participants = session.session_participants.active.by_score.limit(100)

    participants.map.with_index(1) do |p, index|
      {
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        score: p.score,
        position: index
      }
    end
  end

  def calculate_answer_stats(session, question)
    answers = session.quiz_answers.where(question_id: question.id)
    total = answers.count

    return [] if total.zero?

    # Get all possible options from question
    options = JSON.parse(question.options)

    options.map do |option|
      count = answers.where(answer: option).count
      {
        answer: option,
        count: count,
        percentage: ((count.to_f / total) * 100).round(1),
        is_correct: option == question.correct_answer
      }
    end
  end

  def broadcast_answer_count(session, question)
    answered = session.quiz_answers.where(question_id: question.id).count
    total = session.session_participants.active.count

    ActionCable.server.broadcast("quiz_session_#{@session_id}", {
      type: 'answer_count_updated',
      answered: answered,
      total: total,
      question_id: question.id
    })
  end

  def end_game(session)
    session.update!(status: 'ended', ended_at: Time.current)

    # Calculate final positions
    participants = session.session_participants.active.by_score
    participants.each_with_index do |p, index|
      p.update_column(:position, index + 1)
    end

    leaderboard = calculate_leaderboard(session)

    ActionCable.server.broadcast("quiz_session_#{@session_id}", {
      type: 'game_ended',
      leaderboard: leaderboard,
      winner: leaderboard.first,
      timestamp: Time.current.iso8601(3)
    })

    Rails.logger.info "Game ended for session #{@session_id}"
  end

  def authorized_host?(session)
    # TODO: Implement proper host validation via JWT or session token
    # For now, trust the connection (should validate in production)
    true
  end

  def transmit_error(message)
    transmit({ type: 'error', message: message })
  end

  def serialize_session(session)
    {
      id: session.id,
      status: session.status,
      current_question_index: session.current_question_index,
      total_questions: session.quiz.questions.count
    }
  end

  def serialize_participants(session)
    session.session_participants.active.map do |p|
      {
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        score: p.score
      }
    end
  end

  def serialize_question(question, include_answer: true)
    data = {
      id: question.id,
      text: question.text,
      question_type: question.question_type,
      time_limit: question.time_limit,
      options: JSON.parse(question.options)
    }

    data[:correct_answer] = question.correct_answer if include_answer

    data
  end
end
```

### Deployment (Render.com)

#### `render.yaml`

```yaml
services:
  - type: web
    name: quiz-websocket-server
    env: ruby
    buildCommand: bundle install
    startCommand: bundle exec puma -C config/puma.rb
    envVars:
      - key: RAILS_ENV
        value: production
      - key: SUPABASE_DIRECT_URL
        sync: false
      - key: REDIS_URL
        fromService:
          type: redis
          name: quiz-redis
          property: connectionString
      - key: FRONTEND_URL
        value: https://yourdomain.vercel.app
      - key: CABLE_URL
        value: wss://quiz-websocket-server.onrender.com/cable
      - key: RAILS_MASTER_KEY
        sync: false

  - type: redis
    name: quiz-redis
    plan: starter
    maxmemoryPolicy: noeviction
```

---

## Frontend Components

### Directory Structure

```
src/
├── components/
│   ├── quiz/
│   │   ├── QuizListPage.jsx          # Browse/manage quizzes
│   │   ├── QuizEditorPage.jsx        # Quiz builder
│   │   ├── QuizCard.jsx              # Quiz list item
│   │   ├── QuestionEditor.jsx        # Individual question editor
│   │   └── QuestionList.jsx          # Sidebar question list
│   ├── quiz-game/
│   │   ├── LobbyPage.jsx             # Pre-game waiting room
│   │   ├── HostGameView.jsx          # Host control panel
│   │   ├── PlayerJoinPage.jsx        # Join with code
│   │   ├── PlayerGameView.jsx        # Player gameplay
│   │   ├── Leaderboard.jsx           # Leaderboard component
│   │   ├── QuestionDisplay.jsx       # Question card
│   │   ├── AnswerButton.jsx          # Answer option button
│   │   └── WinnerScreen.jsx          # End game celebration
│   └── shared/
│       ├── QRCodePanel.jsx           # Reusable QR display
│       └── Timer.jsx                 # Countdown timer
├── services/
│   ├── quizGameCable.js              # ActionCable connection
│   └── quizApi.js                    # Supabase quiz CRUD
└── hooks/
    ├── useQuizGame.js                # Game state management
    └── useTimer.js                   # Timer synchronization
```

### Routing

Update `src/App.jsx`:

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import QuizListPage from './components/quiz/QuizListPage'
import QuizEditorPage from './components/quiz/QuizEditorPage'
import LobbyPage from './components/quiz-game/LobbyPage'
import HostGameView from './components/quiz-game/HostGameView'
import PlayerJoinPage from './components/quiz-game/PlayerJoinPage'
import PlayerGameView from './components/quiz-game/PlayerGameView'

// ... other imports

function App() {
  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        <Route path="/" element={<WheelPage />} />
        <Route path="/squad-scramble" element={<SquadScramblePage />} />

        {/* New Quiz Race routes */}
        <Route path="/quiz-builder" element={<QuizListPage />} />
        <Route path="/quiz-builder/:quizId" element={<QuizEditorPage />} />
        <Route path="/quiz-lobby/:sessionId" element={<LobbyPage />} />
        <Route path="/quiz-host/:sessionId" element={<HostGameView />} />
        <Route path="/quiz-join/:code?" element={<PlayerJoinPage />} />
        <Route path="/quiz-play/:sessionId" element={<PlayerGameView />} />

        {/* ... other routes */}
      </Routes>
    </Router>
  )
}
```

### Key Services

#### `src/services/quizGameCable.js`

```javascript
import { createConsumer } from '@rails/actioncable'

class QuizGameCable {
  constructor() {
    this.cable = null
    this.channel = null
  }

  connect(sessionId, callbacks) {
    const wsUrl = import.meta.env.VITE_RAILS_WS_URL || 'ws://localhost:3000/cable'

    this.cable = createConsumer(wsUrl)

    this.channel = this.cable.subscriptions.create(
      { channel: 'QuizGameChannel', session_id: sessionId },
      {
        connected: () => {
          console.log('Connected to quiz game channel')
          callbacks.onConnected?.()
        },

        disconnected: () => {
          console.log('Disconnected from quiz game channel')
          callbacks.onDisconnected?.()
        },

        received: (data) => {
          console.log('Received:', data.type, data)

          switch (data.type) {
            case 'connected':
              callbacks.onInitialState?.(data)
              break
            case 'answer_count_updated':
              callbacks.onAnswerCountUpdate?.(data)
              break
            case 'answer_revealed':
              callbacks.onAnswerRevealed?.(data)
              break
            case 'next_question':
              callbacks.onNextQuestion?.(data)
              break
            case 'game_ended':
              callbacks.onGameEnded?.(data)
              break
            case 'error':
              callbacks.onError?.(data.message)
              break
          }
        }
      }
    )
  }

  submitAnswer(participantId, questionId, answer, timeTaken) {
    this.channel.perform('submit_answer', {
      participant_id: participantId,
      question_id: questionId,
      answer: answer,
      time_taken: timeTaken
    })
  }

  revealAnswer() {
    this.channel.perform('reveal_answer', {})
  }

  nextQuestion() {
    this.channel.perform('next_question', {})
  }

  disconnect() {
    if (this.channel) {
      this.channel.unsubscribe()
    }
    if (this.cable) {
      this.cable.disconnect()
    }
  }
}

export default new QuizGameCable()
```

#### `src/hooks/useTimer.js`

```javascript
import { useState, useEffect, useRef } from 'react'

export function useTimer(startedAt, timeLimit, onExpire) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const [isExpired, setIsExpired] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!startedAt || !timeLimit) return

    const startTime = new Date(startedAt).getTime()

    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const elapsed = (now - startTime) / 1000 // seconds
      const remaining = Math.max(0, timeLimit - elapsed)

      setTimeRemaining(remaining)

      if (remaining === 0 && !isExpired) {
        setIsExpired(true)
        onExpire?.()
      }
    }, 100) // Update every 100ms for smooth countdown

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [startedAt, timeLimit, isExpired, onExpire])

  const getElapsedTime = () => {
    if (!startedAt) return 0
    const startTime = new Date(startedAt).getTime()
    const now = Date.now()
    return Math.max(0, (now - startTime) / 1000)
  }

  return {
    timeRemaining,
    isExpired,
    getElapsedTime,
    percentage: (timeRemaining / timeLimit) * 100
  }
}
```

---

## WebSocket Message Protocol

### Client → Server

#### `submit_answer`
```json
{
  "action": "submit_answer",
  "participant_id": "uuid",
  "question_id": "uuid",
  "answer": "Option A",
  "time_taken": 12.45
}
```

#### `reveal_answer`
```json
{
  "action": "reveal_answer"
}
```

#### `next_question`
```json
{
  "action": "next_question"
}
```

### Server → Client

#### `connected`
```json
{
  "type": "connected",
  "session": {
    "id": "uuid",
    "status": "active",
    "current_question_index": 2,
    "total_questions": 10
  },
  "participants": [
    {
      "id": "uuid",
      "username": "Alice",
      "avatar": "🚀",
      "score": 2850
    }
  ]
}
```

#### `answer_count_updated`
```json
{
  "type": "answer_count_updated",
  "answered": 15,
  "total": 20,
  "question_id": "uuid"
}
```

#### `answer_revealed`
```json
{
  "type": "answer_revealed",
  "question_id": "uuid",
  "correct_answer": "Paris",
  "leaderboard": [
    {
      "id": "uuid",
      "username": "Alice",
      "avatar": "🚀",
      "score": 2850,
      "position": 1
    }
  ],
  "answer_stats": [
    {
      "answer": "Paris",
      "count": 15,
      "percentage": 75.0,
      "is_correct": true
    },
    {
      "answer": "London",
      "count": 5,
      "percentage": 25.0,
      "is_correct": false
    }
  ],
  "timestamp": "2025-11-21T14:32:15.123Z"
}
```

#### `next_question`
```json
{
  "type": "next_question",
  "question": {
    "id": "uuid",
    "text": "What is the capital of France?",
    "question_type": "multiple_choice",
    "time_limit": 30,
    "options": ["Paris", "London", "Berlin", "Madrid"]
  },
  "question_index": 3,
  "total_questions": 10,
  "started_at": "2025-11-21T14:32:20.123Z"
}
```

#### `game_ended`
```json
{
  "type": "game_ended",
  "leaderboard": [...],
  "winner": {
    "id": "uuid",
    "username": "Alice",
    "avatar": "🚀",
    "score": 8950,
    "position": 1
  },
  "timestamp": "2025-11-21T14:45:00.123Z"
}
```

---

## Implementation Phases

### Phase 0: Rails WebSocket Server Setup
**Estimated Time:** 5-7 hours

- [ ] Create Rails API app with `--api --skip-test`
- [ ] Configure database.yml with Supabase connection
- [ ] Add gems: redis, rack-cors, jwt, puma
- [ ] Configure ActionCable with Redis
- [ ] Set up CORS for frontend domain
- [ ] Create minimal ActiveRecord models (no migrations)
- [ ] Create QuizGameChannel with all actions
- [ ] Add health check endpoint `/health`
- [ ] Test WebSocket connection locally
- [ ] Deploy to Render.com
- [ ] Configure environment variables
- [ ] Test deployed WebSocket connection
- [ ] Document Rails WS URL for frontend

### Phase 1: Supabase Database Schema
**Estimated Time:** 2-3 hours

- [ ] Create migration file with all tables
- [ ] Run migration in Supabase dashboard
- [ ] Create RLS policies for each table
- [ ] Test policies with different user contexts
- [ ] Create `generate_join_code()` RPC function
- [ ] Create `calculate_speed_multiplier()` RPC function
- [ ] Test RPC functions
- [ ] Add indexes for performance
- [ ] Verify foreign key constraints
- [ ] Document schema in this file

### Phase 2: Quiz Builder (Frontend)
**Estimated Time:** 5-6 hours

- [ ] Create QuizListPage component
  - [ ] Fetch user's quizzes from Supabase
  - [ ] Display in grid with glassmorphic cards
  - [ ] Add "Create Quiz" button
  - [ ] Add Edit/Delete/Duplicate actions
  - [ ] Add "Start Session" button
- [ ] Create QuizCard component
  - [ ] Show quiz name, question count, created date
  - [ ] Action buttons (edit, delete, start)
  - [ ] Hover effects and animations
- [ ] Create QuizEditorPage component
  - [ ] Load quiz with questions
  - [ ] Editable title at top
  - [ ] Save button with loading state
  - [ ] Back button with unsaved changes warning
- [ ] Create QuestionList sidebar
  - [ ] Show all questions in order
  - [ ] Click to select/edit
  - [ ] Drag handles for reordering
  - [ ] Delete button per question
- [ ] Create QuestionEditor component
  - [ ] Question type selector (True/False, Multiple Choice)
  - [ ] Text input for question
  - [ ] Time limit slider (10-60s)
  - [ ] Answer options editor
  - [ ] Mark correct answer (radio/checkbox)
  - [ ] Validation and error messages
- [ ] Implement Supabase CRUD operations
  - [ ] Create quiz
  - [ ] Update quiz
  - [ ] Delete quiz
  - [ ] Create question
  - [ ] Update question
  - [ ] Delete question
  - [ ] Reorder questions
- [ ] Add route `/quiz-builder` and `/quiz-builder/:quizId`
- [ ] Update header with "Quiz Race" link
- [ ] Style with Attensi brand (glassmorphism, dark navy, cyan)
- [ ] Test on mobile devices

### Phase 3: Host Lobby & Game View
**Estimated Time:** 4-5 hours

- [ ] Session creation flow
  - [ ] Call `generate_join_code()` RPC
  - [ ] Insert quiz_session record
  - [ ] Navigate to lobby
- [ ] Create LobbyPage component
  - [ ] Display large join code
  - [ ] Generate and show QR code
  - [ ] Subscribe to participant joins (Supabase)
  - [ ] Animated participant list
  - [ ] Participant count display
  - [ ] "Start Game" button (disabled until 2+ players)
- [ ] Start game action
  - [ ] Update session status to 'active'
  - [ ] Set first question as current
  - [ ] Navigate to host game view
  - [ ] Connect to Rails WebSocket
- [ ] Create HostGameView component
  - [ ] Question display at top
  - [ ] Timer countdown
  - [ ] Answer count tracker ("15/20 answered")
  - [ ] "Reveal Answer" button (enabled when ready)
  - [ ] "Next Question" button (after reveal)
- [ ] Implement WebSocket connection
  - [ ] Connect on mount
  - [ ] Handle `connected` message
  - [ ] Handle `answer_count_updated`
  - [ ] Handle `answer_revealed`
  - [ ] Handle `next_question`
  - [ ] Handle `game_ended`
  - [ ] Disconnect on unmount
- [ ] Create Leaderboard component
  - [ ] Show top 10 participants
  - [ ] Smooth position changes (Framer Motion)
  - [ ] Score updates
  - [ ] Trophy emojis for top 3
- [ ] Answer reveal visualization
  - [ ] Highlight correct answer (green)
  - [ ] Show answer statistics (bar chart)
  - [ ] Animate leaderboard updates
- [ ] Host controls
  - [ ] Reveal answer action
  - [ ] Next question action
  - [ ] Visual feedback for actions
- [ ] Test with multiple browser tabs
- [ ] Test on mobile + desktop simultaneously

### Phase 4: Player Experience
**Estimated Time:** 4-5 hours

- [ ] Create PlayerJoinPage component
  - [ ] Input for username
  - [ ] Avatar emoji picker
  - [ ] Join code input (or from URL)
  - [ ] "Join Game" button
  - [ ] Error handling (invalid code, game started)
- [ ] Join game action
  - [ ] Validate join code in Supabase
  - [ ] Generate participant_token
  - [ ] Insert session_participant record
  - [ ] Store token in localStorage
  - [ ] Navigate to player game view
- [ ] Create PlayerGameView component
  - [ ] Waiting room state
  - [ ] Subscribe to session status changes
  - [ ] Connect to WebSocket when game starts
- [ ] Player waiting room
  - [ ] "Waiting for host..." message
  - [ ] Participant count animation
  - [ ] List of other players
- [ ] Player game view states
  - [ ] Question active: Show question + timer + answers
  - [ ] Answer submitted: Highlight selection, show "Waiting..."
  - [ ] Answer revealed: Show correct/incorrect, points earned
  - [ ] Mini leaderboard: Show ±3 positions + percentile
- [ ] Create QuestionDisplay component
  - [ ] Large question text
  - [ ] Timer with progress bar
  - [ ] Mobile-optimized layout
- [ ] Create AnswerButton component
  - [ ] Large touch-friendly buttons
  - [ ] Color-coded (A/B/C/D)
  - [ ] Selected state
  - [ ] Disabled state
  - [ ] Correct/incorrect reveal animation
- [ ] Implement answer submission
  - [ ] Calculate elapsed time from server timestamp
  - [ ] Send via WebSocket
  - [ ] Optimistic UI update
  - [ ] Handle submission errors
- [ ] Mini leaderboard logic
  - [ ] Find player's position in full leaderboard
  - [ ] Extract ±3 surrounding positions
  - [ ] Calculate percentile
  - [ ] Show badge (Top 10%, Top 25%, etc.)
  - [ ] Slide in animation
  - [ ] Auto-dismiss after 3 seconds
- [ ] Create WinnerScreen component
  - [ ] Confetti animation (top 3)
  - [ ] Final leaderboard
  - [ ] Player's final position highlighted
  - [ ] "Play Again" / "Exit" buttons
- [ ] Test timer synchronization across devices
- [ ] Test on slow network connections
- [ ] Test on various mobile devices

### Phase 5: Game Logic & Polish
**Estimated Time:** 5-6 hours

- [ ] Timer synchronization
  - [ ] Server sends started_at timestamp
  - [ ] Client calculates remaining time
  - [ ] Update every 100ms for smoothness
  - [ ] Handle clock drift gracefully
  - [ ] Test across timezones
- [ ] Answer reveal timing
  - [ ] Auto-enable reveal when timer expires
  - [ ] Auto-enable when all answered
  - [ ] Manual host override
  - [ ] Visual feedback for each condition
- [ ] Reconnection handling
  - [ ] Store participant_token in localStorage
  - [ ] Auto-reconnect on page refresh
  - [ ] Resume game state
  - [ ] Show "Reconnecting..." message
- [ ] Host abandonment handling
  - [ ] Detect host disconnect
  - [ ] Show warning to players
  - [ ] Auto-advance after 2min timeout (optional)
  - [ ] Allow session recovery
- [ ] Leaderboard calculations
  - [ ] Real-time position updates
  - [ ] Handle tie scores
  - [ ] Efficient sorting for 100+ players
  - [ ] Cache previous positions for animations
- [ ] Scoring system verification
  - [ ] Test speed multiplier edge cases
  - [ ] Verify 70%-130% range
  - [ ] Test with instant answers
  - [ ] Test with timeout answers
- [ ] Error handling
  - [ ] Network disconnection
  - [ ] Invalid WebSocket messages
  - [ ] Database write failures
  - [ ] Race condition mitigation
- [ ] Session history
  - [ ] Query completed sessions
  - [ ] Display in dashboard
  - [ ] Show final leaderboard
  - [ ] Export to CSV
- [ ] Loading states
  - [ ] Quiz list loading
  - [ ] Session joining
  - [ ] Question loading
  - [ ] Leaderboard updates
  - [ ] Skeleton screens
- [ ] Performance optimization
  - [ ] Memoize expensive calculations
  - [ ] Debounce real-time updates
  - [ ] Optimize re-renders
  - [ ] Test with 50+ players

### Phase 6: Integration & Final Polish
**Estimated Time:** 3-4 hours

- [ ] Header navigation
  - [ ] Add "Quiz Race" link
  - [ ] Position next to Squad Scramble
  - [ ] Active state styling
  - [ ] Mobile responsive menu
- [ ] Dashboard integration
  - [ ] Add "My Quizzes" section
  - [ ] Show recent sessions
  - [ ] Quick action buttons
  - [ ] Statistics (total quizzes, sessions, players)
- [ ] Responsive design
  - [ ] Test all pages on mobile
  - [ ] Optimize touch targets (min 44px)
  - [ ] Test landscape orientation
  - [ ] Test on iOS Safari
  - [ ] Test on Android Chrome
- [ ] Accessibility
  - [ ] Add ARIA labels
  - [ ] Keyboard navigation
  - [ ] Focus management
  - [ ] Screen reader testing
  - [ ] High contrast mode support
- [ ] Browser compatibility
  - [ ] Chrome (desktop + mobile)
  - [ ] Safari (iOS + macOS)
  - [ ] Firefox
  - [ ] Edge
- [ ] End-to-end testing
  - [ ] Create quiz → Start session → Join as player → Play game → Winner screen
  - [ ] Test with 2 players
  - [ ] Test with 10 players
  - [ ] Test with 50+ players (load test)
  - [ ] Test timer sync on slow network
  - [ ] Test reconnection scenarios
  - [ ] Test host disconnect
- [ ] Documentation
  - [ ] Update README with Quiz Race feature
  - [ ] Document environment variables
  - [ ] Document deployment process
  - [ ] Add troubleshooting guide
- [ ] Final polish
  - [ ] Animation timing tweaks
  - [ ] Color adjustments
  - [ ] Font size optimization
  - [ ] Sound effects (optional)
  - [ ] Celebration animations

---

## Risk Mitigation

### 1. Timer Synchronization
**Risk:** Players see different remaining times due to network latency.

**Solution:**
- ✅ Server-authoritative timestamps
- ✅ Client calculates time locally based on server `started_at`
- ✅ Accept answers for 1-2 seconds after theoretical expiry
- ✅ High precision timestamps (ISO8601 with milliseconds)
- ✅ Test on devices with incorrect system clocks

**Implementation:**
```javascript
// Server sends
{ started_at: "2025-11-21T14:32:20.123Z" }

// Client calculates
const startTime = new Date(startedAt).getTime()
const elapsed = (Date.now() - startTime) / 1000
const remaining = Math.max(0, timeLimit - elapsed)
```

### 2. WebSocket Scalability
**Risk:** 50+ concurrent players overwhelm WebSocket server.

**Solution:**
- ✅ Use Redis for ActionCable (built for pub/sub at scale)
- ✅ Minimize broadcast frequency (batch updates)
- ✅ Only broadcast aggregates (answer count, not individual answers)
- ✅ Load test with 100 simulated players before launch
- ✅ Monitor Render.com metrics (CPU, memory, connections)
- ✅ Scale to larger Render plan if needed

**Load Testing:**
```bash
# Use https://github.com/danielrh/actioncable-loadtest
gem install actioncable-loadtest
actioncable-loadtest wss://your-rails-app.onrender.com/cable 100
```

### 3. Answer Submission Race Conditions
**Risk:** Player submits answer twice or after question changed.

**Solution:**
- ✅ Unique constraint: `(session_id, participant_id, question_id)`
- ✅ Server validates current question matches
- ✅ Silently ignore duplicate submissions
- ✅ Optimistic UI with rollback on error
- ✅ Idempotent operations

**Database Constraint:**
```sql
CONSTRAINT unique_participant_answer
UNIQUE(quiz_session_id, participant_id, question_id)
```

### 4. Player Session Management
**Risk:** Player refreshes page and loses progress.

**Solution:**
- ✅ Store `participant_token` (UUID) in localStorage
- ✅ Include token in WebSocket connection
- ✅ Validate token on reconnect
- ✅ Restore score and game state
- ✅ Handle expired/invalid tokens gracefully

**Reconnection Flow:**
```javascript
const participantToken = localStorage.getItem('participant_token')
if (participantToken) {
  const { data: participant } = await supabase
    .from('session_participants')
    .select('*')
    .eq('participant_token', participantToken)
    .single()

  if (participant && participant.quiz_session_id === sessionId) {
    // Rejoin game
    connectToGameChannel(sessionId)
  }
}
```

### 5. Host Abandonment
**Risk:** Host closes browser mid-game, players stuck.

**Solution:**
- ✅ Detect host disconnect via WebSocket
- ✅ Show "Host disconnected" message to players
- ✅ Auto-advance after 2 minutes (optional background job)
- ✅ Allow another authenticated user to "take over" session
- ✅ Session timeout after 10 minutes inactive

**Future Enhancement:**
```ruby
# Sidekiq job to auto-advance abandoned sessions
class AutoAdvanceQuestionJob < ApplicationJob
  def perform(session_id)
    session = QuizSession.find(session_id)
    return unless session.active?

    # Advance if host hasn't acted in 2 minutes
    if session.updated_at < 2.minutes.ago
      # Reveal and advance logic
    end
  end
end
```

### 6. Leaderboard Performance
**Risk:** Calculating positions for 200+ players is slow.

**Solution:**
- ✅ Index on `(quiz_session_id, score DESC)`
- ✅ Limit leaderboard to top 100 for broadcast
- ✅ Calculate positions in background (async)
- ✅ Only recalculate after question reveals (not per answer)
- ✅ Cache previous positions client-side

**Optimized Query:**
```sql
-- Indexed query is fast even with 1000+ participants
SELECT * FROM session_participants
WHERE quiz_session_id = ?
ORDER BY score DESC
LIMIT 100;
```

### 7. Mobile Data Usage
**Risk:** Realtime connection drains battery/data.

**Solution:**
- ✅ Minimize payload sizes (no unnecessary data)
- ✅ Compress JSON messages where possible
- ✅ Reconnect with exponential backoff
- ✅ Degrade gracefully on poor connections
- ✅ Test on 3G network throttling

**Connection Recovery:**
```javascript
let reconnectAttempts = 0
const maxAttempts = 5

cable.subscriptions.create(..., {
  disconnected() {
    if (reconnectAttempts < maxAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000)
      setTimeout(() => cable.connect(), delay)
      reconnectAttempts++
    }
  }
})
```

### 8. State Consistency
**Risk:** Client and server state diverge.

**Solution:**
- ✅ Version/sequence numbers on state updates
- ✅ Server validates question_id on answer submission
- ✅ Reject stale answers with error message
- ✅ Force state refresh if mismatch detected
- ✅ Idempotent operations (safe to replay)

**Validation:**
```ruby
def submit_answer(data)
  session = participant.quiz_session

  unless session.current_question_id == data['question_id']
    transmit_error('Question no longer active')
    return
  end

  # Process answer...
end
```

---

## Deployment Guide

### Prerequisites
- [ ] Supabase project with database created
- [ ] Render.com account (or Railway/Heroku)
- [ ] Vercel account (for frontend)
- [ ] GitHub repository

### Step 1: Deploy Database Schema
1. Log into Supabase dashboard
2. Navigate to SQL Editor
3. Copy entire schema from [Database Schema](#database-schema)
4. Run migration
5. Verify tables created: `quizzes`, `questions`, `quiz_sessions`, etc.
6. Test RLS policies with different user contexts
7. Note down database connection strings:
   - Direct connection URL (for Rails)
   - Connection pooler URL (for frontend)

### Step 2: Deploy Rails WebSocket Server

#### 2.1 Prepare Repository
```bash
cd quiz-websocket-server
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourorg/quiz-websocket-server.git
git push -u origin main
```

#### 2.2 Deploy to Render
1. Log into Render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name:** quiz-websocket-server
   - **Environment:** Ruby
   - **Build Command:** `bundle install`
   - **Start Command:** `bundle exec puma -C config/puma.rb`
5. Add Redis instance:
   - Click "New +" → "Redis"
   - **Name:** quiz-redis
   - **Plan:** Starter (free or $5/mo)
6. Add environment variables:
   ```
   RAILS_ENV=production
   RAILS_MASTER_KEY=<generate with: rails secret>
   SUPABASE_DIRECT_URL=<from Supabase dashboard>
   REDIS_URL=<auto-filled from Redis instance>
   FRONTEND_URL=https://yourdomain.vercel.app
   CABLE_URL=wss://quiz-websocket-server.onrender.com/cable
   ```
7. Click "Create Web Service"
8. Wait for deployment (3-5 minutes)
9. Test health endpoint: `https://quiz-websocket-server.onrender.com/health`

#### 2.3 Verify WebSocket Connection
```javascript
// Test in browser console
const ws = new WebSocket('wss://quiz-websocket-server.onrender.com/cable')
ws.onopen = () => console.log('Connected')
ws.onerror = (e) => console.error('Error:', e)
```

### Step 3: Deploy Frontend (Vercel)

#### 3.1 Update Environment Variables
Create `.env.production`:
```bash
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase>
VITE_RAILS_WS_URL=wss://quiz-websocket-server.onrender.com/cable
```

#### 3.2 Deploy to Vercel
```bash
cd attensi-spin
vercel --prod
```

Or via Vercel dashboard:
1. Import GitHub repository
2. Add environment variables
3. Deploy

#### 3.3 Configure CORS
Update Rails `config/environments/production.rb` with actual Vercel URL:
```ruby
config.action_cable.allowed_request_origins = [
  'https://yourdomain.vercel.app',
  /https:\/\/.*\.vercel\.app/
]
```

Redeploy Rails server on Render.

### Step 4: Smoke Test

#### 4.1 Create Quiz
1. Navigate to `https://yourdomain.vercel.app/quiz-builder`
2. Sign in with Supabase auth
3. Create test quiz with 3 questions
4. Verify quiz saves to database

#### 4.2 Start Session
1. Click "Start Session" on quiz
2. Verify join code generated
3. Copy join URL

#### 4.3 Join as Player
1. Open incognito window or mobile device
2. Navigate to join URL
3. Enter username and join
4. Verify participant appears in lobby

#### 4.4 Play Game
1. As host, click "Start Game"
2. Verify WebSocket connects (check browser console)
3. As player, answer question
4. Verify answer count updates on host view
5. Click "Reveal Answer"
6. Verify correct answer shows, leaderboard updates
7. Click "Next Question"
8. Complete all questions
9. Verify winner screen displays

### Step 5: Monitor & Debug

#### Rails Logs
```bash
# View live logs on Render
render logs quiz-websocket-server --tail
```

#### Supabase Logs
1. Go to Supabase dashboard
2. Navigate to Logs → API Logs
3. Monitor database queries and errors

#### Frontend Logs
- Vercel dashboard → Deployments → Functions Logs
- Browser console for client-side errors

### Troubleshooting

**WebSocket connection fails:**
- Verify CORS origins in Rails config
- Check `CABLE_URL` environment variable
- Ensure Redis is running and connected
- Test with `wscat -c wss://your-url/cable`

**Timer out of sync:**
- Check server sends high-precision timestamps
- Verify client calculates from server time
- Test with network throttling

**Leaderboard not updating:**
- Check ActionCable broadcast in Rails logs
- Verify frontend subscribes to correct channel
- Ensure `session_id` matches

**Players can't join:**
- Verify join code generation works
- Check RLS policies on `quiz_sessions` table
- Ensure `status = 'lobby'` before start

---

## Testing Strategy

### Unit Tests (Optional)

#### Rails (RSpec)
```ruby
# spec/channels/quiz_game_channel_spec.rb
RSpec.describe QuizGameChannel do
  it "broadcasts answer count after submission" do
    # Test channel behavior
  end

  it "calculates correct points with speed multiplier" do
    expect(calculate_points(true, 10, 30)).to be_within(50).of(1100)
  end
end
```

#### Frontend (Jest + React Testing Library)
```javascript
// src/hooks/useTimer.test.js
test('timer counts down from server timestamp', () => {
  const { result } = renderHook(() =>
    useTimer('2025-11-21T12:00:00.000Z', 30)
  )

  expect(result.current.timeRemaining).toBeLessThanOrEqual(30)
})
```

### Integration Tests

#### Lobby Flow
1. Host creates quiz
2. Host starts session
3. Player joins via code
4. Host sees player in lobby
5. Host starts game
6. Both connect to WebSocket

**Expected:** No errors, smooth transition to game view.

#### Game Flow
1. Question displays on both views
2. Timer counts down synchronously
3. Player submits answer
4. Host sees answer count update
5. Host reveals answer
6. Both see correct answer + leaderboard
7. Host advances to next question
8. Repeat until end
9. Winner screen displays

**Expected:** All real-time updates work, leaderboard accurate.

#### Timer Sync Test
1. Open host view and 3 player views
2. Start game
3. Record timer values every 1 second on each device
4. Compare at 10-second mark

**Expected:** All timers within ±1 second.

#### Reconnection Test
1. Join as player
2. Answer 2 questions
3. Refresh browser
4. Verify game state restored
5. Continue playing

**Expected:** Score preserved, current question displays.

#### Load Test
1. Use `actioncable-loadtest` or custom script
2. Simulate 50 players joining session
3. All submit answers simultaneously
4. Measure latency and success rate

**Expected:**
- <500ms answer submission latency
- 100% success rate
- No WebSocket disconnections
- Leaderboard updates within 1 second

### Browser Testing Matrix

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome | ✅ | ✅ | - |
| Safari | ✅ | ✅ | - |
| Firefox | ✅ | ❌ | - |
| Edge | ✅ | ❌ | - |

### Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Timer sync accuracy | ±1 second | - |
| Answer submission latency | <500ms | - |
| Leaderboard update latency | <1 second | - |
| Page load time (quiz builder) | <2 seconds | - |
| WebSocket connection time | <1 second | - |
| Mobile frame rate (gameplay) | 60fps | - |

---

## Next Steps

1. **Review this plan** with team for feedback
2. **Set up development environment** (Rails + Supabase)
3. **Start with Phase 0** (Rails WebSocket server)
4. **Work through phases sequentially**
5. **Test after each phase** before moving forward
6. **Update this document** as implementation progresses

---

## Questions & Decisions Log

### 2025-11-21: Architecture Decision
**Question:** Supabase realtime vs Rails WebSocket?
**Decision:** Use Rails WebSocket for gameplay, keep Supabase for data.
**Rationale:** Quiz requires <100ms latency for timer sync and answer submission. Supabase realtime (50-200ms) would feel laggy. Team has Rails expertise. Hybrid approach leverages both strengths.

### 2025-11-21: Points System
**Question:** Should quiz creators set points per question?
**Decision:** No, auto-calculate based on base points (1000) + speed multiplier (70-130%).
**Rationale:** Simpler for creators, consistent scoring system, encourages speed without punishing correctness.

### 2025-11-21: Answer Reveal Timing
**Question:** When should correct answer be revealed?
**Decision:** Host controls reveal manually, auto-enabled when timer expires OR all players answered.
**Rationale:** Gives host control over pacing while preventing stalls. Can reveal early if all players done.

### 2025-11-21: Player Leaderboard
**Question:** Show full leaderboard or partial?
**Decision:** Show ±3 positions around player + percentile badge (Top 10%, Top 25%, etc.).
**Rationale:** Keeps competitive even for players not at top. Percentile gives context. Full leaderboard available on final screen.

---

## Resources

### Documentation
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [ActionCable Guides](https://guides.rubyonrails.org/action_cable_overview.html)
- [Render Deploy Docs](https://render.com/docs/deploy-rails)
- [Framer Motion](https://www.framer.com/motion/)

### Similar Projects
- [Kahoot](https://kahoot.com) - UX inspiration
- [Quizizz](https://quizizz.com) - Gameplay patterns
- [Mentimeter](https://www.mentimeter.com) - Live polls

### Tools
- [wscat](https://github.com/websockets/wscat) - WebSocket CLI testing
- [actioncable-loadtest](https://github.com/danielrh/actioncable-loadtest) - Load testing
- [Postman](https://www.postman.com) - API testing

---

**Document Version:** 1.0
**Last Updated:** 2025-11-21
**Maintainer:** Espen / Claude Code
**Status:** ✅ Planning Complete, Ready for Implementation
